import apiClient from "./apiClient";

// Public
export async function fetchCourses() {
  const response = await apiClient.get("/courses");
  return response.data;
}

export async function fetchCourse(id) {
  const response = await apiClient.get(`/courses/${encodeURIComponent(id)}`);
  return response.data;
}

// Login required (the Axios interceptor adds the Bearer token)
export async function createCourse(course) {
  const response = await apiClient.post("/courses", course);
  return response.data;
}

export async function updateCourse(id, course) {
  const response = await apiClient.put(`/courses/${encodeURIComponent(id)}`, course);
  return response.data;
}

export async function deleteCourse(id) {
  const response = await apiClient.delete(`/courses/${encodeURIComponent(id)}`);
  return response.data;
}
