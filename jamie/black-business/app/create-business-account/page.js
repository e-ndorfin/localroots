"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export default function CreateBusinessAccountPage() {
  const router = useRouter();

  function handleSubmit(event) {
    event.preventDefault();
    window.localStorage.setItem("bb-role", "business");
    router.push("/directory");
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

          <form className="login-form" noValidate onSubmit={handleSubmit}>
            <label>
              Business name
              <input type="text" placeholder="Your business name" />
            </label>
            <label>
              Owner full name
              <input type="text" placeholder="Owner full name" />
            </label>
            <label>
              Business email
              <input type="email" placeholder="business@email.com" />
            </label>
            <label>
              Password
              <input type="password" placeholder="Create a password" />
            </label>
            <button className="btn btn-solid" type="submit">Create Business Account</button>
          </form>

          <p className="signup-note">
            Need a customer account? <Link href="/create-account">Create customer account</Link>
          </p>
        </section>
      </main>
    </div>
  );
}
