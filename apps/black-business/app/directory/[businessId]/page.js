"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Topbar from "@/components/layout/Header";
import { createClient } from "@/lib/supabase/client";

const CART_KEY = "bb-cart-items";

export default function BusinessDetailPage() {
  const params = useParams();
  const businessId = typeof params?.businessId === "string" ? params.businessId : "";
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cartCount, setCartCount] = useState(0);
  const [role, setRole] = useState(null);

  const isBusiness = role === "business";

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("businesses")
      .select("id, name, category, location, description, is_boosted, products, image_url")
      .eq("id", businessId)
      .single()
      .then(({ data }) => {
        setBusiness(data || null);
        setLoading(false);
      });

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase.from("profiles").select("role").eq("id", user.id).single()
        .then(({ data }) => setRole(data?.role || user.user_metadata?.role || "customer"));
    });

    try {
      const cartRaw = window.localStorage.getItem(CART_KEY);
      const cart = cartRaw ? JSON.parse(cartRaw) : [];
      setCartCount(Array.isArray(cart) ? cart.length : 0);
    } catch {
      setCartCount(0);
    }
  }, [businessId]);

  function add(product) {
    try {
      const cartRaw = window.localStorage.getItem(CART_KEY);
      const cart = cartRaw ? JSON.parse(cartRaw) : [];
      const next = Array.isArray(cart) ? cart : [];
      next.push({
        id: Date.now() + Math.random(),
        name: product.name,
        price: Number(product.price || 0),
        businessId: String(businessId),
        usePoints: false,
      });
      window.localStorage.setItem(CART_KEY, JSON.stringify(next));
      setCartCount(next.length);
    } catch {
      setCartCount((c) => c + 1);
    }
  }

  if (loading) {
    return (
      <>
        <div className="bg-orb orb-a"></div>
        <div className="bg-orb orb-b"></div>
        <Topbar />
        <main className="content"><p className="muted">Loading...</p></main>
      </>
    );
  }

  if (!business) {
    return (
      <>
        <div className="bg-orb orb-a"></div>
        <div className="bg-orb orb-b"></div>
        <Topbar />
        <main className="content">
          <section className="panel">
            <h1>Storefront not found</h1>
            <p className="muted">This business profile is unavailable.</p>
            <Link className="btn btn-solid" href="/directory">Back to Browse</Link>
          </section>
        </main>
      </>
    );
  }

  return (
    <>
      <div className="bg-orb orb-a"></div>
      <div className="bg-orb orb-b"></div>

      <Topbar />

      <main className="content">
        {business.image_url && (
          <section className="hero-image reveal">
            <img
              src={business.image_url}
              alt={`${business.name} storefront`}
              style={{ width: "100%", maxHeight: 360, objectFit: "cover", borderRadius: "var(--radius)" }}
            />
          </section>
        )}
        <section className="page-head">
          <h1>{business.name}</h1>
          {business.is_boosted && <span className="biz-badge">Featured</span>}
        </section>
        <section className="panel reveal">
          <p className="muted">{business.description || "No description provided."}</p>
          <p className="store-location"><strong>Location:</strong> {business.location || "—"}</p>
          {business.category && (
            <p className="muted"><strong>Category:</strong> {business.category}</p>
          )}

          <h2 className="mt-4">Products</h2>
          <div className="product-list">
            {(!business.products || business.products.length === 0) ? (
              <p className="muted text-sm">This business has not listed any products yet.</p>
            ) : business.products.map((product) => (
              <div className="product-item" key={product.id}>
                <div>
                  <h3>{product.name}</h3>
                  <p>{product.description}</p>
                </div>
                <div className="product-actions">
                  <span>${Number(product.price || 0).toFixed(2)}</span>
                  {!isBusiness && (
                    <button className="btn btn-solid" onClick={() => add(product)}>Add</button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {!isBusiness && (
            <div className="checkout-row mt-4">
              <p><strong>Cart Items:</strong> <span>{cartCount}</span></p>
              <Link className="btn btn-outline" href="/checkout">Checkout</Link>
            </div>
          )}
        </section>
      </main>
    </>
  );
}
