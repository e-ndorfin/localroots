"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Topbar from "@/components/layout/Header";
import { businesses, storefrontProfiles } from "@/lib/mockData";

const CART_KEY = "bb-cart-items";

export default function BusinessDetailPage() {
  const params = useParams();
  const businessId = typeof params?.businessId === "string" ? params.businessId : "";
  const business = businesses.find((item) => item.id === businessId);
  const profile = storefrontProfiles[businessId];
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    try {
      const cartRaw = window.localStorage.getItem(CART_KEY);
      const cart = cartRaw ? JSON.parse(cartRaw) : [];
      setCartCount(Array.isArray(cart) ? cart.length : 0);
    } catch {
      setCartCount(0);
    }
  }, []);

  function add(product) {
    try {
      const cartRaw = window.localStorage.getItem(CART_KEY);
      const cart = cartRaw ? JSON.parse(cartRaw) : [];
      const next = Array.isArray(cart) ? cart : [];
      next.push({
        id: Date.now() + Math.random(),
        name: product.name,
        price: Number(product.price || 0),
        usePoints: false,
      });
      window.localStorage.setItem(CART_KEY, JSON.stringify(next));
      setCartCount(next.length);
    } catch {
      setCartCount((c) => c + 1);
    }
  }

  if (!business || !profile) {
    return (
      <>
        <div className="bg-orb orb-a"></div>
        <div className="bg-orb orb-b"></div>
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
        <section className="page-head"><h1>{business.name}</h1></section>
        <section className="panel reveal">
          <p className="rating">&#9733; {business.rating} ({business.reviews} reviews)</p>
          <h2>Order Products</h2>
          <p className="muted">{profile.intro}</p>
          <p className="store-location"><strong>Location:</strong> {business.location}</p>
          <img className="store-hero-image" src={business.image} alt={`${business.name} storefront`} />

          <div className="product-list">
            {profile.products.map((product) => (
              <div className="product-item" key={product.name}>
                <div><h3>{product.name}</h3><p>{product.description}</p></div>
                <div className="product-actions"><span>${product.price}</span><button className="btn btn-solid" onClick={() => add(product)}>Add</button></div>
              </div>
            ))}
          </div>

          <div className="checkout-row">
            <p><strong>Cart Items:</strong> <span>{cartCount}</span></p>
            <Link className="btn btn-outline" href="/checkout">Checkout</Link>
          </div>
        </section>
      </main>
    </>
  );
}




