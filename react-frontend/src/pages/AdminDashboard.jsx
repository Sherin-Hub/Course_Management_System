import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { addStudent, deleteStudent, getStudents, updateStudent } from "../lib/storage";

const emptyForm = { name: "", email: "", phone: "", password: "student123" };

function initialsOf(name = "") {
  return name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join("");
}

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
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
    } catch {
      setError("Unable to load students. Please make sure the Mock API is running.");
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
      password: student.password || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim() || !form.password) {
      return showToast("Please fill all student fields.", "error");
    }

    try {
      setSaving(true);
      if (editingId) {
        await updateStudent(editingId, {
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          phone: form.phone.trim(),
          password: form.password,
        });
        showToast("Student updated.", "success");
      } else {
        await addStudent({
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          phone: form.phone.trim(),
          password: form.password,
        });
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
    if (!window.confirm(`Delete ${student.name}'s student record?`)) return;

    try {
      await deleteStudent(student.id);
      showToast("Student deleted.", "success");
      await loadStudents();
    } catch {
      showToast("Could not delete the student.", "error");
    }
  }

  async function handleLogout() {
    logout();
  }

  return (
    <div className="dash-shell">
      <aside className="dash-sidebar">
        <div className="dash-user">
          <div className="dash-avatar">{initialsOf(user?.name)}</div>
          <div>
            <div className="dash-user-name">{user?.name}</div>
            <div className="dash-user-role">Administrator</div>
          </div>
        </div>
        <nav className="dash-nav">
          <div className="admin-nav-current">🛡️ Student Management</div>
          <button type="button" className="logout-link" onClick={handleLogout}>↩ Log out</button>
        </nav>
      </aside>

      <main className="dash-main">
        <div className="dash-header">
          <div>
            <h1>Admin Dashboard</h1>
            <p>Manage student records using the local Mock API.</p>
          </div>
          <div className="admin-api-badge">API: http://localhost:5000</div>
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
                <input id="adminStudentPassword" name="password" type="password" value={form.password} onChange={updateField} />
              </div>
            </div>
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
                  <tr><th>Student</th><th>Email</th><th>Phone</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <tr key={student.id}>
                      <td><strong>{student.name}</strong></td>
                      <td>{student.email}</td>
                      <td>{student.phone}</td>
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
      </main>
    </div>
  );
}
