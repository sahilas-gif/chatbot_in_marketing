// ═══════════════════════════════════════════════════════════════
// ISSUE DATABASE & KEYWORDS — Shared configuration
// ═══════════════════════════════════════════════════════════════

export const ISSUE_DATABASE = {
  late_order: {
    label: "Late / delayed order",
    icon: "⏰",
    priority: "low",
    queueTime: 0,
    botCanSolve: true,
    keywords: ["late", "delay", "delayed", "slow", "taking long", "not arrived", "waiting", "where is my order", "taking too long", "eta", "deri", "late ho gaya", "kab aayega", "time lag raha", "abhi tak nahi", "der se", "लेट", "देरी", "कब आएगा", "टाइम लग रहा"],
    resolution: `I completely understand how frustrating a delayed order can be. Let me look into this for you right away.\n\nHere's what I've found and what we're doing:\n\n✅ Your order #QB-85492 (Cheese Burst Margherita Pizza) is currently being prepared/in transit\n✅ I've flagged this with our logistics team for priority routing\n✅ You'll receive a live tracking update shortly\n\n💡 As a goodwill gesture, I'm applying a ₹50 QuickBite credit to your account for the inconvenience.\n\nIs there anything else I can help with?`
  },
  missing_items: {
    label: "Missing items in order",
    icon: "📦",
    priority: "low",
    queueTime: 0,
    botCanSolve: true,
    keywords: ["missing", "not included", "forgot", "forgotten", "incomplete", "items missing", "didnt get", "didn't receive all", "nahi mila", "kuch nahi", "kam hai", "chhut gaya", "bhul gaye", "gayab", "नहीं मिला", "कम है", "छूट गया", "गायब"],
    resolution: `I'm really sorry to hear that items were missing from your order. That's definitely not the experience we want for you.\n\nI've reviewed your order and here's what I'm doing:\n\n✅ Identified the missing item(s) from your order #QB-85492 (Cheese Burst Margherita Pizza)\n✅ Initiating a full refund for the missing items\n✅ The refund of the missing item value will be credited within 24-48 hours\n\n💡 I've also added a ₹75 credit to your QuickBite wallet as an apology.\n\nWould you like help with anything else?`
  },
  poor_quality: {
    label: "Poor food quality",
    icon: "🍽️",
    priority: "high",
    queueTime: 60,
    botCanSolve: false,
    botFallbackResolution: "I sincerely apologize if the cheese was not fully cooked or the quality was poor. Your satisfaction is our priority, and you will be completely refunded for this Cheese Burst Margherita Pizza (Order #QB-85492).",
    keywords: ["quality", "taste", "bad food", "stale", "cold food", "not fresh", "poor quality", "terrible", "inedible", "disgusting", "undercooked", "overcooked", "raw", "kharab", "bekar", "ganda", "testy nahi", "thanda", "kachha", "baasi", "swaad nahi", "खराब", "बेकार", "ठंडा", "कच्चा", "बासी"],
    transferReason: "Food quality issues require a senior specialist who can coordinate with the restaurant partner and authorize appropriate compensation."
  },
  wrong_items: {
    label: "Wrong items received",
    icon: "🔄",
    priority: "high",
    queueTime: 60,
    botCanSolve: false,
    botFallbackResolution: "We are very sorry you received the wrong pizza! Please keep it with our compliments—we will refund your money entirely for Order #QB-85492 (Cheese Burst Margherita Pizza).",
    keywords: ["wrong item", "wrong order", "different item", "not what i ordered", "incorrect item", "mixed up", "someone else", "swapped", "galat", "dusra de diya", "alag hai", "ye order nahi", "mistake", "bura hai", "गलत", "दूसरा दे दिया", "अलग है"],
    transferReason: "Wrong item cases require verification with our dispatch team and restaurant to arrange a replacement or full refund."
  },
  veg_nonveg: {
    label: "Veg / Non-veg mix-up",
    icon: "🚫",
    priority: "high",
    queueTime: 60,
    botCanSolve: false,
    botFallbackResolution: "We are extremely sorry this happened to you! We entirely understand the severity of this mix-up with your Cheese Burst Margherita Pizza (Order #QB-85492). We will refund you right away, and you will be receiving a call soon from our executive to formally apologize.",
    keywords: ["veg", "non-veg", "non veg", "nonveg", "meat", "vegetarian", "chicken", "egg", "pork", "beef", "fish", "mix-up", "dietary", "religious", "mans", "chicken de diya", "egg de diya", "mutton", "anda", "veg order tha", "वेज", "नॉन वेज", "मांस", "अंडा", "मुर्गा"],
    transferReason: "Dietary and religious food concerns are treated with highest priority. A senior specialist will handle this with full investigation and appropriate resolution."
  },
  rude_delivery: {
    label: "Rude delivery person",
    icon: "😤",
    priority: "high",
    queueTime: 60,
    botCanSolve: false,
    botFallbackResolution: "We are incredibly sorry to hear about this unacceptable behavior during the delivery of your Cheese Burst Margherita Pizza (Order #QB-85492). We will take strict action immediately, and you will be receiving a call soon from our executive to resolve this matter.",
    keywords: ["rude", "rude delivery", "misbehave", "misbehaved", "disrespectful", "abusive", "harass", "threatening", "delivery person", "delivery boy", "driver rude", "bad behavior", "unprofessional", "battameezi", "galat tareeke", "gaali", "gussa", "chilla raha", "kharab bartav", "delivery wala", "बदतमीज़ी", "गाली", "चिल्ला रहा", "खराब बर्ताव"],
    transferReason: "Reports about delivery partner behavior are escalated to our Safety & Conduct team. A specialist will take your detailed account and ensure appropriate action."
  },
  spillage: {
    label: "Spillage issue with my order",
    icon: "💧",
    priority: "medium",
    queueTime: 120,
    botCanSolve: false,
    botFallbackResolution: "I sincerely apologize for the spillage on your Cheese Burst Margherita Pizza (Order #QB-85492). I've initiated a full refund for the damaged pizza right away.",
    keywords: ["spill", "spillage", "leaked", "leaking", "soaked", "wet", "damaged packaging", "broken container", "messy", "gir gaya", "fail gaya", "fata hua", "leak ho raha", "gira hua", "polythene", "khul gaya", "गिर गया", "फैल गया", "फटा हुआ", "लीक"],
    transferReason: "Spillage issues require photo verification and a specialist to authorize replacement or refund along with packaging feedback to the restaurant."
  },
  not_received: {
    label: "Order not received at all",
    icon: "❌",
    priority: "medium",
    queueTime: 120,
    botCanSolve: false,
    botFallbackResolution: "This issue cannot be handled by the chatbot. I am transferring you to a human agent immediately.",
    keywords: ["not received", "never arrived", "never got", "didn't deliver", "not delivered", "no delivery", "marked delivered", "shows delivered", "mila hi nahi", "kahan hai", "aaya nahi", "jhoot bol raha", "deliver nahi hua", "gayab ho gaya", "मिला ही नहीं", "आया नहीं", "डिलीवर नहीं हुआ"],
    transferReason: "Order non-delivery is a critical issue. A specialist will investigate with GPS logs and coordinate an immediate resolution."
  }
};

export const HUMAN_TRANSFER_KEYWORDS = [
  "talk", "executive", "customer support", "talk to customer support",
  "human", "agent", "real person", "manager", "supervisor",
  "speak to someone", "connect me", "live agent", "live chat",
  "representative", "escalate", "complaint", "file a complaint",
  "baat karni hai", "insaan se baat", "agent se baat", "customer care",
  "call lagao", "baat karao", "madad", "help chahiye", "कस्टमर केयर", "बात कराओ", "इंसान से बात", "मदद"
];

export const AGENTS = [
  { name: "Priya Sharma", role: "Senior Support Specialist" },
  { name: "Arjun Mehta", role: "Customer Experience Lead" },
  { name: "Sneha Reddy", role: "Escalation Specialist" },
  { name: "Vikram Patel", role: "Resolution Manager" }
];

export function detectHumanTransferKeywords(message) {
  const lower = message.toLowerCase();
  return HUMAN_TRANSFER_KEYWORDS.some(kw => lower.includes(kw));
}

export function classifyIssueFromText(message) {
  const lower = message.toLowerCase();
  for (const [key, issue] of Object.entries(ISSUE_DATABASE)) {
    if (issue.keywords.some(kw => lower.includes(kw))) {
      return key;
    }
  }
  return null;
}
