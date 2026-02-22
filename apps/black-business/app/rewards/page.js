"use client";

import { useEffect, useState } from "react";
import Topbar from "@/components/layout/Header";
import PointsBalance from "@/components/rewards/PointsBalance";
import PointsHistory from "@/components/rewards/PointsHistory";

export default function RewardsPage() {
  const [points, setPoints] = useState(0);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/loyalty/balance")
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data) {
          setPoints(data.balance);
          setHistory((data.history || []).map((h) => ({
            id: h.id,
            type: h.type,
            points: h.points,
            description: h.description,
            date: h.created_at,
          })));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <div className="bg-orb orb-a"></div>
      <div className="bg-orb orb-b"></div>
      <Topbar />
      <main className="content">
        <section className="page-head"><h1>Rewards</h1></section>
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <PointsBalance points={loading ? 0 : points} />
          <PointsHistory items={history} />
        </div>
      </main>
    </>
  );
}
