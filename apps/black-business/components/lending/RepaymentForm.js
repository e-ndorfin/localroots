"use client";

import { useState, useCallback } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "");

function StripePaymentForm({ amountDollars, onSuccess, onCancel }) {
  const stripe = useStripe();
  const elements = useElements();
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!stripe || !elements) return;

    setStatus("processing");
    setMessage("");

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: window.location.href },
      redirect: "if_required",
    });

    if (error) {
      setStatus("error");
      setMessage(error.message);
    } else if (paymentIntent?.status === "succeeded") {
      setStatus("succeeded");
      onSuccess();
    } else {
      setStatus("idle");
      setMessage(`Unexpected status: ${paymentIntent?.status}`);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      <div className="repay-modal-actions" style={{ marginTop: 16 }}>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={onCancel}
          disabled={status === "processing"}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn btn-solid"
          disabled={!stripe || status === "processing"}
        >
          {status === "processing" ? "Processing..." : `Pay $${amountDollars.toFixed(2)} CAD`}
        </button>
      </div>
      {message && (
        <p className="text-sm" style={{ color: "#dc2626", marginTop: 12 }}>{message}</p>
      )}
    </form>
  );
}

export default function RepaymentForm({ loans = [], userId }) {
  const [amount, setAmount] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [clientSecret, setClientSecret] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const activeLoan = loans.find(
    (l) => (l.status === "active" || l.status === "disbursing") && l.borrower_user_id === userId
  );
  const owedCents = activeLoan
    ? (activeLoan.total_repayment_cents || activeLoan.principal_cents) - (activeLoan.repaid_cents || 0)
    : 0;

  async function openCheckout(e) {
    e.preventDefault();
    const cents = Math.round(Number(amount) * 100);
    if (!cents || cents <= 0 || !activeLoan) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/lending/repay-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountCents: cents }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create payment");
      setClientSecret(data.clientSecret);
      setShowModal(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const handlePaymentSuccess = useCallback(async () => {
    const cents = Math.round(Number(amount) * 100);
    try {
      await fetch("/api/lending/repay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loanId: activeLoan.id, amountCents: cents }),
      });
    } catch (err) {
      console.error("Post-payment repayment recording failed:", err);
    }
    setShowModal(false);
    setClientSecret(null);
    setAmount("");
    setSuccess(true);
  }, [amount, activeLoan]);

  function closeModal() {
    if (loading) return;
    setShowModal(false);
    setClientSecret(null);
  }

  return (
    <>
      <div className="card space-y-3">
        <h3 className="text-lg font-semibold">Repayment</h3>
        {activeLoan ? (
          <>
            <p className="text-sm text-slate-500">
              Loan: ${(activeLoan.principal_cents / 100).toLocaleString()} &middot; Owed: $
              {(owedCents / 100).toFixed(2)}
            </p>
            <form onSubmit={openCheckout} className="space-y-3">
              <input
                className="input"
                type="number"
                placeholder="Repayment amount (USD)"
                min="1"
                max={owedCents / 100}
                step="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <button className="btn btn-outline" type="submit" disabled={loading || !amount}>
                {loading ? "Setting up..." : "Make Payment"}
              </button>
            </form>
          </>
        ) : (
          <p className="text-sm text-slate-500">No active loan to repay.</p>
        )}
        {error && <p className="text-sm" style={{ color: "#dc2626" }}>{error}</p>}
        {success && (
          <p className="text-sm" style={{ color: "#059669" }}>
            Payment successful! Repayment recorded.
          </p>
        )}
      </div>

      {/* Stripe Payment Modal */}
      <div className={`circle-modal${showModal ? " open" : ""}`} onClick={closeModal}>
        <div className="circle-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
          <button className="circle-modal-close" onClick={closeModal} aria-label="Close">
            &times;
          </button>
          <h2>Loan Repayment</h2>
          <p className="muted" style={{ marginBottom: "0.5rem" }}>
            Repaying <strong>${Number(amount || 0).toFixed(2)} CAD</strong> toward your microloan.
          </p>

          {clientSecret && (
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret,
                appearance: {
                  theme: "stripe",
                  variables: {
                    colorPrimary: "#0f766e",
                    borderRadius: "8px",
                    fontFamily: "Space Grotesk, sans-serif",
                  },
                },
              }}
            >
              <StripePaymentForm
                amountDollars={Number(amount || 0)}
                onSuccess={handlePaymentSuccess}
                onCancel={closeModal}
              />
            </Elements>
          )}

          <div
            style={{
              marginTop: 12,
              padding: 10,
              background: "#f8fafc",
              borderRadius: 10,
              fontSize: 13,
            }}
          >
            <strong>Test card:</strong> <code>4242 4242 4242 4242</code> — any future expiry, any
            CVC
          </div>
        </div>
      </div>
    </>
  );
}
