"use client";

import Link from "next/link";
import Script from "next/script";
import { useEffect, useRef, useState } from "react";
import Topbar from "@/components/layout/Header";
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

  const allBusinesses = apiBusinesses.map((b) => ({
    id: String(b.id),
    name: b.name,
    category: b.category || "Business",
    location: b.location || "Toronto, ON",
    description: b.description || "",
    image: b.imageUrl || DEFAULT_IMAGE,
    featured: b.isBoosted,
  }));

  const displayedBusinesses = activeCategory === "All"
    ? allBusinesses
    : allBusinesses.filter((b) => b.category === activeCategory);

  const allCategories = ["All", ...new Set(allBusinesses.map((b) => b.category))];

  const mapPins = apiBusinesses
    .filter((b) => b.lat && b.lng)
    .map((b) => ({
      id: String(b.id),
      name: b.name,
      brief: b.description || b.category || "",
      coords: [b.lat, b.lng],
    }));

  useEffect(() => {
    if (!leafletReady || !window.L) return undefined;

    // Destroy and recreate map when pins change
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    const map = window.L.map("browse-map", {
      scrollWheelZoom: true,
    }).setView([43.6532, -79.3832], 14);

    window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    // Show user's location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          const userIcon = window.L.divIcon({
            html: '<div style="width:14px;height:14px;background:#3b82f6;border:3px solid #fff;border-radius:50%;box-shadow:0 0 6px rgba(59,130,246,0.5)"></div>',
            iconSize: [14, 14],
            iconAnchor: [7, 7],
            className: "",
          });
          window.L.marker([latitude, longitude], { icon: userIcon })
            .addTo(map)
            .bindTooltip("You are here", { direction: "top" });
        },
        () => {} // silently ignore denied permission
      );
    }

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
  }, [leafletReady, mapPins.length]);

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
          {displayedBusinesses.length === 0 && (
            <p className="muted col-span-full">No businesses registered yet.</p>
          )}
          {displayedBusinesses.map((business) => (
            <article className="biz-card reveal" key={business.id}>
              <div className="card-image-wrap">
                {business.featured ? <span className="biz-badge">Featured</span> : null}
                <Link href={`/directory/${business.id}`}>
                  <img src={business.image} alt={business.name} />
                </Link>
              </div>
              <div className="card-body">
                <h2>{business.name}</h2>
                <p>{business.description}</p>
                <p className="muted text-xs">{business.category}</p>
              </div>
            </article>
          ))}
        </section>
      </main>
    </>
  );
}
