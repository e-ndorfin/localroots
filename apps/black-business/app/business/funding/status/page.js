"use client";

import { useEffect, useState } from "react";
import Topbar from "@/components/layout/Header";
import { createClient } from "@/lib/supabase/client";

const TRANCHE_ICONS = {
  released: (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5" aria-hidden="true">
      <circle cx="12" cy="12" r="10"></circle><path d="m9 12 2 2 4-4"></path>
    </svg>
  ),
  locked: (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4" aria-hidden="true">
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
    </svg>
  ),
};

function statusLabel(status) {
  if (status === "released") return "Unlocked";
  if (status === "proof_submitted") return "Proof Submitted";
  return "Locked";
}

export default function BusinessFundingStatusPage() {
  const [loan, setLoan] = useState(null);
  const [tranches, setTranches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { setLoading(false); return; }

      fetch("/api/lending/circles")
        .then((res) => (res.ok ? res.json() : null))
        .then(async (data) => {
          if (!data || !data.circles) return;
          for (const circle of data.circles) {
            const cRes = await fetch(`/api/lending/circles/${circle.id}`);
            if (!cRes.ok) continue;
            const cData = await cRes.json();
            const myLoan = (cData.loans || []).find((l) => l.borrower_user_id === user.id);
            if (myLoan) {
              setLoan(myLoan);
              fetch(`/api/lending/tranches/${myLoan.id}`)
                .then((r) => r.ok ? r.json() : null)
                .then((t) => { if (t?.tranches) setTranches(t.tranches); })
                .catch(() => {});
              break;
            }
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    });
  }, []);

  if (loading) {
    return (
      <>
        <div className="bg-orb orb-a"></div>
        <div className="bg-orb orb-b"></div>
        <Topbar />
        <main className="content"><p className="muted">Loading...</p></main>
      </>
    );
  }

  if (!loan) {
    return (
      <>
        <div className="bg-orb orb-a"></div>
        <div className="bg-orb orb-b"></div>
        <Topbar />
        <main className="content">
          <section className="page-head">
            <h1>Funding Dispersement Details</h1>
          </section>
          <div className="panel reveal">
            <p className="muted">No active loan found. Submit a funding request to get started.</p>
          </div>
        </main>
      </>
    );
  }

  const disbursed = (loan.principal_cents - (loan.repaid_cents || 0)) / 100;

  return (
    <>
      <div className="bg-orb orb-a"></div>
      <div className="bg-orb orb-b"></div>

      <Topbar />

      <main className="content">
        <section className="page-head">
          <h1>Funding Dispersement Details</h1>
        </section>

        <div className="two-col items-start">
          <section className="reveal rounded-3xl border-none soft-shadow overflow-hidden bg-white">
            <div className="h-2 w-full bg-gradient-to-r from-teal-700 to-emerald-500"></div>
            <div className="p-6 pb-2">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold mb-2 text-teal-700 border border-teal-200 bg-teal-50">
                    {loan.status}
                  </div>
                  <h2 className="text-2xl">Microloan</h2>
                  <p className="text-base mt-1 muted">Requested: ${(loan.principal_cents / 100).toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-500 font-medium">Current Balance</p>
                  <p className="text-3xl font-black text-slate-900">${disbursed.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="p-6 pt-0">
              {tranches.length === 0 ? (
                <p className="muted text-sm mt-4">No tranches yet.</p>
              ) : (
                <div className="space-y-6 mt-4">
                  <div className="relative">
                    <div className="absolute left-[15px] top-8 bottom-8 w-[2px] bg-slate-200"></div>
                    {tranches.map((tranche, idx) => {
                      const isUnlocked = tranche.status === "released";
                      return (
                        <div key={idx} className={`flex gap-6 relative z-10 ${idx < tranches.length - 1 ? "mb-8" : ""}`}>
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isUnlocked ? "bg-teal-700 text-white shadow-md shadow-teal-700/20" : "bg-white border-2 border-slate-300 text-slate-500"}`}>
                            {isUnlocked ? TRANCHE_ICONS.released : TRANCHE_ICONS.locked}
                          </div>
                          <div className={`p-4 rounded-2xl flex-1 border ${isUnlocked ? "bg-slate-50 border-slate-200" : "bg-white border-slate-200 shadow-sm opacity-60"}`}>
                            <div className="flex justify-between items-center mb-1">
                              <h4 className="font-bold">{`Tranche ${idx + 1}`}</h4>
                              <span className={isUnlocked ? "text-teal-700 font-bold" : "text-slate-500 font-medium text-sm"}>{statusLabel(tranche.status)}</span>
                            </div>
                            <p className="text-sm text-slate-500">${((tranche.amount_cents || 0) / 100).toLocaleString()}</p>
                            {!isUnlocked && tranche.status !== "proof_submitted" && (
                              <button className="btn btn-outline mt-3 w-full rounded-lg text-xs">Upload Proof to Unlock</button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </section>

          <aside className="panel reveal max-w-xs w-full self-start justify-self-end md:mr-6 md:ml-4 bg-green-50 border-green-200">
            <div className="p-3">
              <div className="flex items-center gap-2 mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-green-700 opacity-90" aria-hidden="true">
                  <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"></path>
                  <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"></path>
                </svg>
                <h3 className="font-medium text-base text-green-900">Available Payout</h3>
              </div>
              <p className="text-[2rem] font-bold mb-2 text-green-900">${disbursed.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
              <button className="btn w-full h-9 rounded-lg text-xs bg-green-700 text-white">Withdraw to Bank</button>
            </div>
          </aside>
        </div>
      </main>
    </>
  );
}
