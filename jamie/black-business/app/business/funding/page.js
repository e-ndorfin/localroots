"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import UserAvatarLink from "@/components/layout/UserAvatarLink";

export default function BusinessFundingPage() {
  const router = useRouter();

  return (
    <>
      <div className="bg-orb orb-a"></div>
      <div className="bg-orb orb-b"></div>

      <header className="topbar">
        <Link className="app-name" href="/directory">LocalRoots</Link>
        <nav className="nav-links nav-inline">
          <Link className="nav-link" href="/directory">Browse</Link>
          <Link className="nav-link active" href="/business/funding">Funding Requests</Link>
          <Link className="nav-link" href="/business/tracking">Business Metrics</Link>
          <Link className="nav-link" href="/business/storefront">Edit Storefront</Link>
        </nav>
        <div className="topbar-right"><div className="site-balances"><div className="balance-pill"><strong>$245.0</strong></div><div className="balance-pill"><strong>1,840 pts</strong></div></div><UserAvatarLink /></div>
      </header>

      <main className="content">
        <section className="page-head">
          <h1>Funding Requests</h1>
          <p className="muted">Access community-backed microloans to grow your business with local support.</p>
        </section>

        <div className="two-col items-start">
          <section className="panel reveal">
            <h2>Request Microloan</h2>
            <p className="muted">Share your funding plan and we will review your microloan application.</p>
            <form
              className="loan-form mt-3"
              noValidate
              onSubmit={(e) => {
                e.preventDefault();
                router.push("/business/funding/status");
              }}
            >
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

              <button className="btn btn-solid w-full" type="submit">Submit Funding Request</button>
            </form>
          </section>

          <aside className="panel reveal max-w-xs w-full self-start justify-self-end md:mr-6 md:ml-4">
            <div className="p-3">
              <div className="flex items-center gap-2 mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 opacity-80" aria-hidden="true">
                  <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"></path>
                  <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"></path>
                </svg>
                <h3 className="font-medium text-base">Available Payout</h3>
              </div>
              <p className="text-[2rem] font-bold mb-2">$0.00</p>
              <button className="btn btn-outline w-full h-9 rounded-lg text-xs">Withdraw to Bank</button>
            </div>
          </aside>
        </div>
      </main>
    </>
  );
}
