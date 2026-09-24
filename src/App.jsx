import { Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";

/*
 * Every route uses the ORIGINAL .html filename. script.js reads
 * `location.pathname` to decide which page it's on (both for the
 * DOMContentLoaded dispatcher and for every `location.href = "x.html"`
 * redirect it does after login/register/logout/reset). Keeping the same
 * filenames as routes means the untouched script just works.
 */
function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/index.html" element={<Home />} />

      <Route path="/login.html" element={<Login />} />
      <Route path="/register.html" element={<Register />} />

      <Route path="/forgot-password.html" element={<ForgotPassword />} />
      <Route path="/reset-password.html" element={<ResetPassword />} />

      <Route path="/dashboard.html" element={<Dashboard />} />

      {/* Fallback */}
      <Route path="*" element={<Home />} />
    </Routes>
  );
}

export default App;
