import { ISSUE_DATABASE } from "../data/issueDatabase";

export default function OptionCards({ mode, onSelect, onMore, onBack, onEscalation }) {
  if (mode === "escalation_choice") {
    return (
      <div className="options-container">
        <button className="option-card" onClick={() => onEscalation("continue_with_chatbot")}>
          <span className="option-icon">🤖</span>
          <span className="option-text">Continue with chatbot</span>
          <span className="option-arrow">›</span>
        </button>
        <button className="option-card" onClick={() => onEscalation("talk_to_executive")}>
          <span className="option-icon">👤</span>
          <span className="option-text">Talk with customer executive</span>
          <span className="option-arrow">›</span>
        </button>
      </div>
    );
  }

  const primaryIssues = mode === "more"
    ? ["spillage", "not_received", "rude_delivery"]
    : ["late_order", "missing_items", "poor_quality", "wrong_items", "veg_nonveg"];

  return (
    <div className="options-container">
      {primaryIssues.map(key => {
        const issue = ISSUE_DATABASE[key];
        return (
          <button key={key} className="option-card" onClick={() => onSelect(key)}>
            <span className="option-icon">{issue.icon}</span>
            <span className="option-text">{issue.label}</span>
            <span className="option-arrow">›</span>
          </button>
        );
      })}

      {mode !== "more" ? (
        <button className="more-options-btn" onClick={onMore}>
          More options...
        </button>
      ) : (
        <button className="option-card" onClick={onBack}>
          <span className="option-icon">◀️</span>
          <span className="option-text">Go back</span>
          <span className="option-arrow">›</span>
        </button>
      )}
    </div>
  );
}
