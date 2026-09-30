import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { isEmail } from "../lib/validate";

export default function Login() {
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState({});

  async function handleSubmit(e) {
    e.preventDefault();
    const next = {};
    if (!isEmail(email)) next.email = "Enter a valid email address.";
    if (!password) next.password = "Password is required.";
    setErrors(next);
    if (Object.keys(next).length) return;

    try {
      const account = await login(email, password);
      showToast("Welcome back!", "success");
      navigate(account.role === "admin" ? "/admin" : "/dashboard");
    } catch (err) {
      setErrors({ form: err.message });
    }
  }

  return (
    <>
      <Navbar />
      <div className="auth-page">
        <div className="auth-wrap">
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

          <div className="auth-right">
            <div className="eyebrow">Sign in</div>
            <h1>Welcome back</h1>
            <p className="sub-text">Don't have an account? <Link to="/register">Register for free</Link></p>

            <form onSubmit={handleSubmit} noValidate>
              <div className="field">
                <label htmlFor="loginEmail">Email address</label>
                <input id="loginEmail" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
                {errors.email && <span className="err-msg visible">{errors.email}</span>}
              </div>

              <div className="field">
                <label htmlFor="loginPassword">
                  Password
                  <Link to="/forgot-password" style={{ float: "right", fontWeight: 600, color: "#2563eb", fontSize: 12 }}>Forgot password?</Link>
                </label>
                <div className="input-wrap">
                  <input id="loginPassword" type={showPw ? "text" : "password"} placeholder="Your password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
                  <button type="button" className="toggle-pw" aria-label="Show password" onClick={() => setShowPw((s) => !s)}>👁</button>
                </div>
                {errors.password && <span className="err-msg visible">{errors.password}</span>}
              </div>

              {errors.form && <p className="err-msg visible" style={{ marginBottom: 12 }}>{errors.form}</p>}

              <button type="submit" className="form-btn">Sign in →</button>
            </form>

            <div className="form-footer" style={{ marginTop: 24 }}>
              New to LMS? <Link to="/register">Create a free account</Link>
            </div>

            <div style={{ marginTop: 18, padding: "12px 14px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 9, fontSize: 12.5, color: "#64748b" }}>
              <strong style={{ color: "#1a2e5a" }}>💡 Demo hint:</strong> Student: student@example.com / student123. Admin: admin@example.com / admin123.
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
