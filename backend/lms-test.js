// Tests the MongoDB-backed LMS features: courses, enrollment, learning progress,
// notifications, admin student records and clean-up on delete.
// Usage: backend running + `npm run seed` done, then:  npm run test:lms
// (uses the seeded admin: ADMIN_EMAIL / ADMIN_PASSWORD or admin@example.com / admin123)
require("dotenv").config();
const { io } = require("socket.io-client");
const mongoose = require("mongoose");

const ORIGIN = process.env.API_URL || `http://localhost:${process.env.PORT || 5000}`;
const BASE = `${ORIGIN}/api/v1`;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@example.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";
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
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  let data = null;
  try { data = await res.json(); } catch { /* empty */ }
  return { status: res.status, data };
}

async function makeStudent(label) {
  const email = `${label}${stamp}@example.com`;
  const password = "LearnSecure123";
  await call("POST", "/auth/register", { name: `Student ${label}`, email, password, department: "CSE" });
  const login = await call("POST", "/auth/login", { email, password });
  return { email, password, token: login.data.token, id: login.data.student.id };
}

const waitFor = (socket, event, ms = 3000) =>
  new Promise((resolve) => {
    const timer = setTimeout(() => resolve(null), ms);
    socket.once(event, (data) => { clearTimeout(timer); resolve(data); });
  });

(async () => {
  const adminLogin = await call("POST", "/auth/login", { email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
  if (adminLogin.status !== 200) {
    console.error(`Could not log in as admin ${ADMIN_EMAIL}. Run \`npm run seed\` first (or set ADMIN_EMAIL / ADMIN_PASSWORD).`);
    process.exit(1);
  }
  const admin = adminLogin.data.token;
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;
  const count = (collection, filter) => db.collection(collection).countDocuments(filter);
  const oid = (id) => new mongoose.Types.ObjectId(id);

  console.log("--- Courses are in MongoDB and visible to students ---");
  let r = await call("GET", "/courses?limit=100");
  check("GET /courses -> 200", r.status, 200);
  check("At least the 6 starter courses exist", r.data.length >= 6, true);
  const [course1, course2] = r.data;

  const A = await makeStudent("ann");
  const B = await makeStudent("ben");

  console.log("--- Enrollment ---");
  r = await call("GET", "/enrollments/me");
  check("Enrollments without token -> 401", r.status, 401);
  r = await call("GET", "/enrollments/me", undefined, A.token);
  check("New student has no enrollments", r.data.enrollments.length, 0);

  const aSocket = io(ORIGIN, { auth: { token: A.token }, reconnection: false });
  await new Promise((resolve) => aSocket.on("connect", resolve));
  const liveEnrollNote = waitFor(aSocket, "new_notification");

  r = await call("POST", "/enrollments", { courseId: course1.id }, A.token);
  check("Enroll in a course -> 201", r.status, 201);
  check("Enrollment status is active", r.data.enrollment.status, "active");
  check("Enrollment carries the course title", r.data.enrollment.course.title, course1.title);
  check("Enrollment starts at 0%", r.data.enrollment.progressPercentage, 0);
  const live = await liveEnrollNote;
  check("Student gets a LIVE notification when enrolling", live && live.message, `You enrolled in "${course1.title}"`);

  r = await call("POST", "/enrollments", { courseId: course1.id }, A.token);
  check("Enrolling twice -> 409", r.status, 409);
  r = await call("POST", "/enrollments", { courseId: "abc" }, A.token);
  check("Invalid course id -> 400", r.status, 400);
  r = await call("POST", "/enrollments", { courseId: "64b7f0f0f0f0f0f0f0f0f0f0" }, A.token);
  check("Unknown course -> 404", r.status, 404);
  r = await call("POST", "/enrollments", { courseId: course2.id }, A.token);
  check("Enroll in a second course", r.status, 201);

  check("Enrollment saved in MongoDB", await count("enrollments", { student: oid(A.id) }), 2);
  check("Progress record saved in MongoDB", await count("learningprogresses", { student: oid(A.id) }), 2);

  r = await call("GET", "/enrollments/me", undefined, B.token);
  check("Another student cannot see Ann's enrollments", r.data.enrollments.length, 0);

  console.log("--- Learning progress ---");
  r = await call("PUT", `/progress/${course1.id}`, { progressPercentage: 15 }, A.token);
  check("Set 15% -> 200", r.status, 200);
  check("15% = 3 of 20 lessons", r.data.enrollment.completedLessons, 3);
  check("Percentage stored as 15", r.data.enrollment.progressPercentage, 15);
  check("Still active", r.data.enrollment.status, "active");

  r = await call("PUT", `/progress/${course1.id}`, { completedLessons: 10 }, A.token);
  check("Set 10 lessons -> 50%", r.data.enrollment.progressPercentage, 50);

  r = await call("PUT", `/progress/${course1.id}`, { progressPercentage: -5 }, A.token);
  check("Negative percentage -> 400", r.status, 400);
  r = await call("PUT", `/progress/${course1.id}`, {}, A.token);
  check("No value sent -> 400", r.status, 400);
  r = await call("PUT", `/progress/${course1.id}`, { progressPercentage: 50 });
  check("Progress without token -> 401", r.status, 401);
  r = await call("PUT", `/progress/${course1.id}`, { progressPercentage: 50 }, B.token);
  check("Student not enrolled cannot set progress -> 404", r.status, 404);

  const liveDone = waitFor(aSocket, "new_notification");
  r = await call("PUT", `/progress/${course1.id}`, { progressPercentage: 100 }, A.token);
  check("100% -> completed", r.data.enrollment.status, "completed");
  const done = await liveDone;
  check("Completion sends a live notification", done && /completed/.test(done.message), true);

  r = await call("GET", "/progress/me", undefined, A.token);
  check("GET /progress/me lists both courses", r.data.progress.length, 2);

  r = await call("GET", "/notifications", undefined, A.token);
  check("Notifications are stored in MongoDB (2 enroll + 1 completion)", r.data.notifications.length, 3);

  console.log("--- Unenroll and re-enroll (history kept) ---");
  r = await call("DELETE", `/enrollments/${course2.id}`, undefined, A.token);
  check("Unenroll -> 200", r.status, 200);
  check("Status is withdrawn", r.data.enrollment.status, "withdrawn");
  r = await call("DELETE", `/enrollments/${course2.id}`, undefined, A.token);
  check("Unenrolling again -> 404", r.status, 404);
  r = await call("PUT", `/progress/${course2.id}`, { progressPercentage: 10 }, A.token);
  check("Cannot update progress after withdrawing -> 404", r.status, 404);
  check("Withdrawn enrollment record is kept", await count("enrollments", { student: oid(A.id), status: "withdrawn" }), 1);

  r = await call("POST", "/enrollments", { courseId: course2.id }, A.token);
  check("Re-enrolling after withdrawing -> 201", r.status, 201);
  check("Re-enrollment reuses the same record (still 2 records)", await count("enrollments", { student: oid(A.id) }), 2);
  r = await call("DELETE", `/enrollments/${course1.id}`, undefined, A.token);
  r = await call("POST", "/enrollments", { courseId: course1.id }, A.token);
  check("Re-enrolling a finished course keeps it completed", r.data.enrollment.status, "completed");
  check("...and keeps its 100% progress", r.data.enrollment.progressPercentage, 100);
  aSocket.disconnect();

  console.log("--- Admin: student records in MongoDB ---");
  r = await call("GET", "/students");
  check("Students without token -> 401", r.status, 401);
  r = await call("GET", "/students", undefined, A.token);
  check("Student calling the admin students API -> 403", r.status, 403);

  const newEmail = `created${stamp}@example.com`;
  r = await call("POST", "/students", { name: "Created Student", email: newEmail, password: "short", phone: "9876543210" }, admin);
  check("Short password -> 400", r.status, 400);
  r = await call("POST", "/students", { name: "Created Student", email: newEmail, password: "AdminMade-Pass1", phone: "9876543210" }, admin);
  check("Admin creates a student -> 201", r.status, 201);
  const created = r.data.student;
  check("Role is student", created.role, "student");
  check("Department defaults to General", created.department, "General");
  r = await call("POST", "/students", { name: "Dup", email: newEmail, password: "AdminMade-Pass1" }, admin);
  check("Duplicate email -> 409", r.status, 409);
  const stored = await db.collection("users").findOne({ email: newEmail });
  check("Password stored as a bcrypt hash", /^\$2[aby]\$12\$/.test(stored.passwordHash), true);

  r = await call("GET", "/students?limit=100", undefined, admin);
  check("Admin lists students", r.data.students.some((s) => s.id === created.id), true);
  check("List never contains admins", r.data.students.some((s) => s.role === "admin"), false);
  check("List never exposes password hashes", JSON.stringify(r.data).includes("passwordHash"), false);
  r = await call("GET", `/students?search=created${stamp}`, undefined, admin);
  check("Search finds the student", r.data.students.length, 1);

  r = await call("PUT", `/students/${created.id}`, { name: "Renamed Student", phone: "1112223333" }, admin);
  check("Admin updates a student -> 200", r.status, 200);
  check("Name changed", r.data.student.name, "Renamed Student");
  r = await call("PUT", `/students/${created.id}`, { email: A.email }, admin);
  check("Changing to someone else's email -> 409", r.status, 409);
  r = await call("PUT", "/students/not-an-id", { name: "x" }, admin);
  check("Invalid id -> 400", r.status, 400);

  r = await call("POST", "/auth/login", { email: newEmail, password: "AdminMade-Pass1" });
  check("The admin-created student can log in", r.status, 200);
  const createdToken = r.data.token;

  // give the new student data in every collection, then delete them
  await call("POST", "/enrollments", { courseId: course1.id }, createdToken);
  check("Student has an enrollment before deletion", await count("enrollments", { student: oid(created.id) }), 1);
  check("Student has a notification before deletion", await count("notifications", { recipient: oid(created.id) }) >= 1, true);

  r = await call("DELETE", `/students/${created.id}`, undefined, admin);
  check("Admin deletes the student -> 200", r.status, 200);
  check("Their enrollments are cleaned up", await count("enrollments", { student: oid(created.id) }), 0);
  check("Their progress is cleaned up", await count("learningprogresses", { student: oid(created.id) }), 0);
  check("Their notifications are cleaned up", await count("notifications", { recipient: oid(created.id) }), 0);
  r = await call("POST", "/auth/login", { email: newEmail, password: "AdminMade-Pass1" });
  check("Deleted student can no longer log in", r.status, 401);
  r = await call("DELETE", `/students/${created.id}`, undefined, admin);
  check("Deleting again -> 404", r.status, 404);
  r = await call("DELETE", `/students/${adminLogin.data.student.id}`, undefined, admin);
  check("An admin account cannot be deleted through the students API -> 404", r.status, 404);

  console.log("--- Admin: courses (create, edit, delete) + clean-up ---");
  r = await call("POST", "/courses", { title: `Temp ${stamp}`, category: "Test", icon: "🧪" }, admin);
  check("Admin creates a course -> 201", r.status, 201);
  const temp = r.data.course;
  check("Course is stored in MongoDB", await count("courses", { title: `Temp ${stamp}` }), 1);
  r = await call("PUT", `/courses/${temp.id}`, { title: `Temp ${stamp} v2`, category: "Test" }, admin);
  check("Admin edits the course", r.data.course.title, `Temp ${stamp} v2`);
  r = await call("POST", "/enrollments", { courseId: temp.id }, B.token);
  check("Student enrolls in the new course", r.status, 201);
  r = await call("DELETE", `/courses/${temp.id}`, undefined, admin);
  check("Admin deletes the course -> 200", r.status, 200);
  check("Enrollments in that course are removed", await count("enrollments", { course: oid(temp.id) }), 0);
  r = await call("GET", "/enrollments/me", undefined, B.token);
  check("Student's list no longer shows the deleted course", r.data.enrollments.length, 0);

  await mongoose.disconnect();
  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
})().catch((err) => {
  console.error("Test could not run. Is the backend running and seeded?", err);
  process.exit(1);
});
