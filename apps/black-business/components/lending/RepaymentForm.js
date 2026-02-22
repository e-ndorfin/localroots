"use client";

import { useState } from "react";

export default function RepaymentForm({ loans = [] }) {
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const activeLoan = loans.find((l) => l.status === "active" || l.status === "disbursing");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!amount || !activeLoan || submitting) return;
    setSubmitting(true);

    try {
      const res = await fetch("/api/lending/repay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          loanId: activeLoan.id,
          amountCents: Math.round(Number(amount) * 100),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult({ success: true, msg: `Repayment of $${amount} recorded.` });
        setAmount("");
      } else {
        setResult({ success: false, msg: data.error || "Repayment failed." });
      }
    } catch {
      setResult({ success: false, msg: "Network error." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="card space-y-3" onSubmit={handleSubmit}>
      <h3 className="text-lg font-semibold">Repayment</h3>
      {activeLoan ? (
        <>
          <p className="text-sm text-slate-500">Loan: ${(activeLoan.principal_cents / 100).toLocaleString()} &middot; Owed: ${(((activeLoan.total_owed_cents || activeLoan.principal_cents) - (activeLoan.repaid_cents || 0)) / 100).toFixed(2)}</p>
          <input className="input" type="number" placeholder="Repayment amount (USD)" min="1" step="1" value={amount} onChange={(e) => setAmount(e.target.value)} />
          <button className="btn btn-outline" type="submit" disabled={submitting}>{submitting ? "Processing..." : "Submit Repayment"}</button>
        </>
      ) : (
        <p className="text-sm text-slate-500">No active loan to repay.</p>
      )}
      {result && <p style={{ color: result.success ? "#059669" : "#dc2626" }} className="text-sm">{result.msg}</p>}
    </form>
  );
}
