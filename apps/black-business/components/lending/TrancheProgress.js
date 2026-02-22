export default function TrancheProgress({ loans = [] }) {
  if (!loans.length) {
    return (
      <div className="card">
        <h3 className="mb-3 text-lg font-semibold">Tranche Progress</h3>
        <p className="text-sm text-slate-500">No active loans in this circle yet.</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h3 className="mb-3 text-lg font-semibold">Tranche Progress</h3>
      {loans.map((loan) => (
        <div key={loan.id} className="mb-4">
          <p className="text-sm font-medium">{loan.borrower_pseudonym} &mdash; ${(loan.principal_cents / 100).toLocaleString()}</p>
          <p className="text-xs text-slate-500">Status: {loan.status} &middot; Repaid: ${((loan.repaid_cents || 0) / 100).toFixed(2)}</p>
        </div>
      ))}
    </div>
  );
}
