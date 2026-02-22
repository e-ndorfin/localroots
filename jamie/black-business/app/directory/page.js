"use client";

import Link from "next/link";
import Script from "next/script";
import { useEffect, useRef, useState } from "react";
import UserAvatarLink from "@/components/layout/UserAvatarLink";
import { businesses } from "@/lib/mockData";

export default function DirectoryPage() {
  const [role, setRole] = useState("");
  const [leafletReady, setLeafletReady] = useState(false);
  const mapRef = useRef(null);

  useEffect(() => {
    const saved = window.localStorage.getItem("bb-role");
    setRole(saved || "");
  }, []);

  const isBusiness = role === "business";
  const mapPins = [
    {
      id: "fresh-plate-cafe",
      name: "Fresh Plate Cafe",
      brief: "Farm-to-table bowls and brunch.",
      coords: [43.6487, -79.3868],
    },
    {
      id: "neighborhood-roasters",
      name: "Neighborhood Roasters",
      brief: "Single-origin espresso bar.",
      coords: [43.6515, -79.3895],
    },
    {
      id: "makers-market",
      name: "Makers Market",
      brief: "Handmade goods and artisan gifts.",
      coords: [43.6501, -79.3739],
    },
    {
      id: "crown-steel-barbershop",
      name: "Crown & Steel Barbershop",
      brief: "Classic cuts and beard shaping.",
      coords: [43.657, -79.3812],
    },
    {
      id: "elm-street-books",
      name: "Elm Street Books",
      brief: "Independent bookstore and events.",
      coords: [43.6557, -79.4007],
    },
    {
      id: "juniper-boutique",
      name: "Juniper Boutique",
      brief: "Local fashion and capsule collections.",
      coords: [43.6709, -79.3925],
    },
    {
      id: "green-basket-grocer",
      name: "Green Basket Grocer",
      brief: "Fresh produce and pantry staples.",
      coords: [43.6488, -79.3716],
    },
  ];

  useEffect(() => {
    if (!leafletReady || mapRef.current) return undefined;
    if (!window.L) return undefined;

    const map = window.L.map("browse-map", {
      scrollWheelZoom: true,
    }).setView([43.6532, -79.3832], 15);

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

      <header className="topbar">
        <Link className="app-name" href="/directory">LocalRoots</Link>
        <nav className="nav-links nav-inline">
          <Link className="nav-link active" href="/directory">Browse</Link>
          {isBusiness ? (
            <>
              <Link className="nav-link" href="/business/funding">Funding Requests</Link>
              <Link className="nav-link" href="/business/tracking">Business Metrics</Link>
              <Link className="nav-link" href="/business/storefront">Edit Storefront</Link>
            </>
          ) : (
            <Link className="nav-link" href="/vault">Community Fund</Link>
          )}
        </nav>
        <div className="topbar-right">
          <div className="site-balances">
            <div className="balance-pill"><strong>$245.0</strong></div>
            <div className="balance-pill"><strong>1,840 pts</strong></div>
          </div>
          <UserAvatarLink />
        </div>
      </header>

      <main className="content">
        <section className="page-head"><h1>Discover Local Businesses</h1></section>
        <section className="map-panel reveal">
          <div id="browse-map" className="browse-map" role="region" aria-label="Downtown Toronto store map"></div>
        </section>
        <section className="chip-row">
          <button className="chip chip-active">All</button>
          <button className="chip">Food</button>
          <button className="chip">Retail</button>
          <button className="chip">Services</button>
          <button className="chip">Wellness</button>
        </section>

        <section className="card-grid">
          {businesses.map((business, index) => (
            <article className="biz-card reveal" key={business.id}>
              <div className="card-image-wrap">
                {business.featured ? <span className="biz-badge">{index % 2 === 0 ? "Top Rated" : "Sponsored"}</span> : null}
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




