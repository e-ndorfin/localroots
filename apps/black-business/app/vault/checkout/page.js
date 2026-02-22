"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import Topbar from "@/components/layout/Header";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ""
);

function PaymentForm({ amountDollars, onSuccess }) {
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
      <button
        type="submit"
        disabled={!stripe || status === "processing"}
        className="btn btn-solid"
        style={{ marginTop: 24, width: "100%" }}
      >
        {status === "processing"
          ? "Processing..."
          : `Contribute $${amountDollars.toFixed(2)} CAD`}
      </button>

      {message && (
        <div
          style={{
            marginTop: 16,
            padding: "12px 16px",
            borderRadius: 12,
            background: "#fef2f2",
            border: "1px solid #fca5a5",
            color: "#991b1b",
          }}
        >
          {message}
        </div>
      )}
    </form>
  );
}

export default function VaultCheckoutPage() {
  const router = useRouter();
  const [amountCents, setAmountCents] = useState(0);
  const [clientSecret, setClientSecret] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function init() {
      const stored = sessionStorage.getItem("bb-vault-deposit-cents");
      const cents = Number(stored);
      if (!cents || cents <= 0) {
        setError("No deposit amount specified.");
        setLoading(false);
        return;
      }
      setAmountCents(cents);

      try {
        const res = await fetch("/api/vault/create-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amountCents: cents }),
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
    init();
  }, []);

  const handleSuccess = useCallback(async () => {
    try {
      await fetch("/api/vault/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountCents }),
      });
    } catch (err) {
      console.error("Post-payment deposit recording failed:", err);
    }
    sessionStorage.removeItem("bb-vault-deposit-cents");
    setSuccess(true);
  }, [amountCents]);

  const amountDollars = amountCents / 100;
  const hasPk = !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

  return (
    <>
      <div className="bg-orb orb-a"></div>
      <div className="bg-orb orb-b"></div>
      <Topbar />

      <main
        className="content"
        style={{ maxWidth: 640, margin: "0 auto", padding: "2rem 1rem" }}
      >
        <section className="page-head">
          <h1>Fund Contribution</h1>
          <p className="muted">
            Complete your contribution with Stripe (test mode — no real charges).
          </p>
        </section>

        {success && (
          <section className="panel reveal" style={{ textAlign: "center" }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                background: "#ecfdf5",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
                fontSize: 32,
              }}
            >
              ✓
            </div>
            <h2>Contribution Received!</h2>
            <p className="muted" style={{ marginTop: 8 }}>
              Your contribution of <strong>${amountDollars.toFixed(2)} CAD</strong> has
              been added to the community fund.
            </p>
            <Link
              href="/vault"
              className="btn btn-solid"
              style={{ marginTop: 20 }}
            >
              Back to Community Fund
            </Link>
          </section>
        )}

        {loading && !success && (
          <section className="panel reveal" style={{ textAlign: "center", padding: 40 }}>
            <p className="muted">Setting up payment...</p>
          </section>
        )}

        {error && !success && (
          <section className="panel reveal">
            <p style={{ color: "#991b1b" }}>{error}</p>
            <Link href="/vault" className="btn btn-outline" style={{ marginTop: 12 }}>
              Back to Community Fund
            </Link>
          </section>
        )}

        {!hasPk && !loading && !error && !success && (
          <div
            className="panel"
            style={{
              background: "#fef9c3",
              border: "1px solid #fde68a",
              marginBottom: 24,
            }}
          >
            <p style={{ margin: 0 }}>
              <strong>Missing publishable key.</strong> Add{" "}
              <code>NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...</code> to{" "}
              <code>.env.local</code> and restart the dev server.
            </p>
          </div>
        )}

        {clientSecret && !success && !loading && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <section className="panel reveal">
              <h2>Contribution Summary</h2>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "12px 0",
                  fontWeight: 700,
                  fontSize: 18,
                }}
              >
                <span>Community Fund Deposit</span>
                <span>${amountDollars.toFixed(2)} CAD</span>
              </div>
            </section>

            <section className="panel reveal">
              <h2>Card Details</h2>
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
                  <PaymentForm
                    amountDollars={amountDollars}
                    onSuccess={handleSuccess}
                  />
                </Elements>
              </div>

              <div
                style={{
                  marginTop: 20,
                  padding: 12,
                  background: "#f8fafc",
                  borderRadius: 10,
                  fontSize: 13,
                }}
              >
                <strong>Test card:</strong>{" "}
                <code>4242 4242 4242 4242</code> — any future expiry, any CVC
              </div>
            </section>

            <Link
              href="/vault"
              className="btn btn-outline"
              style={{ alignSelf: "flex-start" }}
            >
              Back to Community Fund
            </Link>
          </div>
        )}
      </main>
    </>
  );
}
