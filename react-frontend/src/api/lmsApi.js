import apiClient, { TOKEN_KEY } from "./apiClient";

// Accounts that logged in through the Express API have a JWT in sessionStorage.
// They use MongoDB for everything below. (Old demo accounts that only exist in
// the json-server mock API have no token and keep using the mock API.)
export function hasApiSession() {
  return Boolean(sessionStorage.getItem(TOKEN_KEY));
}

// Turn an Axios error into an Error whose message is safe to show to the user.
export function toError(err, fallback = "Something went wrong. Please try again.") {
  const data = err?.response?.data;
  if (data?.errors?.length && data.errors[0]?.message) return new Error(data.errors[0].message);
  if (data?.message) return new Error(data.message);
  if (!err?.response) return new Error("Cannot reach the server. It may be waking up: wait a few seconds and try again.");
  return new Error(fallback);
}

async function run(promise, fallback) {
  try {
    return (await promise).data;
  } catch (err) {
    throw toError(err, fallback);
  }
}

// ----- enrollments and progress (MongoDB) -----
export async function fetchMyEnrollments() {
  const data = await run(apiClient.get("/enrollments/me"), "Unable to load your courses.");
  return data.enrollments;
}

export function enrollApi(courseId) {
  return run(apiClient.post("/enrollments", { courseId }), "Could not enroll in this course.");
}

export function unenrollApi(courseId) {
  return run(apiClient.delete(`/enrollments/${encodeURIComponent(courseId)}`), "Could not unenroll.");
}

export function saveProgressApi(courseId, progressPercentage) {
  return run(
    apiClient.put(`/progress/${encodeURIComponent(courseId)}`, { progressPercentage }),
    "Could not save progress."
  );
}

// ----- student records (admin only, MongoDB) -----
export async function fetchStudentsApi() {
  const data = await run(apiClient.get("/students", { params: { limit: 100 } }), "Unable to load students.");
  return data.students;
}

export async function createStudentApi(student) {
  return (await run(apiClient.post("/students", student), "Could not add the student.")).student;
}

export async function updateStudentApi(id, patch) {
  return (await run(apiClient.put(`/students/${encodeURIComponent(id)}`, patch), "Could not update the student.")).student;
}

export function deleteStudentApi(id) {
  return run(apiClient.delete(`/students/${encodeURIComponent(id)}`), "Could not delete the student.");
}
