export default function CircleDetail({ circleId, circle, members = [], loading }) {
  if (loading) return <div className="card"><p className="muted">Loading circle...</p></div>;
  if (!circle) return <div className="card"><h2 className="text-xl font-bold">Circle: {circleId}</h2><p className="mt-2 text-slate-600">Circle not found. It may not exist yet in the database.</p></div>;

  return (
    <div className="card">
      <h2 className="text-xl font-bold">{circle.name || `Circle ${circleId}`}</h2>
      <p className="text-sm text-slate-500 mt-1">Status: <strong>{circle.status}</strong> &middot; {members.length}/{circle.max_members || 6} members</p>
      {members.length > 0 && (
        <div className="mt-3 space-y-1">
          <p className="text-sm font-medium">Members:</p>
          {members.map((m, i) => (
            <p key={i} className="text-sm text-slate-600">{m.pseudonym} {m.role === "creator" ? "(Creator)" : ""}</p>
          ))}
        </div>
      )}
      <p className="mt-3 text-slate-600">Members collaborate on milestone-based lending decisions.</p>
    </div>
  );
}
