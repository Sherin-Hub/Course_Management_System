import AdminShell from "../components/AdminShell";
import ManageCourses from "./dashboard/ManageCourses";

// Admin-only page at /admin/courses. (It used to live under /dashboard, but
// ProtectedRoute sends every admin away from /dashboard/*, so the button
// "Manage courses" bounced straight back to /admin.)
export default function AdminCourses() {
  return (
    <AdminShell>
      <ManageCourses />
    </AdminShell>
  );
}
