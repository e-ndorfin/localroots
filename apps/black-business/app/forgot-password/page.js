"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.target);
    const email = formData.get("email");

    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email);

    if (resetError) {
      setError(resetError.message);
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  }

  return (
    <div className="login-page">
      <div className="bg-orb orb-a"></div>
      <div className="bg-orb orb-b"></div>

      <main className="login-wrap">
        <section className="login-card">
          <Link className="app-name login-brand" href="/directory">LocalRoots</Link>
          <h1>Reset password</h1>
          <p className="muted">Enter your account email and we will send a reset link.</p>

          {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
          {sent && <p className="text-green-600 text-sm mb-2">Check your email for a reset link.</p>}

          <form className="login-form" onSubmit={handleSubmit}>
            <label>
              Email
              <input type="email" name="email" placeholder="you@email.com" required />
            </label>
            <button className="btn btn-solid" type="submit" disabled={loading || sent}>
              {sent ? "Sent!" : loading ? "Sending..." : "Send Reset Link"}
            </button>
          </form>

          <p className="signup-note">
            <Link href="/login">Back to log in</Link>
          </p>
        </section>
      </main>
    </div>
  );
}
