"use client";

import { useMemo, useState } from "react";

export default function BusinessSearch({ onChange }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [location, setLocation] = useState("All");
  const filters = useMemo(() => ({ query, category, location }), [query, category, location]);

  function emit(next) {
    onChange?.({ ...filters, ...next });
  }

  return (
    <div className="card mb-4 grid gap-3 md:grid-cols-3">
      <input className="input" placeholder="Search by business or category" value={query} onChange={(e) => { setQuery(e.target.value); emit({ query: e.target.value }); }} />
      <select className="input" value={category} onChange={(e) => { setCategory(e.target.value); emit({ category: e.target.value }); }}>
        <option>All</option><option>Food</option><option>Retail</option><option>Services</option>
      </select>
      <select className="input" value={location} onChange={(e) => { setLocation(e.target.value); emit({ location: e.target.value }); }}>
        <option>All</option><option>Atlanta, GA</option><option>Houston, TX</option><option>Chicago, IL</option><option>Detroit, MI</option>
      </select>
    </div>
  );
}
