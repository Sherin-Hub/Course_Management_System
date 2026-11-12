import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function initialsOf(name = "") {
  return name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join("");
}

const NAV_ITEMS = [
  { to: "/admin", end: true, label: "🛡️ Student Management" },
  { to: "/admin/courses", label: "🛠️ Manage Courses" },
];

// Sidebar + page frame shared by every admin page (/admin and /admin/courses).
export default function AdminShell({ children }) {
  const { user, logout } = useAuth();

  return (
    <div className="dash-shell">
      <aside className="dash-sidebar">
        <div className="dash-user">
          <div className="dash-avatar">{initialsOf(user?.name)}</div>
          <div>
            <div className="dash-user-name">{user?.name}</div>
            <div className="dash-user-role">Administrator</div>
          </div>
        </div>
        <nav className="dash-nav">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => (isActive ? "active" : undefined)}
            >
              <span>{item.label}</span>
            </NavLink>
          ))}
          <button type="button" className="logout-link" onClick={logout}>↩ Log out</button>
        </nav>
      </aside>

      <main className="dash-main">{children}</main>
    </div>
  );
}
