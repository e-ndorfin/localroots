"use client";

import { useEffect, useState } from "react";
import Topbar from "@/components/layout/Header";
import CircleList from "@/components/lending/CircleList";
import { circles as mockCircles } from "@/lib/mockData";

export default function LendingPage() {
  const [circles, setCircles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [circleName, setCircleName] = useState("");

  useEffect(() => {
    fetch("/api/lending/circles")
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data && data.circles && data.circles.length) {
          setCircles(data.circles.map((c) => ({
            id: String(c.id),
            name: c.name,
            members: c.member_count || 0,
            maxMembers: c.max_members || 6,
            status: c.status || "forming",
            totalFunded: 0,
            activeLoan: null,
          })));
        } else {
          setCircles(mockCircles);
        }
      })
      .catch(() => setCircles(mockCircles))
      .finally(() => setLoading(false));
  }, []);

  async function createCircle(e) {
    e.preventDefault();
    if (!circleName.trim()) return;
    const pseudonym = window.localStorage.getItem("bb-pseudonym") || "demo-user";
    try {
      const res = await fetch("/api/lending/circles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: circleName, creatorPseudonym: pseudonym }),
      });
      if (res.ok) {
        const data = await res.json();
        setCircles((prev) => [{
          id: String(data.circle.id),
          name: data.circle.name,
          members: 1,
          maxMembers: data.circle.max_members || 6,
          status: "forming",
          totalFunded: 0,
          activeLoan: null,
        }, ...prev]);
        setCircleName("");
        setShowForm(false);
      }
    } catch (err) {
      console.error("Failed to create circle:", err);
    }
  }

  return (
    <>
      <div className="bg-orb orb-a"></div>
      <div className="bg-orb orb-b"></div>
      <Topbar />
      <main className="content">
        <section className="page-head">
          <div className="flex items-center justify-between">
            <h1>Lending Circles</h1>
            <button className="btn btn-solid" onClick={() => setShowForm((v) => !v)}>Create Circle</button>
          </div>
        </section>
        {showForm && (
          <form onSubmit={createCircle} className="panel flex gap-2 items-end">
            <label className="flex-1">
              Circle Name
              <input type="text" value={circleName} onChange={(e) => setCircleName(e.target.value)} placeholder="e.g. Queen West Collective" required />
            </label>
            <button type="submit" className="btn btn-solid">Create</button>
          </form>
        )}
        {loading ? <p className="muted">Loading circles...</p> : <CircleList circles={circles} />}
      </main>
    </>
  );
}
