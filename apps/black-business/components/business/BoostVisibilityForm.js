"use client";

import { useState } from "react";

export default function BoostVisibilityForm({ isBoosted }) {
  const [submitting, setSubmitting] = useState(false);
  const [boosted, setBoosted] = useState(isBoosted);
  const [error, setError] = useState("");

  // Sync prop changes (e.g. after parent re-fetches)
  if (isBoosted && !boosted) setBoosted(true);

  async function handleBoost(e) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/business/boost", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to boost");
      } else {
        setBoosted(true);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (boosted) {
    return (
      <div className="panel">
        <h3 className="text-lg font-semibold">Boost Visibility</h3>
        <p className="mt-2 text-green-700 font-medium">
          Your business is currently Featured in the directory.
        </p>
      </div>
    );
  }

  return (
    <form className="panel space-y-3" onSubmit={handleBoost}>
      <h3 className="text-lg font-semibold">Boost Visibility</h3>
      <p className="muted text-sm">
        Feature your business at the top of the directory with a "Featured" badge.
      </p>
      <p className="text-sm font-medium">Cost: $25.00 (deducted from your balance)</p>
      <button className="btn btn-solid" type="submit" disabled={submitting}>
        {submitting ? "Boosting..." : "Boost My Business — $25"}
      </button>
      {error && <p className="text-red-600 text-sm">{error}</p>}
    </form>
  );
}
