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

const CART_KEY = "bb-cart-items";
const POINTS_PER_DOLLAR = 10;
const POINTS_REDEMPTION_RATE = 100;

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ""
);

// ---------- Stripe payment form ----------
function PaymentForm({ cashTotal, onSuccess }) {
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
      onSuccess(paymentIntent);
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
          : `Pay $${cashTotal.toFixed(2)} CAD`}
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

// ---------- Main page ----------
export default function StripeCheckoutPage() {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [clientSecret, setClientSecret] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [orderComplete, setOrderComplete] = useState(false);
  const [earnedPoints, setEarnedPoints] = useState(0);

  // Derived totals
  const cashItems = items.filter((it) => !it.usePoints);
  const pointsItems = items.filter((it) => it.usePoints);
  const cashTotal = cashItems.reduce(
    (sum, it) => sum + Number(it.price || 0),
    0
  );
  const pointsTotal = pointsItems.reduce(
    (sum, it) => sum + Math.round(Number(it.price || 0) * POINTS_REDEMPTION_RATE),
    0
  );

  // Load cart and create PaymentIntent on mount
  useEffect(() => {
    async function init() {
      // Read cart
      let cart = [];
      try {
        const raw = window.localStorage.getItem(CART_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        cart = Array.isArray(parsed) ? parsed : [];
      } catch {
        cart = [];
      }

      if (!cart.length) {
        setError("Your cart is empty.");
        setLoading(false);
        return;
      }

      setItems(cart);

      const total = cart
        .filter((it) => !it.usePoints)
        .reduce((sum, it) => sum + Number(it.price || 0), 0);

      if (total <= 0) {
        // Everything is paid with points — no Stripe needed, redirect back
        setError("No cash payment needed — all items are covered by points.");
        setLoading(false);
        return;
      }

      // Create PaymentIntent via real checkout endpoint
      const firstBusinessId = cart.find((it) => !it.usePoints)?.businessId || null;
      try {
        const res = await fetch("/api/payments/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amountCents: Math.round(total * 100), businessId: firstBusinessId }),
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

  // After Stripe payment succeeds, finalize the order
  const handlePaymentSuccess = useCallback(
    async (paymentIntent) => {
      try {
        // Call confirm endpoint — credits business, awards points, mints MPT, mirrors RLUSD
        const firstBusinessId = cashItems[0]?.businessId || items[0]?.businessId || null;
        const confirmRes = await fetch("/api/payments/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            paymentIntentId: paymentIntent.id,
            businessId: firstBusinessId,
            amountCents: Math.round(cashTotal * 100),
          }),
        });
        const confirmData = confirmRes.ok ? await confirmRes.json() : {};

        // Process points redemption items
        if (pointsTotal > 0) {
          const byBiz = {};
          for (const item of pointsItems) {
            const bid = item.businessId || "1";
            byBiz[bid] =
              (byBiz[bid] || 0) +
              Math.round(Number(item.price || 0) * POINTS_REDEMPTION_RATE);
          }
          for (const [bizId, pts] of Object.entries(byBiz)) {
            await fetch("/api/loyalty/redeem", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ businessId: bizId, points: pts }),
            });
          }
        }

        // Clear cart
        window.localStorage.setItem(CART_KEY, "[]");
        window.dispatchEvent(new Event("points-updated"));
        setEarnedPoints(confirmData.earnedPoints || 0);
        setOrderComplete(true);
      } catch (err) {
        console.error("Post-payment processing failed:", err);
        // Payment itself succeeded, so still show success
        setOrderComplete(true);
      }
    },
    [cashItems, cashTotal, items, pointsItems, pointsTotal]
  );

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
          <h1>Payment</h1>
          <p className="muted">
            Complete your purchase with Stripe (test mode — no real charges).
          </p>
        </section>

        {/* Order Complete */}
        {orderComplete && (
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
            <h2>Order Placed!</h2>
            <p className="muted" style={{ marginTop: 8 }}>
              Your payment of <strong>${cashTotal.toFixed(2)} CAD</strong> was
              successful.
            </p>
            {earnedPoints > 0 && (
              <p style={{ color: "var(--accent)", fontWeight: 600, marginTop: 8 }}>
                You earned {earnedPoints.toLocaleString()} loyalty points!
              </p>
            )}
            {pointsTotal > 0 && (
              <p className="muted">
                {pointsTotal.toLocaleString()} points were redeemed.
              </p>
            )}
            <Link
              href="/directory"
              className="btn btn-solid"
              style={{ marginTop: 20 }}
            >
              Continue Shopping
            </Link>
          </section>
        )}

        {/* Loading */}
        {loading && !orderComplete && (
          <section className="panel reveal" style={{ textAlign: "center", padding: 40 }}>
            <p className="muted">Setting up payment...</p>
          </section>
        )}

        {/* Error */}
        {error && !orderComplete && (
          <section className="panel reveal">
            <p style={{ color: "#991b1b" }}>{error}</p>
            <Link href="/checkout" className="btn btn-outline" style={{ marginTop: 12 }}>
              Back to Checkout
            </Link>
          </section>
        )}

        {/* Missing key warning */}
        {!hasPk && !loading && !error && !orderComplete && (
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

        {/* Payment form + order summary */}
        {clientSecret && !orderComplete && !loading && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {/* Order summary */}
            <section className="panel reveal">
              <h2>Order Summary</h2>
              <div style={{ marginTop: 12 }}>
                {items.map((item, i) => {
                  const pts = Math.round(
                    Number(item.price || 0) * POINTS_REDEMPTION_RATE
                  );
                  return (
                    <div
                      key={item.id || i}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        padding: "8px 0",
                        borderBottom: "1px solid var(--line)",
                      }}
                    >
                      <span>{item.name}</span>
                      <span style={{ fontWeight: 600 }}>
                        {item.usePoints
                          ? `${pts.toLocaleString()} pts`
                          : `$${Number(item.price || 0).toFixed(2)}`}
                      </span>
                    </div>
                  );
                })}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "12px 0 0",
                    fontWeight: 700,
                    fontSize: 18,
                  }}
                >
                  <span>Total (card)</span>
                  <span>${cashTotal.toFixed(2)} CAD</span>
                </div>
                {pointsTotal > 0 && (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "4px 0 0",
                      color: "var(--muted)",
                    }}
                  >
                    <span>Points redeemed</span>
                    <span>{pointsTotal.toLocaleString()} pts</span>
                  </div>
                )}
              </div>
            </section>

            {/* Stripe Payment Element */}
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
                    cashTotal={cashTotal}
                    onSuccess={handlePaymentSuccess}
                  />
                </Elements>
              </div>

              {/* Test card hint */}
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
              href="/checkout"
              className="btn btn-outline"
              style={{ alignSelf: "flex-start" }}
            >
              Back to Cart
            </Link>
          </div>
        )}
      </main>
    </>
  );
}
