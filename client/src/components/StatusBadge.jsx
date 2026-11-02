const tone = { draft: 'warn', confirmed: 'ok', cancelled: 'bad' };

export default function StatusBadge({ status }) {
  return <span className={`badge ${tone[status] || ''}`}>{status}</span>;
}