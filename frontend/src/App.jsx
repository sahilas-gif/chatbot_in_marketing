import { useState } from "react";
import Sidebar from "./components/Sidebar";
import ChatWindow from "./components/ChatWindow";
import QueueOverlay from "./components/QueueOverlay";
import useChatEngine from "./hooks/useChatEngine";
import "./App.css";

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const engine = useChatEngine();

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`} id="sidebar">
        <Sidebar
          onQuickAction={(action) => {
            setSidebarOpen(false);
            engine.handleQuickAction(action);
          }}
          onEndChat={() => {
            setSidebarOpen(false);
            engine.handleEndChat();
          }}
        />
      </aside>
      <div
        className={`sidebar-overlay ${sidebarOpen ? "active" : ""}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Chat */}
      <ChatWindow
        messages={engine.messages}
        isThinking={engine.isThinking}
        showOptions={engine.showOptions}
        transferCard={engine.transferCard}
        resolutionCard={engine.resolutionCard}
        showFollowUp={engine.showFollowUp}
        onSendMessage={engine.handleSendMessage}
        onIssueSelect={engine.handleIssueSelection}
        onMore={engine.handleMoreOptions}
        onBack={engine.handleBackOptions}
        onEscalation={engine.handleEscalationChoice}
        onConnect={engine.startQueue}
        onAnother={engine.handleAnotherOrder}
        onEnd={engine.handleEndChat}
        onRefresh={engine.restartConversation}
      />

      {/* Queue Overlay */}
      <QueueOverlay
        active={engine.queueActive}
        remaining={engine.queueRemaining}
        total={engine.queueTotal}
        priority={engine.queuePriority}
        position={engine.queuePosition}
        agentInfo={engine.agentConnectedInfo}
        onCancel={engine.cancelQueue}
      />
    </div>
  );
}
