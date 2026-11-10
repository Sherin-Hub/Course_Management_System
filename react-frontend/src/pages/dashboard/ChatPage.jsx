import Chat from "../../components/Chat";

// Chat needs a JWT (the socket authenticates with it). Accounts that only
// exist in the legacy mock API have no token, so they get a short explanation.
export default function ChatPage() {
  const hasToken = Boolean(sessionStorage.getItem("token"));

  return (
    <>
      <div className="dash-header">
        <div>
          <h1>Chat</h1>
          <p>Message another student in real time.</p>
        </div>
      </div>

      <div className="dash-block">
        {hasToken ? (
          <Chat />
        ) : (
          <p className="empty-hint">
            Please log in with your student account to use chat.
          </p>
        )}
      </div>
    </>
  );
}
