"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Topbar from "@/components/layout/Header";

const CART_KEY = "bb-cart-items";
const POINTS_PER_DOLLAR = 10; // mirrors lib/constants.js
const POINTS_REDEMPTION_RATE = 100; // 100 pts = $1

export default function CheckoutPage() {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [availableBalance, setAvailableBalance] = useState(0);
  const [balanceLoaded, setBalanceLoaded] = useState(false);

  // Load cart from localStorage
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(CART_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      setItems(Array.isArray(parsed) ? parsed : []);
    } catch {
      setItems([]);
    }
  }, []);

  // Fetch loyalty balance on mount
  useEffect(() => {
    fetch("/api/loyalty/balance")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.balance != null) setAvailableBalance(data.balance);
      })
      .catch(() => {})
      .finally(() => setBalanceLoaded(true));
  }, []);

  function setAndPersist(next) {
    setItems(next);
    window.localStorage.setItem(CART_KEY, JSON.stringify(next));
  }

  function toggleItem(index) {
    const item = items[index];
    if (!item) return;

    // If toggling ON, check if balance is sufficient
    if (!item.usePoints) {
      const pointsCost = Math.round(Number(item.price || 0) * POINTS_REDEMPTION_RATE);
      const currentPointsUsed = items.reduce(
        (sum, it, i) => sum + (it.usePoints && i !== index ? Math.round(Number(it.price || 0) * POINTS_REDEMPTION_RATE) : 0),
        0
      );
      if (currentPointsUsed + pointsCost > availableBalance) {
        const balanceUsd = (availableBalance / POINTS_REDEMPTION_RATE).toFixed(2);
        const costUsd = (pointsCost / POINTS_REDEMPTION_RATE).toFixed(2);
        alert(
          `Not enough points!\n\n` +
          `This item costs ${pointsCost.toLocaleString()} pts ($${costUsd})\n` +
          `Your balance: ${availableBalance.toLocaleString()} pts ($${balanceUsd})`
        );
        return;
      }
    }

    const next = items.map((it, i) => (i === index ? { ...it, usePoints: !it.usePoints } : it));
    setAndPersist(next);
  }

  const cashTotal = items.reduce((sum, item) => sum + (item.usePoints ? 0 : Number(item.price || 0)), 0);
  const pointsTotal = items.reduce(
    (sum, item) => sum + (item.usePoints ? Math.round(Number(item.price || 0) * POINTS_REDEMPTION_RATE) : 0),
    0
  );

  const [placing, setPlacing] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [earnedPoints, setEarnedPoints] = useState(0);

  async function placeOrder() {
    if (!items.length || placing) return;

    // If there's a cash total, redirect to Stripe checkout
    if (cashTotal > 0) {
      router.push("/stripe-checkout");
      return;
    }

    // Points-only order — process inline (no Stripe needed)
    setPlacing(true);

    try {
      if (pointsTotal > 0) {
        const byBusiness = {};
        for (const item of items) {
          if (!item.usePoints) continue;
          const bid = item.businessId || "1";
          byBusiness[bid] = (byBusiness[bid] || 0) + Math.round(Number(item.price || 0) * POINTS_REDEMPTION_RATE);
        }

        for (const [bizId, pts] of Object.entries(byBusiness)) {
          const redeemRes = await fetch("/api/loyalty/redeem", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ businessId: bizId, points: pts }),
          });
          if (!redeemRes.ok) {
            const redeemErr = await redeemRes.json().catch(() => ({}));
            console.error("Points redemption failed:", redeemErr.error);
          }
        }
      }

      window.localStorage.setItem(CART_KEY, "[]");
      setItems([]);
      setOrderComplete(true);
      window.dispatchEvent(new Event("points-updated"));
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
          {balanceLoaded && (
            <p className="muted">Your balance: <strong>{availableBalance.toLocaleString()} pts (${(availableBalance / POINTS_REDEMPTION_RATE).toFixed(2)})</strong></p>
          )}
        </section>

        <div className="two-col">
          <section className="panel reveal">
            <h2>Order Items</h2>
            <div className="checkout-items">
              {items.length ? items.map((item, index) => {
                const pointsCost = Math.round(Number(item.price || 0) * POINTS_REDEMPTION_RATE);
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
            <button className={`btn btn-solid checkout-place-btn${items.length && !placing ? "" : " checkout-disabled"}`} onClick={placeOrder} disabled={!items.length || placing}>{placing ? "Processing..." : cashTotal > 0 ? "Proceed to Payment" : "Place Order"}</button>
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
