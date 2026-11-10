import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import {
  availableCoursesToAdd,
  enrollInCourse,
  getCourses,
  updateCourseProgress,
} from "../../lib/storage";
import CourseCard from "../../components/CourseCard";

const FILTERS = ["all", "in-progress", "completed"];

export default function MyCourses() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [courses, setCourses] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [filter, setFilter] = useState("all");
  const [showCatalog, setShowCatalog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadCourses() {
    try {
      setLoading(true);
      const [courseData, catalogData] = await Promise.all([
        getCourses(user.email),
        availableCoursesToAdd(user.email),
      ]);
      setCourses(courseData);
      setCatalog(catalogData);
      setError("");
    } catch {
      setError("Unable to load courses. Please make sure the Mock API is running.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCourses();
  }, [user.email]);

  async function handleContinue(course) {
    try {
      setActionLoading(true);
      const bump = course.status === "completed" ? 0 : Math.min(100, course.progress + 15);
      const updated = await updateCourseProgress(user.email, course.id, bump);
      setCourses(updated);
      if (bump >= 100) {
        showToast(`🎉 You completed "${course.title}"!`, "success");
      } else {
        showToast(`Progress saved — ${bump}% on "${course.title}"`, "info");
      }
    } catch {
      showToast("Could not save progress.", "error");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleEnroll(courseId, title) {
    try {
      setActionLoading(true);
      const updated = await enrollInCourse(user.email, courseId);
      setCourses(updated);
      setCatalog(await availableCoursesToAdd(user.email));
      showToast(`Enrolled in "${title}"`, "success");
      setShowCatalog(false);
    } catch {
      showToast("Could not enroll in this course.", "error");
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) return <div className="dash-loading">Loading your courses...</div>;
  if (error) return <div className="dash-error">{error}</div>;

  const visible = courses.filter((c) => filter === "all" || c.status === filter);

  return (
    <>
      <div className="dash-header">
        <div>
          <h1>My Courses</h1>
          <p>Everything you're enrolled in, in one place.</p>
        </div>
        <button
          className="form-btn form-btn-inline"
          onClick={() => setShowCatalog((s) => !s)}
          disabled={actionLoading}
        >
          {showCatalog ? "Close catalog" : "+ Enroll in a course"}
        </button>
      </div>

      {showCatalog && (
        <div className="dash-block">
          <div className="dash-block-head"><h2>Course catalog</h2></div>
          {catalog.length === 0 ? (
            <p className="empty-hint">You're enrolled in every available course already.</p>
          ) : (
            <div className="catalog-grid">
              {catalog.map((c) => (
                <div key={c.id} className="catalog-item">
                  <div className="catalog-icon">{c.icon}</div>
                  <div>
                    <h4>{c.title}</h4>
                    <p>{c.category}</p>
                  </div>
                  <button
                    className="course-card-btn"
                    onClick={() => handleEnroll(c.id, c.title)}
                    disabled={actionLoading}
                  >
                    Enroll
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="filter-row">
        {FILTERS.map((f) => (
          <button
            key={f}
            className={`filter-pill${filter === f ? " active" : ""}`}
            onClick={() => setFilter(f)}
          >
            {f === "all" ? "All" : f === "in-progress" ? "In progress" : "Completed"}
          </button>
        ))}
      </div>

      <div className="course-grid">
        {visible.length === 0 && <p className="empty-hint">Nothing here yet.</p>}
        {visible.map((c) => (
          <CourseCard key={c.id} course={c} onContinue={handleContinue} />
        ))}
      </div>
    </>
  );
}
