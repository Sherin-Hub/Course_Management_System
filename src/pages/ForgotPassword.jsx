import { Link } from "react-router-dom";
import LegacyBridge from "../components/LegacyBridge";

export default function ForgotPassword() {
  return (
    <>
      <style>{`
        .auth-wrap.narrow {
          max-width: 480px;
          grid-template-columns: 1fr;
        }
        .auth-wrap.narrow .auth-left { display: none; }
        .auth-wrap.narrow .auth-right { padding: 52px 44px; }

        .steps-row {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 30px;
          justify-content: center;
        }
        .step-dot {
          width: 30px; height: 30px;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 12px; font-weight: 700;
          background: #e2e8f0;
          color: #64748b;
        }
        .step-dot.active { background: #2563eb; color: #fff; }
        .step-dot.done   { background: #16a34a; color: #fff; }
        .step-line { flex: 1; height: 2px; background: #e2e8f0; }
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
          <div className="auth-right auth-center">

            {/* Steps indicator */}
            <div className="steps-row">
              <div className="step-dot active" id="step1dot">1</div>
              <div className="step-line"></div>
              <div className="step-dot" id="step2dot">2</div>
            </div>

            <div className="auth-icon-top">🔒</div>
            <div className="eyebrow">Account recovery</div>
            <h1>Forgot your password?</h1>
            <p className="sub-text" style={{ maxWidth: 340, margin: "0 auto 28px" }}>
              Enter the email address you registered with. We'll send a reset code to that address.
            </p>

            <form id="forgotForm" noValidate style={{ textAlign: "left" }}>
              <div className="field">
                <label htmlFor="forgotEmail">Registered email address</label>
                <input id="forgotEmail" type="email" placeholder="you@example.com" autoComplete="email" />
                <span className="err-msg"></span>
              </div>

              <button type="submit" className="form-btn">Send reset code →</button>
            </form>

            <div className="form-footer" style={{ marginTop: 20 }}>
              Remember your password? <Link to="/login.html">Back to login</Link>
            </div>

            <div style={{ marginTop: 18, padding: "12px 14px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 9, fontSize: 12.5, color: "#64748b", textAlign: "left" }}>
              <strong style={{ color: "#1a2e5a" }}>💡 Demo:</strong> Any registered email will advance you to the reset page. OTP is <strong>123456</strong>.
            </div>
          </div>
        </div>
      </div>

      <LegacyBridge />
    </>
  );
}
