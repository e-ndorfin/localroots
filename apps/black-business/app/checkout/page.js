"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Topbar from "@/components/layout/Header";

const CART_KEY = "bb-cart-items";
const POINTS_PER_DOLLAR = 100;

export default function CheckoutPage() {
  const router = useRouter();
  const [items, setItems] = useState([]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(CART_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      setItems(Array.isArray(parsed) ? parsed : []);
    } catch {
      setItems([]);
    }
  }, []);

  function setAndPersist(next) {
    setItems(next);
    window.localStorage.setItem(CART_KEY, JSON.stringify(next));
  }

  function toggleItem(index) {
    const next = items.map((item, i) => (i === index ? { ...item, usePoints: !item.usePoints } : item));
    setAndPersist(next);
  }

  const cashTotal = items.reduce((sum, item) => sum + (item.usePoints ? 0 : Number(item.price || 0)), 0);
  const pointsTotal = items.reduce((sum, item) => sum + (item.usePoints ? Math.round(Number(item.price || 0) * POINTS_PER_DOLLAR) : 0), 0);

  const [placing, setPlacing] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [earnedPoints, setEarnedPoints] = useState(0);

  async function placeOrder() {
    if (!items.length || placing) return;
    setPlacing(true);
    const pseudonym = window.localStorage.getItem("bb-pseudonym") || "demo-user";

    try {
      // Process card payment items
      if (cashTotal > 0) {
        const res = await fetch("/api/payments/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            businessId: "1",
            amountCents: Math.round(cashTotal * 100),
            customerPseudonym: pseudonym,
          }),
        });
        if (res.ok) {
          // Points earned: 100 per dollar spent
          setEarnedPoints(Math.round(cashTotal * POINTS_PER_DOLLAR));
        }
      }

      // Process points redemption items
      if (pointsTotal > 0) {
        await fetch("/api/loyalty/redeem", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customerPseudonym: pseudonym,
            businessId: "1",
            points: pointsTotal,
          }),
        });
      }

      window.localStorage.setItem(CART_KEY, "[]");
      setItems([]);
      setOrderComplete(true);
    } catch (err) {
      console.error("Order failed:", err);
    } finally {
      setPlacing(false);
    }
  }

  return (
    <>
      <div className="bg-orb orb-a"></div>
      <div className="bg-orb orb-b"></div>

      <Topbar />

      <main className="content">
        <section className="page-head">
          <h1>Checkout</h1>
          <p className="muted">Toggle points per item before placing your order.</p>
        </section>

        <div className="two-col">
          <section className="panel reveal">
            <h2>Order Items</h2>
            <div className="checkout-items">
              {items.length ? items.map((item, index) => {
                const pointsCost = Math.round(Number(item.price || 0) * POINTS_PER_DOLLAR);
                return (
                  <article key={item.id || index} className="checkout-item-row">
                    <div>
                      <h3>{item.name}</h3>
                      <p className="muted">{item.usePoints ? `${pointsCost.toLocaleString()} pts` : `$${Number(item.price || 0).toFixed(2)}`}</p>
                    </div>
                    <label className="points-toggle">
                      <input type="checkbox" checked={Boolean(item.usePoints)} onChange={() => toggleItem(index)} />
                      <span>Use points</span>
                    </label>
                  </article>
                );
              }) : <p className="muted">Your cart is empty. Add products from a storefront.</p>}
            </div>
          </section>

          <aside className="panel reveal">
            <h2>Payment Summary</h2>
            <div className="checkout-summary">
              <div className="summary-row">
                <span>Cash Total</span>
                <strong>${cashTotal.toFixed(2)}</strong>
              </div>
              <div className="summary-row">
                <span>Points Total</span>
                <strong>{pointsTotal.toLocaleString()} pts</strong>
              </div>
              <div className="summary-row">
                <span>Items</span>
                <strong>{items.length}</strong>
              </div>
            </div>
            <button className={`btn btn-solid checkout-place-btn${items.length && !placing ? "" : " checkout-disabled"}`} onClick={placeOrder} disabled={!items.length || placing}>{placing ? "Processing..." : "Place Order"}</button>
            {orderComplete && (
              <div className="mt-3 p-3 rounded-xl bg-green-50 border border-green-200 text-center">
                <p className="font-bold text-green-800">Order placed!</p>
                {earnedPoints > 0 && <p className="text-green-700">You earned {earnedPoints.toLocaleString()} points!</p>}
                <Link href="/directory" className="btn btn-outline mt-2">Continue Shopping</Link>
              </div>
            )}
          </aside>
        </div>
      </main>
    </>
  );
}

