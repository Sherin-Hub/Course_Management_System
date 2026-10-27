export default function StatCard({ icon, value, label }) {
  return (
    <div className="dash-stat-card">
      <div className="dsc-icon">{icon}</div>
      <div className="dsc-num">{value}</div>
      <div className="dsc-lbl">{label}</div>
    </div>
  );
}
