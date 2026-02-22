"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Topbar from "@/components/layout/Header";

export default function VaultPage() {
  const router = useRouter();
  const [total, setTotal] = useState(0);
  const [lenderBalance, setLenderBalance] = useState(0);
  const [activeLoans, setActiveLoans] = useState(0);
  const [available, setAvailable] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showCustom, setShowCustom] = useState(false);
  const [custom, setCustom] = useState("");
  const [withdrawAmt, setWithdrawAmt] = useState("");
  const [withdrawing, setWithdrawing] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawStep, setWithdrawStep] = useState("bank"); // "bank" | "success"
  const [pendingWithdraw, setPendingWithdraw] = useState(0);
  const [bankInfo, setBankInfo] = useState({ institution: "", transit: "", account: "" });
  const goal = 6250000; // $62,500 in cents
  const pct = useMemo(() => Math.min(100, Math.round((total / goal) * 100)), [total]);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/vault/status");
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
  }, []);

  // Redirect business users away from vault
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single()
        .then(({ data }) => {
          if (data?.role === "business") router.replace("/dashboard");
        });
    });
  }, [router]);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  function contribute(amountDollars) {
    sessionStorage.setItem("bb-vault-deposit-cents", String(Math.round(amountDollars * 100)));
    router.push("/vault/checkout");
  }

  function openWithdrawModal(amountDollars) {
    setPendingWithdraw(amountDollars);
    setBankInfo({ institution: "", transit: "", account: "" });
    setWithdrawStep("bank");
    setShowWithdrawModal(true);
  }

  async function confirmWithdraw() {
    setWithdrawing(true);
    try {
      const res = await fetch("/api/vault/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountCents: Math.round(pendingWithdraw * 100) }),
      });
      if (res.ok) {
        const data = await res.json();
        setTotal(data.totalCents);
        setLenderBalance(data.lenderBalanceCents);
        setWithdrawStep("success");
      } else {
        const err = await res.json();
        alert(err.error || "Withdraw failed");
        setShowWithdrawModal(false);
      }
    } catch (err) {
      console.error("Withdraw failed:", err);
      setShowWithdrawModal(false);
    } finally {
      setWithdrawing(false);
    }
  }

  const displayTotal = (total / 100).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  const displayGoal = (goal / 100).toLocaleString();
  const displayBalance = (lenderBalance / 100).toLocaleString(undefined, { minimumFractionDigits: 2 });

  return (
    <>
      <div className="bg-orb orb-a"></div>
      <div className="bg-orb orb-b"></div>

      <Topbar />

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

            {lenderBalance > 0 && (
              <div className="contribute-row" style={{ marginTop: "1rem" }}>
                <input
                  value={withdrawAmt}
                  onChange={(e) => setWithdrawAmt(e.target.value)}
                  type="number"
                  min="1"
                  step="1"
                  placeholder="Withdraw amount"
                  style={{ maxWidth: 180, fontFamily: "inherit" }}
                />
                <button
                  className="btn btn-outline"
                  onClick={() => {
                    const v = Number(withdrawAmt);
                    if (v >= 1 && v <= lenderBalance / 100) {
                      openWithdrawModal(v);
                      setWithdrawAmt("");
                    }
                  }}
                >
                  Withdraw
                </button>
              </div>
            )}

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

      {/* Withdraw modal */}
      <div className={`circle-modal${showWithdrawModal ? " open" : ""}`} onClick={() => !withdrawing && setShowWithdrawModal(false)}>
        <div className="circle-modal-card" onClick={(e) => e.stopPropagation()}>
          <button className="circle-modal-close" onClick={() => !withdrawing && setShowWithdrawModal(false)}>×</button>

          {withdrawStep === "bank" && (
            <>
              <h2>Withdraw ${pendingWithdraw.toFixed(2)}</h2>
              <p className="muted" style={{ marginBottom: "1rem" }}>
                Enter your bank details so we can transfer the funds. This information is equivalent to a void cheque.
              </p>
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
                  disabled={withdrawing || !bankInfo.institution || !bankInfo.transit || !bankInfo.account}
                  onClick={confirmWithdraw}
                >
                  {withdrawing ? "Processing..." : "Confirm Withdrawal"}
                </button>
              </div>
            </>
          )}

          {withdrawStep === "success" && (
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
                <strong>${pendingWithdraw.toFixed(2)} CAD</strong> will be transferred to your bank account ending in ****{bankInfo.account.slice(-4)}. Please allow 2–3 business days for processing.
              </p>
              <button className="btn btn-solid" style={{ marginTop: 20 }} onClick={() => setShowWithdrawModal(false)}>
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
