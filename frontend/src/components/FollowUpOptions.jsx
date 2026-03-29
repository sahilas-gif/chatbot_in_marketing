export default function FollowUpOptions({ onAnother, onEnd }) {
  return (
    <div className="options-container">
      <button className="option-card" onClick={onAnother}>
        <span className="option-icon">🔁</span>
        <span className="option-text">I need help with another order</span>
        <span className="option-arrow">›</span>
      </button>
      <button className="option-card" onClick={onEnd}>
        <span className="option-icon">✅</span>
        <span className="option-text">That's all, thank you!</span>
        <span className="option-arrow">›</span>
      </button>
    </div>
  );
}
