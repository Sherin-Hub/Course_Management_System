import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    showToast("Logged out. See you soon!", "info");
    navigate("/login");
  }

  return (
    <nav>
      <Link to="/" className="nav-brand">
        <div className="brand-dot">L</div>
        LMS Portal
      </Link>
      <ul className="nav-links">
        <li><Link to="/">Home</Link></li>
        {user ? (
          <>
            <li><Link to="/dashboard" className="nav-btn nav-primary">Dashboard</Link></li>
            <li><button className="nav-btn nav-ghost" onClick={handleLogout}>Log out</button></li>
          </>
        ) : (
          <>
            <li><Link to="/register">Register</Link></li>
            <li><Link to="/login" className="nav-btn">Login</Link></li>
          </>
        )}
      </ul>
    </nav>
  );
}
