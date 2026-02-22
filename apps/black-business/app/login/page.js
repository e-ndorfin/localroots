import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="login-page">
      <div className="bg-orb orb-a"></div>
      <div className="bg-orb orb-b"></div>

      <main className="login-wrap">
        <section className="login-card">
          <Link className="app-name login-brand" href="/directory">LocalRoots</Link>
          <h1>Welcome back</h1>
          <p className="muted">Log in to continue supporting and discovering local businesses.</p>

          <form className="login-form">
            <label>
              Email
              <input type="email" placeholder="you@email.com" required />
            </label>
            <label>
              Password
              <input type="password" placeholder="Enter your password" required />
            </label>
            <div className="login-row">
              <label className="remember-me">
                <input type="checkbox" /> Remember me
              </label>
              <Link href="/forgot-password">Forgot password?</Link>
            </div>
            <button className="btn btn-solid" type="submit">Log In</button>
          </form>

          <p className="signup-note">
            New here? <Link href="/choose-account">Create an account</Link>
          </p>
        </section>
      </main>
    </div>
  );
}
