import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AdminShell from "../components/AdminShell";
import { useToast } from "../context/ToastContext";
import { hasApiSession } from "../api/lmsApi";
import { addStudent, deleteStudent, getStudents, updateStudent } from "../lib/storage";
import { API_BASE_URL } from "../services/api";

const emptyForm = { name: "", email: "", phone: "", department: "", password: "" };

export default function AdminDashboard() {
  const { showToast } = useToast();
  // Admins who logged in through the Express API manage students stored in
  // MongoDB. Old demo admins (no JWT) still manage the mock API records.
  const useMongo = hasApiSession();

  const [students, setStudents] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function loadStudents() {
    try {
      setLoading(true);
      setStudents(await getStudents());
      setError("");
    } catch (err) {
      setError(err.message || "Unable to load students.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStudents();
  }, []);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function startEdit(student) {
    setEditingId(student.id);
    setForm({
      name: student.name || "",
      email: student.email || "",
      phone: student.phone || "",
      department: student.department || "",
      // MongoDB never returns passwords: leave blank to keep the current one.
      password: useMongo ? "" : student.password || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim()) {
      return showToast("Please fill name, email and mobile number.", "error");
    }
    if (!editingId && !form.password) {
      return showToast("Please set a password for the new student.", "error");
    }
    if (useMongo && form.password && (form.password.length < 12 || form.password.length > 72)) {
      return showToast("Password must be 12 to 72 characters.", "error");
    }

    const payload = {
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      phone: form.phone.trim(),
      ...(useMongo && form.department.trim() ? { department: form.department.trim() } : {}),
      ...(form.password ? { password: form.password } : {}),
    };

    try {
      setSaving(true);
      if (editingId) {
        await updateStudent(editingId, payload);
        showToast("Student updated.", "success");
      } else {
        await addStudent(payload);
        showToast("Student added.", "success");
      }
      cancelEdit();
      await loadStudents();
    } catch (err) {
      showToast(err.message || "Could not save student.", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(student) {
    const warning = useMongo
      ? `Delete ${student.name}? Their enrollments, progress, notifications and messages are deleted too.`
      : `Delete ${student.name}'s student record?`;
    if (!window.confirm(warning)) return;

    try {
      await deleteStudent(student.id);
      showToast("Student deleted.", "success");
      if (editingId === student.id) cancelEdit();
      await loadStudents();
    } catch (err) {
      showToast(err.message || "Could not delete the student.", "error");
    }
  }

  return (
    <AdminShell>
      <div className="dash-header">
        <div>
          <h1>Admin Dashboard</h1>
          <p>
            {useMongo
              ? "Manage student accounts stored in MongoDB."
              : "Manage student records using the local Mock API."}
          </p>
        </div>
        {!useMongo && <div className="admin-api-badge">API: {API_BASE_URL}</div>}
        <Link className="form-btn form-btn-inline" to="/admin/courses">Manage courses (MongoDB)</Link>
      </div>

      <div className="dash-block">
        <div className="dash-block-head">
          <h2>{editingId ? "Edit student" : "Add student"}</h2>
          {editingId && (
            <button className="link-btn" type="button" onClick={cancelEdit}>Cancel edit</button>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="field-row">
            <div className="field">
              <label htmlFor="adminStudentName">Full name</label>
              <input id="adminStudentName" name="name" value={form.name} onChange={updateField} placeholder="Student name" />
            </div>
            <div className="field">
              <label htmlFor="adminStudentEmail">Email</label>
              <input id="adminStudentEmail" name="email" type="email" value={form.email} onChange={updateField} placeholder="student@example.com" />
            </div>
          </div>
          <div className="field-row">
            <div className="field">
              <label htmlFor="adminStudentPhone">Mobile number</label>
              <input id="adminStudentPhone" name="phone" value={form.phone} onChange={updateField} placeholder="10-digit number" />
            </div>
            <div className="field">
              <label htmlFor="adminStudentPassword">Password</label>
              <input
                id="adminStudentPassword"
                name="password"
                type="password"
                value={form.password}
                onChange={updateField}
                placeholder={useMongo ? (editingId ? "Leave blank to keep current" : "At least 12 characters") : ""}
                autoComplete="new-password"
              />
            </div>
          </div>
          {useMongo && (
            <div className="field">
              <label htmlFor="adminStudentDepartment">Department (optional)</label>
              <input id="adminStudentDepartment" name="department" value={form.department} onChange={updateField} placeholder="e.g. Computer Science" />
            </div>
          )}
          <button className="form-btn form-btn-inline" type="submit" disabled={saving}>
            {saving ? "Saving..." : editingId ? "Update student" : "Add student"}
          </button>
        </form>
      </div>

      <div className="dash-block">
        <div className="dash-block-head">
          <h2>Student records ({students.length})</h2>
          <button className="link-btn" onClick={loadStudents}>Refresh</button>
        </div>

        {loading ? (
          <p className="empty-hint">Loading student records...</p>
        ) : error ? (
          <p className="err-msg visible">{error}</p>
        ) : students.length === 0 ? (
          <p className="empty-hint">No student records found.</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Student</th><th>Email</th><th>Phone</th>
                  {useMongo && <th>Department</th>}
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student.id}>
                    <td><strong>{student.name}</strong></td>
                    <td>{student.email}</td>
                    <td>{student.phone}</td>
                    {useMongo && <td>{student.department}</td>}
                    <td>
                      <div className="admin-actions">
                        <button className="course-card-btn" onClick={() => startEdit(student)}>Edit</button>
                        <button className="course-card-btn admin-delete-btn" onClick={() => handleDelete(student)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
