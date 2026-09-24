import { Link } from "react-router-dom";
import LegacyBridge from "../components/LegacyBridge";

export default function Login() {
  return (
    <>
      {/* Navigation */}
      <nav>
        <div className="nav-brand">
          <div className="brand-dot">L</div>
          LMS Portal
        </div>
        <ul className="nav-links">
          <li><Link to="/index.html">Home</Link></li>
          <li><Link to="/register.html">Register</Link></li>
          <li><Link to="/login.html" className="nav-btn">Login</Link></li>
        </ul>
      </nav>

      {/* Auth page */}
      <div className="auth-page">
        <div className="auth-wrap">

          {/* Left panel */}
          <div className="auth-left">
            <div className="auth-logo">L</div>
            <h2>Welcome back to LMS Portal</h2>
            <p>Sign in to continue your learning, check your progress, and access all your enrolled courses.</p>
            <ul className="perks">
              <li><span className="tick">✓</span> Pick up right where you left off</li>
              <li><span className="tick">✓</span> View your enrolled courses</li>
              <li><span className="tick">✓</span> Track completion progress</li>
              <li><span className="tick">✓</span> Download your certificates</li>
              <li><span className="tick">✓</span> Get latest notifications</li>
            </ul>
          </div>

          {/* Right panel */}
          <div className="auth-right">
            <div className="eyebrow">Sign in</div>
            <h1>Welcome back</h1>
            <p className="sub-text">Don't have an account? <Link to="/register.html">Register for free</Link></p>

            <form id="loginForm" noValidate>

              <div className="field">
                <label htmlFor="loginEmail">Email address</label>
                <input id="loginEmail" type="email" placeholder="you@example.com" autoComplete="email" />
                <span className="err-msg"></span>
              </div>

              <div className="field">
                <label htmlFor="loginPassword">
                  Password
                  <Link to="/forgot-password.html" style={{ float: "right", fontWeight: 600, color: "#2563eb", fontSize: 12 }}>Forgot password?</Link>
                </label>
                <div className="input-wrap">
                  <input id="loginPassword" type="password" placeholder="Your password" autoComplete="current-password" />
                  <button type="button" className="toggle-pw" aria-label="Show password">👁</button>
                </div>
                <span className="err-msg"></span>
              </div>

              <div className="field" style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <input id="rememberMe" type="checkbox" style={{ width: "auto" }} />
                <label htmlFor="rememberMe" style={{ margin: 0, fontSize: 13.5, color: "#64748b", cursor: "pointer" }}>Remember me on this device</label>
              </div>

              <button type="submit" className="form-btn">Sign in →</button>
            </form>

            <div className="form-footer" style={{ marginTop: 24 }}>
              New to LMS? <Link to="/register.html">Create a free account</Link>
            </div>

            {/* Demo hint */}
            <div style={{ marginTop: 18, padding: "12px 14px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 9, fontSize: 12.5, color: "#64748b" }}>
              <strong style={{ color: "#1a2e5a" }}>💡 Demo hint:</strong> Register an account first, then sign in. The demo stores accounts in your browser.
            </div>
          </div>

        </div>
      </div>

      <LegacyBridge />
    </>
  );
}
