"use client";

import { useEffect, useMemo, useState } from "react";

export default function RedeemForm() {
  const [businesses, setBusinesses] = useState([]);
  const [business, setBusiness] = useState("");
  const [points, setPoints] = useState(500);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const dollars = useMemo(() => (Number(points || 0) / 100).toFixed(2), [points]);

  useEffect(() => {
    fetch("/api/business/directory")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.businesses?.length) {
          setBusinesses(data.businesses);
          setBusiness(String(data.businesses[0].id));
        }
      })
      .catch(() => {});
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (submitting || points < 100 || !business) return;
    setSubmitting(true);
    setResult(null);

    try {
      const res = await fetch("/api/loyalty/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
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
      <div>
        <label className="label" htmlFor="biz">Business</label>
        {businesses.length === 0
          ? <p className="muted text-sm">No businesses registered yet.</p>
          : <select id="biz" className="input" value={business} onChange={(e) => setBusiness(e.target.value)}>
              {businesses.map((b) => <option key={b.id} value={String(b.id)}>{b.name}</option>)}
            </select>
        }
      </div>
      <div>
        <label className="label" htmlFor="pts">Points to redeem</label>
        <input id="pts" className="input" type="number" value={points} min="100" step="50" onChange={(e) => setPoints(e.target.value)} />
      </div>
      <p className="rounded-xl bg-amber-50 p-3 text-sm">{points} points = ${dollars} off</p>
      <button className="btn btn-solid" type="submit" disabled={submitting || !business}>{submitting ? "Redeeming..." : "Redeem"}</button>
      {result && <p style={{ color: result.success ? "#059669" : "#dc2626" }} className="text-sm">{result.msg}</p>}
    </form>
  );
}
