"use client";

import { useEffect, useState, useCallback } from "react";

const STATUS_LABELS = {
  pending: "Pending",
  locked: "Locked",
  proof_submitted: "Proof Submitted",
  released: "Released",
  claimed: "Claimed",
};

const PROOF_TYPES = ["receipt", "invoice", "photo", "document", "other"];

function TrancheCard({ tranche, index, canUnlock, isBorrower, onRefresh, requiredApprovals }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [showProofForm, setShowProofForm] = useState(false);
  const [proofType, setProofType] = useState("receipt");
  const [description, setDescription] = useState("");
  const [proofs, setProofs] = useState([]);
  const [loadingProofs, setLoadingProofs] = useState(false);
  const [proofRefresh, setProofRefresh] = useState(0);
  const [showClaimSuccess, setShowClaimSuccess] = useState(false);

  // Fetch proofs when tranche is proof_submitted
  useEffect(() => {
    if (tranche.status !== "proof_submitted") return;
    setLoadingProofs(true);
    fetch(`/api/lending/proofs/${tranche.id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.proofs) setProofs(data.proofs);
      })
      .catch(() => {})
      .finally(() => setLoadingProofs(false));
  }, [tranche.id, tranche.status, proofRefresh]);

  async function handleUnlock() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/lending/disburse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trancheId: tranche.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to unlock");
      onRefresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleSubmitProof(e) {
    e.preventDefault();
    if (!description.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/lending/submit-proof", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trancheId: tranche.id,
          proofType,
          description,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit proof");
      setShowProofForm(false);
      setDescription("");
      onRefresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleClaim() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/lending/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trancheId: tranche.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to claim");
      setShowClaimSuccess(true);
      onRefresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleApprove(proofId) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/lending/approve-proof", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proofId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to approve");
      setProofRefresh((n) => n + 1);
      onRefresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const isActive = tranche.status !== "pending" || canUnlock;
  const isReleased = tranche.status === "released";
  const isClaimed = tranche.status === "claimed";

  return (
    <div className={`tranche-step${isReleased || isClaimed ? " released" : ""}${!isActive ? " dimmed" : ""}`}>
      <div className="tranche-header">
        <div className="tranche-index">{index + 1}</div>
        <div className="tranche-info">
          <span className="tranche-label">Tranche {index + 1}</span>
          <span className="tranche-amount">${(tranche.amount_cents / 100).toLocaleString()}</span>
        </div>
        <span className={`tranche-badge tranche-badge--${tranche.status}`}>
          {STATUS_LABELS[tranche.status] || tranche.status}
        </span>
      </div>

      {/* Borrower: claim released tranche */}
      {isBorrower && isReleased && (
        <button className="btn btn-solid btn-sm" onClick={handleClaim} disabled={busy}>
          {busy ? "Claiming..." : "Claim Tranche"}
        </button>
      )}

      {/* Borrower actions */}
      {isBorrower && tranche.status === "pending" && canUnlock && (
        <button className="btn btn-solid btn-sm" onClick={handleUnlock} disabled={busy}>
          {busy ? "Unlocking..." : "Unlock Tranche"}
        </button>
      )}

      {isBorrower && tranche.status === "locked" && !showProofForm && (
        <button className="btn btn-outline btn-sm" onClick={() => setShowProofForm(true)}>
          Upload Proof
        </button>
      )}

      {isBorrower && tranche.status === "locked" && showProofForm && (
        <form className="tranche-proof-form" onSubmit={handleSubmitProof}>
          <select className="input" value={proofType} onChange={(e) => setProofType(e.target.value)}>
            {PROOF_TYPES.map((t) => (
              <option key={t} value={t}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </option>
            ))}
          </select>
          <textarea
            className="input"
            placeholder="Describe your milestone proof..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            required
          />
          <div className="tranche-proof-actions">
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowProofForm(false)} disabled={busy}>
              Cancel
            </button>
            <button type="submit" className="btn btn-solid btn-sm" disabled={busy || !description.trim()}>
              {busy ? "Submitting..." : "Submit Proof"}
            </button>
          </div>
        </form>
      )}

      {/* Non-borrower: approve proof */}
      {!isBorrower && tranche.status === "proof_submitted" && (
        <div className="tranche-proofs">
          {loadingProofs ? (
            <p className="text-sm muted">Loading proofs...</p>
          ) : proofs.length === 0 ? (
            <p className="text-sm muted">No proofs found.</p>
          ) : (
            proofs.map((proof) => (
              <div key={proof.id} className="tranche-proof-item">
                <p className="text-sm">
                  <strong>{proof.proof_type}:</strong> {proof.description}
                </p>
                <p className="text-xs muted">
                  {proof.approval_count}/{requiredApprovals} approvals
                </p>
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => handleApprove(proof.id)}
                  disabled={busy}
                >
                  {busy ? "Approving..." : "Approve"}
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Borrower: show proof status when proof_submitted */}
      {isBorrower && tranche.status === "proof_submitted" && (
        <p className="text-sm muted">Waiting for circle member approvals...</p>
      )}

      {tranche.xrpl_tx_hash && (
        <p className="text-xs muted" style={{ wordBreak: "break-all" }}>
          XRPL: {tranche.xrpl_tx_hash}
        </p>
      )}

      {error && <p className="text-sm" style={{ color: "#dc2626" }}>{error}</p>}

      {/* Claim success modal */}
      <div className={`circle-modal${showClaimSuccess ? " open" : ""}`} onClick={() => setShowClaimSuccess(false)}>
        <div className="circle-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 380, textAlign: "center" }}>
          <div style={{
            width: 64, height: 64, borderRadius: "50%", background: "#ecfdf5",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 12px", fontSize: 32, color: "#059669",
          }}>
            ✓
          </div>
          <h2 style={{ marginBottom: 4 }}>Tranche Claimed!</h2>
          <p className="muted" style={{ marginBottom: 16 }}>
            You have successfully claimed <strong>${(tranche.amount_cents / 100).toLocaleString()}</strong> from Tranche {index + 1}.
          </p>
          <button className="btn btn-solid" onClick={() => setShowClaimSuccess(false)}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TrancheProgress({ loans = [], userId, memberCount = 0 }) {
  const [tranchesByLoan, setTranchesByLoan] = useState({});
  const [loading, setLoading] = useState(false);

  const fetchTranches = useCallback(async () => {
    if (!loans.length) return;
    setLoading(true);
    const result = {};
    for (const loan of loans) {
      try {
        const res = await fetch(`/api/lending/tranches/${loan.id}`);
        if (res.ok) {
          const data = await res.json();
          result[loan.id] = data.tranches || [];
        }
      } catch {
        // skip
      }
    }
    setTranchesByLoan(result);
    setLoading(false);
  }, [loans]);

  useEffect(() => {
    fetchTranches();
  }, [fetchTranches]);

  if (!loans.length) {
    return (
      <div className="card">
        <h3 className="text-lg font-semibold">Tranche Progress</h3>
        <p className="text-sm muted">No active loans in this circle yet.</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h3 className="text-lg font-semibold" style={{ marginBottom: "0.75rem" }}>Tranche Progress</h3>
      {loading && <p className="text-sm muted">Loading tranches...</p>}
      {loans.map((loan) => {
        const tranches = tranchesByLoan[loan.id] || [];
        const isBorrower = userId && loan.borrower_user_id === userId;

        return (
          <div key={loan.id} className="tranche-loan-group">
            <p className="text-sm font-medium" style={{ marginBottom: "0.5rem" }}>
              ${(loan.principal_cents / 100).toLocaleString()} loan &middot;{" "}
              <span className="muted">{loan.status}</span>
            </p>
            {tranches.length === 0 && !loading && (
              <p className="text-sm muted">No tranches found.</p>
            )}
            <div className="tranche-steps">
              {tranches.map((tranche, i) => {
                // Sequential gating: can unlock if pending AND (first tranche OR previous is released/claimed)
                const prevDone = i === 0 || tranches[i - 1]?.status === "released" || tranches[i - 1]?.status === "claimed";
                const canUnlock = tranche.status === "pending" && prevDone;

                return (
                  <TrancheCard
                    key={tranche.id}
                    tranche={tranche}
                    index={i}
                    canUnlock={canUnlock}
                    isBorrower={isBorrower}
                    onRefresh={fetchTranches}
                    requiredApprovals={Math.max(1, memberCount - 1)}
                  />
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
