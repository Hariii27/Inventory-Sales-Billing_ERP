export default function StatCard({ label, value, tone = '' }) {
  return (
    <div className={`card stat ${tone}`}>
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
    </div>
  );
}