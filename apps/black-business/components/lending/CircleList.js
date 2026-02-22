import Link from "next/link";

export default function CircleList({ circles }) {
  return <div className="grid gap-3 md:grid-cols-2">{circles.map((c) => <Link href={`/lending/${c.id}`} key={c.id} className="card block"><p className="text-xs uppercase tracking-wide text-slate-500">{c.status}</p><h3 className="mt-1 text-lg font-semibold">{c.name}</h3><p className="text-sm text-slate-600">{c.members} members</p></Link>)}</div>;
}
