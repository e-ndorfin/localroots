"use client";

import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import Topbar from "@/components/layout/Header";

// Uses the NEXT_PUBLIC_ publishable key from .env.local
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ""
);

// ---------- Inner form (must be inside <Elements>) ----------
function CheckoutForm({ amount }) {
  const stripe = useStripe();
  const elements = useElements();
  const [status, setStatus] = useState("idle"); // idle | processing | succeeded | error
  const [message, setMessage] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!stripe || !elements) return;

    setStatus("processing");
    setMessage("");

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.href, // stay on same page
      },
      redirect: "if_required",
    });

    if (error) {
      setStatus("error");
      setMessage(error.message);
    } else if (paymentIntent?.status === "succeeded") {
      setStatus("succeeded");
      setMessage(
        `Payment succeeded! ID: ${paymentIntent.id} — $${(paymentIntent.amount / 100).toFixed(2)}`
      );
    } else {
      setStatus("idle");
      setMessage(`Unexpected status: ${paymentIntent?.status}`);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 480 }}>
      <PaymentElement />
      <button
        type="submit"
        disabled={!stripe || status === "processing"}
        className="btn btn-solid"
        style={{ marginTop: 24, width: "100%" }}
      >
        {status === "processing"
          ? "Processing..."
          : `Pay $${(amount / 100).toFixed(2)}`}
      </button>

      {message && (
        <div
          style={{
            marginTop: 16,
            padding: "12px 16px",
            borderRadius: 12,
            background: status === "succeeded" ? "#ecfdf5" : "#fef2f2",
            border: `1px solid ${status === "succeeded" ? "#86efac" : "#fca5a5"}`,
            color: status === "succeeded" ? "#166534" : "#991b1b",
          }}
        >
          {message}
        </div>
      )}
    </form>
  );
}

// ---------- Page wrapper ----------
export default function StripeTestPage() {
  const [clientSecret, setClientSecret] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [amountCents, setAmountCents] = useState(2000); // default $20.00

  async function createPayment() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/stripe-test/create-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountCents }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create payment");
      setClientSecret(data.clientSecret);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const hasPk = !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

  return (
    <>
      <div className="bg-orb orb-a"></div>
      <div className="bg-orb orb-b"></div>
      <Topbar />

      <main className="content" style={{ maxWidth: 600, margin: "0 auto", padding: "2rem 1rem" }}>
        <section className="page-head">
          <h1>Stripe Test Checkout</h1>
          <p className="muted">
            Demo payment page using Stripe test mode. No real charges.
          </p>
        </section>

        {!hasPk && (
          <div
            className="panel"
            style={{ background: "#fef9c3", border: "1px solid #fde68a", marginBottom: 24 }}
          >
            <p style={{ margin: 0 }}>
              <strong>Missing publishable key.</strong> Add{" "}
              <code>NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...</code> to your{" "}
              <code>.env.local</code> and restart the dev server.
            </p>
          </div>
        )}

        {!clientSecret ? (
          <section className="panel reveal">
            <h2>Start a Test Payment</h2>
            <div style={{ marginTop: 16, display: "flex", gap: 12, alignItems: "center" }}>
              <label>
                Amount ($):{" "}
                <input
                  type="number"
                  step="0.01"
                  min="0.50"
                  value={(amountCents / 100).toFixed(2)}
                  onChange={(e) =>
                    setAmountCents(Math.round(parseFloat(e.target.value || "0") * 100))
                  }
                  style={{
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: "1px solid var(--line)",
                    width: 120,
                    fontSize: 16,
                  }}
                />
              </label>
              <button
                className="btn btn-solid"
                onClick={createPayment}
                disabled={loading || !hasPk}
              >
                {loading ? "Creating..." : "Create Payment"}
              </button>
            </div>

            {error && (
              <p style={{ color: "#991b1b", marginTop: 12 }}>{error}</p>
            )}

            <div style={{ marginTop: 24, padding: 16, background: "#f8fafc", borderRadius: 12 }}>
              <h3 style={{ fontSize: 14, marginBottom: 8 }}>Test Card Numbers</h3>
              <table style={{ fontSize: 13, width: "100%" }}>
                <tbody>
                  <tr><td><code>4242 4242 4242 4242</code></td><td>Visa (success)</td></tr>
                  <tr><td><code>4000 0000 0000 9995</code></td><td>Insufficient funds</td></tr>
                  <tr><td><code>4000 0000 0000 0002</code></td><td>Card declined</td></tr>
                </tbody>
              </table>
              <p className="muted" style={{ fontSize: 12, marginTop: 8 }}>
                Use any future expiry, any 3-digit CVC, any ZIP code.
              </p>
            </div>
          </section>
        ) : (
          <section className="panel reveal">
            <h2>Enter Payment Details</h2>
            <div style={{ marginTop: 16 }}>
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
                <CheckoutForm amount={amountCents} />
              </Elements>
            </div>
            <button
              className="btn btn-outline"
              style={{ marginTop: 16 }}
              onClick={() => setClientSecret(null)}
            >
              Start Over
            </button>
          </section>
        )}
      </main>
    </>
  );
}
