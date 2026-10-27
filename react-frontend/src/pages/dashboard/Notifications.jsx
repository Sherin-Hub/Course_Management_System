import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { getNotifications, markAllNotificationsRead, markNotificationRead } from "../../lib/storage";

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.max(0, Math.round(diff / 60000));
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

export default function Notifications() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      setLoading(true);
      setList(await getNotifications(user.email));
    } catch {
      showToast("Unable to load notifications.", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [user.email]);

  async function handleRead(id) {
    try {
      setList(await markNotificationRead(user.email, id));
    } catch {
      showToast("Could not update notification.", "error");
    }
  }

  async function handleReadAll() {
    try {
      setList(await markAllNotificationsRead(user.email));
    } catch {
      showToast("Could not update notifications.", "error");
    }
  }

  if (loading) return <div className="dash-loading">Loading notifications...</div>;

  const unreadCount = list.filter((n) => !n.read).length;

  return (
    <>
      <div className="dash-header">
        <div>
          <h1>Notifications</h1>
          <p>{unreadCount > 0 ? `${unreadCount} unread` : "You're all caught up"}</p>
        </div>
        {unreadCount > 0 && (
          <button className="form-btn form-btn-inline" onClick={handleReadAll}>
            Mark all as read
          </button>
        )}
      </div>

      <div className="dash-block">
        {list.length === 0 ? (
          <p className="empty-hint">No notifications yet.</p>
        ) : (
          <ul className="notif-list">
            {list.map((n) => (
              <li key={n.id} className={n.read ? "" : "unread"} onClick={() => handleRead(n.id)}>
                <span className="notif-dot" />
                <div className="notif-body">
                  <div className="notif-title">{n.title}</div>
                  <p>{n.body}</p>
                </div>
                <span className="notif-time">{timeAgo(n.time)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
