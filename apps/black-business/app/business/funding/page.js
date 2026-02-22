"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Topbar from "@/components/layout/Header";

export default function BusinessFundingPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [vaultAvailable, setVaultAvailable] = useState(null);

  useEffect(() => {
    fetch("/api/vault/status")
      .then((res) => res.ok ? res.json() : null)
      .then((data) => { if (data) setVaultAvailable(data.availableCapitalCents); })
      .catch(() => {});
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    const form = e.target;
    const amount = Number(form.querySelector('input[type="number"]')?.value || 0);
    const pseudonym = window.localStorage.getItem("bb-pseudonym") || "demo-user";

    if (amount < 100) {
      setError("Minimum loan amount is $100.");
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/lending/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          borrowerPseudonym: pseudonym,
          circleId: 1,
          principalCents: Math.round(amount * 100),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        router.push("/business/funding/status");
      } else {
        setError(data.error || "Failed to submit application.");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="bg-orb orb-a"></div>
      <div className="bg-orb orb-b"></div>

      <Topbar />

      <main className="content">
        <section className="page-head">
          <h1>Funding Requests</h1>
          <p className="muted">Access community-backed microloans to grow your business with local support.</p>
        </section>

        <div className="two-col items-start">
          <section className="panel reveal">
            <h2>Request Microloan</h2>
            <p className="muted">Share your funding plan and we will review your microloan application.</p>
            {error && <p style={{ color: "#dc2626", marginTop: "0.5rem" }}>{error}</p>}
            <form className="loan-form mt-3" noValidate onSubmit={handleSubmit}>
              <label>
                Requested Amount (USD)
                <input type="number" min="100" step="50" placeholder="e.g. 5000" required />
              </label>
              <label>
                Funding Purpose
                <select className="w-full border border-[var(--line)] rounded-[10px] px-3 py-2.5 bg-white">
                  <option>Inventory and supplies</option>
                  <option>Equipment purchase</option>
                  <option>Hiring and payroll</option>
                  <option>Marketing and growth</option>
                  <option>Store improvements</option>
                </select>
              </label>
              <label>
                Requested Term
                <input type="text" placeholder="e.g. 6 months" />
              </label>
              <label>
                Monthly Revenue
                <input type="number" min="0" step="100" placeholder="e.g. 12000" />
              </label>
              <label>
                How will this funding be used?
                <textarea placeholder="Tell us how this microloan will improve operations, revenue, or customer service." required></textarea>
              </label>
              <button className="btn btn-solid w-full" type="submit" disabled={submitting}>
                {submitting ? "Submitting..." : "Submit Funding Request"}
              </button>
            </form>
          </section>

          <aside className="panel reveal max-w-xs w-full self-start justify-self-end md:mr-6 md:ml-4">
            <div className="p-3">
              <div className="flex items-center gap-2 mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 opacity-80" aria-hidden="true">
                  <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"></path>
                  <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"></path>
                </svg>
                <h3 className="font-medium text-base">Community Fund Available</h3>
              </div>
              <p className="text-[2rem] font-bold mb-2">
                {vaultAvailable !== null ? `$${(vaultAvailable / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}` : "..."}
              </p>
              <p className="muted text-xs">Capital available for new microloans</p>
            </div>
          </aside>
        </div>
      </main>
    </>
  );
}
