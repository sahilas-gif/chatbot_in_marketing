export default function ThinkingIndicator() {
  return (
    <div className="thinking-wrapper">
      <div className="msg-avatar" style={{ background: "linear-gradient(135deg, #8b5cf6, #6d28d9)" }}>🤖</div>
      <div className="thinking-bubble">
        <span className="brain-pulse">🧠</span>
        <span className="thinking-label">Deep thinking...</span>
        <div className="thinking-dots">
          <div className="dot"></div>
          <div className="dot"></div>
          <div className="dot"></div>
        </div>
      </div>
    </div>
  );
}
