export default function PointsBalance({ points }) {
  return (
    <div className="card border-loyalty/30 bg-amber-50">
      <p className="text-sm text-slate-600">Current points balance</p>
      <p className="text-4xl font-bold text-loyalty">{points.toLocaleString()}</p>
    </div>
  );
}
