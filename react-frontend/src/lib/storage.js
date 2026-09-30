import api from "../services/api";

const SESSION_KEY = "lms_session";

const DEMO_COURSE_ENROLLMENTS = [
  { courseId: "c1", progress: 78, status: "in-progress", lastLesson: "Working with dictionaries" },
  { courseId: "c2", progress: 45, status: "in-progress", lastLesson: "Flexbox & Grid layouts" },
  { courseId: "c3", progress: 100, status: "completed", lastLesson: "Final portfolio review" },
  { courseId: "c4", progress: 20, status: "in-progress", lastLesson: "Writing your first JOIN" },
];

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

export async function getStudents() {
  return api.get("/students");
}

export async function getAdmins() {
  return api.get("/admins");
}

export async function findStudentByEmail(email) {
  const students = await api.get(`/students?email=${encodeURIComponent(normalizeEmail(email))}`);
  return students[0] || null;
}

export async function findAdminByEmail(email) {
  const admins = await api.get(`/admins?email=${encodeURIComponent(normalizeEmail(email))}`);
  return admins[0] || null;
}

export async function addStudent(student) {
  const existing = await findStudentByEmail(student.email);
  if (existing) throw new Error("A student with this email already exists.");
  return api.post("/students", { ...student, role: "student" });
}

export async function addAdmin(admin) {
  return api.post("/admins", { ...admin, role: "admin" });
}

export async function updateStudent(id, patch) {
  const current = await api.get(`/students/${id}`);
  const updated = await api.patch(`/students/${id}`, patch);

  if (patch.email && patch.email.trim().toLowerCase() !== current.email.toLowerCase()) {
    const oldEmail = current.email;
    const newEmail = patch.email.trim().toLowerCase();

    const [enrollments, activities, notifications] = await Promise.all([
      api.get(`/enrollments?studentEmail=${encodeURIComponent(oldEmail)}`),
      api.get(`/activities?studentEmail=${encodeURIComponent(oldEmail)}`),
      api.get(`/notifications?studentEmail=${encodeURIComponent(oldEmail)}`),
    ]);

    await Promise.all([
      ...enrollments.map((item) =>
        api.patch(`/enrollments/${item.id}`, { studentEmail: newEmail })
      ),
      ...activities.map((item) =>
        api.patch(`/activities/${item.id}`, { studentEmail: newEmail })
      ),
      ...notifications.map((item) =>
        api.patch(`/notifications/${item.id}`, { studentEmail: newEmail })
      ),
    ]);
  }

  return updated;
}

export async function deleteStudent(id) {
  const student = await api.get(`/students/${id}`);
  const enrollments = await api.get(
    `/enrollments?studentEmail=${encodeURIComponent(student.email)}`
  );
  await Promise.all(
    enrollments.map((item) => api.delete(`/enrollments/${item.id}`))
  );
  await api.delete(`/students/${id}`);
  return true;
}

export async function getSession() {
  return localStorage.getItem(SESSION_KEY);
}

export function setSession(email) {
  localStorage.setItem(SESSION_KEY, normalizeEmail(email));
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

export async function getCurrentUser() {
  const email = await getSession();
  if (!email) return null;
  const [student, admin] = await Promise.all([
    findStudentByEmail(email),
    findAdminByEmail(email),
  ]);
  return student || admin || null;
}

async function getCoursesCatalog() {
  return api.get("/courses");
}

async function getEnrollments(email) {
  return api.get(`/enrollments?studentEmail=${encodeURIComponent(normalizeEmail(email))}`);
}

async function seedStudentCourses(email) {
  const existing = await getEnrollments(email);
  if (existing.length > 0) return existing;

  const seeded = [];
  for (const item of DEMO_COURSE_ENROLLMENTS) {
    seeded.push(
      await api.post("/enrollments", {
        studentEmail: normalizeEmail(email),
        ...item,
      })
    );
  }
  return seeded;
}

function mergeCourses(courses, enrollments) {
  return enrollments
    .map((enrollment) => {
      const course = courses.find((item) => item.id === enrollment.courseId);
      return course ? { ...course, ...enrollment } : null;
    })
    .filter(Boolean);
}

export async function getCourses(email) {
  const [courses, enrollments] = await Promise.all([
    getCoursesCatalog(),
    seedStudentCourses(email),
  ]);
  return mergeCourses(courses, enrollments);
}

export async function availableCoursesToAdd(email) {
  const [courses, enrollments] = await Promise.all([
    getCoursesCatalog(),
    getEnrollments(email),
  ]);
  const owned = new Set(enrollments.map((item) => item.courseId));
  return courses.filter((course) => !owned.has(course.id));
}

export async function enrollInCourse(email, courseId) {
  const courses = await getCoursesCatalog();
  const course = courses.find((item) => item.id === courseId);
  if (!course) throw new Error("Course not found.");

  const existing = await api.get(
    `/enrollments?studentEmail=${encodeURIComponent(normalizeEmail(email))}&courseId=${encodeURIComponent(courseId)}`
  );
  if (existing.length) return getCourses(email);

  await api.post("/enrollments", {
    studentEmail: normalizeEmail(email),
    courseId,
    progress: 0,
    status: "in-progress",
    lastLesson: "Not started yet",
  });

  await addActivity(email, {
    text: `Enrolled in "${course.title}"`,
    time: new Date().toISOString(),
  });

  return getCourses(email);
}

export async function updateCourseProgress(email, courseId, progress) {
  const enrollments = await getEnrollments(email);
  const enrollment = enrollments.find((item) => item.courseId === courseId);
  if (!enrollment) return getCourses(email);

  const clamped = Math.max(0, Math.min(100, progress));
  const updated = await api.patch(`/enrollments/${enrollment.id}`, {
    progress: clamped,
    status: clamped >= 100 ? "completed" : "in-progress",
  });

  const courses = await getCoursesCatalog();
  const course = courses.find((item) => item.id === courseId);
  if (course) {
    await addActivity(email, {
      text: `Progress updated on "${course.title}" (${clamped}%)`,
      time: new Date().toISOString(),
    });
  }

  return getCourses(email);
}

export async function getActivity(email) {
  return api.get(`/activities?studentEmail=${encodeURIComponent(normalizeEmail(email))}&_sort=time&_order=desc`);
}

export async function addActivity(email, entry) {
  return api.post("/activities", {
    studentEmail: normalizeEmail(email),
    ...entry,
  });
}

export async function getNotifications(email) {
  return api.get(`/notifications?studentEmail=${encodeURIComponent(normalizeEmail(email))}&_sort=time&_order=desc`);
}

export async function markNotificationRead(email, id) {
  await api.patch(`/notifications/${id}`, { read: true });
  return getNotifications(email);
}

export async function markAllNotificationsRead(email) {
  const list = await getNotifications(email);
  await Promise.all(list.filter((item) => !item.read).map((item) => api.patch(`/notifications/${item.id}`, { read: true })));
  return getNotifications(email);
}

export async function resetPassword(email, password) {
  const student = await findStudentByEmail(email);
  if (student) return updateStudent(student.id, { password });

  const admin = await findAdminByEmail(email);
  if (admin) return api.patch(`/admins/${admin.id}`, { password });

  return null;
}
