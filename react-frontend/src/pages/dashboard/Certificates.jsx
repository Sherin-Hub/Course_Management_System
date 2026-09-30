import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { getCourses } from "../../lib/storage";

function CertificateModal({ course, name, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        <div className="certificate">
          <div className="certificate-eyebrow">Certificate of Completion</div>
          <div className="certificate-brand">
            <div className="brand-dot">L</div> LMS Portal
          </div>
          <p className="certificate-line">This certifies that</p>
          <h2 className="certificate-name">{name}</h2>
          <p className="certificate-line">has successfully completed</p>
          <h3 className="certificate-course">{course.title}</h3>
          <p className="certificate-date">
            Issued {new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        <button className="form-btn form-btn-inline" onClick={() => window.print()}>
          🖨️ Print / Save as PDF
        </button>
      </div>
    </div>
  );
}

export default function Certificates() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    getCourses(user.email)
      .then((data) => {
        if (active) setCourses(data);
      })
      .catch(() => {
        if (active) setError("Unable to load certificates.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [user.email]);

  if (loading) return <div className="dash-loading">Loading certificates...</div>;
  if (error) return <div className="dash-error">{error}</div>;

  const completed = courses.filter((c) => c.status === "completed");
  const inProgress = courses.filter((c) => c.status !== "completed");

  return (
    <>
      <div className="dash-header">
        <div>
          <h1>Certificates</h1>
          <p>Earned once you finish a course — click one to view and print it.</p>
        </div>
      </div>

      <div className="dash-block">
        <div className="dash-block-head"><h2>Earned</h2></div>
        {completed.length === 0 ? (
          <p className="empty-hint">No certificates yet — finish a course from My Courses to earn one.</p>
        ) : (
          <div className="cert-grid">
            {completed.map((c) => (
              <button key={c.id} className="cert-card" onClick={() => setSelected(c)}>
                <div className="cert-card-icon">📜</div>
                <div className="cert-card-title">{c.title}</div>
                <span className="link-btn">View certificate →</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {inProgress.length > 0 && (
        <div className="dash-block">
          <div className="dash-block-head"><h2>Locked</h2></div>
          <div className="cert-grid">
            {inProgress.map((c) => (
              <div key={c.id} className="cert-card locked">
                <div className="cert-card-icon">🔒</div>
                <div className="cert-card-title">{c.title}</div>
                <span className="cert-card-hint">{c.progress}% complete</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {selected && (
        <CertificateModal course={selected} name={user.name} onClose={() => setSelected(null)} />
      )}
    </>
  );
}
