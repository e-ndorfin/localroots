"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function CreateBusinessAccountPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.target);
    const businessName = formData.get("businessName");
    const ownerName = formData.get("ownerName");
    const email = formData.get("email");
    const password = formData.get("password");

    const supabase = createClient();
    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { role: "business", display_name: ownerName, business_name: businessName },
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    // Insert profile row
    if (data.user) {
      await supabase.from("profiles").insert({
        id: data.user.id,
        role: "business",
        display_name: ownerName,
      });
    }

    router.push("/business/storefront");
    router.refresh();
  }

  return (
    <div className="login-page">
      <div className="bg-orb orb-a"></div>
      <div className="bg-orb orb-b"></div>

      <main className="login-wrap">
        <section className="login-card">
          <Link className="app-name login-brand" href="/directory">LocalRoots</Link>
          <h1>Create business account</h1>
          <p className="muted">Set up your business profile to start receiving local orders and funding opportunities.</p>

          {error && <p className="text-red-500 text-sm mb-2">{error}</p>}

          <form className="login-form" noValidate onSubmit={handleSubmit}>
            <label>
              Business name
              <input type="text" name="businessName" placeholder="Your business name" />
            </label>
            <label>
              Owner full name
              <input type="text" name="ownerName" placeholder="Owner full name" />
            </label>
            <label>
              Business email
              <input type="email" name="email" placeholder="business@email.com" />
            </label>
            <label>
              Password
              <input type="password" name="password" placeholder="Create a password" />
            </label>
            <button className="btn btn-solid" type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Business Account"}
            </button>
          </form>

          <p className="signup-note">
            Need a customer account? <Link href="/create-customer-account">Create customer account</Link>
          </p>
        </section>
      </main>
    </div>
  );
}
