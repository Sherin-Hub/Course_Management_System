// Task 14 automated check (Activity 14.11 test table).
// Usage:
//   1. MongoDB running, `npm run seed` done, `npm start` running in another terminal
//   2. npm run test:security
//
// The LAST section deliberately triggers the login rate limit (429). The counter
// lives in the server's memory, so afterwards RESTART THE BACKEND (or wait
// 15 minutes) before logging in again / re-running this test.
// Skip that section with:  SKIP_RATE_LIMIT_TEST=1 npm run test:security
require("dotenv").config();
const http = require("http");
const express = require("express");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const ORIGIN = process.env.API_URL || `http://localhost:${process.env.PORT || 5000}`;
const BASE = `${ORIGIN}/api/v1`;
const GOOD_ORIGIN = (process.env.CLIENT_URL || "http://localhost:5173").split(",")[0].trim();
const stamp = Date.now();
let passed = 0;
let failed = 0;

function check(name, actual, expected) {
  const ok = actual === expected;
  ok ? passed++ : failed++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}  (got ${actual}, expected ${expected})`);
}

async function call(method, path, body, token, extraHeaders = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...extraHeaders,
    },
    body: body === undefined ? undefined : typeof body === "string" ? body : JSON.stringify(body),
  });
  let data = null;
  try { data = await res.json(); } catch { /* no body */ }
  return { status: res.status, data, headers: res.headers };
}

async function makeUser(label) {
  const email = `${label}${stamp}@example.com`;
  const password = "LearnSecure123";
  await call("POST", "/auth/register", { name: `Student ${label}`, email, password, department: "CSE" });
  const login = await call("POST", "/auth/login", { email, password });
  return { email, password, token: login.data.token, id: login.data.student.id };
}

(async () => {
  const good = { name: "Test Student", email: `sec${stamp}@example.com`, password: "LearnSecure123", department: "CSE" };

  // Fail fast with a helpful message if an earlier run already tripped the limiter.
  const probe = await call("POST", "/auth/login", { email: "probe@example.com", password: "x" });
  if (probe.status === 429) {
    console.error("The login rate limit is still active from an earlier run. Restart the backend (or wait 15 minutes) and try again.");
    process.exit(1);
  }

  console.log("--- Registration validation ---");
  let r = await call("POST", "/auth/register", { ...good, email: "not-an-email" });
  check("Invalid registration email -> 400", r.status, 400);
  check("Validation error names the field", r.data && r.data.errors && r.data.errors[0].field, "email");

  r = await call("POST", "/auth/register", { name: "Only Name" });
  check("Missing required fields -> 400", r.status, 400);

  r = await call("POST", "/auth/register", { ...good, password: "Elevenchars" });
  check("11-character password -> 400 (minimum is 12)", r.status, 400);

  r = await call("POST", "/auth/register", { ...good, name: ["array", "not", "string"] });
  check("Wrong data type for name -> 400", r.status, 400);

  r = await call("POST", "/auth/register", '{"name": "broken json"');
  check("Malformed JSON body -> 400", r.status, 400);

  r = await call("POST", "/auth/register", { ...good, password: "Twelve-chars" });
  check("Exactly 12 characters -> 201", r.status, 201);

  r = await call("POST", "/auth/register", { ...good, password: "Twelve-chars" });
  check("Duplicate email -> 409", r.status, 409);

  r = await call("POST", "/auth/register", { ...good, email: `Dots.${stamp}@gmail.com`, password: "LearnSecure123" });
  check("Gmail address with dots registers", r.status, 201);
  r = await call("POST", "/auth/login", { email: `Dots.${stamp}@gmail.com`, password: "LearnSecure123" });
  check("...and can log in with the same address", r.status, 200);

  console.log("--- Authentication & authorization ---");
  r = await call("POST", "/auth/login", { email: good.email, password: "WrongPassword123" });
  check("Incorrect login password -> 401", r.status, 401);

  r = await call("POST", "/auth/login", { email: "not-an-email", password: "x" });
  check("Login with invalid email -> 400", r.status, 400);

  r = await call("GET", "/profile");
  check("Missing JWT -> 401", r.status, 401);

  const A = await makeUser("alice");
  const B = await makeUser("bob");
  const C = await makeUser("carol");

  const expired = jwt.sign({ email: A.email }, process.env.JWT_SECRET, { subject: A.id, expiresIn: -60 });
  r = await call("GET", "/profile", undefined, expired);
  check("Expired JWT -> 401", r.status, 401);

  const forged = jwt.sign({ email: A.email }, "some-other-secret", { subject: A.id, expiresIn: "1h" });
  r = await call("GET", "/profile", undefined, forged);
  check("JWT signed with the wrong secret -> 401", r.status, 401);

  r = await call("POST", "/courses", { title: "Hack", category: "Hack" }, A.token);
  check("Student accessing admin endpoint -> 403", r.status, 403);

  console.log("--- Validation of IDs, pagination and course fields ---");
  r = await call("GET", "/courses/not-an-id");
  check("Invalid MongoDB ID -> 400", r.status, 400);

  r = await call("GET", "/messages/not-an-id", undefined, A.token);
  check("Invalid ID in /messages -> 400", r.status, 400);

  r = await call("GET", "/courses?limit=1");
  check("GET /courses?limit=1 returns one course", r.data.length, 1);
  check("Total count is sent in X-Total-Count", Number(r.headers.get("x-total-count")) >= 6, true);
  r = await call("GET", "/courses?page=2&limit=2");
  check("GET /courses?page=2&limit=2 -> 200", r.status, 200);
  r = await call("GET", "/courses?limit=100000");
  check("Oversized limit is refused -> 400", r.status, 400);
  r = await call("GET", "/courses?page=abc");
  check("Non-numeric page is refused -> 400", r.status, 400);
  r = await call("GET", "/courses");
  check("Default page size keeps the response small (<=20)", r.data.length <= 20, true);

  console.log("--- Ownership: users cannot touch each other's data ---");
  r = await call("PUT", "/profile", { name: "Alice Renamed", _id: B.id, id: B.id, email: B.email, role: "admin" }, A.token);
  check("Alice updates her own profile -> 200", r.status, 200);
  check("Alice's role is unchanged", r.data.user.role, "student");
  r = await call("GET", "/profile", undefined, B.token);
  check("Bob's profile was NOT changed by Alice", r.data.user.name, "Student bob");
  check("Bob's email was NOT changed by Alice", r.data.user.email, B.email);

  r = await call("PUT", `/profile/${B.id}`, { name: "Hacked" }, A.token);
  check("There is no route to edit another student's profile -> 404", r.status, 404);

  await mongoose.connect(process.env.MONGO_URI);
  const Message = require("./models/Message");
  await Message.create({ sender: A.id, recipient: B.id, text: "private between Alice and Bob" });
  r = await call("GET", `/messages/${A.id}`, undefined, C.token);
  check("Carol cannot read Alice<->Bob messages (asking for Alice)", r.data.messages.length, 0);
  r = await call("GET", `/messages/${B.id}`, undefined, C.token);
  check("Carol cannot read Alice<->Bob messages (asking for Bob)", r.data.messages.length, 0);
  r = await call("GET", `/messages/${B.id}`, undefined, A.token);
  check("Alice can read her own conversation with Bob", r.data.messages.length, 1);

  console.log("--- Passwords in MongoDB ---");
  const stored = await mongoose.connection.db.collection("users").findOne({ email: good.email });
  check("Stored value is not the plaintext password", stored.passwordHash !== "Twelve-chars", true);
  check("Stored value is a bcrypt hash ($2...)", /^\$2[aby]\$12\$/.test(stored.passwordHash), true);
  check("bcrypt hash is 60 characters", stored.passwordHash.length, 60);
  r = await call("GET", "/profile", undefined, A.token);
  check("API never returns the hash", JSON.stringify(r.data).includes("passwordHash"), false);
  await mongoose.disconnect();

  console.log("--- Health checks (Task 15.9) ---");
  const health = await fetch(`${ORIGIN}/api/health`);
  check("GET /api/health -> 200", health.status, 200);
  const healthBody = await health.json();
  check("/api/health body status", healthBody.status, "ok");
  check("/api/health body message", healthBody.message, "API is running");
  const healthDb = await fetch(`${ORIGIN}/api/health/db`);
  check("GET /api/health/db -> 200 when MongoDB is connected", healthDb.status, 200);

  console.log("--- Routing, CORS and security headers ---");
  r = await call("GET", "/nothing-here");
  check("Unknown API route -> 404", r.status, 404);
  check("404 message is JSON", r.data && r.data.message, "API endpoint not found");

  r = await call("GET", "/courses", undefined, undefined, { Origin: "http://evil.example" });
  check("Untrusted Origin -> 403", r.status, 403);

  r = await call("GET", "/courses", undefined, undefined, { Origin: GOOD_ORIGIN });
  check("Trusted Origin -> 200", r.status, 200);
  check("Trusted Origin gets CORS header", r.headers.get("access-control-allow-origin"), GOOD_ORIGIN);

  r = await call("GET", "/courses");
  check("helmet: X-Content-Type-Options is nosniff", r.headers.get("x-content-type-options"), "nosniff");
  check("helmet: X-Powered-By is removed", r.headers.get("x-powered-by"), null);
  check("helmet: Content-Security-Policy is set", Boolean(r.headers.get("content-security-policy")), true);

  console.log("--- Unexpected server error (central error handler) ---");
  // Run the project's real errorHandler behind a route that crashes, so we can
  // see exactly what a client would get from an unexpected failure.
  const errorHandler = require("./middleware/errorHandler");
  const crashApp = express();
  crashApp.get("/boom", () => { throw new Error("secret: mongodb://user:pass@host/db"); });
  crashApp.use(errorHandler);
  const crashServer = http.createServer(crashApp);
  await new Promise((resolve) => crashServer.listen(0, resolve));
  const originalError = console.error;
  console.error = () => {}; // the handler logs the real error; keep test output clean
  const boom = await fetch(`http://127.0.0.1:${crashServer.address().port}/boom`);
  console.error = originalError;
  const boomBody = await boom.json();
  crashServer.close();
  check("Unexpected error -> controlled 500", boom.status, 500);
  check("500 body is generic", boomBody.message, "Internal server error");
  check("500 body does not leak the real error", JSON.stringify(boomBody).includes("mongodb://"), false);

  if (process.env.SKIP_RATE_LIMIT_TEST === "1") {
    console.log("--- Rate limiting: SKIPPED ---");
  } else {
    console.log("--- Excessive login attempts (this blocks your IP until the backend restarts) ---");
    let got429 = false;
    let attempts = 0;
    for (; attempts < 30 && !got429; attempts++) {
      r = await call("POST", "/auth/login", { email: good.email, password: "WrongPassword123" });
      got429 = r.status === 429;
    }
    check("Repeated failed logins -> 429", got429, true);
    check("429 message is JSON", r.data && r.data.message, "Too many login attempts. Try again later.");
    check("Limiter kicks in within 30 attempts", attempts <= 30, true);
    r = await call("POST", "/auth/login", { email: good.email, password: good.password });
    check("Even the correct password is blocked while limited -> 429", r.status, 429);
    console.log("      (restart the backend to clear the in-memory counter)");
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
})().catch((err) => {
  console.error("Test could not run. Is the backend running and seeded?", err);
  process.exit(1);
});
