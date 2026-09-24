import { Link } from "react-router-dom";
import LegacyBridge from "../components/LegacyBridge";

export default function ResetPassword() {
  return (
    <>
      <style>{`
        .auth-wrap.narrow {
          max-width: 500px;
          grid-template-columns: 1fr;
        }
        .auth-wrap.narrow .auth-left { display: none; }
        .auth-wrap.narrow .auth-right { padding: 48px 44px; }
      `}</style>

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
        <div className="auth-wrap narrow">
          <div className="auth-right">

            <div className="auth-icon-top" style={{ margin: "0 auto 18px" }}>🔑</div>
            <div className="eyebrow" style={{ textAlign: "center" }}>Reset password</div>
            <h1 style={{ textAlign: "center" }}>Set a new password</h1>
            <p className="sub-text" style={{ textAlign: "center", marginBottom: 4 }}>
              Enter the 6-digit code we sent to your email, then choose a new password.
            </p>

            <p style={{ textAlign: "center", fontSize: 12.5, color: "#2563eb", fontWeight: 600, marginBottom: 4 }}>
              Demo OTP: <strong>123456</strong>
            </p>

            {/* OTP boxes */}
            <div className="otp-row">
              <input className="otp-box" type="text" maxLength={1} inputMode="numeric" pattern="[0-9]" />
              <input className="otp-box" type="text" maxLength={1} inputMode="numeric" pattern="[0-9]" />
              <input className="otp-box" type="text" maxLength={1} inputMode="numeric" pattern="[0-9]" />
              <input className="otp-box" type="text" maxLength={1} inputMode="numeric" pattern="[0-9]" />
              <input className="otp-box" type="text" maxLength={1} inputMode="numeric" pattern="[0-9]" />
              <input className="otp-box" type="text" maxLength={1} inputMode="numeric" pattern="[0-9]" />
            </div>
            <span className="err-msg" id="otpError" style={{ textAlign: "center", display: "block", marginTop: -8, marginBottom: 12 }}></span>

            <form id="resetForm" noValidate>

              <div className="field">
                <label htmlFor="newPassword">New password</label>
                <div className="input-wrap">
                  <input id="newPassword" type="password" placeholder="Min. 8 characters" autoComplete="new-password" />
                  <button type="button" className="toggle-pw" aria-label="Show password">👁</button>
                </div>
                <div className="pw-strength">
                  <div className="pw-strength-bar"><div className="pw-strength-fill" id="strengthFill"></div></div>
                  <span className="pw-strength-label" id="strengthLabel"></span>
                </div>
                <span className="err-msg"></span>
              </div>

              <div className="field">
                <label htmlFor="confirmNewPassword">Confirm new password</label>
                <div className="input-wrap">
                  <input id="confirmNewPassword" type="password" placeholder="Re-enter new password" autoComplete="new-password" />
                  <button type="button" className="toggle-pw" aria-label="Show password">👁</button>
                </div>
                <span className="err-msg"></span>
              </div>

              <button type="submit" className="form-btn">Reset password →</button>
            </form>

            <div className="form-footer" style={{ marginTop: 20 }}>
              Didn't receive the code? <Link to="/forgot-password.html">Resend code</Link>
              &nbsp;|&nbsp; <Link to="/login.html">Back to login</Link>
            </div>

          </div>
        </div>
      </div>

      <LegacyBridge />
    </>
  );
}
