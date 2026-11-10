import { useEffect, useRef, useState } from "react";
import apiClient from "../api/apiClient";
import { createSocket } from "../api/socketClient";
import { useAuth } from "../context/AuthContext";

const OBJECT_ID = /^[0-9a-fA-F]{24}$/;

function Chat() {
  const { user } = useAuth();
  const myId = user?.id;

  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [recipientId, setRecipientId] = useState("");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  // The conversation currently on screen (the other person's user id).
  // A ref is used so the long-lived socket listener always sees the latest value.
  const activeIdRef = useRef("");
  const [activeId, setActiveId] = useState("");

  function setActive(id) {
    activeIdRef.current = id;
    setActiveId(id);
  }

  useEffect(() => {
    const client = createSocket();

    client.on("connect", () => {
      setConnected(true);
      setError("");
    });

    client.on("disconnect", () => {
      setConnected(false);
    });

    client.on("connect_error", (err) => {
      setConnected(false);
      setError(err.message);
    });

    client.on("receive_message", (data) => {
      const otherId =
        data.sender === myId ? data.recipient : data.sender;

      // Nothing open yet: the first incoming message opens that conversation,
      // so you can reply straight away.
      if (!activeIdRef.current) {
        setActive(otherId);
        setRecipientId(otherId);
      } else if (otherId !== activeIdRef.current) {
        // Belongs to a different conversation (a notification still arrives).
        return;
      }

      setMessages((previous) =>
        previous.some((item) => item._id === data._id)
          ? previous
          : [...previous, data]
      );
    });

    client.connect();
    setSocket(client);

    return () => {
      client.disconnect();
    };
  }, [myId]);

  async function loadHistory(idOverride) {
    const id = (typeof idOverride === "string" ? idOverride : recipientId).trim();

    if (!OBJECT_ID.test(id)) {
      setError("Enter a valid recipient user ID (24 characters).");
      return false;
    }

    try {
      const response = await apiClient.get(`/messages/${id}`);

      setActive(id);
      setMessages(response.data.messages);
      setError("");
      return true;
    } catch (err) {
      setError("Unable to load message history");
      return false;
    }
  }

  async function sendMessage(event) {
    event.preventDefault();

    if (!socket || !connected) return;

    const id = recipientId.trim();

    if (!OBJECT_ID.test(id)) {
      setError("Enter a valid recipient user ID (24 characters).");
      return;
    }

    if (id === myId) {
      setError("You cannot send a message to yourself.");
      return;
    }

    // Switching to someone new: show that conversation (and reset the old one).
    if (activeIdRef.current !== id) {
      const ok = await loadHistory(id);
      if (!ok) return;
    }

    socket.emit(
      "send_message",
      {
        recipientId: id,
        text: message
      },
      (result) => {
        if (result.success) {
          setMessage("");
          setError("");
        } else {
          setError(result.message);
        }
      }
    );
  }

  async function copyMyId() {
    try {
      await navigator.clipboard.writeText(myId);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard not available: the id is still shown on screen */
    }
  }

  return (
    <section>
      <h2>Student Chat</h2>

      <p>
        Connection:{" "}
        <strong style={{ color: connected ? "var(--success)" : "var(--danger)" }}>
          {connected ? "Online" : "Offline"}
        </strong>
      </p>

      {myId && (
        <p className="chat-hint">
          Your user ID: <code>{myId}</code>{" "}
          <button type="button" className="link-btn" onClick={copyMyId}>
            {copied ? "Copied!" : "Copy"}
          </button>
          <br />
          Share it with a classmate so they can message you.
        </p>
      )}

      {error && <p role="alert" className="chat-error">{error}</p>}

      <form onSubmit={sendMessage} className="chat-form">
        <div className="chat-row">
          <input
            value={recipientId}
            onChange={(e) =>
              setRecipientId(e.target.value)
            }
            placeholder="Recipient MongoDB user ID"
            required
          />

          <button
            type="button"
            className="btn-outline chat-btn"
            onClick={() => loadHistory()}
          >
            Load Chat History
          </button>
        </div>

        <div className="chat-row">
          <input
            value={message}
            onChange={(e) =>
              setMessage(e.target.value)
            }
            placeholder="Type a message"
            maxLength={2000}
            required
          />

          <button
            type="submit"
            className="form-btn form-btn-inline chat-btn"
            disabled={!connected}
          >
            Send
          </button>
        </div>
      </form>

      <h3>Messages</h3>

      {activeId && (
        <p className="chat-hint">
          Conversation with <code>{activeId}</code>
        </p>
      )}

      <div className="chat-thread">
        {messages.length === 0 && (
          <p className="empty-hint">No messages to show yet.</p>
        )}

        {messages.map((item) => {
          const mine = item.sender === myId;

          return (
            <p key={item._id} className={mine ? "chat-msg mine" : "chat-msg"}>
              <strong>{mine ? "You" : `${item.sender.slice(-6)}`}:</strong>{" "}
              {item.text}
            </p>
          );
        })}
      </div>
    </section>
  );
}

export default Chat;
