"use client";

import Link from "next/link";
import Script from "next/script";
import { useEffect, useRef, useState } from "react";
import Topbar from "@/components/layout/Header";
import { businesses as mockBusinesses } from "@/lib/mockData";

const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&h=400&fit=crop";

export default function DirectoryPage() {
  const [leafletReady, setLeafletReady] = useState(() => typeof window !== "undefined" && !!window.L);
  const [apiBusinesses, setApiBusinesses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState("All");
  const mapRef = useRef(null);

  useEffect(() => {
    fetch("/api/business/directory")
      .then((res) => res.ok ? res.json() : { businesses: [], categories: [] })
      .then((data) => {
        setApiBusinesses(data.businesses || []);
        setCategories(data.categories || []);
      })
      .catch(() => {});
  }, []);

  // Merge: API-registered businesses first, then mockData for demo richness
  const apiBizNormalized = apiBusinesses.map((b) => ({
    id: String(b.id),
    name: b.name,
    category: b.category || "Business",
    location: b.location || "Toronto, ON",
    description: b.description || "",
    rating: "New",
    reviews: 0,
    image: DEFAULT_IMAGE,
    featured: b.isBoosted,
    fromApi: true,
  }));

  const mockIds = new Set(apiBizNormalized.map((b) => b.name.toLowerCase()));
  const filteredMock = mockBusinesses.filter((b) => !mockIds.has(b.name.toLowerCase()));
  const allBusinesses = [...apiBizNormalized, ...filteredMock];

  const displayedBusinesses = activeCategory === "All"
    ? allBusinesses
    : allBusinesses.filter((b) => b.category === activeCategory);

  const allCategories = ["All", ...new Set(allBusinesses.map((b) => b.category))];

  const mapPins = [
    { id: "1", name: "Patois Toronto", brief: "Caribbean-inspired fine dining.", coords: [43.6532, -79.4112] },
    { id: "2", name: "Kensington Natural", brief: "Organic health foods and beauty.", coords: [43.6547, -79.4006] },
    { id: "3", name: "Crown & Glory Barbershop", brief: "Premium fades and beard shaping.", coords: [43.6426, -79.4291] },
    { id: "4", name: "Afro-Bookshop", brief: "Books by Black authors.", coords: [43.6677, -79.4056] },
    { id: "5", name: "Ubuntu Tech Hub", brief: "Co-working and tech incubator.", coords: [43.6510, -79.3660] },
    { id: "6", name: "Mama Fifi's Kitchen", brief: "Authentic West African cuisine.", coords: [43.6763, -79.3492] },
    { id: "7", name: "Heritage Dance Studio", brief: "Afrobeats and dance classes.", coords: [43.6564, -79.4163] },
  ];

  useEffect(() => {
    if (!leafletReady || mapRef.current) return undefined;
    if (!window.L) return undefined;

    const map = window.L.map("browse-map", {
      scrollWheelZoom: true,
    }).setView([43.6532, -79.3832], 14);

    window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    mapPins.forEach((store) => {
      const marker = window.L.marker(store.coords).addTo(map);
      marker.bindTooltip(`<strong>${store.name}</strong><br>${store.brief}`, {
        direction: "top",
        opacity: 0.95,
      });
      marker.on("click", () => {
        window.location.href = `/directory/${store.id}`;
      });
    });

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [leafletReady]);

  return (
    <>
      <Script src="https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js" strategy="afterInteractive" onLoad={() => setLeafletReady(true)} />
      <div className="bg-orb orb-a"></div>
      <div className="bg-orb orb-b"></div>

      <Topbar />

      <main className="content">
        <section className="page-head"><h1>Discover Local Businesses</h1></section>
        <section className="map-panel reveal">
          <div id="browse-map" className="browse-map" role="region" aria-label="Downtown Toronto store map"></div>
        </section>
        <section className="chip-row">
          {allCategories.map((cat) => (
            <button key={cat} className={`chip${activeCategory === cat ? " chip-active" : ""}`} onClick={() => setActiveCategory(cat)}>{cat}</button>
          ))}
        </section>

        <section className="card-grid">
          {displayedBusinesses.map((business, index) => (
            <article className="biz-card reveal" key={business.id}>
              <div className="card-image-wrap">
                {business.fromApi ? <span className="biz-badge">Registered</span> : business.featured || business.badge ? <span className="biz-badge">{business.badge || (index % 2 === 0 ? "Top Rated" : "Sponsored")}</span> : null}
                <Link href={`/directory/${business.id}`}>
                  <img src={business.image} alt={business.name} />
                </Link>
              </div>
              <div className="card-body">
                <h2>{business.name}</h2>
                <p>{business.description}</p>
                <p className="rating">&#9733; {business.rating} ({business.reviews} reviews)</p>
              </div>
            </article>
          ))}
        </section>
      </main>
    </>
  );
}
