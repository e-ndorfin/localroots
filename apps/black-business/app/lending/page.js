"use client";

import { useEffect, useState } from "react";
import Topbar from "@/components/layout/Header";
import CircleList from "@/components/lending/CircleList";

export default function LendingPage() {
  const [circles, setCircles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [circleName, setCircleName] = useState("");
  const [maxMembers, setMaxMembers] = useState(6);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetch("/api/lending/circles")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.circles && data.circles.length) {
          setCircles(
            data.circles.map((c) => ({
              id: String(c.id),
              name: c.name,
              members: c.member_count || 0,
              maxMembers: c.max_members || 6,
              status: c.status || "forming",
              totalFunded: 0,
              activeLoan: null,
            }))
          );
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function openModal() {
    setCircleName("");
    setMaxMembers(6);
    setShowModal(true);
  }

  function closeModal() {
    if (creating) return;
    setShowModal(false);
  }

  async function createCircle(e) {
    e.preventDefault();
    if (!circleName.trim() || creating) return;
    setCreating(true);
    try {
      const res = await fetch("/api/lending/circles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: circleName, maxMembers }),
      });
      if (res.ok) {
        const data = await res.json();
        setCircles((prev) => [
          {
            id: String(data.circle.id),
            name: data.circle.name,
            members: 1,
            maxMembers: data.circle.max_members || 6,
            status: "forming",
            totalFunded: 0,
            activeLoan: null,
          },
          ...prev,
        ]);
        setShowModal(false);
      }
    } catch (err) {
      console.error("Failed to create circle:", err);
    } finally {
      setCreating(false);
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
            <button className="btn btn-solid" onClick={openModal}>
              + Create Circle
            </button>
          </div>
        </section>
        {loading ? <p className="muted">Loading circles...</p> : <CircleList circles={circles} />}
      </main>

      {/* Create Circle Modal */}
      <div className={`circle-modal${showModal ? " open" : ""}`} onClick={closeModal}>
        <div className="circle-modal-card" onClick={(e) => e.stopPropagation()}>
          <button className="circle-modal-close" onClick={closeModal} aria-label="Close">
            &times;
          </button>
          <h2>Create a Lending Circle</h2>
          <p className="muted" style={{ marginBottom: "0.5rem" }}>
            Invite community members to pool trust and unlock microloans together.
          </p>
          <form onSubmit={createCircle}>
            <label>
              Circle Name
              <input
                type="text"
                value={circleName}
                onChange={(e) => setCircleName(e.target.value)}
                placeholder="e.g. Queen West Collective"
                autoFocus
                required
              />
            </label>
            <label>
              Max Members
              <select value={maxMembers} onChange={(e) => setMaxMembers(Number(e.target.value))}>
                <option value={3}>3 members</option>
                <option value={4}>4 members</option>
                <option value={5}>5 members</option>
                <option value={6}>6 members</option>
                <option value={8}>8 members</option>
                <option value={10}>10 members</option>
              </select>
            </label>
            <div className="circle-modal-actions">
              <button type="button" className="btn btn-ghost" onClick={closeModal} disabled={creating}>
                Cancel
              </button>
              <button type="submit" className="btn btn-solid" disabled={creating || !circleName.trim()}>
                {creating ? "Creating..." : "Create Circle"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
