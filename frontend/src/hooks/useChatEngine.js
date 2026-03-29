import { useState, useRef, useCallback, useEffect } from "react";
import { ISSUE_DATABASE, AGENTS, detectHumanTransferKeywords, classifyIssueFromText } from "../data/issueDatabase";
import { sendChatMessage } from "../services/api";

function getTimeString() {
  return new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

export default function useChatEngine() {
  const [messages, setMessages] = useState([]);
  const [conversationState, setConversationState] = useState("greeting");
  const [currentIssue, setCurrentIssue] = useState(null);
  const [isThinking, setIsThinking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showOptions, setShowOptions] = useState(null); // null | "primary" | "more"
  const [showFollowUp, setShowFollowUp] = useState(false);
  const [transferCard, setTransferCard] = useState(null);
  const [resolutionCard, setResolutionCard] = useState(null);

  // Queue state
  const [queueActive, setQueueActive] = useState(false);
  const [queueRemaining, setQueueRemaining] = useState(0);
  const [queueTotal, setQueueTotal] = useState(0);
  const [queuePriority, setQueuePriority] = useState("high");
  const [queuePosition, setQueuePosition] = useState(1);
  const [agentConnectedInfo, setAgentConnectedInfo] = useState(null);

  const chatHistoryRef = useRef([]);
  const queueTimerRef = useRef(null);
  const earlyConnectRef = useRef(0);
  const cancelledRef = useRef(false);
  const pendingTimeoutsRef = useRef([]);

  // ─── Tracked timeout ────────────────────────────────────────
  const safeTimeout = useCallback((fn, ms) => {
    const id = setTimeout(() => {
      pendingTimeoutsRef.current = pendingTimeoutsRef.current.filter(t => t !== id);
      if (!cancelledRef.current) fn();
    }, ms);
    pendingTimeoutsRef.current.push(id);
    return id;
  }, []);

  const delay = useCallback((ms) => new Promise(resolve => {
    const id = setTimeout(() => {
      pendingTimeoutsRef.current = pendingTimeoutsRef.current.filter(t => t !== id);
      resolve();
    }, ms);
    pendingTimeoutsRef.current.push(id);
  }), []);

  const clearAllPending = useCallback(() => {
    pendingTimeoutsRef.current.forEach(id => clearTimeout(id));
    pendingTimeoutsRef.current = [];
    if (queueTimerRef.current) {
      clearInterval(queueTimerRef.current);
      queueTimerRef.current = null;
    }
  }, []);

  // ─── Add message ─────────────────────────────────────────
  const addMessage = useCallback((type, text, extra = {}) => {
    setMessages(prev => [...prev, {
      id: Date.now() + Math.random(),
      type, // "bot" | "user" | "system" | "divider"
      text,
      time: getTimeString(),
      ...extra
    }]);
  }, []);

  // ─── Issue selection ─────────────────────────────────────
  const handleIssueSelection = useCallback(async (issueKey, skipMessage = false) => {
    if (isProcessing) return;
    setIsProcessing(true);
    cancelledRef.current = false;

    const issue = ISSUE_DATABASE[issueKey];
    setCurrentIssue({ key: issueKey, ...issue });
    setConversationState("resolving");
    setShowOptions(null);
    setShowFollowUp(false);
    setTransferCard(null);
    setResolutionCard(null);

    if (!skipMessage) {
      addMessage("user", issue.label);
    }

    await delay(800);
    if (cancelledRef.current) { setIsProcessing(false); return; }
    setIsThinking(true);

    await delay(6000); // 6 second deep thinking for selected issues
    if (cancelledRef.current) { setIsProcessing(false); return; }
    setIsThinking(false);

    if (issue.botCanSolve) {
      await delay(400);
      if (cancelledRef.current) { setIsProcessing(false); return; }
      addMessage("bot", issue.resolution.replace(/\n/g, "<br>"));

      await delay(600);
      if (cancelledRef.current) { setIsProcessing(false); return; }
      setResolutionCard({ label: issue.label });

      await delay(800);
      if (cancelledRef.current) { setIsProcessing(false); return; }
      addMessage("bot", "Is there anything else I can help you with?");
      await delay(400);
      setShowFollowUp(true);
    } else {
      await delay(400);
      if (cancelledRef.current) { setIsProcessing(false); return; }
      addMessage("bot",
        `Since this is a serious concern, I can connect you with a customer executive immediately, or I can try to help you right now. What would you prefer?`
      );

      await delay(800);
      if (cancelledRef.current) { setIsProcessing(false); return; }
      setShowOptions("escalation_choice");
    }

    setIsProcessing(false);
  }, [isProcessing, addMessage, delay]);

  // ─── Escalation Choice ──────────────────────────────────
  const handleEscalationChoice = useCallback(async (choice) => {
    if (isProcessing || !currentIssue) return;
    setIsProcessing(true);
    setShowOptions(null);

    if (choice === "talk_to_executive") {
      addMessage("user", "Talk with customer executive");
      await delay(400);
      if (cancelledRef.current) { setIsProcessing(false); return; }
      addMessage("bot",
        `I understand. Let me explain what happens next:<br><br>${currentIssue.transferReason}<br><br>Given the nature of this issue, I'm connecting you with a specialist who can provide the resolution you deserve.`
      );

      await delay(800);
      if (cancelledRef.current) { setIsProcessing(false); return; }
      setTransferCard({
        priority: currentIssue.priority,
        queueTime: currentIssue.queueTime,
        priorityLabel: currentIssue.priority === "high" ? "🔴 High Priority" : "🟡 Medium Priority",
        waitText: currentIssue.queueTime === 60 ? "Approx. 1 minute" : "Approx. 2 minutes"
      });
      setIsProcessing(false);

    } else if (choice === "continue_with_chatbot") {
      addMessage("user", "Continue with chatbot");
      await delay(400);
      if (cancelledRef.current) { setIsProcessing(false); return; }

      setIsThinking(true);
      await delay(1200);
      if (cancelledRef.current) { setIsProcessing(false); setIsThinking(false); return; }
      
      setIsThinking(false);
      addMessage("bot", `I'm here to help with your ${currentIssue.label.toLowerCase()}. Could you please provide a few details about what went wrong?`);
      
      chatHistoryRef.current.push({ role: "user", text: `I selected the issue: ${currentIssue.label}. I will now describe the problem.` });
      chatHistoryRef.current.push({ role: "model", text: "I understand. Please describe the problem so I can help you." });

      setConversationState("resolving");
      setIsProcessing(false);
    }
  }, [isProcessing, currentIssue, addMessage, delay]);

  // ─── Queue timer ────────────────────────────────────────
  const startQueue = useCallback((totalSeconds, priority) => {
    if (conversationState === "transferring") return;

    setConversationState("transferring");
    cancelledRef.current = false;
    setTransferCard(null);
    setQueueActive(true);
    setQueueTotal(totalSeconds);
    setQueueRemaining(totalSeconds);
    setQueuePriority(priority);
    setAgentConnectedInfo(null);

    // Random start position 3-9, will decrease to #1 before connection
    const startPosition = Math.floor(Math.random() * 7) + 3;
    setQueuePosition(startPosition);

    const earlyConnect = Math.floor(totalSeconds * (0.1 + Math.random() * 0.5));
    earlyConnectRef.current = earlyConnect;

    // Calculate how many seconds between each position drop
    const activeSeconds = totalSeconds - earlyConnect; // seconds until connection
    const posDropInterval = Math.max(1, Math.floor(activeSeconds / startPosition)); // seconds per position drop

    let remaining = totalSeconds;
    let currentPos = startPosition;
    let ticksSinceLastDrop = 0;

    if (queueTimerRef.current) clearInterval(queueTimerRef.current);

    queueTimerRef.current = setInterval(() => {
      if (cancelledRef.current) {
        clearInterval(queueTimerRef.current);
        queueTimerRef.current = null;
        return;
      }
      remaining--;
      ticksSinceLastDrop++;
      setQueueRemaining(remaining);

      // Decrease queue position progressively
      if (ticksSinceLastDrop >= posDropInterval && currentPos > 1) {
        currentPos--;
        ticksSinceLastDrop = 0;
        setQueuePosition(currentPos);
      }

      if (remaining <= earlyConnect || remaining <= 0) {
        clearInterval(queueTimerRef.current);
        queueTimerRef.current = null;
        if (!cancelledRef.current) {
          // Set position to #1 right before connecting
          setQueuePosition(1);

          // Agent connected
          const agent = AGENTS[Math.floor(Math.random() * AGENTS.length)];
          setAgentConnectedInfo(agent);

          safeTimeout(() => {
            if (cancelledRef.current) return;
            setQueueActive(false);
            setConversationState("connected");
            addMessage("system", `✅ ${agent.name} (${agent.role}) has joined the chat`, { systemType: "success" });

            safeTimeout(() => {
              if (cancelledRef.current) return;
              addMessage("bot",
                `Hi! I'm ${agent.name}, your dedicated support specialist. I've reviewed the details of your case.<br><br>I'm here to personally resolve this for you. Could you share a few more details so I can expedite the resolution?<br><br>For example:<br>• Your order number<br>• When this happened<br>• Any photos if applicable`
              );
              setIsProcessing(false);
            }, 800);
          }, 2000);
        }
      }
    }, 1000);
  }, [conversationState, addMessage, safeTimeout]);

  const cancelQueue = useCallback(() => {
    cancelledRef.current = true;

    if (queueTimerRef.current) {
      clearInterval(queueTimerRef.current);
      queueTimerRef.current = null;
    }
    clearAllPending();

    cancelledRef.current = false;

    setQueueActive(false);
    setAgentConnectedInfo(null);
    setConversationState("issue_select");
    setIsProcessing(false);

    addMessage("system", "⚠️ Transfer cancelled", { systemType: "warning" });
    safeTimeout(() => {
      addMessage("bot", "The transfer has been cancelled. Would you like help with something else?");
      safeTimeout(() => setShowFollowUp(true), 400);
    }, 500);
  }, [addMessage, clearAllPending, safeTimeout]);

  // ─── Send message ────────────────────────────────────────
  const handleSendMessage = useCallback(async (text) => {
    if (!text.trim() || isProcessing) return;
    setIsProcessing(true);
    cancelledRef.current = false;

    addMessage("user", text);
    setShowOptions(null);
    setShowFollowUp(false);
    setTransferCard(null);
    setResolutionCard(null);

    // 1. Check transfer keywords
    if (detectHumanTransferKeywords(text) && conversationState !== "connected" && conversationState !== "transferring") {
      await delay(600);
      if (cancelledRef.current) { setIsProcessing(false); return; }
      setIsThinking(true);
      await delay(2500);
      if (cancelledRef.current) { setIsProcessing(false); setIsThinking(false); return; }
      setIsThinking(false);

      addMessage("bot",
        "I understand you'd like to speak with a support specialist. Let me connect you right away.<br><br>Your conversation history and issue details will be shared with the agent so you don't have to repeat anything."
      );

      await delay(800);
      if (cancelledRef.current) { setIsProcessing(false); return; }
      startQueue(120, "medium");
      setIsProcessing(false);
      return;
    }

    // 2. Classify from text only if an issue hasn't been selected yet
    if (!currentIssue && conversationState !== "connected") {
      const detectedIssue = classifyIssueFromText(text);
      if (detectedIssue) {
        setIsProcessing(false);
        await handleIssueSelection(detectedIssue, true);
        return;
      }
    }

    // 3. Use Gemini API via backend
    await delay(500);
    if (cancelledRef.current) { setIsProcessing(false); return; }
    setIsThinking(true);

    // Dynamic thinking time. Fast for greetings/short, 6 sec for longer context
    const isGreeting = /^(hi|hello|hey|hii|hola|greetings)\b/i.test(text.trim());
    const isShort = text.trim().length <= 15;
    const thinkTime = (isGreeting || isShort) ? (2000 + Math.random() * 1000) : 6000;
    await delay(thinkTime);
    if (cancelledRef.current) { setIsProcessing(false); setIsThinking(false); return; }

    chatHistoryRef.current.push({ role: "user", text });
    
    try {
      const response = await sendChatMessage(chatHistoryRef.current);
      const cleanResponse = response.replace("[TRANSFER]", "").replace("\\[TRANSFER\\]", "").trim();
      chatHistoryRef.current.push({ role: "model", text: cleanResponse });

      setIsThinking(false);
      await delay(300);
      addMessage("bot", cleanResponse);

      if (response.includes("[TRANSFER]")) {
        await delay(1200);
        if (cancelledRef.current) { setIsProcessing(false); return; }
        startQueue(120, "medium");
        setIsProcessing(false);
        return;
      }

      // Only show top-level option cards if we aren't already deep inside a specific issue resolution
      if (currentIssue) {
        await delay(800);
        if (cancelledRef.current) { setIsProcessing(false); return; }
        addMessage("bot", "Is there anything else I can help you with?");
        setShowFollowUp(true);
      } else {
        await delay(600);
        if (cancelledRef.current) { setIsProcessing(false); return; }
        addMessage("bot", "Or you can quickly select your issue type:");
        await delay(400);
        setConversationState("issue_select");
        setShowOptions("primary");
      }
    } catch (apiError) {
      if (cancelledRef.current) { setIsProcessing(false); return; }
      setIsThinking(false);
      addMessage("bot", "⚠️ We're currently experiencing heavy traffic. Let me bypass the virtual assistant and connect you directly to our human support team.");
      await delay(1200);
      startQueue(120, "medium");
    }

    setIsProcessing(false);
  }, [isProcessing, conversationState, currentIssue, addMessage, delay, startQueue, handleIssueSelection]);

  // ─── Quick actions ────────────────────────────────────────
  const handleQuickAction = useCallback((action) => {
    if (isProcessing) return;

    switch (action) {
      case "track":
        addMessage("user", "Track my order");
        setIsProcessing(true);
        safeTimeout(() => {
          setIsThinking(true);
          safeTimeout(() => {
            setIsThinking(false);
            addMessage("bot", "📍 Here's your order tracking:<br><br><strong>Order #QB-48287 — Royal Biryani House</strong><br>Status: 🚗 In Transit<br>ETA: ~15 minutes<br>Delivery Partner: Ravi K.<br><br>Your food is on its way! You'll receive a notification when it arrives.");
            setIsProcessing(false);
          }, 2500);
        }, 500);
        break;
      case "refund":
        addMessage("user", "Refund status");
        setIsProcessing(true);
        safeTimeout(() => {
          setIsThinking(true);
          safeTimeout(() => {
            setIsThinking(false);
            addMessage("bot", "💰 You currently have no pending refund requests.<br><br>If you'd like to request a refund for a recent order, please select the relevant issue from the menu and I'll help you right away.");
            setIsProcessing(false);
          }, 2000);
        }, 500);
        break;
      case "history":
        addMessage("user", "Order history");
        setIsProcessing(true);
        safeTimeout(() => {
          setIsThinking(true);
          safeTimeout(() => {
            setIsThinking(false);
            addMessage("bot", "📋 Your recent orders:<br><br>1. <strong>#QB-48291</strong> — Pizza Palace · ₹649 · ✅ Delivered<br>2. <strong>#QB-48287</strong> — Royal Biryani House · ₹399 · 🚗 In Transit<br>3. <strong>#QB-48210</strong> — Burger Barn · ₹529 · ✅ Delivered<br><br>Need help with any of these orders?");
            setIsProcessing(false);
          }, 2000);
        }, 500);
        break;
      case "human":
        addMessage("user", "Talk to support agent");
        setIsProcessing(true);
        safeTimeout(async () => {
          setIsThinking(true);
          await delay(2000);
          if (cancelledRef.current) { setIsProcessing(false); setIsThinking(false); return; }
          setIsThinking(false);
          addMessage("bot", "I understand you'd like to speak with a support specialist. To connect you to the right department quickly, please select your issue or describe it:");
          await delay(800);
          if (cancelledRef.current) { setIsProcessing(false); return; }
          setConversationState("issue_select");
          setShowOptions("primary");
          setIsProcessing(false);
        }, 500);
        break;
    }
  }, [isProcessing, addMessage, safeTimeout, delay, startQueue]);

  // ─── More / Back options ────────────────────────────────
  const handleMoreOptions = useCallback(() => {
    if (isProcessing) return;
    setShowOptions(null);
    addMessage("user", "More..");
    safeTimeout(() => {
      addMessage("bot", "Here are additional issue categories:");
      safeTimeout(() => setShowOptions("more"), 300);
    }, 500);
  }, [isProcessing, addMessage, safeTimeout]);

  const handleBackOptions = useCallback(() => {
    if (isProcessing) return;
    setShowOptions(null);
    addMessage("user", "Go back");
    safeTimeout(() => {
      addMessage("bot", "No problem! Here are the main categories:");
      safeTimeout(() => setShowOptions("primary"), 300);
    }, 500);
  }, [isProcessing, addMessage, safeTimeout]);

  // ─── Follow-up ─────────────────────────────────────────
  const handleAnotherOrder = useCallback(() => {
    if (isProcessing) return;
    setShowFollowUp(false);
    setResolutionCard(null);
    addMessage("user", "I need help with another order");
    setConversationState("issue_select");
    setCurrentIssue(null);
    safeTimeout(() => {
      addMessage("bot", "How can we help you with your order?");
      safeTimeout(() => setShowOptions("primary"), 400);
    }, 600);
  }, [isProcessing, addMessage, safeTimeout]);

  const handleEndChat = useCallback(() => {
    if (isProcessing) return;
    setShowFollowUp(false);
    setResolutionCard(null);
    addMessage("user", "That's all, thank you!");
    setConversationState("ended");
    clearAllPending();
    cancelledRef.current = true;

    safeTimeout(() => addMessage("system", "✅ This conversation has been closed", { systemType: "success" }), 500);
    safeTimeout(() => addMessage("system", "Thank you for contacting QuickBite Support!", { systemType: "info" }), 1000);
    safeTimeout(() => addMessage("bot", "Your feedback matters to us! We hope we resolved your concern. Have a great day! 😊"), 1600);
  }, [isProcessing, addMessage, clearAllPending, safeTimeout]);

  // ─── Restart ────────────────────────────────────────────
  const restartConversation = useCallback(() => {
    clearAllPending();
    cancelledRef.current = false;
    setIsProcessing(false);
    setIsThinking(false);
    setMessages([]);
    chatHistoryRef.current = [];
    setConversationState("greeting");
    setCurrentIssue(null);
    setShowOptions(null);
    setShowFollowUp(false);
    setTransferCard(null);
    setResolutionCard(null);
    setQueueActive(false);
    setAgentConnectedInfo(null);

    setMessages([{ id: 0, type: "divider", text: "Today", time: "" }]);

    safeTimeout(() => {
      addMessage("bot", "Hii 👋<br>I'm your assistant from <strong>Pizza Palace</strong>. Thank you for ordering the <strong>Cheese Burst Margherita Pizza</strong> (Order #QB-85492).");
    }, 400);

    safeTimeout(() => {
      addMessage("bot", "How can we help you with your order?");
    }, 1200);

    safeTimeout(() => {
      setConversationState("issue_select");
      setShowOptions("primary");
    }, 1800);
  }, [clearAllPending, addMessage, safeTimeout]);

  // ─── Init ───────────────────────────────────────────────
  useEffect(() => {
    restartConversation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    messages,
    isThinking,
    isProcessing,
    showOptions,
    showFollowUp,
    transferCard,
    resolutionCard,
    queueActive,
    queueRemaining,
    queueTotal,
    queuePriority,
    queuePosition,
    agentConnectedInfo,
    conversationState,
    handleIssueSelection,
    handleEscalationChoice,
    handleSendMessage,
    handleQuickAction,
    handleMoreOptions,
    handleBackOptions,
    handleAnotherOrder,
    handleEndChat,
    startQueue,
    cancelQueue,
    restartConversation,
  };
}
