"use client";

import { useMemo, useState } from "react";
import { businesses } from "@/lib/mockData";

export default function RedeemForm() {
  const [business, setBusiness] = useState(businesses[0].id);
  const [points, setPoints] = useState(500);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const dollars = useMemo(() => (Number(points || 0) / 100).toFixed(2), [points]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (submitting || points < 100) return;
    setSubmitting(true);
    setResult(null);
    const pseudonym = typeof window !== "undefined" ? window.localStorage.getItem("bb-pseudonym") || "demo-user" : "demo-user";

    try {
      const res = await fetch("/api/loyalty/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerPseudonym: pseudonym,
          businessId: business,
          points: Number(points),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult({ success: true, msg: `Redeemed ${points} points ($${dollars} off). Remaining: ${data.remainingBalance} points.` });
      } else {
        setResult({ success: false, msg: data.error || "Redemption failed." });
      }
    } catch {
      setResult({ success: false, msg: "Network error." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="card space-y-4" onSubmit={handleSubmit}>
      <div><label className="label" htmlFor="biz">Business</label><select id="biz" className="input" value={business} onChange={(e) => setBusiness(e.target.value)}>{businesses.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select></div>
      <div><label className="label" htmlFor="pts">Points to redeem</label><input id="pts" className="input" type="number" value={points} min="100" step="50" onChange={(e) => setPoints(e.target.value)} /></div>
      <p className="rounded-xl bg-amber-50 p-3 text-sm">{points} points = ${dollars} off</p>
      <button className="btn btn-solid" type="submit" disabled={submitting}>{submitting ? "Redeeming..." : "Redeem"}</button>
      {result && <p style={{ color: result.success ? "#059669" : "#dc2626" }} className="text-sm">{result.msg}</p>}
    </form>
  );
}
