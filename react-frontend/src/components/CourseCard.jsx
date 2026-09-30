function ProgressRing({ progress, size = 52 }) {
  const stroke = 5;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (progress / 100) * c;
  const color = progress >= 100 ? "#16a34a" : "#2563eb";

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="progress-ring">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e2e8f0" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text x="50%" y="50%" textAnchor="middle" dy="0.35em" fontSize="12" fontWeight="700" fill="#1a2e5a">
        {progress}%
      </text>
    </svg>
  );
}

export default function CourseCard({ course, onContinue, compact = false }) {
  return (
    <div className={`course-card${compact ? " compact" : ""}`}>
      <div className="course-card-icon">{course.icon}</div>
      <div className="course-card-body">
        <div className="course-card-top">
          <h3>{course.title}</h3>
          {course.status === "completed" && <span className="badge badge-done">Completed</span>}
        </div>
        <p className="course-card-meta">{course.category}</p>
        <p className="course-card-lesson">
          {course.status === "completed" ? "All lessons complete" : `Last: ${course.lastLesson}`}
        </p>
        {onContinue && (
          <button className="course-card-btn" onClick={() => onContinue(course)}>
            {course.status === "completed" ? "Review course" : "Continue learning"} →
          </button>
        )}
      </div>
      <ProgressRing progress={course.progress} />
    </div>
  );
}
