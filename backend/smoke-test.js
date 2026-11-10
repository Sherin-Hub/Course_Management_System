// Usage:
//   1. npm run seed        (once: default courses + admin account)
//   2. npm start           (in another terminal)
//   3. npm run smoke
// Optional: BASE_URL=http://localhost:5000/api/v1  ADMIN_EMAIL=...  ADMIN_PASSWORD=...
const BASE = process.env.BASE_URL || "http://localhost:5000/api/v1";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@example.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";
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

  console.log("--- Registration & login ---");
  let r = await call("POST", "/auth/register", student);
  check("Register new student", r.status, 201);
  check("Response has no password data", JSON.stringify(r.data).includes("assword"), false);
  check("New account has role student", r.data && r.data.student && r.data.student.role, "student");

  r = await call("POST", "/auth/register", student);
  check("Duplicate email rejected", r.status, 409);

  r = await call("POST", "/auth/register", { ...student, email: "x@example.com", password: "short" });
  check("Short password rejected", r.status, 400);

  r = await call("POST", "/auth/register", { name: "Only Name" });
  check("Missing required fields rejected", r.status, 400);

  // Privilege escalation attempt: role in the body must be ignored.
  const sneaky = `sneaky${Date.now()}@example.com`;
  r = await call("POST", "/auth/register", { ...student, email: sneaky, role: "admin" });
  check("Register with role=admin still creates a student", r.data && r.data.student && r.data.student.role, "student");

  r = await call("POST", "/auth/login", { email, password: "WrongPassword123" });
  check("Wrong password rejected", r.status, 401);

  r = await call("POST", "/auth/login", { email: "nobody@example.com", password: "WrongPassword123" });
  check("Unknown email rejected", r.status, 401);

  r = await call("POST", "/auth/login", { email: email.toUpperCase(), password: student.password });
  check("Login succeeds (email is case-insensitive)", r.status, 200);
  const token = r.data && r.data.token;
  check("Login returns a token", typeof token, "string");

  r = await call("GET", "/auth/me", null, token);
  check("GET /auth/me with token -> 200", r.status, 200);

  console.log("--- Profile ---");
  r = await call("GET", "/profile");
  check("Profile without token -> 401", r.status, 401);

  r = await call("GET", "/profile", null, token);
  check("GET /profile -> 200", r.status, 200);
  check("Profile email matches", r.data && r.data.user && r.data.user.email, email);
  check("Profile never exposes passwordHash", JSON.stringify(r.data).includes("passwordHash"), false);

  r = await call("PUT", "/profile", { name: "   " }, token);
  check("Blank name -> 400", r.status, 400);

  r = await call("PUT", "/profile", {}, token);
  check("Missing name -> 400", r.status, 400);

  r = await call("PUT", "/profile", { name: "N".repeat(101) }, token);
  check("Name over 100 chars -> 400 (validator)", r.status, 400);

  r = await call("PUT", "/profile", { name: "  Arun K Updated  ", phone: "9876543210", role: "admin", email: "hijack@example.com" }, token);
  check("PUT /profile -> 200", r.status, 200);
  check("Name is trimmed and saved", r.data && r.data.user && r.data.user.name, "Arun K Updated");
  check("Role cannot be changed through profile", r.data && r.data.user && r.data.user.role, "student");
  check("Email cannot be changed through profile", r.data && r.data.user && r.data.user.email, email);

  r = await call("GET", "/profile", null, token);
  check("Updated name persisted in the database", r.data && r.data.user && r.data.user.name, "Arun K Updated");
  check("Updated phone persisted", r.data && r.data.user && r.data.user.phone, "9876543210");

  console.log("--- Courses: public reads ---");
  r = await call("GET", "/courses");
  check("GET /courses is public", r.status, 200);
  check("Courses come back as an array", Array.isArray(r.data), true);
  check("Courses expose id (not _id)", r.data[0] && typeof r.data[0].id === "string" && r.data[0]._id === undefined, true);

  const course = { title: "Test Course", category: "Testing", icon: "🧪" };

  console.log("--- Courses: authorization ---");
  r = await call("POST", "/courses", course);
  check("Create without token -> 401", r.status, 401);

  r = await call("POST", "/courses", course, "not.a.real.token");
  check("Create with invalid token -> 401", r.status, 401);

  r = await call("POST", "/courses", course, token);
  check("Create as a student -> 403", r.status, 403);

  r = await call("POST", "/auth/login", { email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
  check("Admin login (run `npm run seed` if this fails)", r.status, 200);
  check("Admin role comes back from MongoDB", r.data && r.data.student && r.data.student.role, "admin");
  const adminToken = r.data && r.data.token;

  console.log("--- Courses: admin CRUD ---");
  r = await call("POST", "/courses", { title: "", category: "" }, adminToken);
  check("Create with missing fields -> 400", r.status, 400);

  r = await call("POST", "/courses", course, adminToken);
  check("Admin create -> 201", r.status, 201);
  const id = r.data && r.data.course && r.data.course.id;
  check("Created course has a 24-char id", typeof id === "string" && id.length === 24, true);

  r = await call("GET", `/courses/${id}`);
  check("GET created course by id -> 200", r.status, 200);
  check("Created course title stored", r.data && r.data.title, "Test Course");

  r = await call("PUT", `/courses/${id}`, { ...course, title: "Renamed" });
  check("Update without token -> 401", r.status, 401);

  r = await call("PUT", `/courses/${id}`, { ...course, title: "Renamed" }, token);
  check("Update as student -> 403", r.status, 403);

  r = await call("PUT", `/courses/${id}`, { ...course, title: "Renamed" }, adminToken);
  check("Admin update -> 200", r.status, 200);
  check("Update returns the new title", r.data && r.data.course && r.data.course.title, "Renamed");

  r = await call("GET", `/courses/${id}`);
  check("Updated title persisted", r.data && r.data.title, "Renamed");

  r = await call("PUT", `/courses/${id}`, { title: "", category: "x" }, adminToken);
  check("Update with blank title -> 400", r.status, 400);

  console.log("--- Courses: invalid ids ---");
  r = await call("GET", "/courses/not-an-id");
  check("GET with malformed id -> 400", r.status, 400);

  r = await call("GET", "/courses/c1");
  check("GET with old-style id (c1) -> 400", r.status, 400);

  r = await call("PUT", "/courses/not-an-id", course, adminToken);
  check("PUT with malformed id -> 400", r.status, 400);

  r = await call("DELETE", "/courses/not-an-id", null, adminToken);
  check("DELETE with malformed id -> 400", r.status, 400);

  r = await call("GET", "/courses/64b7f0f0f0f0f0f0f0f0f0f0");
  check("GET well-formed but unknown id -> 404", r.status, 404);

  console.log("--- Courses: delete ---");
  r = await call("DELETE", `/courses/${id}`);
  check("Delete without token -> 401", r.status, 401);

  r = await call("DELETE", `/courses/${id}`, null, token);
  check("Delete as student -> 403", r.status, 403);

  r = await call("DELETE", `/courses/${id}`, null, adminToken);
  check("Admin delete -> 200", r.status, 200);

  r = await call("GET", `/courses/${id}`);
  check("Deleted course -> 404", r.status, 404);

  r = await call("DELETE", `/courses/${id}`, null, adminToken);
  check("Deleting it again -> 404", r.status, 404);

  console.log("--- Misc ---");
  r = await call("GET", "/nothing-here");
  check("Unknown route -> 404", r.status, 404);

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
})().catch((err) => {
  console.error("Could not reach the server. Is it running?", err.message);
  process.exit(1);
});
