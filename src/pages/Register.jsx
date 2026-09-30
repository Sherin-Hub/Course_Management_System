import { Link } from "react-router-dom";
import LegacyBridge from "../components/LegacyBridge";

export default function Register() {
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
            <h2>Join thousands of learners</h2>
            <p>Create your free account today and start exploring courses designed to advance your career and skills.</p>
            <ul className="perks">
              <li><span className="tick">✓</span> Access 350+ expert-led courses</li>
              <li><span className="tick">✓</span> Learn at your own pace, anytime</li>
              <li><span className="tick">✓</span> Earn verified certificates</li>
              <li><span className="tick">✓</span> Track your progress with dashboards</li>
              <li><span className="tick">✓</span> Free registration, no credit card</li>
            </ul>
          </div>

          {/* Right panel */}
          <div className="auth-right">
            <div className="eyebrow">New account</div>
            <h1>Create your account</h1>
            <p className="sub-text">Already have an account? <Link to="/login.html">Sign in instead</Link></p>

            {/* Role selector */}
            <div className="role-tabs">
              <button className="role-tab active" type="button" data-role="student">🎓 Student</button>
              <button className="role-tab" type="button" data-role="admin">🛡️ Admin</button>
            </div>
            <input type="hidden" id="roleInput" defaultValue="student" />

            <form id="registerForm" noValidate>

              <div className="field-row">
                <div className="field">
                  <label htmlFor="regName">Full name</label>
                  <input id="regName" type="text" placeholder="e.g. Aditi Sharma" autoComplete="name" />
                  <span className="err-msg"></span>
                </div>
                <div className="field">
                  <label htmlFor="regPhone">Mobile number</label>
                  <input id="regPhone" type="tel" placeholder="10-digit number" autoComplete="tel" />
                  <span className="err-msg"></span>
                </div>
              </div>

              <div className="field">
                <label htmlFor="regEmail">Email address</label>
                <input id="regEmail" type="email" placeholder="you@example.com" autoComplete="email" />
                <span className="err-msg"></span>
              </div>

              <div className="field">
                <label htmlFor="regPassword">Password</label>
                <div className="input-wrap">
                  <input id="regPassword" type="password" placeholder="Min. 8 characters" autoComplete="new-password" />
                  <button type="button" className="toggle-pw" aria-label="Show password">👁</button>
                </div>
                <div className="pw-strength">
                  <div className="pw-strength-bar"><div className="pw-strength-fill" id="strengthFill"></div></div>
                  <span className="pw-strength-label" id="strengthLabel"></span>
                </div>
                <span className="err-msg"></span>
              </div>

              <div className="field">
                <label htmlFor="regConfirm">Confirm password</label>
                <div className="input-wrap">
                  <input id="regConfirm" type="password" placeholder="Re-enter password" autoComplete="new-password" />
                  <button type="button" className="toggle-pw" aria-label="Show password">👁</button>
                </div>
                <span className="err-msg"></span>
              </div>

              <button type="submit" className="form-btn">Create account →</button>
            </form>

            <div className="form-footer">
              By registering you agree to our <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.
            </div>
          </div>

        </div>
      </div>

      <LegacyBridge />
    </>
  );
}
