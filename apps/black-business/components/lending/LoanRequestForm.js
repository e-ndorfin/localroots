"use client";

import { useState } from "react";

export default function LoanRequestForm({ circleId }) {
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!amount || submitting) return;
    setSubmitting(true);
    const pseudonym = typeof window !== "undefined" ? window.localStorage.getItem("bb-pseudonym") || "demo-user" : "demo-user";

    try {
      const res = await fetch("/api/lending/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          borrowerPseudonym: pseudonym,
          circleId: Number(circleId) || 1,
          principalCents: Math.round(Number(amount) * 100),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult({ success: true, msg: `Loan of $${amount} approved with ${data.loan?.num_tranches || 3} tranches.` });
        setAmount("");
      } else {
        setResult({ success: false, msg: data.error || "Application failed." });
      }
    } catch {
      setResult({ success: false, msg: "Network error." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="card space-y-3" onSubmit={handleSubmit}>
      <h3 className="text-lg font-semibold">Request Loan</h3>
      <input className="input" type="number" placeholder="Requested amount (USD)" min="100" step="50" value={amount} onChange={(e) => setAmount(e.target.value)} />
      <button className="btn btn-solid" type="submit" disabled={submitting}>{submitting ? "Submitting..." : "Submit Request"}</button>
      {result && <p style={{ color: result.success ? "#059669" : "#dc2626" }} className="text-sm">{result.msg}</p>}
    </form>
  );
}
