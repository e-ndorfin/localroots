"use client";

import { useState } from "react";

export default function CircleDetail({ circleId, circle, members = [], loading, userId, isMember, onJoined }) {
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState(null);

  async function handleJoin() {
    setJoining(true);
    setError(null);
    try {
      const res = await fetch(`/api/lending/circles/${circleId}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to join");
      if (onJoined) onJoined();
    } catch (err) {
      setError(err.message);
    } finally {
      setJoining(false);
    }
  }

  if (loading) return <div className="card"><p className="muted">Loading circle...</p></div>;
  if (!circle) return <div className="card"><h2 className="text-xl font-bold">Circle: {circleId}</h2><p className="mt-2 text-slate-600">Circle not found. It may not exist yet in the database.</p></div>;

  const isFull = members.length >= (circle.max_members || 6);
  const canJoin = userId && !isMember && !isFull && circle.status === "forming";

  return (
    <div className="card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">{circle.name || `Circle ${circleId}`}</h2>
          <p className="text-sm text-slate-500 mt-1">Status: <strong>{circle.status}</strong> &middot; {members.length}/{circle.max_members || 6} members</p>
        </div>
        {canJoin && (
          <button className="btn btn-solid" onClick={handleJoin} disabled={joining}>
            {joining ? "Joining..." : "Join Circle"}
          </button>
        )}
      </div>
      {members.length > 0 && (
        <div className="mt-3 space-y-1">
          <p className="text-sm font-medium">Members:</p>
          {members.map((m, i) => (
            <p key={i} className="text-sm text-slate-600">
              {m.pseudonym || `Member ${i + 1}`}
              {m.member_user_id === userId ? " (You)" : ""}
            </p>
          ))}
        </div>
      )}
      {!isMember && !canJoin && !loading && userId && (
        <p className="mt-3 text-sm muted">
          {isFull ? "This circle is full." : "This circle is no longer accepting members."}
        </p>
      )}
      {isMember && <p className="mt-3 text-slate-600">Members collaborate on milestone-based lending decisions.</p>}
      {error && <p className="mt-2 text-sm" style={{ color: "#dc2626" }}>{error}</p>}
    </div>
  );
}
