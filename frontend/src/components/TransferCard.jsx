import { useState } from "react";

export default function TransferCard({ data, onConnect }) {
  const [clicked, setClicked] = useState(false);

  const handleClick = () => {
    if (clicked) return;
    setClicked(true);
    onConnect(data.queueTime, data.priority);
  };

  return (
    <div className="transfer-card">
      <div className="transfer-card-header">
        <span>👤</span>
        <span className="transfer-card-title">Transfer to Support Specialist</span>
        <span className={`priority-badge ${data.priority}`} style={{ marginLeft: "auto" }}>
          {data.priorityLabel}
        </span>
      </div>
      <div className="transfer-card-body">
        Estimated wait time: <strong>{data.waitText}</strong><br />
        Your issue details will be shared with the agent.
      </div>
      <button className="transfer-btn" onClick={handleClick} disabled={clicked}>
        {clicked ? "Connecting..." : "Connect me now →"}
      </button>
    </div>
  );
}
