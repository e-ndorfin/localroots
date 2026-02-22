"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function CreateAccountPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.target);
    const name = formData.get("name");
    const email = formData.get("email");
    const password = formData.get("password");

    const supabase = createClient();
    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { role: "customer", display_name: name },
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
        role: "customer",
        display_name: name,
      });
    }

    router.push("/directory");
    router.refresh();
  }

  return (
    <div className="login-page">
      <div className="bg-orb orb-a"></div>
      <div className="bg-orb orb-b"></div>

      <main className="login-wrap">
        <section className="login-card">
          <Link className="app-name login-brand" href="/directory">LocalRoots</Link>
          <h1>Create account</h1>
          <p className="muted">Set up your profile to discover and support local businesses.</p>

          {error && <p className="text-red-500 text-sm mb-2">{error}</p>}

          <form className="login-form" noValidate onSubmit={handleSubmit}>
            <label>
              Full name
              <input type="text" name="name" placeholder="Your full name" />
            </label>
            <label>
              Email
              <input type="email" name="email" placeholder="you@email.com" />
            </label>
            <label>
              Password
              <input type="password" name="password" placeholder="Create a password" />
            </label>
            <button className="btn btn-solid" type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Account"}
            </button>
          </form>

          <p className="signup-note">
            Already have an account? <Link href="/login">Log in</Link>
          </p>
        </section>
      </main>
    </div>
  );
}
