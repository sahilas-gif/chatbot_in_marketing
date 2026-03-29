export default function ResolutionCard({ label }) {
  return (
    <div className="resolution-card">
      <div className="resolution-card-header">
        <span>✅</span> Issue Resolved
        <span className="priority-badge low" style={{ marginLeft: "auto" }}>🟢 Resolved</span>
      </div>
      <p>Your <strong>{label.toLowerCase()}</strong> issue has been handled by our AI system. Credits/refunds will be applied automatically.</p>
    </div>
  );
}
