import { Link } from "react-router-dom";
import LegacyBridge from "../components/LegacyBridge";

export default function Dashboard() {
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
          <li><Link to="/dashboard.html" className="nav-btn nav-primary">Dashboard</Link></li>
        </ul>
      </nav>

      <div className="dash-shell" id="dashShell">

        {/* Sidebar */}
        <aside className="dash-sidebar">
          <div className="dash-user">
            <div className="dash-avatar" id="dashAvatar">--</div>
            <div>
              <div className="dash-user-name" id="dashUserName">Loading…</div>
              <div className="dash-user-role" id="dashUserRole">student</div>
            </div>
          </div>
          <nav className="dash-nav">
            <Link to="/dashboard.html" className="active">🏠 Overview</Link>
            <a href="#" onClick={(e) => e.preventDefault()}>📚 My Courses</a>
            <a href="#" onClick={(e) => e.preventDefault()}>📜 Certificates</a>
            <a href="#" onClick={(e) => e.preventDefault()}>🔔 Notifications</a>
            <a href="#" onClick={(e) => e.preventDefault()}>⚙️ Settings</a>
            {/* Plain <a>, not <Link> — script.js attaches its own click
                handler to #logoutLink (clears the session, then navigates).
                Using React Router's Link here would fight that handler. */}
            <a href="login.html" id="logoutLink" className="logout-link">↩ Log out</a>
          </nav>
        </aside>

        {/* Main */}
        <main className="dash-main">
          <div className="dash-header">
            <div>
              <h1 id="dashGreeting">Welcome back 👋</h1>
              <p>Here's what's happening with your learning today.</p>
            </div>
          </div>

          <div className="dash-stats">
            <div className="dash-stat-card">
              <div className="dsc-icon">📚</div>
              <div className="dsc-num" id="statCourses">0</div>
              <div className="dsc-lbl">Enrolled courses</div>
            </div>
            <div className="dash-stat-card">
              <div className="dsc-icon">✅</div>
              <div className="dsc-num" id="statCompleted">0</div>
              <div className="dsc-lbl">Completed</div>
            </div>
            <div className="dash-stat-card">
              <div className="dsc-icon">📈</div>
              <div className="dsc-num" id="statProgress">0%</div>
              <div className="dsc-lbl">Avg. progress</div>
            </div>
            <div className="dash-stat-card">
              <div className="dsc-icon">📜</div>
              <div className="dsc-num" id="statCerts">0</div>
              <div className="dsc-lbl">Certificates</div>
            </div>
          </div>

          <div className="dash-block">
            <div className="dash-block-head">
              <h2>Continue learning</h2>
              <a href="#" onClick={(e) => e.preventDefault()}>View all courses</a>
            </div>
            <div className="course-list" id="courseList"></div>
          </div>

          <div className="dash-block">
            <div className="dash-block-head">
              <h2>Recent activity</h2>
            </div>
            <div id="activityList"></div>
          </div>
        </main>

      </div>

      <LegacyBridge />
    </>
  );
}
