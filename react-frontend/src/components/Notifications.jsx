import { useEffect, useState } from "react";
import apiClient from "../api/apiClient";
import { createSocket } from "../api/socketClient";

// Other parts of the app (e.g. the sidebar badge) listen for this event.
export const NOTIFICATIONS_CHANGED = "lms:notifications-changed";

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    apiClient.get("/notifications").then((response) => {
      if (active) {
        setNotifications(response.data.notifications);
      }
    }).catch((err) => {
      console.error(err);
      if (active) setError("Unable to load notifications");
    });

    const socket = createSocket();

    socket.on("new_notification", (notification) => {
      setNotifications((previous) => [
        notification,
        ...previous
      ]);
    });

    socket.connect();

    return () => {
      active = false;
      socket.disconnect();
    };
  }, []);

  async function markRead(id) {
    try {
      await apiClient.patch(
        `/notifications/${id}/read`
      );

      setNotifications((previous) =>
        previous.map((item) =>
          item._id === id
            ? { ...item, isRead: true }
            : item
        )
      );

      window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED));
    } catch (err) {
      setError("Could not mark the notification as read");
    }
  }

  return (
    <section>
      <h2>Notifications</h2>

      {error && <p role="alert" className="chat-error">{error}</p>}

      {notifications.length === 0 && (
        <p>No notifications yet.</p>
      )}

      {notifications.map((item) => (
        <div
          key={item._id}
          className={item.isRead ? "live-notif" : "live-notif unread"}
        >
          <p>{item.message}</p>

          {!item.isRead && (
            <button
              type="button"
              className="btn-outline chat-btn"
              onClick={() => markRead(item._id)}
            >
              Mark as Read
            </button>
          )}
        </div>
      ))}
    </section>
  );
}

export default Notifications;
