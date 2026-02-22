"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import Topbar from "@/components/layout/Header";

export default function VaultPage() {
  const [total, setTotal] = useState(0);
  const [lenderBalance, setLenderBalance] = useState(0);
  const [activeLoans, setActiveLoans] = useState(0);
  const [available, setAvailable] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showCustom, setShowCustom] = useState(false);
  const [custom, setCustom] = useState("");
  const goal = 6250000; // $62,500 in cents
  const pct = useMemo(() => Math.min(100, Math.round((total / goal) * 100)), [total]);

  const pseudonym = typeof window !== "undefined" ? window.localStorage.getItem("bb-pseudonym") || "demo-user" : "demo-user";

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/vault/status?pseudonym=${encodeURIComponent(pseudonym)}`);
      if (res.ok) {
        const data = await res.json();
        setTotal(data.totalCents);
        setLenderBalance(data.lenderBalanceCents);
        setActiveLoans(data.activeLoans);
        setAvailable(data.availableCapitalCents);
      }
    } catch (err) {
      console.error("Failed to fetch vault status:", err);
    } finally {
      setLoading(false);
    }
  }, [pseudonym]);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  async function contribute(amountDollars) {
    try {
      const res = await fetch("/api/vault/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pseudonym, amountCents: Math.round(amountDollars * 100) }),
      });
      if (res.ok) {
        const data = await res.json();
        setTotal(data.totalCents);
        setLenderBalance(data.lenderBalanceCents);
      }
    } catch (err) {
      console.error("Deposit failed:", err);
    }
  }

  const displayTotal = (total / 100).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  const displayGoal = (goal / 100).toLocaleString();
  const displayBalance = (lenderBalance / 100).toLocaleString(undefined, { minimumFractionDigits: 2 });

  return (
    <>
      <div className="bg-orb orb-a"></div>
      <div className="bg-orb orb-b"></div>

      <Topbar balanceContent={<div className="balance-pill"><strong>${displayBalance}</strong></div>} />

      <main className="content">
        <section className="fund-hero reveal">
          <div className="fund-orb-shell"><div className="fund-orb"><div className="fund-liquid" style={{ height: `${pct}%` }}></div><span className="fund-orb-amount">${displayGoal}</span></div></div>
          <div className="fund-hero-copy"><h1>Pool local capital. Invest in local growth.</h1><p className="muted">Join neighbors to fund verified small businesses together. Loans are issued with modest interest, and contributors receive a small profit as repayments are made.</p></div>
        </section>

        <section className="fund-grid">
          <div className="panel reveal">
            <h2>How it works</h2>
            <div className="fund-steps">
              <article className="fund-step"><div className="fund-step-icon">1</div><div><h3>Pool Capital</h3><p className="muted">Contributors add money into one shared local investment pool.</p></div></article>
              <article className="fund-step"><div className="fund-step-icon">2</div><div><h3>Fund Local Businesses</h3><p className="muted">Verified, local black-owned businesses can apply for, and receive microloans from the pooled capital.</p></div></article>
              <article className="fund-step"><div className="fund-step-icon">3</div><div><h3>Repayment + Small Profit</h3><p className="muted">As businesses repay loans with modest interest, contributors earn a small profit while keeping money circulating locally.</p></div></article>
            </div>
          </div>

          <div className="panel reveal">
            <h2>Make a Contribution</h2>
            <p className="muted">Invest with your community and help local businesses scale responsibly. Repayments and profit distributions are tracked in your wallet balance. Returns are modest, risk-aware, and community-first.</p>

            <div className="contribute-row">
              <button className="btn btn-outline" onClick={() => contribute(25)}>+$25</button>
              <button className="btn btn-outline" onClick={() => contribute(50)}>+$50</button>
              <button className="btn btn-outline" onClick={() => contribute(100)}>+$100</button>
              <button className="btn btn-solid" onClick={() => setShowCustom((v) => !v)}>Custom Contribution</button>
            </div>

            <div className={`custom-fund ${showCustom ? "visible" : ""}`}>
              <input value={custom} onChange={(e) => setCustom(e.target.value)} type="number" min="5" step="5" placeholder="Enter amount" />
              <button className="btn btn-solid" onClick={() => { const v = Number(custom); if (v >= 5) contribute(v); setCustom(""); }}>Add to Fund</button>
            </div>

            <div className="fund-metrics">
              <div className="fund-metric-card"><p className="muted">Total Pool Size</p><h3>{loading ? "..." : `$${displayTotal}`}</h3></div>
              <div className="fund-metric-card"><p className="muted">Active Loans</p><h3>{loading ? "..." : activeLoans}</h3></div>
              <div className="fund-metric-card"><p className="muted">Available Capital</p><h3>{loading ? "..." : `$${(available / 100).toLocaleString()}`}</h3></div>
              <div className="fund-metric-card"><p className="muted">Your Contribution</p><h3>{loading ? "..." : `$${displayBalance}`}</h3></div>
            </div>

            <div className="fund-progress-block">
              <div className="progress-wrap"><div className="progress-fill" style={{ width: `${pct}%` }}></div></div>
              <p className="muted">{pct}% of this month&apos;s ${displayGoal} community target</p>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
