export default function PointsHistory({ items }) {
  return (
    <div className="card">
      <h3 className="mb-3 text-lg font-semibold">History</h3>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.id} className="flex items-center justify-between rounded-xl border border-slate-200 p-3 text-sm">
            <div><p className="font-medium">{item.business}</p><p className="text-slate-500">{item.date}</p></div>
            <p className={item.points > 0 ? "font-semibold text-green-600" : "font-semibold text-amber-700"}>{item.points > 0 ? `+${item.points}` : item.points}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
