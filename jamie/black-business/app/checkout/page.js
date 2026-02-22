"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import UserAvatarLink from "@/components/layout/UserAvatarLink";

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

  function placeOrder() {
    window.localStorage.setItem(CART_KEY, "[]");
    setItems([]);
    router.push("/directory");
  }

  return (
    <>
      <div className="bg-orb orb-a"></div>
      <div className="bg-orb orb-b"></div>

      <header className="topbar">
        <Link className="app-name" href="/directory">LocalRoots</Link>
        <nav className="nav-links nav-inline">
          <Link className="nav-link" href="/directory">Browse</Link>
          <Link className="nav-link" href="/vault">Community Fund</Link>
        </nav>
        <div className="topbar-right">
          <div className="site-balances">
            <div className="balance-pill"><strong>$245.0</strong></div>
            <div className="balance-pill"><strong>1,840 pts</strong></div>
          </div>
          <UserAvatarLink />
        </div>
      </header>

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
            <button className={`btn btn-solid checkout-place-btn${items.length ? "" : " checkout-disabled"}`} onClick={placeOrder} disabled={!items.length}>Place Order</button>
          </aside>
        </div>
      </main>
    </>
  );
}

