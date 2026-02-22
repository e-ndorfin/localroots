import Link from "next/link";

export default function HomePage() {
  return (
    <div className="space-y-8">
      <section className="card">
        <h1 className="text-4xl font-bold text-primary">Black Business Support Platform</h1>
        <p className="mt-3 max-w-3xl text-slate-600">Shop, earn rewards, and invest in Black-owned businesses through local-first commerce, loyalty, and lending.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link className="button-primary" href="/directory">Shop & Earn</Link>
          <Link className="button-outline" href="/business/register">List Your Business</Link>
          <Link className="button-outline" href="/vault">Support the Community</Link>
        </div>
      </section>
      <section className="grid gap-3 md:grid-cols-3">
        <div className="card"><h2 className="text-xl font-semibold">Customer</h2><p className="mt-2 text-slate-600">Discover businesses, pay with card, earn points.</p></div>
        <div className="card"><h2 className="text-xl font-semibold">Business Owner</h2><p className="mt-2 text-slate-600">Register, track performance, and request funding.</p></div>
        <div className="card"><h2 className="text-xl font-semibold">Lender</h2><p className="mt-2 text-slate-600">Deposit RLUSD, track vault health, join circles.</p></div>
      </section>
    </div>
  );
}
