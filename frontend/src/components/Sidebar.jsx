export default function Sidebar({ onQuickAction, onEndChat }) {
  return (
    <>
      <div className="sidebar-brand">
        <div className="brand-icon">⚡</div>
        <div>
          <div className="brand-name">QuickBite</div>
          <div className="brand-subtitle">Intelligent Support System</div>
        </div>
      </div>

      <div className="sidebar-section-label">Recent Order</div>

      <div className="order-card">
        <div className="order-header">
          <span className="order-id">#QB-48291</span>
          <span className="order-status delivered">Delivered</span>
        </div>
        <div className="order-restaurant">Pizza Palace</div>
        <div className="order-details">
          2x Margherita, 1x Garlic Bread<br />
          Delivered at 2:35 PM
        </div>
      </div>

      <div className="order-card">
        <div className="order-header">
          <span className="order-id">#QB-48287</span>
          <span className="order-status in-transit">In Transit</span>
        </div>
        <div className="order-restaurant">Royal Biryani House</div>
        <div className="order-details">
          1x Dum Gosht Biryani<br />
          ETA: 15 mins
        </div>
      </div>

      <div className="sidebar-section-label">Quick Actions</div>

      <button className="quick-action-btn" onClick={() => onQuickAction("track")}>
        <span className="quick-action-icon">📍</span> Track my order
      </button>
      <button className="quick-action-btn" onClick={() => onQuickAction("refund")}>
        <span className="quick-action-icon">💰</span> Refund status
      </button>
      <button className="quick-action-btn" onClick={() => onQuickAction("history")}>
        <span className="quick-action-icon">📋</span> Order history
      </button>
      <button className="quick-action-btn" onClick={() => onQuickAction("human")}>
        <span className="quick-action-icon">👤</span> Talk to support agent
      </button>

      <button className="end-chat-btn" onClick={onEndChat}>
        ✕ End Conversation
      </button>
    </>
  );
}
