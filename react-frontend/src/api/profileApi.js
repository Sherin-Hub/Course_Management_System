import apiClient from "./apiClient";

// GET /api/v1/profile -> the logged-in student's record from MongoDB
export async function fetchProfile() {
  const response = await apiClient.get("/profile");
  return response.data.user;
}

// PUT /api/v1/profile -> { name, phone? }
export async function saveProfile(profile) {
  const response = await apiClient.put("/profile", profile);
  return response.data.user;
}
