export default function QueueOverlay({ active, remaining, total, priority, position, agentInfo, onCancel }) {
  if (!active) return null;

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const timeStr = `${mins}:${secs.toString().padStart(2, "0")}`;
  const progress = total > 0 ? ((total - remaining) / total) * 100 : 0;
  const priorityLabel = priority === "high" ? "🔴 High Priority" : "🟡 Medium Priority";
  const approxWait = `Approx. ${Math.round(total / 60)} minute${Math.round(total / 60) > 1 ? 's' : ''}`;

  // Agent connected state
  if (agentInfo) {
    return (
      <div className="queue-overlay active">
        <div className="queue-content">
          <div className="agent-connected-card">
            <div className="agent-avatar-wrapper">👤</div>
            <div className="agent-name">{agentInfo.name}</div>
            <div className="agent-role">{agentInfo.role}</div>
            <div style={{ marginTop: "16px", fontSize: "0.82rem", color: "var(--text-secondary)" }}>
              ✅ Connected! Your conversation is being transferred...
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="queue-overlay active">
      <div className="queue-content">
        <div className="queue-icon">👤</div>
        <div className="queue-title">Connecting you with a specialist</div>
        <div className="queue-subtitle">Your issue has been flagged and a support agent is being assigned to your case.</div>
        <div className="queue-priority-info">{priorityLabel} · {approxWait}</div>
        <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: "8px" }}>
          Queue position: <strong style={{ color: "var(--accent-primary)" }}>#{position}</strong>
        </div>
        <div className="queue-timer">{timeStr}</div>
        <div className="queue-timer-label">Estimated Wait Time</div>
        <div className="queue-progress">
          <div className="queue-progress-bar" style={{ width: `${progress}%` }}></div>
        </div>
        <button className="queue-cancel-btn" onClick={onCancel}>Cancel & go back</button>
      </div>
    </div>
  );
}
