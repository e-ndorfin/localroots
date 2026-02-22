"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import UserAvatarLink from "@/components/layout/UserAvatarLink";

const seedProducts = [
  { id: 1, name: "Single-Origin Espresso Beans", price: 16, description: "Local favorite" },
  { id: 2, name: "Cold Brew Growler", price: 12, description: "House specialty" },
  { id: 3, name: "Pastry Box", price: 18, description: "Fresh baked daily" },
];

export default function EditStorefrontPage() {
  const [storeName, setStoreName] = useState("Neighborhood Roasters");
  const [storeDescription, setStoreDescription] = useState("Single-origin espresso bar and beans from nearby family farms.");
  const [storeLocation, setStoreLocation] = useState("Queen St W, Toronto, ON");
  const [products, setProducts] = useState(seedProducts);
  const [status, setStatus] = useState("");

  const totalPrice = useMemo(() => products.reduce((sum, p) => sum + Number(p.price || 0), 0), [products]);

  function updateProduct(id, key, value) {
    setProducts((prev) => prev.map((item) => (item.id === id ? { ...item, [key]: value } : item)));
  }

  function addProduct() {
    setProducts((prev) => [
      ...prev,
      { id: Date.now(), name: "New product", price: 0, description: "Add description" },
    ]);
  }

  function removeProduct(id) {
    setProducts((prev) => prev.filter((item) => item.id !== id));
  }

  function saveChanges(event) {
    event.preventDefault();
    setStatus("Storefront updates saved.");
  }

  return (
    <>
      <div className="bg-orb orb-a"></div>
      <div className="bg-orb orb-b"></div>

      <header className="topbar">
        <Link className="app-name" href="/directory">LocalRoots</Link>
        <nav className="nav-links nav-inline">
          <Link className="nav-link" href="/directory">Browse</Link>
          <Link className="nav-link" href="/business/funding">Funding Requests</Link>
          <Link className="nav-link" href="/business/tracking">Business Metrics</Link>
          <Link className="nav-link active" href="/business/storefront">Edit Storefront</Link>
        </nav>
        <div className="topbar-right"><div className="site-balances"><div className="balance-pill"><strong>$245.0</strong></div><div className="balance-pill"><strong>1,840 pts</strong></div></div><UserAvatarLink /></div>
      </header>

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
                <input type="text" value={storeName} onChange={(e) => setStoreName(e.target.value)} />
              </label>
              <label>
                Store Description
                <textarea value={storeDescription} onChange={(e) => setStoreDescription(e.target.value)} />
              </label>
              <label>
                Store Location
                <input type="text" value={storeLocation} onChange={(e) => setStoreLocation(e.target.value)} />
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
                <button className="btn btn-solid" type="submit">Save Storefront</button>
              </div>
            </form>
            {status ? <p className="muted mt-3">{status}</p> : null}
          </section>

          <aside className="panel reveal">
            <h2>Live Storefront Preview</h2>
            <p className="muted">{storeDescription}</p>
            <p className="store-location"><strong>Location:</strong> {storeLocation}</p>
            <div className="product-list">
              {products.map((product) => (
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
            <div className="impact-stat">
              <p className="muted">Total value of listed items</p>
              <h3>${totalPrice.toFixed(2)}</h3>
            </div>
          </aside>
        </div>
      </main>
    </>
  );
}
