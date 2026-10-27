import apiClient from "./apiClient";

export async function registerStudent(studentData) {
  const response = await apiClient.post("/auth/register", studentData);
  return response.data;
}

export async function loginStudent(credentials) {
  const response = await apiClient.post("/auth/login", credentials);
  return response.data;
}

// Validates the stored token and returns the logged-in student.
export async function getCurrentStudent() {
  const response = await apiClient.get("/auth/me");
  return response.data.student;
}
