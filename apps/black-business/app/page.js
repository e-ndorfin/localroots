"use client";

import Link from "next/link";

export default function HomePage() {
  return (
    <>
      <div className="bg-orb orb-a" />
      <div className="bg-orb orb-b" />

      <div className="topbar">
        <Link href="/" className="app-name">LocalRoots</Link>
        <div className="topbar-right">
          <Link href="/login" className="btn btn-outline">Sign In</Link>
          <Link href="/choose-account" className="btn btn-solid">Get Started</Link>
        </div>
      </div>

      <div className="content" style={{ maxWidth: 900, margin: "0 auto" }}>
        <div className="panel reveal" style={{ marginTop: "2rem", textAlign: "center", padding: "2.5rem 1.5rem" }}>
          <p className="eyebrow">Community-Powered Commerce</p>
          <h1 style={{ fontSize: "clamp(1.8rem, 3vw, 2.8rem)", marginBottom: "0.6rem" }}>
            Black Business Support Platform
          </h1>
          <p className="muted" style={{ maxWidth: 560, margin: "0 auto 1.5rem", fontSize: "1.05rem", lineHeight: 1.55 }}>
            Shop, earn rewards, and invest in Black-owned businesses through local-first
            commerce, loyalty, and lending.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem", justifyContent: "center" }}>
            <Link href="/directory" className="btn btn-solid" style={{ padding: "0.7rem 1.4rem", fontSize: "1rem" }}>
              Shop &amp; Earn
            </Link>
            <Link href="/business/register" className="btn btn-outline" style={{ padding: "0.7rem 1.4rem", fontSize: "1rem" }}>
              List Your Business
            </Link>
            <Link href="/vault" className="btn btn-outline" style={{ padding: "0.7rem 1.4rem", fontSize: "1rem" }}>
              Support the Community
            </Link>
          </div>
        </div>

        <div className="card-grid reveal" style={{ marginTop: "1.5rem" }}>
          <div className="panel">
            <div className="eyebrow" style={{ color: "var(--gold)" }}>Customer</div>
            <h2 style={{ fontSize: "1.25rem", marginBottom: "0.4rem" }}>Shop &amp; Earn</h2>
            <p className="muted" style={{ margin: 0, fontSize: "0.92rem" }}>
              Discover businesses, pay with card, earn loyalty points redeemable across the network.
            </p>
          </div>
          <div className="panel">
            <div className="eyebrow" style={{ color: "var(--accent)" }}>Business Owner</div>
            <h2 style={{ fontSize: "1.25rem", marginBottom: "0.4rem" }}>Grow &amp; Fund</h2>
            <p className="muted" style={{ margin: 0, fontSize: "0.92rem" }}>
              Register, track performance, and access community-backed microloans to grow.
            </p>
          </div>
          <div className="panel">
            <div className="eyebrow" style={{ color: "#7c3aed" }}>Lender</div>
            <h2 style={{ fontSize: "1.25rem", marginBottom: "0.4rem" }}>Invest &amp; Impact</h2>
            <p className="muted" style={{ margin: 0, fontSize: "0.92rem" }}>
              Deposit RLUSD to the community vault, earn interest, and join lending circles.
            </p>
          </div>
        </div>

        <div className="panel reveal" style={{ marginTop: "1.5rem", padding: "1.5rem" }}>
          <h2 style={{ fontSize: "1.3rem", marginBottom: "0.8rem", textAlign: "center" }}>How It Works</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
            <div className="panel" style={{ background: "#fff", border: "1px solid var(--line)" }}>
              <h3 style={{ fontSize: "1rem", marginBottom: "0.35rem" }}>For Customers</h3>
              <ol style={{ margin: 0, paddingLeft: "1.1rem", color: "var(--muted)", fontSize: "0.88rem", lineHeight: 1.65 }}>
                <li>Browse the directory of Black-owned businesses</li>
                <li>Pay with your regular card — no crypto needed</li>
                <li>Earn reward points on every purchase</li>
                <li>Redeem points for discounts at any business</li>
              </ol>
            </div>
            <div className="panel" style={{ background: "#fff", border: "1px solid var(--line)" }}>
              <h3 style={{ fontSize: "1rem", marginBottom: "0.35rem" }}>For Business Owners</h3>
              <ol style={{ margin: 0, paddingLeft: "1.1rem", color: "var(--muted)", fontSize: "0.88rem", lineHeight: 1.65 }}>
                <li>Register your business for free</li>
                <li>Get listed in the platform directory</li>
                <li>Receive payments to your dashboard</li>
                <li>Apply for community-backed microloans</li>
              </ol>
            </div>
            <div className="panel" style={{ background: "#fff", border: "1px solid var(--line)" }}>
              <h3 style={{ fontSize: "1rem", marginBottom: "0.35rem" }}>For Community Lenders</h3>
              <ol style={{ margin: 0, paddingLeft: "1.1rem", color: "var(--muted)", fontSize: "0.88rem", lineHeight: 1.65 }}>
                <li>Contribute to the Shared Asset Vault</li>
                <li>Capital funds microloans for businesses</li>
                <li>Earn interest as borrowers repay loans</li>
                <li>Join lending circles for mutual guarantee</li>
              </ol>
            </div>
            <div className="panel" style={{ background: "#fff", border: "1px solid var(--line)" }}>
              <h3 style={{ fontSize: "1rem", marginBottom: "0.35rem" }}>Lending Circles</h3>
              <ol style={{ margin: 0, paddingLeft: "1.1rem", color: "var(--muted)", fontSize: "0.88rem", lineHeight: 1.65 }}>
                <li>Borrowers join circles of 4-6 members</li>
                <li>Loans disbursed in milestone-gated tranches</li>
                <li>Circle members verify proof before release</li>
                <li>Graduated tiers unlock larger amounts</li>
              </ol>
            </div>
          </div>
        </div>

        <div style={{ borderTop: "1px solid var(--line)", marginTop: "2.5rem", paddingTop: "1rem", textAlign: "center" }}>
          <p className="muted" style={{ fontSize: "0.85rem" }}>
            Black Business Support — Powered by XRPL
          </p>
        </div>
      </div>
    </>
  );
}
