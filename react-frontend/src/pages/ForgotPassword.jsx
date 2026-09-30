import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { isEmail } from "../lib/validate";
import { findStudentByEmail, findAdminByEmail } from "../lib/storage";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!isEmail(email)) return setError("Enter a valid email address.");

    try {
      setLoading(true);
      const [student, admin] = await Promise.all([
        findStudentByEmail(email),
        findAdminByEmail(email),
      ]);
      if (!student && !admin) return setError("No account found with that email.");
      setError("");
      navigate("/reset-password", { state: { email: email.trim().toLowerCase() } });
    } catch {
      setError("Unable to check the account. Please make sure the Mock API is running.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Navbar />
      <div className="auth-page">
        <div className="auth-wrap narrow">
          <div className="auth-right auth-center">
            <div className="steps-row">
              <div className="step-dot active">1</div><div className="step-line"></div><div className="step-dot">2</div>
            </div>
            <div className="auth-icon-top">🔒</div>
            <div className="eyebrow">Account recovery</div>
            <h1>Forgot your password?</h1>
            <p className="sub-text" style={{ maxWidth: 340, margin: "0 auto 28px" }}>
              Enter the email address you registered with. We'll send a reset code to that address.
            </p>
            <form onSubmit={handleSubmit} noValidate style={{ textAlign: "left" }}>
              <div className="field">
                <label htmlFor="forgotEmail">Registered email address</label>
                <input id="forgotEmail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" />
                {error && <span className="err-msg visible">{error}</span>}
              </div>
              <button type="submit" className="form-btn" disabled={loading}>
                {loading ? "Checking..." : "Send reset code →"}
              </button>
            </form>
            <div className="form-footer" style={{ marginTop: 20 }}>
              Remember your password? <Link to="/login">Back to login</Link>
            </div>
            <div style={{ marginTop: 18, padding: "12px 14px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 9, fontSize: 12.5, color: "#64748b", textAlign: "left" }}>
              <strong style={{ color: "#1a2e5a" }}>💡 Demo:</strong> Use OTP <strong>123456</strong> on the next page.
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
