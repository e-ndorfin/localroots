"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export default function CreateAccountPage() {
  const router = useRouter();

  function handleSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const name = form.querySelector('input[type="text"]')?.value || "";
    const email = form.querySelector('input[type="email"]')?.value || "";
    const pseudonym = email || name.toLowerCase().replace(/\s+/g, "-") || "customer-" + Date.now();
    window.localStorage.setItem("bb-role", "customer");
    window.localStorage.setItem("bb-pseudonym", pseudonym);
    router.push("/directory");
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

          <form className="login-form" noValidate onSubmit={handleSubmit}>
            <label>
              Full name
              <input type="text" placeholder="Your full name" />
            </label>
            <label>
              Email
              <input type="email" placeholder="you@email.com" />
            </label>
            <label>
              Password
              <input type="password" placeholder="Create a password" />
            </label>
            <button className="btn btn-solid" type="submit">Create Account</button>
          </form>

          <p className="signup-note">
            Already have an account? <Link href="/login">Log in</Link>
          </p>
        </section>
      </main>
    </div>
  );
}
