import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { isEmail, isPhone, passwordStrength } from "../lib/validate";

export default function Register() {
  const { register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [role, setRole] = useState("student");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState({});

  const strength = passwordStrength(password);

  async function handleSubmit(e) {
    e.preventDefault();
    const next = {};
    if (!name.trim()) next.name = "Full name is required.";
    if (!isPhone(phone)) next.phone = "Enter a valid 10-digit number.";
    if (!isEmail(email)) next.email = "Enter a valid email address.";
    if (password.length < 8) next.password = "Password must be at least 8 characters.";
    if (confirm !== password) next.confirm = "Passwords don't match.";
    setErrors(next);
    if (Object.keys(next).length) return;

    try {
      const account = await register({ name: name.trim(), phone: phone.trim(), email: email.trim(), password, role });
      showToast("Account created — welcome to LMS Portal!", "success");
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

          <div className="auth-right">
            <div className="eyebrow">New account</div>
            <h1>Create your account</h1>
            <p className="sub-text">Already have an account? <Link to="/login">Sign in instead</Link></p>

            <div className="role-tabs">
              <button type="button" className={`role-tab${role === "student" ? " active" : ""}`} onClick={() => setRole("student")}>🎓 Student</button>
              <button type="button" className={`role-tab${role === "admin" ? " active" : ""}`} onClick={() => setRole("admin")}>🛡️ Admin</button>
            </div>

            <form onSubmit={handleSubmit} noValidate>
              <div className="field-row">
                <div className="field">
                  <label htmlFor="regName">Full name</label>
                  <input id="regName" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Aditi Sharma" autoComplete="name" />
                  {errors.name && <span className="err-msg visible">{errors.name}</span>}
                </div>
                <div className="field">
                  <label htmlFor="regPhone">Mobile number</label>
                  <input id="regPhone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="10-digit number" autoComplete="tel" />
                  {errors.phone && <span className="err-msg visible">{errors.phone}</span>}
                </div>
              </div>

              <div className="field">
                <label htmlFor="regEmail">Email address</label>
                <input id="regEmail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" />
                {errors.email && <span className="err-msg visible">{errors.email}</span>}
              </div>

              <div className="field">
                <label htmlFor="regPassword">Password</label>
                <div className="input-wrap">
                  <input id="regPassword" type={showPw ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min. 8 characters" autoComplete="new-password" />
                  <button type="button" className="toggle-pw" aria-label="Show password" onClick={() => setShowPw((s) => !s)}>👁</button>
                </div>
                <div className="pw-strength">
                  <div className="pw-strength-bar">
                    <div className="pw-strength-fill" style={{ width: `${strength.pct}%`, background: strength.color }} />
                  </div>
                  <span className="pw-strength-label">{strength.label}</span>
                </div>
                {errors.password && <span className="err-msg visible">{errors.password}</span>}
              </div>

              <div className="field">
                <label htmlFor="regConfirm">Confirm password</label>
                <div className="input-wrap">
                  <input id="regConfirm" type={showConfirm ? "text" : "password"} value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Re-enter password" autoComplete="new-password" />
                  <button type="button" className="toggle-pw" aria-label="Show password" onClick={() => setShowConfirm((s) => !s)}>👁</button>
                </div>
                {errors.confirm && <span className="err-msg visible">{errors.confirm}</span>}
              </div>

              {errors.form && <p className="err-msg visible" style={{ marginBottom: 12 }}>{errors.form}</p>}

              <button type="submit" className="form-btn">Create account →</button>
            </form>

            <div className="form-footer">
              By registering you agree to our <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
