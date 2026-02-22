import Link from "next/link";

export default function ChooseAccountPage() {
  return (
    <div className="login-page">
      <div className="bg-orb orb-a"></div>
      <div className="bg-orb orb-b"></div>

      <main className="login-wrap">
        <section className="login-card">
          <Link className="app-name login-brand" href="/directory">LocalRoots</Link>
          <h1>Choose account type</h1>
          <p className="muted">Select how you want to join the platform.</p>

          <div className="account-type-grid">
            <Link className="account-type-card" href="/create-customer-account">
              <span className="account-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21a8 8 0 0 0-16 0"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </span>
              <h2>Customer Account</h2>
              <p>Browse shops, place orders, chat with businesses, and contribute to the community fund.</p>
            </Link>

            <Link className="account-type-card" href="/create-business-account">
              <span className="account-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2"></rect>
                  <path d="M9 21V9h6v12"></path>
                  <path d="M9 13h6"></path>
                  <path d="M7 7h.01M17 7h.01"></path>
                </svg>
              </span>
              <h2>Business Account</h2>
              <p>Create a verified business profile, receive orders, and apply for community-backed microloans.</p>
            </Link>
          </div>

          <p className="signup-note">
            <Link href="/login">Back to log in</Link>
          </p>
        </section>
      </main>
    </div>
  );
}
