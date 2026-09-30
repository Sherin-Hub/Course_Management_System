import { Link } from "react-router-dom";
import LegacyBridge from "../components/LegacyBridge";

export default function Home() {
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

      {/* Hero */}
      <section className="hero">
        <div className="hero-inner">
          <div className="hero-tag">🎓 Trusted Learning Platform</div>
          <h1>Learn Smarter.<br /><span>Grow Faster.</span></h1>
          <p>
            Access hundreds of professional courses, earn certificates,
            and track your progress — all in one place.
            Start your learning journey today.
          </p>
          <div className="hero-buttons">
            <Link to="/register.html" className="btn-primary">Get started — it's free</Link>
            <Link to="/login.html" className="btn-outline">Sign in to continue</Link>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <div className="stats-bar">
        <div className="stat-item"><div className="num">12,000+</div><div className="lbl">Students enrolled</div></div>
        <div className="stat-item"><div className="num">350+</div><div className="lbl">Expert-led courses</div></div>
        <div className="stat-item"><div className="num">98%</div><div className="lbl">Satisfaction rate</div></div>
        <div className="stat-item"><div className="num">5,400+</div><div className="lbl">Certificates issued</div></div>
      </div>

      {/* Features */}
      <section className="section section-center">
        <div className="section-eyebrow">Why LMS?</div>
        <h2 className="section-title">Everything you need to learn</h2>
        <p className="section-sub">A complete platform built for students and educators — designed for real outcomes, not just content consumption.</p>

        <div className="feature-grid">
          <div className="feature-card">
            <div className="feature-icon">📚</div>
            <h3>Curated Courses</h3>
            <p>Hundreds of structured courses across technology, business, design, and more — created by industry experts.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🎥</div>
            <h3>HD Video Lessons</h3>
            <p>Stream crisp, chapter-wise video lectures on any device. Pause, rewind, and learn at your own pace.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📜</div>
            <h3>Verified Certificates</h3>
            <p>Complete a course and earn a shareable certificate that proves your skill to employers and clients.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📈</div>
            <h3>Progress Tracking</h3>
            <p>Visual dashboards show exactly where you are in each course and what to tackle next.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🔔</div>
            <h3>Smart Notifications</h3>
            <p>Get reminders for upcoming lessons, assignment deadlines, and announcements from instructors.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🛡️</div>
            <h3>Secure &amp; Reliable</h3>
            <p>Your data is protected. Our platform is always available so your learning never gets interrupted.</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <h2>Ready to start learning?</h2>
        <p>Join thousands of students already growing their skills on LMS Portal.</p>
        <Link to="/register.html" className="btn-primary">Create a free account</Link>
      </section>

      {/* Footer */}
      <footer>
        <p>
          © 2026 Learning Management System &nbsp;|&nbsp;{" "}
          <Link to="/login.html">Student Login</Link> &nbsp;|&nbsp;{" "}
          <Link to="/login.html">Admin Login</Link>
        </p>
      </footer>

      <LegacyBridge />
    </>
  );
}
