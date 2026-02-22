"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Topbar from "@/components/layout/Header";
import PointsBalance from "@/components/rewards/PointsBalance";
import PointsHistory from "@/components/rewards/PointsHistory";
import { rewardHistory as mockHistory } from "@/lib/mockData";

export default function RewardsPage() {
  const [points, setPoints] = useState(0);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const pseudonym = window.localStorage.getItem("bb-pseudonym") || "demo-user";
    fetch(`/api/loyalty/balance?pseudonym=${encodeURIComponent(pseudonym)}`)
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data) {
          setPoints(data.balance);
          setHistory(data.history.length ? data.history.map((h) => ({
            id: h.id,
            type: h.type,
            points: h.points,
            description: h.description,
            date: h.created_at,
          })) : mockHistory);
        } else {
          setPoints(1840);
          setHistory(mockHistory);
        }
      })
      .catch(() => {
        setPoints(1840);
        setHistory(mockHistory);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <div className="bg-orb orb-a"></div>
      <div className="bg-orb orb-b"></div>
      <Topbar />
      <main className="content">
        <section className="page-head"><h1>Rewards</h1></section>
        <PointsBalance points={loading ? 0 : points} />
        <PointsHistory items={history} />
        <Link href="/rewards/redeem" className="btn btn-solid">Redeem Points</Link>
      </main>
    </>
  );
}
