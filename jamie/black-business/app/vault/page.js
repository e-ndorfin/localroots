"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import UserAvatarLink from "@/components/layout/UserAvatarLink";

export default function VaultPage() {
  const [total, setTotal] = useState(42500);
  const [showCustom, setShowCustom] = useState(false);
  const [custom, setCustom] = useState("");
  const pct = useMemo(() => Math.min(100, Math.round((total / 62500) * 100)), [total]);

  function contribute(amount) {
    setTotal((t) => t + amount);
  }

  return (
    <>
      <div className="bg-orb orb-a"></div>
      <div className="bg-orb orb-b"></div>

      <header className="topbar">
        <Link className="app-name" href="/directory">LocalRoots</Link>
        <nav className="nav-links nav-inline">
          <Link className="nav-link" href="/directory">Browse</Link>
          <Link className="nav-link active" href="/vault">Community Fund</Link>
        </nav>
        <div className="topbar-right"><div className="site-balances"><div className="balance-pill"><strong>$245.0</strong></div><div className="balance-pill"><strong>1,840 pts</strong></div></div><UserAvatarLink /></div>
      </header>

      <main className="content">
        <section className="fund-hero reveal">
          <div className="fund-orb-shell"><div className="fund-orb"><div className="fund-liquid" style={{ height: `${pct}%` }}></div><span className="fund-orb-amount">$62,500</span></div></div>
          <div className="fund-hero-copy"><h1>Pool local capital. Invest in local growth.</h1><p className="muted">Join neighbors to fund verified small businesses together. Loans are issued with modest interest, and contributors receive a small profit as repayments are made.</p></div>
        </section>

        <section className="fund-grid">
          <div className="panel reveal">
            <h2>How it works</h2>
            <div className="fund-steps">
              <article className="fund-step"><div className="fund-step-icon">1</div><div><h3>Pool Capital</h3><p className="muted">Contributors add money into one shared local investment pool.</p></div></article>
              <article className="fund-step"><div className="fund-step-icon">2</div><div><h3>Fund Local Businesses</h3><p className="muted">Verified, local black-owned businesses can apply for, and recieve microloans from the pooled capital.</p></div></article>
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
              <div className="fund-metric-card"><p className="muted">Total Pool Size</p><h3>${total.toLocaleString()}</h3></div>
              <div className="fund-metric-card"><p className="muted">Businesses Funded</p><h3>14</h3></div>
            </div>

            <div className="fund-progress-block">
              <div className="progress-wrap"><div className="progress-fill" style={{ width: `${pct}%` }}></div></div>
              <p className="muted">{pct}% of this month&apos;s $62,500 community target</p>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
