"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState(null); // null = choosing, "customer" | "business"
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.target);
    const email = formData.get("email");
    const password = formData.get("password");

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    router.push("/directory");
    router.refresh();
  }

  // Step 1: Choose role
  if (!role) {
    return (
      <div className="login-page">
        <div className="bg-orb orb-a"></div>
        <div className="bg-orb orb-b"></div>

        <main className="login-wrap">
          <section className="login-card">
            <Link className="app-name login-brand" href="/directory">LocalRoots</Link>
            <h1>Welcome back</h1>
            <p className="muted">How would you like to log in?</p>

            <div className="account-type-grid">
              <button className="account-type-card" onClick={() => setRole("customer")}>
                <span className="account-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21a8 8 0 0 0-16 0"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                </span>
                <h2>Customer</h2>
                <p>Browse shops, place orders, and earn rewards.</p>
              </button>

              <button className="account-type-card" onClick={() => setRole("business")}>
                <span className="account-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2"></rect>
                    <path d="M9 21V9h6v12"></path>
                    <path d="M9 13h6"></path>
                    <path d="M7 7h.01M17 7h.01"></path>
                  </svg>
                </span>
                <h2>Business</h2>
                <p>Manage your storefront, orders, and funding.</p>
              </button>
            </div>

            <p className="signup-note">
              New here? <Link href="/choose-account">Create an account</Link>
            </p>
          </section>
        </main>
      </div>
    );
  }

  // Step 2: Login form
  const title = role === "business" ? "Business log in" : "Customer log in";

  return (
    <div className="login-page">
      <div className="bg-orb orb-a"></div>
      <div className="bg-orb orb-b"></div>

      <main className="login-wrap">
        <section className="login-card">
          <Link className="app-name login-brand" href="/directory">LocalRoots</Link>
          <h1>{title}</h1>

          {error && <p className="text-red-500 text-sm mb-2">{error}</p>}

          <form className="login-form" onSubmit={handleSubmit}>
            <label>
              Email
              <input type="email" name="email" placeholder="you@email.com" required />
            </label>
            <label>
              Password
              <input type="password" name="password" placeholder="Enter your password" required />
            </label>
            <div className="login-row">
              <Link href="/forgot-password">Forgot password?</Link>
            </div>
            <button className="btn btn-solid" type="submit" disabled={loading}>
              {loading ? "Logging in..." : "Log In"}
            </button>
          </form>

          <p className="signup-note">
            <button className="link-button" onClick={() => { setRole(null); setError(""); }}>
              &larr; Change account type
            </button>
          </p>
          <p className="signup-note">
            New here? <Link href="/choose-account">Create an account</Link>
          </p>
        </section>
      </main>
    </div>
  );
}
