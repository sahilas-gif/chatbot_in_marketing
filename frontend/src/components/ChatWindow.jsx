import { useRef, useEffect, useState } from "react";
import MessageBubble from "./MessageBubble";
import ThinkingIndicator from "./ThinkingIndicator";
import OptionCards from "./OptionCards";
import TransferCard from "./TransferCard";
import ResolutionCard from "./ResolutionCard";
import FollowUpOptions from "./FollowUpOptions";

export default function ChatWindow({
  messages, isThinking, showOptions, transferCard, resolutionCard, showFollowUp,
  onSendMessage, onIssueSelect, onMore, onBack, onEscalation, onConnect, onAnother, onEnd, onRefresh
}) {
  const [inputText, setInputText] = useState("");
  const chatRef = useRef(null);
  const textareaRef = useRef(null);

  // Auto-scroll
  useEffect(() => {
    if (chatRef.current) {
      requestAnimationFrame(() => {
        chatRef.current.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" });
      });
    }
  }, [messages, isThinking, showOptions, transferCard, resolutionCard, showFollowUp]);

  const handleSend = () => {
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText("");
    if (textareaRef.current) textareaRef.current.style.height = "42px";
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e) => {
    setInputText(e.target.value);
    e.target.style.height = "42px";
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
  };

  return (
    <main className="chat-area">
      {/* Header */}
      <header className="chat-header">
        <button className="sidebar-toggle" id="sidebar-toggle">☰</button>
        <div className="header-avatar">🤖</div>
        <div className="header-info">
          <div className="header-name">QuickBite Assistant</div>
          <div className="header-status">● Online — Ready to help</div>
        </div>
        <button className="header-action" onClick={onRefresh} title="Restart conversation">↻</button>
      </header>

      {/* Messages */}
      <div className="chat-messages" ref={chatRef} id="chat-messages">
        {messages.map(msg => (
          <MessageBubble key={msg.id} msg={msg} />
        ))}

        {isThinking && <ThinkingIndicator />}

        {resolutionCard && <ResolutionCard label={resolutionCard.label} />}

        {transferCard && (
          <TransferCard data={transferCard} onConnect={onConnect} />
        )}

        {showOptions && (
          <OptionCards
            mode={showOptions}
            onSelect={onIssueSelect}
            onMore={onMore}
            onBack={onBack}
            onEscalation={onEscalation}
          />
        )}

        {showFollowUp && (
          <FollowUpOptions onAnother={onAnother} onEnd={onEnd} />
        )}
      </div>

      {/* Input */}
      <div className="input-area">
        <div className="input-wrapper">
          <textarea
            ref={textareaRef}
            id="user-input"
            placeholder="Describe your issue or type a message..."
            rows="1"
            value={inputText}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
          />
          <button className="send-btn" id="send-btn" onClick={handleSend} disabled={!inputText.trim()}>
            <span className="send-icon">↑</span>
          </button>
        </div>
        <div className="input-hint">Press Enter to send · Shift+Enter for new line</div>
      </div>
    </main>
  );
}
