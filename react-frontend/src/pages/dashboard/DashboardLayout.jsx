import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { getNotifications } from "../../lib/storage";

const NAV_ITEMS = [
  { to: "/dashboard", end: true, icon: "🏠", label: "Overview" },
  { to: "/dashboard/courses", icon: "📚", label: "My Courses" },
  { to: "/dashboard/certificates", icon: "📜", label: "Certificates" },
  { to: "/dashboard/notifications", icon: "🔔", label: "Notifications" },
  { to: "/dashboard/settings", icon: "⚙️", label: "Settings" },
];

function initialsOf(name) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join("");
}

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    let active = true;
    if (!user) return undefined;
    getNotifications(user.email)
      .then((items) => {
        if (active) setUnread(items.filter((n) => !n.read).length);
      })
      .catch(() => {});
    return () => { active = false; };
  }, [user]);

  function handleLogout() {
    logout();
    showToast("Logged out. See you soon!", "info");
    navigate("/login");
  }

  return (
    <div className="dash-shell">
      <aside className="dash-sidebar">
        <div className="dash-user">
          <div className="dash-avatar">{user ? initialsOf(user.name) : "--"}</div>
          <div>
            <div className="dash-user-name">{user?.name}</div>
            <div className="dash-user-role">{user?.role}</div>
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
              <span>{item.icon} {item.label}</span>
              {item.label === "Notifications" && unread > 0 && (
                <span className="nav-badge">{unread}</span>
              )}
            </NavLink>
          ))}
          <button type="button" className="logout-link" onClick={handleLogout}>
            ↩ Log out
          </button>
        </nav>
      </aside>

      <main className="dash-main">
        <Outlet />
      </main>
    </div>
  );
}
