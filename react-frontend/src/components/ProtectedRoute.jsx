import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { user, authLoading } = useAuth();
  const location = useLocation();

  if (authLoading) return <div className="auth-loading">Checking your session...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === "admin" && location.pathname.startsWith("/dashboard")) {
    return <Navigate to="/admin" replace />;
  }

  return children;
}
