// ═══════════════════════════════════════════════════════════════
// API SERVICE — Calls Spring Boot backend
// ═══════════════════════════════════════════════════════════════

const API_BASE = import.meta.env.VITE_API_URL || "/api";

export async function sendChatMessage(messages) {
  try {
    const response = await fetch(`${API_BASE}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages })
    });

    const data = await response.json();

    if (data.success) {
      return data.reply;
    } else {
      throw new Error(data.error || "API request failed");
    }
  } catch (err) {
    console.error("API Error:", err);
    throw err;
  }
}

export async function healthCheck() {
  try {
    const response = await fetch(`${API_BASE}/health`);
    return response.ok;
  } catch {
    return false;
  }
}
