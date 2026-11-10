import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { getNotifications } from "../../lib/storage";
import apiClient from "../../api/apiClient";
import { createSocket } from "../../api/socketClient";
import { NOTIFICATIONS_CHANGED } from "../../components/Notifications";

const NAV_ITEMS = [
  { to: "/dashboard", end: true, icon: "🏠", label: "Overview" },
  { to: "/dashboard/courses", icon: "📚", label: "My Courses" },
  { to: "/dashboard/manage-courses", icon: "🛠️", label: "Manage Courses", adminOnly: true },
  { to: "/dashboard/certificates", icon: "📜", label: "Certificates" },
  { to: "/dashboard/chat", icon: "💬", label: "Chat" },
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
  const [liveUnread, setLiveUnread] = useState(0);

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

  // Real-time notifications (Task 13): only accounts that have a JWT.
  // This socket stays connected on every dashboard page, so a new message
  // updates the badge and shows a toast no matter which page is open.
  const isApiUser = user?.authSource === "api";
  useEffect(() => {
    if (!isApiUser) return undefined;
    let active = true;

    async function refreshUnread() {
      try {
        const response = await apiClient.get("/notifications");
        if (active) {
          setLiveUnread(response.data.notifications.filter((n) => !n.isRead).length);
        }
      } catch {
        /* the badge is optional; ignore */
      }
    }

    refreshUnread();

    const socket = createSocket();
    socket.on("new_notification", (notification) => {
      if (!active) return;
      setLiveUnread((count) => count + 1);
      showToast(notification.message, "info");
    });
    socket.connect();
    window.addEventListener(NOTIFICATIONS_CHANGED, refreshUnread);

    return () => {
      active = false;
      window.removeEventListener(NOTIFICATIONS_CHANGED, refreshUnread);
      socket.disconnect();
    };
  }, [isApiUser, user?.id, showToast]);

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
          {NAV_ITEMS.filter((item) => !item.adminOnly || user?.role === "admin").map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => (isActive ? "active" : undefined)}
            >
              <span>{item.icon} {item.label}</span>
              {item.label === "Notifications" && unread + liveUnread > 0 && (
                <span className="nav-badge">{unread + liveUnread}</span>
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
