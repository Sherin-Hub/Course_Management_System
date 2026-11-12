import api from "../services/api";
import { fetchCourses } from "../api/courseApi";
import {
  createStudentApi,
  deleteStudentApi,
  enrollApi,
  fetchMyEnrollments,
  fetchStudentsApi,
  hasApiSession,
  saveProgressApi,
  unenrollApi,
  updateStudentApi,
} from "../api/lmsApi";

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

// Admin student records: MongoDB for admins who logged in through the API,
// the json-server mock API for old demo admins.
export async function getStudents() {
  if (hasApiSession()) return fetchStudentsApi();
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
  if (hasApiSession()) return createStudentApi(student);
  const existing = await findStudentByEmail(student.email);
  if (existing) throw new Error("A student with this email already exists.");
  return api.post("/students", { ...student, role: "student" });
}

export async function addAdmin(admin) {
  return api.post("/admins", { ...admin, role: "admin" });
}

export async function updateStudent(id, patch) {
  if (hasApiSession()) return updateStudentApi(id, patch);
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
  if (hasApiSession()) {
    await deleteStudentApi(id);
    return true;
  }
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

// The course catalog lives in the Express backend (GET /api/v1/courses is public).
// For accounts that logged in through the API, enrollments, progress, activity
// and notifications are stored in MongoDB too. Only old demo accounts (no JWT)
// still use the json-server mock API for those.
// ---------------------------------------------------------------------------
// MongoDB helpers
// ---------------------------------------------------------------------------
function enrollmentToCard(item) {
  return {
    id: item.courseId,
    enrollmentId: item.id,
    title: item.course.title,
    icon: item.course.icon,
    category: item.course.category,
    progress: item.progressPercentage,
    status: item.status === "completed" ? "completed" : "in-progress",
    lastLesson:
      item.completedLessons > 0
        ? `Lesson ${item.completedLessons} of ${item.totalLessons}`
        : "Not started yet",
    completedLessons: item.completedLessons,
    totalLessons: item.totalLessons,
  };
}

async function getApiCourses() {
  const enrollments = await fetchMyEnrollments();
  return enrollments.filter((item) => item.status !== "withdrawn").map(enrollmentToCard);
}

// "Recent activity" is built from the saved enrollments (no extra collection needed).
async function getApiActivity() {
  const enrollments = await fetchMyEnrollments();
  const events = [];

  for (const item of enrollments) {
    const title = item.course.title;
    events.push({ id: `enrolled-${item.id}`, text: `Enrolled in "${title}"`, time: item.enrolledAt });

    if (item.status === "withdrawn") {
      events.push({ id: `left-${item.id}`, text: `Left "${title}"`, time: item.updatedAt });
    } else if (item.completedLessons > 0 && item.progressUpdatedAt) {
      events.push({
        id: `progress-${item.id}`,
        text:
          item.status === "completed"
            ? `Completed "${title}"`
            : `Progress updated on "${title}" (${item.progressPercentage}%)`,
        time: item.progressUpdatedAt,
      });
    }
  }

  return events.sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 10);
}
async function getCoursesCatalog() {
  return fetchCourses();
}

async function getEnrollments(email) {
  return api.get(`/enrollments?studentEmail=${encodeURIComponent(normalizeEmail(email))}`);
}

async function seedStudentCourses(email) {
  const existing = await getEnrollments(email);
  if (existing.length > 0) return existing;

  // Course ids now come from MongoDB (ObjectIds), so the demo enrollments are
  // attached to the first courses of the real catalog instead of "c1".."c4".
  const catalog = await getCoursesCatalog();
  const seeded = [];
  for (const [index, item] of DEMO_COURSE_ENROLLMENTS.entries()) {
    const course = catalog[index];
    if (!course) break;
    seeded.push(
      await api.post("/enrollments", {
        studentEmail: normalizeEmail(email),
        ...item,
        courseId: course.id,
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
  if (hasApiSession()) return getApiCourses();
  const [courses, enrollments] = await Promise.all([
    getCoursesCatalog(),
    seedStudentCourses(email),
  ]);
  return mergeCourses(courses, enrollments);
}

export async function availableCoursesToAdd(email) {
  if (hasApiSession()) {
    const [catalog, mine] = await Promise.all([getCoursesCatalog(), fetchMyEnrollments()]);
    const owned = new Set(mine.filter((item) => item.status !== "withdrawn").map((item) => item.courseId));
    return catalog.filter((course) => !owned.has(course.id));
  }
  const [courses, enrollments] = await Promise.all([
    getCoursesCatalog(),
    getEnrollments(email),
  ]);
  const owned = new Set(enrollments.map((item) => item.courseId));
  return courses.filter((course) => !owned.has(course.id));
}

export async function enrollInCourse(email, courseId) {
  if (hasApiSession()) {
    await enrollApi(courseId);
    return getApiCourses();
  }
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
  if (hasApiSession()) {
    await saveProgressApi(courseId, Math.max(0, Math.min(100, Math.round(progress))));
    return getApiCourses();
  }
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

// Leave a course (MongoDB: status "withdrawn", the history is kept).
export async function unenrollFromCourse(email, courseId) {
  if (hasApiSession()) {
    await unenrollApi(courseId);
    return getApiCourses();
  }
  const existing = await api.get(
    `/enrollments?studentEmail=${encodeURIComponent(normalizeEmail(email))}&courseId=${encodeURIComponent(courseId)}`
  );
  await Promise.all(existing.map((item) => api.delete(`/enrollments/${item.id}`)));
  return getCourses(email);
}

export async function getActivity(email) {
  if (hasApiSession()) return getApiActivity();
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
