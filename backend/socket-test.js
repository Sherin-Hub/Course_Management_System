// Task 13 automated check (Activity 13.11, steps 4-10) - no browser needed.
// Usage:
//   1. MongoDB running, `npm run seed` done, `npm start` running in another terminal
//   2. npm run test:socket
// Optional: API_URL=http://localhost:5000  (backend origin, without /api/v1)
require("dotenv").config();
const { io } = require("socket.io-client");
const jwt = require("jsonwebtoken");

const ORIGIN = process.env.API_URL || `http://localhost:${process.env.PORT || 5000}`;
const BASE = `${ORIGIN}/api/v1`;
const stamp = Date.now();
let passed = 0;
let failed = 0;

function check(name, actual, expected) {
  const ok = actual === expected;
  ok ? passed++ : failed++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}  (got ${actual}, expected ${expected})`);
}

async function call(method, path, body, token) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try { data = await res.json(); } catch { /* no body */ }
  return { status: res.status, data };
}

async function makeUser(label) {
  const email = `${label}${stamp}@example.com`;
  const password = "LearnSecure123";
  await call("POST", "/auth/register", {
    name: `Student ${label.toUpperCase()}`,
    email,
    password,
    department: "Computer Science",
  });
  const login = await call("POST", "/auth/login", { email, password });
  return { token: login.data.token, id: login.data.student.id, name: login.data.student.name };
}

function connect(token) {
  return new Promise((resolve) => {
    const socket = io(ORIGIN, { autoConnect: false, auth: token === undefined ? {} : { token }, reconnection: false });
    socket.on("connect", () => resolve({ socket, error: null }));
    socket.on("connect_error", (err) => { socket.close(); resolve({ socket: null, error: err.message }); });
    socket.connect();
  });
}

const send = (socket, payload) =>
  new Promise((resolve) => socket.emit("send_message", payload, resolve));

const once = (socket, event, ms = 3000) =>
  new Promise((resolve) => {
    const timer = setTimeout(() => resolve(null), ms);
    socket.once(event, (data) => { clearTimeout(timer); resolve(data); });
  });

(async () => {
  const A = await makeUser("a");
  const B = await makeUser("b");
  const C = await makeUser("c");

  console.log("--- Socket authentication (step 10) ---");
  let r = await connect(undefined);
  check("No token -> rejected", r.error, "Authentication required");

  r = await connect("not.a.real.token");
  check("Garbage token -> rejected", r.error, "Invalid authentication token");

  const expired = jwt.sign({ email: "x@example.com" }, process.env.JWT_SECRET, { subject: A.id, expiresIn: -10 });
  r = await connect(expired);
  check("Expired token -> rejected", r.error, "Invalid authentication token");

  const unknownUser = jwt.sign({ email: "x@example.com" }, process.env.JWT_SECRET, { subject: "64b7f0f0f0f0f0f0f0f0f0f0", expiresIn: "5m" });
  r = await connect(unknownUser);
  check("Valid token for a deleted/unknown user -> rejected", r.error, "User not found");

  const noneAlg = `${Buffer.from('{"alg":"none","typ":"JWT"}').toString("base64url")}.${Buffer.from(JSON.stringify({ sub: A.id })).toString("base64url")}.`;
  r = await connect(noneAlg);
  check('Unsigned ("alg":"none") token -> rejected', r.error, "Invalid authentication token");

  console.log("--- Real-time delivery (steps 5-8) ---");
  const a = await connect(A.token);
  const b = await connect(B.token);
  check("Student A connects with a valid token", a.error, null);
  check("Student B connects with a valid token", b.error, null);

  const bGotMessage = once(b.socket, "receive_message");
  const aGotEcho = once(a.socket, "receive_message");
  const bGotNotification = once(b.socket, "new_notification");
  const ack = await send(a.socket, { recipientId: B.id, text: "  Hello B, are you there?  " });
  check("send_message acknowledged with success", ack && ack.success, true);

  const msgB = await bGotMessage;
  check("Student B receives the message without refresh", msgB && msgB.text, "Hello B, are you there?");
  check("Message sender is A (taken from the token)", msgB && msgB.sender, A.id);
  check("Message recipient is B", msgB && msgB.recipient, B.id);
  const msgA = await aGotEcho;
  check("Sender A also receives the message (echo to own room)", msgA && msgA._id === (msgB && msgB._id), true);

  const note = await bGotNotification;
  check("Student B receives a live notification", note && note.message, `New message from ${A.name}`);
  check("Live notification starts unread", note && note.isRead, false);

  // The client cannot choose who the sender is.
  const spoofGot = once(b.socket, "receive_message");
  await send(a.socket, { recipientId: B.id, text: "spoof attempt", sender: C.id, senderId: C.id });
  const spoof = await spoofGot;
  check("Client-supplied sender is ignored", spoof && spoof.sender, A.id);

  console.log("--- Bad messages are refused ---");
  check("Invalid recipient id", (await send(a.socket, { recipientId: "nope", text: "hi" })).success, false);
  check("Unknown recipient", (await send(a.socket, { recipientId: "64b7f0f0f0f0f0f0f0f0f0f0", text: "hi" })).message, "Recipient not found");
  check("Empty text", (await send(a.socket, { recipientId: B.id, text: "   " })).success, false);
  check("Text over 2000 characters", (await send(a.socket, { recipientId: B.id, text: "x".repeat(2001) })).success, false);
  check("Non-string text", (await send(a.socket, { recipientId: B.id, text: { $gt: "" } })).success, false);
  check("No payload at all", (await send(a.socket, undefined)).success, false);
  check("Message to yourself", (await send(a.socket, { recipientId: A.id, text: "me" })).success, false);

  console.log("--- Message history (step 9) ---");
  r = await call("GET", `/messages/${B.id}`);
  check("History without token -> 401", r.status, 401);

  r = await call("GET", "/messages/not-an-id", null, A.token);
  check("History with invalid id -> 400", r.status, 400);

  r = await call("GET", `/messages/${B.id}`, null, A.token);
  check("A loads history with B -> 200", r.status, 200);
  check("History contains both saved messages", r.data.messages.length, 2);
  check("History is oldest-first", r.data.messages[0].text, "Hello B, are you there?");

  r = await call("GET", `/messages/${A.id}`, null, B.token);
  check("B sees the same conversation", r.data.messages.length, 2);

  r = await call("GET", `/messages/${A.id}`, null, C.token);
  check("Third user C cannot see A<->B messages", r.data.messages.length, 0);
  r = await call("GET", `/messages/${B.id}`, null, C.token);
  check("Third user C cannot see B<->A messages either", r.data.messages.length, 0);

  console.log("--- Notifications API (step 7) ---");
  r = await call("GET", "/notifications");
  check("Notifications without token -> 401", r.status, 401);

  r = await call("GET", "/notifications", null, B.token);
  check("B has stored notifications", r.data.notifications.length >= 2, true);
  const noteId = r.data.notifications[0]._id;
  check("Notification text names the sender", r.data.notifications[0].message, `New message from ${A.name}`);

  r = await call("GET", "/notifications", null, A.token);
  check("A has none (A only sent messages)", r.data.notifications.length, 0);

  r = await call("PATCH", `/notifications/${noteId}/read`, null, A.token);
  check("A cannot mark B's notification -> 404", r.status, 404);

  r = await call("PATCH", "/notifications/not-an-id/read", null, B.token);
  check("Invalid notification id -> 400", r.status, 400);

  r = await call("PATCH", `/notifications/${noteId}/read`, null, B.token);
  check("B marks own notification read -> 200", r.status, 200);
  check("Notification is now read", r.data.notification.isRead, true);

  console.log("--- Connection status (step 8) ---");
  const bDropped = once(b.socket, "disconnect");
  b.socket.disconnect();
  check("B's socket fires 'disconnect'", (await bDropped) !== null, true);
  check("B's socket reports disconnected", b.socket.connected, false);

  console.log("--- Message rate limit ---");
  const results = await Promise.all(
    Array.from({ length: 30 }, (_, i) => send(a.socket, { recipientId: B.id, text: `burst ${i}` }))
  );
  const blocked = results.filter((x) => !x.success && /too quickly/.test(x.message)).length;
  check("Burst of 30 messages is throttled", blocked > 0, true);

  a.socket.disconnect();
  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
})().catch((err) => {
  console.error("Test could not run. Is the backend running and seeded?", err.message);
  process.exit(1);
});
