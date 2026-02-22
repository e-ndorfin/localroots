"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Topbar from "@/components/layout/Header";
import { createClient } from "@/lib/supabase/client";

const CATEGORIES = [
  "Restaurant",
  "Café & Bakery",
  "Health & Beauty",
  "Barbershop",
  "Retail",
  "Bookstore",
  "Tech & Services",
  "Arts & Culture",
  "Fitness & Dance",
  "Other",
];

export default function EditStorefrontPage() {
  const [storeName, setStoreName] = useState("");
  const [storeCategory, setStoreCategory] = useState(CATEGORIES[0]);
  const [storeDescription, setStoreDescription] = useState("");
  const [storeLocation, setStoreLocation] = useState("");
  const [lat, setLat] = useState(null);
  const [lng, setLng] = useState(null);
  const [products, setProducts] = useState([]);
  const [status, setStatus] = useState("");
  const [businessId, setBusinessId] = useState(null);
  const [saving, setSaving] = useState(false);

  // Nominatim address autocomplete
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const geocodeTimer = useRef(null);
  const suggestionsRef = useRef(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      // Pre-fill name from signup metadata if no business row yet
      const metaName = user.user_metadata?.business_name || "";
      supabase
        .from("businesses")
        .select("id, name, category, description, location, lat, lng, products")
        .eq("owner_user_id", user.id)
        .maybeSingle()
        .then(({ data }) => {
          if (data) {
            setBusinessId(data.id);
            setStoreName(data.name || "");
            setStoreCategory(data.category || CATEGORIES[0]);
            setStoreDescription(data.description || "");
            setStoreLocation(data.location || "");
            setLat(data.lat ?? null);
            setLng(data.lng ?? null);
            setProducts(Array.isArray(data.products) ? data.products : []);
          } else if (metaName) {
            setStoreName(metaName);
          }
        });
    });
  }, []);

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClick(e) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleLocationChange(val) {
    setStoreLocation(val);
    setLat(null);
    setLng(null);

    clearTimeout(geocodeTimer.current);
    if (val.length < 3) { setSuggestions([]); return; }

    geocodeTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(val)}&format=json&limit=5&addressdetails=0`,
          { headers: { "Accept-Language": "en" } }
        );
        const data = await res.json();
        setSuggestions(data.map((d) => ({ label: d.display_name, lat: parseFloat(d.lat), lng: parseFloat(d.lon) })));
        setShowSuggestions(true);
      } catch {
        setSuggestions([]);
      }
    }, 500);
  }

  function selectSuggestion(s) {
    setStoreLocation(s.label);
    setLat(s.lat);
    setLng(s.lng);
    setSuggestions([]);
    setShowSuggestions(false);
  }

  const totalPrice = useMemo(() => products.reduce((sum, p) => sum + Number(p.price || 0), 0), [products]);

  function updateProduct(id, key, value) {
    setProducts((prev) => prev.map((item) => (item.id === id ? { ...item, [key]: value } : item)));
  }

  function addProduct() {
    setProducts((prev) => [...prev, { id: Date.now(), name: "New product", price: 0, description: "Add description" }]);
  }

  function removeProduct(id) {
    setProducts((prev) => prev.filter((item) => item.id !== id));
  }

  async function saveChanges(event) {
    event.preventDefault();
    if (!storeName.trim()) { setStatus("Store name is required."); return; }
    setSaving(true);
    setStatus("");

    try {
      let res;
      if (!businessId) {
        // First save — register the business
        res = await fetch("/api/business/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: storeName,
            category: storeCategory,
            description: storeDescription,
            location: storeLocation,
            lat,
            lng,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          setBusinessId(data.id);
          // Save products separately now that we have an id
          if (products.length > 0) {
            await fetch("/api/business/update", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ products }),
            });
          }
        }
      } else {
        res = await fetch("/api/business/update", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: storeName,
            category: storeCategory,
            description: storeDescription,
            location: storeLocation,
            lat,
            lng,
            products,
          }),
        });
      }

      if (res.ok) {
        setStatus("Storefront saved.");
      } else {
        const data = await res.json();
        setStatus(`Save failed: ${data.error || "unknown error"}`);
      }
    } catch {
      setStatus("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="bg-orb orb-a"></div>
      <div className="bg-orb orb-b"></div>

      <Topbar />

      <main className="content">
        <section className="page-head">
          <h1>Edit Storefront</h1>
          <p className="muted">Update your store profile, product prices, and item descriptions.</p>
        </section>

        <div className="two-col">
          <section className="panel reveal">
            <h2>Store Details</h2>
            <form className="loan-form mt-3" onSubmit={saveChanges}>
              <label>
                Store Name
                <input type="text" value={storeName} onChange={(e) => setStoreName(e.target.value)} required />
              </label>
              <label>
                Category
                <select className="w-full border border-[var(--line)] rounded-[10px] px-3 py-2.5 bg-white" value={storeCategory} onChange={(e) => setStoreCategory(e.target.value)}>
                  {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </label>
              <label>
                Store Description
                <textarea value={storeDescription} onChange={(e) => setStoreDescription(e.target.value)} />
              </label>
              <label>
                Store Location
                <div className="relative" ref={suggestionsRef}>
                  <input
                    type="text"
                    value={storeLocation}
                    onChange={(e) => handleLocationChange(e.target.value)}
                    onFocus={() => suggestions.length && setShowSuggestions(true)}
                    placeholder="Start typing an address..."
                    autoComplete="off"
                  />
                  {lat && lng && (
                    <p className="text-xs text-green-600 mt-1">✓ Coordinates set ({lat.toFixed(4)}, {lng.toFixed(4)})</p>
                  )}
                  {showSuggestions && suggestions.length > 0 && (
                    <ul className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-border rounded-xl shadow-lg overflow-hidden">
                      {suggestions.map((s, i) => (
                        <li
                          key={i}
                          className="px-3 py-2 text-sm cursor-pointer hover:bg-muted/30 border-b border-border/50 last:border-0"
                          onMouseDown={() => selectSuggestion(s)}
                        >
                          {s.label}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </label>

              <h3>Products</h3>
              <div className="product-list">
                {products.map((product) => (
                  <div className="panel" key={product.id} style={{ marginBottom: "0.7rem", padding: "0.8rem" }}>
                    <label>
                      Product Name
                      <input type="text" value={product.name} onChange={(e) => updateProduct(product.id, "name", e.target.value)} />
                    </label>
                    <label>
                      Price (USD)
                      <input type="number" min="0" step="0.01" value={product.price} onChange={(e) => updateProduct(product.id, "price", e.target.value)} />
                    </label>
                    <label>
                      Description
                      <input type="text" value={product.description} onChange={(e) => updateProduct(product.id, "description", e.target.value)} />
                    </label>
                    <button className="btn btn-outline" type="button" onClick={() => removeProduct(product.id)}>Remove Product</button>
                  </div>
                ))}
              </div>

              <div className="contribute-row">
                <button className="btn btn-outline" type="button" onClick={addProduct}>Add Product</button>
                <button className="btn btn-solid" type="submit" disabled={saving}>{saving ? "Saving..." : "Save Storefront"}</button>
              </div>
            </form>
            {status && (
              <p className={`mt-3 text-sm ${status.startsWith("Save failed") || status.startsWith("Network") ? "text-red-600" : "text-green-700"}`}>
                {status}
              </p>
            )}
          </section>

          <aside className="panel reveal">
            <h2>Live Storefront Preview</h2>
            <p className="muted">{storeDescription || "No description yet."}</p>
            <p className="store-location"><strong>Location:</strong> {storeLocation || "—"}</p>
            <div className="product-list">
              {products.length === 0 ? (
                <p className="muted text-sm">No products added yet.</p>
              ) : products.map((product) => (
                <div className="product-item" key={`preview-${product.id}`}>
                  <div>
                    <h3>{product.name || "Untitled product"}</h3>
                    <p>{product.description || "No description yet"}</p>
                  </div>
                  <div className="product-actions">
                    <span>${Number(product.price || 0).toFixed(2)}</span>
                    <button className="btn btn-solid" type="button">Add</button>
                  </div>
                </div>
              ))}
            </div>
            {products.length > 0 && (
              <div className="impact-stat">
                <p className="muted">Total value of listed items</p>
                <h3>${totalPrice.toFixed(2)}</h3>
              </div>
            )}
          </aside>
        </div>
      </main>
    </>
  );
}
