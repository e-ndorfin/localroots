export default function RevenueDashboard() {
  const stats = [["Total Revenue", "$24,380"],["Customers", "1,146"],["Transactions", "1,962"],["Points Redeemed", "7,420"]];
  return <div className="grid gap-3 md:grid-cols-2">{stats.map(([k,v]) => <div className="card" key={k}><p className="text-sm text-slate-500">{k}</p><p className="text-2xl font-bold">{v}</p></div>)}</div>;
}
