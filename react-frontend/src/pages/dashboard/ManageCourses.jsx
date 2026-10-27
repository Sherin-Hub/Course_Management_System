import { useEffect, useState } from "react";
import { useToast } from "../../context/ToastContext";
import {
  createCourse,
  deleteCourse,
  fetchCourses,
  updateCourse,
} from "../../api/courseApi";

const emptyForm = { title: "", icon: "", category: "" };

function messageFrom(err, fallback) {
  if (err.response?.status === 401) {
    return "Your session has expired. Please log in again.";
  }
  return err.response?.data?.message || fallback;
}

export default function ManageCourses() {
  const { showToast } = useToast();
  const [courses, setCourses] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function loadCourses() {
    try {
      setLoading(true);
      setCourses(await fetchCourses());
      setError("");
    } catch (err) {
      setError(messageFrom(err, "Unable to load courses. Please make sure the backend is running."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCourses();
  }, []);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function startEdit(course) {
    setEditingId(course.id);
    setForm({ title: course.title, icon: course.icon || "", category: course.category });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!form.title.trim() || !form.category.trim()) {
      return showToast("Course title and category are required.", "error");
    }

    const payload = {
      title: form.title.trim(),
      category: form.category.trim(),
      icon: form.icon.trim(),
    };

    try {
      setSaving(true);
      if (editingId) {
        await updateCourse(editingId, payload);
        showToast("Course updated.", "success");
      } else {
        await createCourse(payload);
        showToast("Course created.", "success");
      }
      cancelEdit();
      await loadCourses();
    } catch (err) {
      showToast(messageFrom(err, "Could not save the course."), "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(course) {
    if (!window.confirm(`Delete "${course.title}"?`)) return;
    try {
      await deleteCourse(course.id);
      showToast("Course deleted.", "success");
      if (editingId === course.id) cancelEdit();
      await loadCourses();
    } catch (err) {
      showToast(messageFrom(err, "Could not delete the course."), "error");
    }
  }

  return (
    <>
      <div className="dash-header">
        <div>
          <h1>Manage Courses</h1>
          <p>Viewing courses is public. Creating, updating and deleting needs your login token.</p>
        </div>
      </div>

      <div className="dash-block">
        <div className="dash-block-head">
          <h2>{editingId ? "Edit course" : "Add course"}</h2>
          {editingId && (
            <button className="link-btn" type="button" onClick={cancelEdit}>Cancel edit</button>
          )}
        </div>
        <form onSubmit={handleSubmit}>
          <div className="field-row">
            <div className="field">
              <label htmlFor="courseTitle">Title</label>
              <input id="courseTitle" name="title" value={form.title} onChange={updateField} placeholder="e.g. Intro to Cloud Computing" />
            </div>
            <div className="field">
              <label htmlFor="courseCategory">Category</label>
              <input id="courseCategory" name="category" value={form.category} onChange={updateField} placeholder="e.g. Technology" />
            </div>
          </div>
          <div className="field">
            <label htmlFor="courseIcon">Icon (emoji, optional)</label>
            <input id="courseIcon" name="icon" value={form.icon} onChange={updateField} placeholder="📘" />
          </div>
          <button className="form-btn form-btn-inline" type="submit" disabled={saving}>
            {saving ? "Saving..." : editingId ? "Update course" : "Add course"}
          </button>
        </form>
      </div>

      <div className="dash-block">
        <div className="dash-block-head">
          <h2>All courses ({courses.length})</h2>
          <button className="link-btn" onClick={loadCourses}>Refresh</button>
        </div>

        {loading ? (
          <p className="empty-hint">Loading courses...</p>
        ) : error ? (
          <p className="err-msg visible">{error}</p>
        ) : courses.length === 0 ? (
          <p className="empty-hint">No courses found.</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr><th>Course</th><th>Category</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {courses.map((course) => (
                  <tr key={course.id}>
                    <td><strong>{course.icon} {course.title}</strong></td>
                    <td>{course.category}</td>
                    <td>
                      <div className="admin-actions">
                        <button className="course-card-btn" onClick={() => startEdit(course)}>Edit</button>
                        <button className="course-card-btn admin-delete-btn" onClick={() => handleDelete(course)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
