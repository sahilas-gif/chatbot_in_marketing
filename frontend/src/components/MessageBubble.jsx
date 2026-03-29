export default function MessageBubble({ msg }) {
  if (msg.type === "divider") {
    return <div className="date-divider"><span>{msg.text}</span></div>;
  }

  if (msg.type === "system") {
    return (
      <div className="system-message">
        <span className={`system-message-pill ${msg.systemType || ""}`}>{msg.text}</span>
      </div>
    );
  }

  const isBot = msg.type === "bot";
  return (
    <div className={`message-wrapper ${msg.type}`}>
      <div className="msg-avatar">{isBot ? "🤖" : "👤"}</div>
      <div className="msg-content">
        <div className="msg-bubble" dangerouslySetInnerHTML={{ __html: msg.text }} />
        <span className="msg-time">{msg.time}</span>
      </div>
    </div>
  );
}
