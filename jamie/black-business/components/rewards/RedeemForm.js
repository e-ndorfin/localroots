"use client";

import { useMemo, useState } from "react";
import { businesses } from "@/lib/mockData";

export default function RedeemForm() {
  const [business, setBusiness] = useState(businesses[0].id);
  const [points, setPoints] = useState(500);
  const dollars = useMemo(() => (Number(points || 0) / 100).toFixed(2), [points]);

  return (
    <form className="card space-y-4" onSubmit={(e) => e.preventDefault()}>
      <div><label className="label" htmlFor="biz">Business</label><select id="biz" className="input" value={business} onChange={(e) => setBusiness(e.target.value)}>{businesses.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select></div>
      <div><label className="label" htmlFor="pts">Points to redeem</label><input id="pts" className="input" type="number" value={points} min="100" step="50" onChange={(e) => setPoints(e.target.value)} /></div>
      <p className="rounded-xl bg-amber-50 p-3 text-sm">{points} points = ${dollars} off</p>
      <button className="button-primary" type="submit">Redeem</button>
    </form>
  );
}
