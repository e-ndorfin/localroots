import Link from "next/link";
import UserAvatarLink from "@/components/layout/UserAvatarLink";

const recentOrders = [
  { initials: "JD", customer: "John Doe", items: "1x Artisan Sourdough Loaf, 2x Coffee", amount: 24.5, status: "Ready for pickup" },
  { initials: "MB", customer: "Mia Brown", items: "2x Veggie Wrap, 1x Matcha Latte", amount: 31.75, status: "Preparing order" },
  { initials: "AL", customer: "Ari Lewis", items: "1x Granola Bowl, 1x Fresh Juice", amount: 18.0, status: "Completed" },
];

export default function BusinessTrackingPage() {
  return (
    <>
      <div className="bg-orb orb-a"></div>
      <div className="bg-orb orb-b"></div>

      <header className="topbar">
        <Link className="app-name" href="/directory">LocalRoots</Link>
        <nav className="nav-links nav-inline">
          <Link className="nav-link" href="/directory">Browse</Link>
          <Link className="nav-link" href="/business/funding">Funding Requests</Link>
          <Link className="nav-link active" href="/business/tracking">Business Metrics</Link>
          <Link className="nav-link" href="/business/storefront">Edit Storefront</Link>
        </nav>
        <div className="topbar-right"><div className="site-balances"><div className="balance-pill"><strong>$245.0</strong></div><div className="balance-pill"><strong>1,840 pts</strong></div></div><UserAvatarLink /></div>
      </header>

      <main className="content">
        <section className="card-grid">
          <article className="panel reveal">
            <p className="muted">Revenue (30 days)</p>
            <h2>$12,480</h2>
            <p className="muted">+14% vs last month</p>
          </article>
          <article className="panel reveal">
            <p className="muted">Orders (30 days)</p>
            <h2>286</h2>
            <p className="muted">Average order: $43.64</p>
          </article>
          <article className="panel reveal">
            <p className="muted">Repeat Customers</p>
            <h2>41%</h2>
            <p className="muted">Target: 45%</p>
          </article>
        </section>

        <section className="reveal mt-6 max-w-3xl">
          <h2 className="mb-2 text-lg">Recent Customer Purchases</h2>
          <div className="bg-white rounded-2xl soft-shadow border border-border/50 overflow-hidden">
            <div className="divide-y divide-border">
              {recentOrders.map((order) => (
                <div key={`${order.customer}-${order.amount}`} className="p-3 flex items-center justify-between hover:bg-muted/20 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center text-secondary-foreground text-sm font-bold">
                      {order.initials}
                    </div>
                    <div>
                      <p className="font-bold text-sm">{order.customer}</p>
                      <p className="text-xs text-muted-foreground">{order.items}</p>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1">
                    <p className="font-bold text-sm">${order.amount.toFixed(2)}</p>
                    <div className="whitespace-nowrap inline-flex items-center rounded-md px-2 py-0.5 font-semibold transition-colors border bg-green-50 text-green-700 border-green-200 text-[11px]">
                      {order.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
