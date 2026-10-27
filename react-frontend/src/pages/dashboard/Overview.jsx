import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getActivity, getCourses } from "../../lib/storage";
import StatCard from "../../components/StatCard";
import CourseCard from "../../components/CourseCard";

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.max(0, Math.round(diff / 60000));
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

export default function Overview() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        setLoading(true);
        const [courseData, activityData] = await Promise.all([
          getCourses(user.email),
          getActivity(user.email),
        ]);
        if (active) {
          setCourses(courseData);
          setActivity(activityData);
          setError("");
        }
      } catch (err) {
        if (active) setError("Unable to load your dashboard. Please try again.");
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, [user.email]);

  if (loading) return <div className="dash-loading">Loading your dashboard...</div>;
  if (error) return <div className="dash-error">{error}</div>;

  const completed = courses.filter((c) => c.status === "completed").length;
  const avgProgress = courses.length
    ? Math.round(courses.reduce((s, c) => s + c.progress, 0) / courses.length)
    : 0;
  const inProgress = courses.filter((c) => c.status !== "completed").slice(0, 3);

  return (
    <>
      <div className="dash-header">
        <div>
          <h1>Welcome back, {user.name.split(" ")[0]} 👋</h1>
          <p>Here's what's happening with your learning today.</p>
        </div>
      </div>

      <div className="dash-stats">
        <StatCard icon="📚" value={courses.length} label="Enrolled courses" />
        <StatCard icon="✅" value={completed} label="Completed" />
        <StatCard icon="📈" value={`${avgProgress}%`} label="Avg. progress" />
        <StatCard icon="📜" value={completed} label="Certificates" />
      </div>

      <div className="dash-block">
        <div className="dash-block-head">
          <h2>Continue learning</h2>
          <button className="link-btn" onClick={() => navigate("/dashboard/courses")}>
            View all courses →
          </button>
        </div>
        <div className="course-list">
          {inProgress.length === 0 && (
            <p className="empty-hint">You're all caught up — every course is complete 🎉</p>
          )}
          {inProgress.map((c) => (
            <CourseCard key={c.id} course={c} onContinue={() => navigate("/dashboard/courses")} compact />
          ))}
        </div>
      </div>

      <div className="dash-block">
        <div className="dash-block-head"><h2>Recent activity</h2></div>
        {activity.length === 0 ? (
          <p className="empty-hint">No activity yet.</p>
        ) : (
          <ul className="activity-list">
            {activity.map((a) => (
              <li key={a.id}>
                <span className="activity-dot" />
                <span className="activity-text">{a.text}</span>
                <span className="activity-time">{timeAgo(a.time)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
