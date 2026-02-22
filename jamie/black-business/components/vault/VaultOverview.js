export default function VaultOverview() {
  return <div className="grid gap-3 md:grid-cols-4">{[["Total Pooled","$420,000"],["Active Loans","18"],["Repayment Rate","92%"],["Available","$126,000"]].map(([k,v]) => <div className="card" key={k}><p className="text-sm text-slate-500">{k}</p><p className="text-2xl font-bold text-vault">{v}</p></div>)}</div>;
}
