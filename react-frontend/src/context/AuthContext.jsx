import { createContext, useContext, useEffect, useState } from "react";
import * as Storage from "../lib/storage";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    let active = true;

    Storage.getCurrentUser()
      .then((currentUser) => {
        if (active) {
          setUser(currentUser);
        }
      })
      .catch((error) => {
        console.error("Unable to restore session:", error);
      })
      .finally(() => {
        if (active) {
          setAuthLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  async function register({ name, email, phone, password, role }) {
    const normalizedEmail = email.trim().toLowerCase();

    const [student, admin] = await Promise.all([
      Storage.findStudentByEmail(normalizedEmail),
      Storage.findAdminByEmail(normalizedEmail),
    ]);

    if (student || admin) {
      throw new Error("An account with this email already exists.");
    }

    const account = {
      name,
      email: normalizedEmail,
      phone,
      password,
      role: role === "admin" ? "admin" : "student",
    };

    const created =
      account.role === "admin"
        ? await Storage.addAdmin(account)
        : await Storage.addStudent(account);

    if (account.role !== "admin") {
      await Storage.getCourses(normalizedEmail);
      await Storage.getActivity(normalizedEmail);
      await Storage.getNotifications(normalizedEmail);
    }

    const loggedInUser = {
      ...created,
      role: account.role,
    };

    Storage.setSession(normalizedEmail);
    setUser(loggedInUser);

    return loggedInUser;
  }

  async function login(email, password) {
    const normalizedEmail = email.trim().toLowerCase();

    const [student, admin] = await Promise.all([
      Storage.findStudentByEmail(normalizedEmail),
      Storage.findAdminByEmail(normalizedEmail),
    ]);

    let account = null;

    if (student && student.password === password) {
      account = {
        ...student,
        role: "student",
      };
    } else if (admin && admin.password === password) {
      account = {
        ...admin,
        role: "admin",
      };
    }

    if (!account) {
      throw new Error("Incorrect email or password.");
    }

    Storage.setSession(normalizedEmail);
    setUser(account);

    return account;
  }

  function logout() {
    Storage.clearSession();
    setUser(null);
  }

  async function updateProfile(patch) {
    if (!user) return null;

    const updated =
      user.role === "admin"
        ? await Storage.api.patch(`/admins/${user.id}`, patch)
        : await Storage.updateStudent(user.id, patch);

    const updatedUser = {
      ...updated,
      role: user.role,
    };

    setUser(updatedUser);

    return updatedUser;
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        authLoading,
        register,
        login,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}