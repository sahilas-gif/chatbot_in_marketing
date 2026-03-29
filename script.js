/* ═══════════════════════════════════════════════════════════════════
   QUICKBITE SUPPORT — INTELLIGENT CUSTOMER ASSISTANCE ENGINE
   ═══════════════════════════════════════════════════════════════════
   Features:
   1. Gemini API integration with deep thinking system prompt
   2. Keyword-based human transfer detection
   3. Issue classification & priority queue system
   4. Interactive option cards
   5. Simulated human agent transfer with countdown
   ═══════════════════════════════════════════════════════════════════ */

// ─── CONFIG ───────────────────────────────────────────────────────
const API_KEY = "AIzaSyCQHKo-UpRPLBu5Kyvz8MfhcADm6-fZc_k";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

// ─── DOM REFS ─────────────────────────────────────────────────────
const chatMessages = document.getElementById("chat-messages");
const userInput = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");
const queueOverlay = document.getElementById("queue-overlay");
const queueContent = document.getElementById("queue-content");
const sidebar = document.getElementById("sidebar");
const sidebarOverlay = document.getElementById("sidebar-overlay");
const sidebarToggle = document.getElementById("sidebar-toggle");
const refreshBtn = document.getElementById("btn-refresh");
const endChatBtn = document.getElementById("end-chat-btn");

// ─── STATE ────────────────────────────────────────────────────────
let chatHistory = [];
let conversationState = "greeting"; // greeting | issue_select | resolving | transferring | connected | ended
let currentIssue = null;
let queueTimerId = null;
let queueCancelled = false;        // flag to kill all pending async work after cancel
let pendingTimeouts = [];           // track ALL setTimeouts so we can nuke them
let isProcessing = false;           // prevent double-clicks / double-sends

// Helper: tracked setTimeout that can be cleared on reset/cancel
function safeTimeout(fn, ms) {
  const id = setTimeout(() => {
    pendingTimeouts = pendingTimeouts.filter(t => t !== id);
    if (!queueCancelled) fn();
  }, ms);
  pendingTimeouts.push(id);
  return id;
}

// Helper: cancellable delay
function delay(ms) {
  return new Promise((resolve, reject) => {
    const id = setTimeout(() => {
      pendingTimeouts = pendingTimeouts.filter(t => t !== id);
      resolve();
    }, ms);
    pendingTimeouts.push(id);
  });
}

// Kill every pending timeout
function clearAllPending() {
  pendingTimeouts.forEach(id => clearTimeout(id));
  pendingTimeouts = [];
  if (queueTimerId) { clearInterval(queueTimerId); queueTimerId = null; }
}

// ─── ISSUE CLASSIFICATION ENGINE ─────────────────────────────────
const ISSUE_DATABASE = {
  late_order: {
    label: "Late / delayed order",
    icon: "⏰",
    priority: "low",
    queueTime: 0,
    botCanSolve: true,
    keywords: ["late", "delay", "delayed", "slow", "taking long", "not arrived", "waiting", "where is my order", "taking too long", "eta"],
    resolution: `I completely understand how frustrating a delayed order can be. Let me look into this for you right away.\n\nHere's what I've found and what we're doing:\n\n✅ Your order is currently being prepared/in transit\n✅ I've flagged this with our logistics team for priority routing\n✅ You'll receive a live tracking update shortly\n\n💡 As a goodwill gesture, I'm applying a ₹50 QuickBite credit to your account for the inconvenience.\n\nIs there anything else I can help with?`
  },
  missing_items: {
    label: "Missing items in order",
    icon: "📦",
    priority: "low",
    queueTime: 0,
    botCanSolve: true,
    keywords: ["missing", "not included", "forgot", "forgotten", "incomplete", "items missing", "didnt get", "didn't receive all"],
    resolution: `I'm really sorry to hear that items were missing from your order. That's definitely not the experience we want for you.\n\nI've reviewed your order and here's what I'm doing:\n\n✅ Identified the missing item(s) from your order #QB-48291\n✅ Initiating a full refund for the missing items\n✅ The refund of the missing item value will be credited within 24-48 hours\n\n💡 I've also added a ₹75 credit to your QuickBite wallet as an apology.\n\nWould you like help with anything else?`
  },
  poor_quality: {
    label: "Poor food quality",
    icon: "🍽️",
    priority: "high",
    queueTime: 60,
    botCanSolve: false,
    keywords: ["quality", "taste", "bad food", "stale", "cold food", "not fresh", "poor quality", "terrible", "inedible", "disgusting", "undercooked", "overcooked", "raw"],
    transferReason: "Food quality issues require a senior specialist who can coordinate with the restaurant partner and authorize appropriate compensation."
  },
  wrong_items: {
    label: "Wrong items received",
    icon: "🔄",
    priority: "medium",
    queueTime: 180,
    botCanSolve: false,
    keywords: ["wrong item", "wrong order", "different item", "not what i ordered", "incorrect item", "mixed up", "someone else", "swapped"],
    transferReason: "Wrong item cases require verification with our dispatch team and restaurant to arrange a replacement or full refund."
  },
  veg_nonveg: {
    label: "Veg / Non-veg mix-up",
    icon: "🚫",
    priority: "high",
    queueTime: 60,
    botCanSolve: false,
    keywords: ["veg", "non-veg", "non veg", "nonveg", "meat", "vegetarian", "chicken", "egg", "pork", "beef", "fish", "mix-up", "dietary", "religious"],
    transferReason: "Dietary and religious food concerns are treated with highest priority. A senior specialist will handle this with full investigation and appropriate resolution."
  },
  rude_delivery: {
    label: "Rude delivery person",
    icon: "😤",
    priority: "high",
    queueTime: 60,
    botCanSolve: false,
    keywords: ["rude", "rude delivery", "misbehave", "misbehaved", "disrespectful", "abusive", "harass", "threatening", "delivery person", "delivery boy", "driver rude", "bad behavior", "unprofessional"],
    transferReason: "Reports about delivery partner behavior are escalated to our Safety & Conduct team. A specialist will take your detailed account and ensure appropriate action."
  },
  spillage: {
    label: "Spillage issue with my order",
    icon: "💧",
    priority: "high",
    queueTime: 60,
    botCanSolve: false,
    keywords: ["spill", "spillage", "leaked", "leaking", "soaked", "wet", "damaged packaging", "broken container", "messy"],
    transferReason: "Spillage issues require photo verification and a specialist to authorize replacement or refund along with packaging feedback to the restaurant."
  },
  not_received: {
    label: "Order not received at all",
    icon: "❌",
    priority: "high",
    queueTime: 60,
    botCanSolve: false,
    keywords: ["not received", "never arrived", "never got", "didn't deliver", "not delivered", "no delivery", "marked delivered", "shows delivered"],
    transferReason: "Order non-delivery is a critical issue. A specialist will investigate with GPS logs and coordinate an immediate resolution."
  }
};

// ─── HUMAN TRANSFER KEYWORDS ─────────────────────────────────────
const HUMAN_TRANSFER_KEYWORDS = [
  "talk", "executive", "customer support", "talk to customer support",
  "human", "agent", "real person", "manager", "supervisor",
  "speak to someone", "connect me", "live agent", "live chat",
  "representative", "escalate", "complaint", "file a complaint"
];

// ─── GEMINI SYSTEM PROMPT (DEEP THINKING) ────────────────────────
const SYSTEM_PROMPT = `You are QuickBite's senior AI customer support specialist. You provide thoughtful, thorough, and empathetic responses — never rushed one-liners.

RESPONSE STYLE:
- Always acknowledge the customer's frustration/concern first
- Analyze the issue from multiple angles before responding
- Provide structured, step-by-step solutions
- Use clear formatting with line breaks
- End with a proactive follow-up question
- Be warm but professional — never robotic
- Keep responses between 3-6 sentences, well-structured

CONTEXT:
- You handle food delivery order issues for QuickBite
- Common issues: late orders, missing items, wrong items, food quality, delivery problems
- You can offer credits, refunds, and escalation to human agents
- If the issue requires human intervention, recommend transferring
- Never mention you are an AI or Gemini — you are QuickBite Assistant

IMPORTANT: Do NOT use markdown formatting like ** or ## in your responses. Use plain text with line breaks and emojis for structure.`;

// ─── UTILITY FUNCTIONS ───────────────────────────────────────────
function getTimeString() {
  return new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  });
}

function scrollToBottom() {
  requestAnimationFrame(() => {
    chatMessages.scrollTo({ top: chatMessages.scrollHeight, behavior: "smooth" });
  });
}

// ─── MESSAGE RENDERING ───────────────────────────────────────────
function addBotMessage(text) {
  const wrapper = document.createElement("div");
  wrapper.className = "message-wrapper bot";
  wrapper.innerHTML = `
    <div class="msg-avatar">🤖</div>
    <div class="msg-content">
      <div class="msg-bubble">${text}</div>
      <span class="msg-time">${getTimeString()}</span>
    </div>
  `;
  chatMessages.appendChild(wrapper);
  scrollToBottom();
}

function addUserMessage(text) {
  const wrapper = document.createElement("div");
  wrapper.className = "message-wrapper user";
  wrapper.innerHTML = `
    <div class="msg-avatar">👤</div>
    <div class="msg-content">
      <div class="msg-bubble">${text}</div>
      <span class="msg-time">${getTimeString()}</span>
    </div>
  `;
  chatMessages.appendChild(wrapper);
  scrollToBottom();
}

function addSystemMessage(text, type = "") {
  const div = document.createElement("div");
  div.className = "system-message";
  div.innerHTML = `<span class="system-message-pill ${type}">${text}</span>`;
  chatMessages.appendChild(div);
  scrollToBottom();
}

function addDateDivider(text) {
  const div = document.createElement("div");
  div.className = "date-divider";
  div.innerHTML = `<span>${text}</span>`;
  chatMessages.appendChild(div);
}

// ─── THINKING INDICATOR (DEEP THINKING) ──────────────────────────
function showThinking() {
  // Remove any existing thinking indicator first
  hideThinking();
  const wrapper = document.createElement("div");
  wrapper.className = "thinking-wrapper";
  wrapper.id = "thinking-indicator";
  wrapper.innerHTML = `
    <div class="msg-avatar" style="background: linear-gradient(135deg, #8b5cf6, #6d28d9);">🤖</div>
    <div class="thinking-bubble">
      <span class="brain-pulse">🧠</span>
      <span class="thinking-label">Analyzing deeply...</span>
      <div class="thinking-dots">
        <div class="dot"></div>
        <div class="dot"></div>
        <div class="dot"></div>
      </div>
    </div>
  `;
  chatMessages.appendChild(wrapper);
  scrollToBottom();
}

function hideThinking() {
  const el = document.getElementById("thinking-indicator");
  if (el) el.remove();
}

// ─── OPTION CARDS ────────────────────────────────────────────────
function showIssueOptions(isMore = false) {
  // Remove any existing options panel first
  const existing = document.getElementById("options-panel");
  if (existing) existing.remove();

  const container = document.createElement("div");
  container.className = "options-container";
  container.id = "options-panel";

  const primaryIssues = isMore
    ? ["spillage", "not_received", "rude_delivery"]
    : ["late_order", "missing_items", "poor_quality", "wrong_items", "veg_nonveg"];

  primaryIssues.forEach(key => {
    const issue = ISSUE_DATABASE[key];
    const card = document.createElement("button");
    card.className = "option-card";
    card.innerHTML = `
      <span class="option-icon">${issue.icon}</span>
      <span class="option-text">${issue.label}</span>
      <span class="option-arrow">›</span>
    `;
    card.addEventListener("click", () => {
      if (isProcessing) return; // prevent double-click
      handleIssueSelection(key);
    });
    container.appendChild(card);
  });

  if (!isMore) {
    const moreBtn = document.createElement("button");
    moreBtn.className = "more-options-btn";
    moreBtn.textContent = "More options...";
    moreBtn.addEventListener("click", () => {
      if (isProcessing) return;
      container.remove();
      addUserMessage("More..");
      safeTimeout(() => {
        addBotMessage("Here are additional issue categories:");
        safeTimeout(() => showIssueOptions(true), 300);
      }, 500);
    });
    container.appendChild(moreBtn);
  } else {
    const backBtn = document.createElement("button");
    backBtn.className = "option-card";
    backBtn.innerHTML = `
      <span class="option-icon">◀️</span>
      <span class="option-text">Go back</span>
      <span class="option-arrow">›</span>
    `;
    backBtn.addEventListener("click", () => {
      if (isProcessing) return;
      container.remove();
      addUserMessage("Go back");
      safeTimeout(() => {
        addBotMessage("No problem! Here are the main categories:");
        safeTimeout(() => showIssueOptions(false), 300);
      }, 500);
    });
    container.appendChild(backBtn);
  }

  chatMessages.appendChild(container);
  scrollToBottom();
}

// Show a "need help with another order" follow-up
function showFollowUpOptions() {
  const container = document.createElement("div");
  container.className = "options-container";

  const helpBtn = document.createElement("button");
  helpBtn.className = "option-card";
  helpBtn.innerHTML = `
    <span class="option-icon">🔁</span>
    <span class="option-text">I need help with another order</span>
    <span class="option-arrow">›</span>
  `;
  helpBtn.addEventListener("click", () => {
    if (isProcessing) return;
    container.remove();
    addUserMessage("I need help with another order");
    conversationState = "issue_select";
    safeTimeout(() => {
      addBotMessage("How can we help you with your order?");
      safeTimeout(() => showIssueOptions(false), 400);
    }, 600);
  });
  container.appendChild(helpBtn);

  const endBtn = document.createElement("button");
  endBtn.className = "option-card";
  endBtn.innerHTML = `
    <span class="option-icon">✅</span>
    <span class="option-text">That's all, thank you!</span>
    <span class="option-arrow">›</span>
  `;
  endBtn.addEventListener("click", () => {
    if (isProcessing) return;
    container.remove();
    addUserMessage("That's all, thank you!");
    endConversation();
  });
  container.appendChild(endBtn);

  chatMessages.appendChild(container);
  scrollToBottom();
}

// ─── ISSUE SELECTION HANDLER ─────────────────────────────────────
async function handleIssueSelection(issueKey) {
  if (isProcessing) return;
  isProcessing = true;

  const issue = ISSUE_DATABASE[issueKey];
  currentIssue = { key: issueKey, ...issue };
  conversationState = "resolving";
  queueCancelled = false;

  // Remove options panel
  const optionsPanel = document.getElementById("options-panel");
  if (optionsPanel) optionsPanel.remove();

  // Show user's selection
  addUserMessage(issue.label);

  // Deep thinking delay
  await delay(800);
  if (queueCancelled) { isProcessing = false; return; }
  showThinking();

  // Intentional deep thinking delay (3-5 seconds)
  const thinkTime = 3000 + Math.random() * 2000;
  await delay(thinkTime);
  if (queueCancelled) { isProcessing = false; return; }
  hideThinking();

  if (issue.botCanSolve) {
    // Bot resolves the issue directly
    await delay(400);
    if (queueCancelled) { isProcessing = false; return; }
    addBotMessage(issue.resolution.replace(/\n/g, "<br>"));

    await delay(600);
    if (queueCancelled) { isProcessing = false; return; }
    // Show resolution card
    const card = document.createElement("div");
    card.className = "resolution-card";
    card.innerHTML = `
      <div class="resolution-card-header">
        <span>✅</span> Issue Resolved
        <span class="priority-badge low" style="margin-left: auto;">🟢 Resolved</span>
      </div>
      <p>Your <strong>${issue.label.toLowerCase()}</strong> issue has been handled by our AI system. Credits/refunds will be applied automatically.</p>
    `;
    chatMessages.appendChild(card);
    scrollToBottom();

    await delay(800);
    if (queueCancelled) { isProcessing = false; return; }
    addBotMessage("Is there anything else I can help you with?");
    await delay(400);
    showFollowUpOptions();

  } else {
    // Needs human transfer — show transfer card with timer button
    await delay(400);
    if (queueCancelled) { isProcessing = false; return; }
    const priorityLabel = issue.priority === "high" ? "🔴 High Priority" : "🟡 Medium Priority";
    const waitText = issue.queueTime === 60 ? "Approx. 1 minute" : "Approx. 3 minutes";

    addBotMessage(`I understand this is a serious concern. Let me explain what happens next:<br><br>${issue.transferReason}<br><br>Given the nature of this issue, I'm connecting you with a specialist who can provide the resolution you deserve.`);

    await delay(800);
    if (queueCancelled) { isProcessing = false; return; }

    // Show transfer card
    const card = document.createElement("div");
    card.className = "transfer-card";
    const transferBtnId = "transfer-now-btn-" + Date.now();
    card.innerHTML = `
      <div class="transfer-card-header">
        <span>👤</span>
        <span class="transfer-card-title">Transfer to Support Specialist</span>
        <span class="priority-badge ${issue.priority}" style="margin-left: auto;">${priorityLabel}</span>
      </div>
      <div class="transfer-card-body">
        Estimated wait time: <strong>${waitText}</strong><br>
        Your issue details will be shared with the agent.
      </div>
      <button class="transfer-btn" id="${transferBtnId}">Connect me now →</button>
    `;
    chatMessages.appendChild(card);
    scrollToBottom();

    document.getElementById(transferBtnId).addEventListener("click", function handler() {
      this.removeEventListener("click", handler); // prevent double-click
      this.disabled = true;
      this.textContent = "Connecting...";
      startQueueTimer(issue.queueTime, issue.priority);
    });
  }

  isProcessing = false;
}

// ─── KEYWORD DETECTION ───────────────────────────────────────────
function detectHumanTransferKeywords(message) {
  const lower = message.toLowerCase();
  return HUMAN_TRANSFER_KEYWORDS.some(kw => lower.includes(kw));
}

function classifyIssueFromText(message) {
  const lower = message.toLowerCase();
  for (const [key, issue] of Object.entries(ISSUE_DATABASE)) {
    if (issue.keywords.some(kw => lower.includes(kw))) {
      return key;
    }
  }
  return null;
}

// ─── QUEUE TIMER SYSTEM ──────────────────────────────────────────
function startQueueTimer(totalSeconds, priority) {
  // Guard: prevent stacking multiple timers
  if (conversationState === "transferring") {
    console.warn("Queue already active — ignoring duplicate startQueueTimer call");
    return;
  }

  conversationState = "transferring";
  queueCancelled = false;
  queueOverlay.classList.add("active");

  let remaining = totalSeconds;
  const priorityLabel = priority === "high" ? "🔴 High Priority" : "🟡 Medium Priority";
  const approxWait = totalSeconds === 60 ? "Approx. 1 minute" : "Approx. 3 minutes";

  // Random queue position (1-9) — gives a realistic feel
  const queuePosition = Math.floor(Math.random() * 9) + 1;

  // Random early connection: connect between 40-90% through the wait
  // e.g. for 60s queue → connect randomly between 6s and 36s remaining
  const earlyConnectAt = Math.floor(totalSeconds * (0.1 + Math.random() * 0.5));

  function updateUI() {
    if (queueCancelled) return;

    const mins = Math.floor(remaining / 60);
    const secs = remaining % 60;
    const timeStr = `${mins}:${secs.toString().padStart(2, "0")}`;
    const progress = ((totalSeconds - remaining) / totalSeconds) * 100;

    queueContent.innerHTML = `
      <div class="queue-icon">👤</div>
      <div class="queue-title">Connecting you with a specialist</div>
      <div class="queue-subtitle">Your issue has been flagged and a support agent is being assigned to your case.</div>
      <div class="queue-priority-info">${priorityLabel} · ${approxWait}</div>
      <div style="font-size: 0.82rem; color: var(--text-secondary); margin-bottom: 8px;">Queue position: <strong style="color: var(--accent-primary);">#${queuePosition}</strong></div>
      <div class="queue-timer">${timeStr}</div>
      <div class="queue-timer-label">Estimated Wait Time</div>
      <div class="queue-progress">
        <div class="queue-progress-bar" style="width: ${progress}%"></div>
      </div>
      <button class="queue-cancel-btn" id="queue-cancel">Cancel & go back</button>
    `;

    document.getElementById("queue-cancel").addEventListener("click", cancelQueue);
  }

  updateUI();

  // Clear any previous interval just in case
  if (queueTimerId) clearInterval(queueTimerId);

  queueTimerId = setInterval(() => {
    if (queueCancelled) {
      clearInterval(queueTimerId);
      queueTimerId = null;
      return;
    }
    remaining--;

    // Connect randomly when timer hits the early-connect point OR reaches 0
    if (remaining <= earlyConnectAt || remaining <= 0) {
      clearInterval(queueTimerId);
      queueTimerId = null;
      if (!queueCancelled) {
        agentConnected();
      }
    } else {
      updateUI();
    }
  }, 1000);
}

function cancelQueue() {
  // Set the cancel flag to stop the interval & agentConnected
  queueCancelled = true;

  // Clear the timer interval
  if (queueTimerId) {
    clearInterval(queueTimerId);
    queueTimerId = null;
  }

  // Clear ALL pending timeouts to prevent ghost callbacks
  clearAllPending();

  // NOW reset the cancel flag so new safeTimeouts below can fire
  queueCancelled = false;

  // Hide overlay
  queueOverlay.classList.remove("active");
  conversationState = "issue_select";
  isProcessing = false;

  addSystemMessage("⚠️ Transfer cancelled", "warning");
  safeTimeout(() => {
    addBotMessage("The transfer has been cancelled. Would you like help with something else?");
    safeTimeout(() => showFollowUpOptions(), 400);
  }, 500);
}

function agentConnected() {
  // Guard: don't connect if cancelled
  if (queueCancelled) return;

  const agents = [
    { name: "Priya Sharma", role: "Senior Support Specialist" },
    { name: "Arjun Mehta", role: "Customer Experience Lead" },
    { name: "Sneha Reddy", role: "Escalation Specialist" },
    { name: "Vikram Patel", role: "Resolution Manager" }
  ];
  const agent = agents[Math.floor(Math.random() * agents.length)];

  queueContent.innerHTML = `
    <div class="agent-connected-card">
      <div class="agent-avatar-wrapper">👤</div>
      <div class="agent-name">${agent.name}</div>
      <div class="agent-role">${agent.role}</div>
      <div style="margin-top: 16px; font-size: 0.82rem; color: var(--text-secondary);">
        ✅ Connected! Your conversation is being transferred...
      </div>
    </div>
  `;

  safeTimeout(() => {
    if (queueCancelled) return; // double-check before proceeding
    queueOverlay.classList.remove("active");
    conversationState = "connected";

    addSystemMessage(`✅ ${agent.name} (${agent.role}) has joined the chat`, "success");

    safeTimeout(() => {
      if (queueCancelled) return;
      addBotMessage(`Hi! I'm ${agent.name}, your dedicated support specialist. I've reviewed the details of your case regarding "<strong>${currentIssue ? currentIssue.label : 'your issue'}</strong>".<br><br>I'm here to personally resolve this for you. Could you share a few more details so I can expedite the resolution?<br><br>For example:<br>• Your order number<br>• When this happened<br>• Any photos if applicable`);
      isProcessing = false;
    }, 800);
  }, 2000);
}

// ─── GEMINI API (DEEP THINKING) ──────────────────────────────────
async function getGeminiResponse(userMessage) {
  chatHistory.push({
    role: "user",
    parts: [{ text: userMessage }]
  });

  const requestBody = {
    system_instruction: {
      parts: [{ text: SYSTEM_PROMPT }]
    },
    contents: chatHistory
  };

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || "API request failed");
    }

    const text = data.candidates[0].content.parts[0].text
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/##\s*(.*)/g, "$1")
      .replace(/\n/g, "<br>")
      .trim();

    chatHistory.push({
      role: "model",
      parts: [{ text }]
    });

    return text;
  } catch (err) {
    console.error("Gemini API Error:", err);
    // Graceful fallback — don't break the chat
    return `I appreciate your patience! To best assist you, please select your issue from the options below, or type <strong>"talk to support"</strong> to connect with a human agent directly.`;
  }
}

// ─── MAIN MESSAGE HANDLER ────────────────────────────────────────
async function handleUserMessage() {
  const message = userInput.value.trim();
  if (!message || isProcessing) return;

  isProcessing = true;
  queueCancelled = false;

  // Clear input
  userInput.value = "";
  userInput.style.height = "42px";
  sendBtn.disabled = true;

  // Show user message
  addUserMessage(message);

  // Remove any existing option panels
  const existingOptions = document.getElementById("options-panel");
  if (existingOptions) existingOptions.remove();

  // 1. Check for human transfer keywords FIRST
  if (detectHumanTransferKeywords(message)) {
    await delay(600);
    if (queueCancelled) { isProcessing = false; sendBtn.disabled = false; return; }
    showThinking();
    await delay(2500);
    if (queueCancelled) { isProcessing = false; sendBtn.disabled = false; return; }
    hideThinking();

    addBotMessage("I understand you'd like to speak with a support specialist. Let me connect you right away.<br><br>Your conversation history and issue details will be shared with the agent so you don't have to repeat anything.");

    await delay(800);
    if (queueCancelled) { isProcessing = false; sendBtn.disabled = false; return; }
    startQueueTimer(60, "high");
    sendBtn.disabled = false;
    isProcessing = false;
    return;
  }

  // 2. Try to classify issue from free text
  const detectedIssue = classifyIssueFromText(message);
  if (detectedIssue && conversationState !== "connected") {
    sendBtn.disabled = false;
    await handleIssueSelection(detectedIssue);
    isProcessing = false;
    return;
  }

  // 3. If in connected state or no classification, use Gemini API
  await delay(500);
  if (queueCancelled) { isProcessing = false; sendBtn.disabled = false; return; }
  showThinking();

  // Deep thinking delay (3-5 seconds for thoughtful responses)
  const thinkTime = 3000 + Math.random() * 2000;
  await delay(thinkTime);
  if (queueCancelled) { isProcessing = false; sendBtn.disabled = false; return; }

  const response = await getGeminiResponse(message);
  hideThinking();
  await delay(300);
  addBotMessage(response);

  // If bot suggests issue selection after generic query
  if (conversationState === "greeting" || conversationState === "issue_select") {
    await delay(600);
    if (queueCancelled) { isProcessing = false; sendBtn.disabled = false; return; }
    addBotMessage("Or you can quickly select your issue type:");
    await delay(400);
    showIssueOptions(false);
  }

  sendBtn.disabled = false;
  isProcessing = false;
}

// ─── CONVERSATION LIFECYCLE ──────────────────────────────────────
function startConversation() {
  // Nuclear reset — clear everything
  clearAllPending();
  queueCancelled = false;
  isProcessing = false;

  chatMessages.innerHTML = "";
  chatHistory = [];
  conversationState = "greeting";
  currentIssue = null;
  queueOverlay.classList.remove("active");

  addDateDivider("Today");

  safeTimeout(() => {
    addBotMessage("Hii 👋<br>I'm here to help you with your order from <strong>Pizza Palace</strong>.");
  }, 400);

  safeTimeout(() => {
    addBotMessage("How can we help you with your order?");
  }, 1200);

  safeTimeout(() => {
    conversationState = "issue_select";
    showIssueOptions(false);
  }, 1800);
}

function endConversation() {
  conversationState = "ended";
  clearAllPending();
  queueCancelled = true;
  queueOverlay.classList.remove("active");
  isProcessing = false;

  safeTimeout(() => {
    addSystemMessage("✅ This conversation has been closed", "success");
  }, 500);
  safeTimeout(() => {
    addSystemMessage("Thank you for contacting QuickBite Support!", "info");
  }, 1000);
  safeTimeout(() => {
    addBotMessage("Your feedback matters to us! We hope we resolved your concern. Have a great day! 😊");
  }, 1600);
}

// ─── EVENT LISTENERS ─────────────────────────────────────────────

// Send message
sendBtn.addEventListener("click", handleUserMessage);

userInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    handleUserMessage();
  }
});

// Auto-resize textarea
userInput.addEventListener("input", () => {
  userInput.style.height = "42px";
  userInput.style.height = Math.min(userInput.scrollHeight, 120) + "px";
});

// Sidebar toggle (mobile)
sidebarToggle.addEventListener("click", () => {
  sidebar.classList.toggle("open");
  sidebarOverlay.classList.toggle("active");
});

sidebarOverlay.addEventListener("click", () => {
  sidebar.classList.remove("open");
  sidebarOverlay.classList.remove("active");
});

// Refresh conversation
refreshBtn.addEventListener("click", () => {
  startConversation();
});

// End chat
endChatBtn.addEventListener("click", () => {
  if (conversationState !== "ended") {
    endConversation();
  }
});

// Quick action buttons in sidebar
document.querySelectorAll(".quick-action-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    if (isProcessing) return;
    const action = btn.dataset.action;
    sidebar.classList.remove("open");
    sidebarOverlay.classList.remove("active");

    switch (action) {
      case "track":
        addUserMessage("Track my order");
        safeTimeout(() => {
          showThinking();
          safeTimeout(() => {
            hideThinking();
            addBotMessage("📍 Here's your order tracking:<br><br><strong>Order #QB-48287 — Royal Biryani House</strong><br>Status: 🚗 In Transit<br>ETA: ~15 minutes<br>Delivery Partner: Ravi K.<br><br>Your food is on its way! You'll receive a notification when it arrives.");
          }, 2500);
        }, 500);
        break;
      case "refund":
        addUserMessage("Refund status");
        safeTimeout(() => {
          showThinking();
          safeTimeout(() => {
            hideThinking();
            addBotMessage("💰 You currently have no pending refund requests.<br><br>If you'd like to request a refund for a recent order, please select the relevant issue from the menu and I'll help you right away.");
          }, 2000);
        }, 500);
        break;
      case "history":
        addUserMessage("Order history");
        safeTimeout(() => {
          showThinking();
          safeTimeout(() => {
            hideThinking();
            addBotMessage("📋 Your recent orders:<br><br>1. <strong>#QB-48291</strong> — Pizza Palace · ₹649 · ✅ Delivered<br>2. <strong>#QB-48287</strong> — Royal Biryani House · ₹399 · 🚗 In Transit<br>3. <strong>#QB-48210</strong> — Burger Barn · ₹529 · ✅ Delivered<br><br>Need help with any of these orders?");
          }, 2000);
        }, 500);
        break;
      case "human":
        addUserMessage("Talk to support agent");
        isProcessing = true;
        safeTimeout(async () => {
          showThinking();
          await delay(2000);
          if (queueCancelled) { isProcessing = false; return; }
          hideThinking();
          addBotMessage("I'll connect you with a support specialist right away. Your conversation details will be shared so you won't need to repeat anything.");
          await delay(800);
          if (queueCancelled) { isProcessing = false; return; }
          startQueueTimer(60, "high");
          isProcessing = false;
        }, 500);
        break;
    }
  });
});

// ─── INITIALIZE ──────────────────────────────────────────────────
startConversation();