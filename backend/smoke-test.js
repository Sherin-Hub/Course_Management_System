// Usage: start the server (npm start), then run: node smoke-test.js
// Optional: BASE_URL=http://localhost:5000/api/v1 node smoke-test.js
const BASE = process.env.BASE_URL || "http://localhost:5000/api/v1";
const email = `test${Date.now()}@example.com`;
let passed = 0;
let failed = 0;

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

function check(name, actual, expected) {
  const ok = actual === expected;
  ok ? passed++ : failed++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}  (got ${actual}, expected ${expected})`);
}

(async () => {
  const student = { name: "Arun Kumar", email, password: "LearnSecure123", department: "Computer Science" };

  let r = await call("POST", "/auth/register", student);
  check("Register new student", r.status, 201);
  check("Response has no password data", JSON.stringify(r.data).includes("assword"), false);

  r = await call("POST", "/auth/register", student);
  check("Duplicate email rejected", r.status, 409);

  r = await call("POST", "/auth/register", { ...student, email: "x@example.com", password: "short" });
  check("Short password rejected", r.status, 400);

  r = await call("POST", "/auth/login", { email, password: "WrongPassword123" });
  check("Wrong password rejected", r.status, 401);

  r = await call("POST", "/auth/login", { email, password: student.password });
  check("Login succeeds", r.status, 200);
  const token = r.data && r.data.token;
  check("Login returns a token", typeof token, "string");

  r = await call("GET", "/courses");
  check("GET /courses is public", r.status, 200);

  r = await call("GET", "/courses/c1");
  check("GET /courses/c1 is public", r.status, 200);

  const course = { title: "Test Course", category: "Testing", icon: "🧪" };

  r = await call("POST", "/courses", course);
  check("Create without token -> 401", r.status, 401);

  r = await call("POST", "/courses", course, "not.a.real.token");
  check("Create with invalid token -> 401", r.status, 401);

  r = await call("POST", "/courses", course, token);
  check("Create with valid token -> 201", r.status, 201);
  const id = r.data && r.data.course && r.data.course.id;

  r = await call("PUT", `/courses/${id}`, { ...course, title: "Renamed" });
  check("Update without token -> 401", r.status, 401);

  r = await call("PUT", `/courses/${id}`, { ...course, title: "Renamed" }, token);
  check("Update with token -> 200", r.status, 200);

  r = await call("DELETE", `/courses/${id}`);
  check("Delete without token -> 401", r.status, 401);

  r = await call("DELETE", `/courses/${id}`, null, token);
  check("Delete with token -> 200", r.status, 200);

  r = await call("GET", `/courses/${id}`);
  check("Deleted course -> 404", r.status, 404);

  r = await call("GET", "/auth/me", null, token);
  check("GET /auth/me with token -> 200", r.status, 200);

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
})().catch((err) => {
  console.error("Could not reach the server. Is it running?", err.message);
  process.exit(1);
});
