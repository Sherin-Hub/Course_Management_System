import { createContext, useContext, useEffect, useState } from "react";
import * as Storage from "../lib/storage";
import api from "../services/api";
import { TOKEN_KEY } from "../api/apiClient";
import {
  getCurrentStudent,
  loginStudent,
  registerStudent,
} from "../api/authApi";

const AuthContext = createContext(null);

function apiErrorMessage(err, fallback) {
  if (err.response?.data?.message) return err.response.data.message;
  if (!err.response) {
    return "Unable to reach the server. Make sure the backend is running on port 5000.";
  }
  return fallback;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Restore the session on page load.
  useEffect(() => {
    let active = true;

    async function restore() {
      try {
        if (sessionStorage.getItem(TOKEN_KEY)) {
          // Student session: the JWT is checked by the backend (GET /auth/me).
          try {
            const student = await getCurrentStudent();
            if (active) setUser({ ...student, authSource: "api" });
          } catch {
            sessionStorage.removeItem(TOKEN_KEY);
            if (active) setUser(null);
          }
          return;
        }

        // Legacy admin session (admins still live in the mock API).
        const email = await Storage.getSession();
        if (email) {
          const admin = await Storage.findAdminByEmail(email);
          if (active) setUser(admin);
        }
      } catch (error) {
        console.error("Unable to restore session:", error);
      } finally {
        if (active) setAuthLoading(false);
      }
    }

    restore();
    return () => {
      active = false;
    };
  }, []);

  async function register({ name, email, phone, password, role, department }) {
    const normalizedEmail = email.trim().toLowerCase();

    // Admin accounts are not part of the student auth API: they stay in the mock API.
    if (role === "admin") {
      const [student, admin] = await Promise.all([
        Storage.findStudentByEmail(normalizedEmail),
        Storage.findAdminByEmail(normalizedEmail),
      ]);
      if (student || admin) {
        throw new Error("An account with this email already exists.");
      }
      const created = await Storage.addAdmin({ name, email: normalizedEmail, phone, password });
      Storage.setSession(normalizedEmail);
      setUser(created);
      return created;
    }

    // Student: POST /api/v1/auth/register, then sign in to get a JWT.
    try {
      await registerStudent({ name, email: normalizedEmail, password, department, phone });
    } catch (err) {
      throw new Error(apiErrorMessage(err, "Registration failed. Please try again."));
    }

    const account = await login(normalizedEmail, password);

    // Prepare the demo enrollments / activity / notifications for the new student.
    await Storage.getCourses(normalizedEmail);
    await Storage.getActivity(normalizedEmail);
    await Storage.getNotifications(normalizedEmail);

    return account;
  }

  async function login(email, password) {
    const normalizedEmail = email.trim().toLowerCase();

    try {
      // POST /api/v1/auth/login -> { token, student }
      const result = await loginStudent({ email: normalizedEmail, password });
      sessionStorage.setItem(TOKEN_KEY, result.token);
      Storage.clearSession();
      const account = { ...result.student, authSource: "api" };
      setUser(account);
      return account;
    } catch (err) {
      // Not a student account? Fall back to the legacy mock-API admin account.
      if (err.response?.status === 401) {
        let admin = null;
        try {
          admin = await Storage.findAdminByEmail(normalizedEmail);
        } catch {
          admin = null;
        }
        if (admin && admin.password === password) {
          sessionStorage.removeItem(TOKEN_KEY);
          Storage.setSession(normalizedEmail);
          setUser(admin);
          return admin;
        }
      }
      throw new Error(apiErrorMessage(err, "Login failed. Please try again."));
    }
  }

  function logout() {
    sessionStorage.removeItem(TOKEN_KEY);
    Storage.clearSession();
    setUser(null);
  }

  async function updateProfile(patch) {
    if (!user) return null;

    if (user.authSource === "api") {
      throw new Error("Profile updates are not available for API accounts yet.");
    }

    const updated =
      user.role === "admin"
        ? await api.patch(`/admins/${user.id}`, patch)
        : await Storage.updateStudent(user.id, patch);

    setUser(updated);
    return updated;
  }

  return (
    <AuthContext.Provider
      value={{ user, authLoading, register, login, logout, updateProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
