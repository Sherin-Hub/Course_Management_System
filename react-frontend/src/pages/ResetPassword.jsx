import { useRef, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useToast } from "../context/ToastContext";
import { passwordStrength } from "../lib/validate";
import { resetPassword } from "../lib/storage";

const DEMO_OTP = "123456";

export default function ResetPassword() {
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const email = location.state?.email;
  const [otp, setOtp] = useState(Array(6).fill(""));
  const [otpError, setOtpError] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const boxRefs = useRef([]);
  const strength = passwordStrength(newPw);

  if (!email) return <Navigate to="/forgot-password" replace />;

  function handleOtpChange(i, value) {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[i] = digit;
    setOtp(next);
    if (digit && i < 5) boxRefs.current[i + 1]?.focus();
  }

  function handleOtpKeyDown(i, e) {
    if (e.key === "Backspace" && !otp[i] && i > 0) boxRefs.current[i - 1]?.focus();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const code = otp.join("");
    if (code.length < 6) return setOtpError("Enter the full 6-digit code.");
    if (code !== DEMO_OTP) return setOtpError("Incorrect code. Try 123456 for this demo.");
    setOtpError("");
    if (newPw.length < 8) return setError("Password must be at least 8 characters.");
    if (newPw !== confirmPw) return setError("Passwords don't match.");
    setError("");

    try {
      setLoading(true);
      const updated = await resetPassword(email, newPw);
      if (!updated) return setError("Account was not found.");
      showToast("Password reset — you can sign in now.", "success");
      navigate("/login");
    } catch {
      setError("Could not reset the password. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Navbar />
      <div className="auth-page">
        <div className="auth-wrap narrow">
          <div className="auth-right">
            <div className="auth-icon-top" style={{ margin: "0 auto 18px" }}>🔑</div>
            <div className="eyebrow" style={{ textAlign: "center" }}>Reset password</div>
            <h1 style={{ textAlign: "center" }}>Set a new password</h1>
            <p className="sub-text" style={{ textAlign: "center", marginBottom: 4 }}>
              Enter the 6-digit code we sent to <strong>{email}</strong>, then choose a new password.
            </p>
            <p style={{ textAlign: "center", fontSize: 12.5, color: "#2563eb", fontWeight: 600, marginBottom: 4 }}>
              Demo OTP: <strong>123456</strong>
            </p>
            <div className="otp-row">
              {otp.map((digit, i) => (
                <input key={i} ref={(el) => (boxRefs.current[i] = el)} className="otp-box" type="text" maxLength={1}
                  inputMode="numeric" pattern="[0-9]" value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)} />
              ))}
            </div>
            {otpError && <span className="err-msg visible" style={{ textAlign: "center", display: "block", marginBottom: 12 }}>{otpError}</span>}
            <form onSubmit={handleSubmit} noValidate>
              <div className="field">
                <label htmlFor="newPassword">New password</label>
                <input id="newPassword" type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="Min. 8 characters" autoComplete="new-password" />
                <div className="pw-strength"><div className="pw-strength-bar"><div className="pw-strength-fill" style={{ width: `${strength.pct}%`, background: strength.color }} /></div><span className="pw-strength-label">{strength.label}</span></div>
              </div>
              <div className="field">
                <label htmlFor="confirmNewPassword">Confirm new password</label>
                <input id="confirmNewPassword" type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} placeholder="Re-enter new password" autoComplete="new-password" />
              </div>
              {error && <p className="err-msg visible" style={{ marginBottom: 12 }}>{error}</p>}
              <button type="submit" className="form-btn" disabled={loading}>{loading ? "Resetting..." : "Reset password →"}</button>
            </form>
            <div className="form-footer" style={{ marginTop: 20 }}>
              Didn't receive the code? <Link to="/forgot-password">Resend code</Link>&nbsp;|&nbsp; <Link to="/login">Back to login</Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
