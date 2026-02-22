"use client";

import { useEffect, useState } from "react";
import Topbar from "@/components/layout/Header";
import BoostVisibilityForm from "@/components/business/BoostVisibilityForm";
import { createClient } from "@/lib/supabase/client";

export default function BusinessTrackingPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Cashout modal state
  const [showCashoutModal, setShowCashoutModal] = useState(false);
  const [cashoutStep, setCashoutStep] = useState("bank");
  const [bankInfo, setBankInfo] = useState({ institution: "", transit: "", account: "" });
  const [cashoutAmount, setCashoutAmount] = useState("");
  const [cashoutLoading, setCashoutLoading] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        setLoading(false);
        return;
      }
      fetch("/api/business/stats")
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data && !data.error) setStats(data);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    });
  }, []);

  // Listen for cashout modal open event from Topbar
  useEffect(() => {
    const handler = () => {
      setCashoutStep("bank");
      setCashoutAmount("");
      setBankInfo({ institution: "", transit: "", account: "" });
      setShowCashoutModal(true);
    };
    window.addEventListener("open-cashout-modal", handler);
    return () => window.removeEventListener("open-cashout-modal", handler);
  }, []);

  const fmt = (cents) =>
    cents != null
      ? (cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })
      : "—";

  const revenue = stats ? fmt(stats.balanceCents) : "—";

  async function confirmCashout() {
    const cents = Math.round(parseFloat(cashoutAmount) * 100);
    if (!cents || cents <= 0) return;
    setCashoutLoading(true);
    try {
      const res = await fetch("/api/business/cashout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountCents: cents }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Cashout failed");
        setCashoutLoading(false);
        return;
      }
      setStats((prev) => (prev ? { ...prev, balanceCents: data.newBalanceCents } : prev));
      window.dispatchEvent(new Event("balance-updated"));
      setCashoutStep("success");
    } catch {
      alert("Network error");
    } finally {
      setCashoutLoading(false);
    }
  }

  const maxCashout = stats ? (stats.balanceCents / 100).toFixed(2) : "0.00";

  return (
    <>
      <div className="bg-orb orb-a"></div>
      <div className="bg-orb orb-b"></div>

      <Topbar />

      <main className="content">
        <section className="card-grid">
          <article className="panel reveal">
            <p className="muted">Revenue (All Time)</p>
            <h2>{stats ? `$${revenue}` : "—"}</h2>
            <p className="muted">From customer purchases</p>
          </article>
          <article className="panel reveal">
            <p className="muted">Total Orders</p>
            <h2>{stats ? stats.totalOrders.toLocaleString() : "—"}</h2>
            <p className="muted">Loyalty point earn events</p>
          </article>
          <article className="panel reveal">
            <p className="muted">Unique Customers</p>
            <h2>{stats ? stats.uniqueCustomers.toLocaleString() : "—"}</h2>
            <p className="muted">Distinct customers served</p>
          </article>
          <article className="panel reveal">
            <p className="muted">Points Redeemed</p>
            <h2>{stats ? stats.pointsRedeemed.toLocaleString() : "—"}</h2>
            <p className="muted">Customer loyalty redemptions</p>
          </article>
        </section>

        <section className="reveal mt-6 max-w-md">
          <BoostVisibilityForm isBoosted={stats?.isBoosted} />
        </section>
      </main>

      {/* Cashout modal */}
      <div className={`circle-modal${showCashoutModal ? " open" : ""}`} onClick={() => !cashoutLoading && setShowCashoutModal(false)}>
        <div className="circle-modal-card" onClick={(e) => e.stopPropagation()}>
          <button className="circle-modal-close" onClick={() => !cashoutLoading && setShowCashoutModal(false)}>×</button>

          {cashoutStep === "bank" && (
            <>
              <h2>Cash Out</h2>
              <p className="muted" style={{ marginBottom: "1rem" }}>
                Enter your bank details and the amount to withdraw. This information is equivalent to a void cheque.
              </p>
              <label>
                Amount ($)
                <input
                  type="number"
                  min="0.01"
                  max={maxCashout}
                  step="0.01"
                  placeholder="0.00"
                  value={cashoutAmount}
                  onChange={(e) => setCashoutAmount(e.target.value)}
                />
              </label>
              <label>
                Institution Number
                <input
                  type="text"
                  maxLength={3}
                  placeholder="e.g. 001"
                  value={bankInfo.institution}
                  onChange={(e) => setBankInfo((b) => ({ ...b, institution: e.target.value }))}
                />
              </label>
              <label>
                Transit Number
                <input
                  type="text"
                  maxLength={5}
                  placeholder="e.g. 12345"
                  value={bankInfo.transit}
                  onChange={(e) => setBankInfo((b) => ({ ...b, transit: e.target.value }))}
                />
              </label>
              <label>
                Account Number
                <input
                  type="text"
                  maxLength={12}
                  placeholder="e.g. 1234567"
                  value={bankInfo.account}
                  onChange={(e) => setBankInfo((b) => ({ ...b, account: e.target.value }))}
                />
              </label>
              <div className="circle-modal-actions">
                <button
                  className="btn btn-solid"
                  disabled={cashoutLoading || !cashoutAmount || !bankInfo.institution || !bankInfo.transit || !bankInfo.account}
                  onClick={confirmCashout}
                >
                  {cashoutLoading ? "Processing..." : "Confirm Withdrawal"}
                </button>
              </div>
            </>
          )}

          {cashoutStep === "success" && (
            <div style={{ textAlign: "center" }}>
              <div style={{
                width: 64, height: 64, borderRadius: "50%", background: "#ecfdf5",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 16px", fontSize: 32,
              }}>
                ✓
              </div>
              <h2>Withdrawal Successful</h2>
              <p className="muted" style={{ marginTop: 8 }}>
                <strong>${parseFloat(cashoutAmount).toFixed(2)} CAD</strong> will be transferred to your bank account ending in ****{bankInfo.account.slice(-4)}. Please allow 2–3 business days for processing.
              </p>
              <button className="btn btn-solid" style={{ marginTop: 20 }} onClick={() => setShowCashoutModal(false)}>
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
