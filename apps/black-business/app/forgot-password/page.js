import Link from "next/link";

export default function ForgotPasswordPage() {
  return (
    <div className="login-page">
      <div className="bg-orb orb-a"></div>
      <div className="bg-orb orb-b"></div>

      <main className="login-wrap">
        <section className="login-card">
          <Link className="app-name login-brand" href="/directory">LocalRoots</Link>
          <h1>Reset password</h1>
          <p className="muted">Enter your account email and we will send a reset link.</p>

          <form className="login-form">
            <label>
              Email
              <input type="email" placeholder="you@email.com" required />
            </label>
            <button className="btn btn-solid" type="submit">Send Reset Link</button>
          </form>

          <p className="signup-note">
            <Link href="/login">Back to log in</Link>
          </p>
        </section>
      </main>
    </div>
  );
}
