import os
import re
from typing import List, Dict, Any
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import httpx

load_dotenv()

# Global HTTP client
http_client: httpx.AsyncClient = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize the shared httpx client
    global http_client
    http_client = httpx.AsyncClient(timeout=30.0)
    yield
    # Shutdown: Close the httpx client
    await http_client.aclose()

app = FastAPI(lifespan=lifespan)

# Dynamic CORS setup
FRONTEND_URL = os.getenv("FRONTEND_URL", "*")
allow_origins = [FRONTEND_URL] if FRONTEND_URL != "*" else ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatMessage(BaseModel):
    role: str
    text: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]

SYSTEM_PROMPT = """You are QuickBite's senior AI customer support specialist. You provide thoughtful, thorough, and empathetic responses — never rushed one-liners.

RESPONSE STYLE:
- Always acknowledge the customer's frustration/concern first
- Analyze the issue from multiple angles before responding
- Provide structured, step-by-step solutions
- Use clear formatting with line breaks
- End with a proactive follow-up question
- Be warm but professional — never robotic
- Keep responses between 3-6 sentences, well-structured

CONTEXT:
- You are QuickBite Assistant, working specifically for **Pizza Palace**.
- The customer has ordered a **Cheese Burst Margherita Pizza** (Order #QB-85492).
- You can offer credits, refunds, and escalation to human agents.
- Never mention you are an AI or Gemini — you are QuickBite Assistant.

STRICT RULE SET FOR DEMO SCENARIOS:
- If they complain about poor quality (e.g. cheese not cooked): Apologize, mention the Cheese Burst Margherita Pizza (Order #QB-85492), and tell them they will be fully refunded.
- If they receive the wrong pizza: Tell them to keep it with our compliments and that we will refund their money entirely for Order #QB-85492.
- If it's a veg/non-veg mix-up: Offer an extreme apology for the severity of the mix-up, initiate a full refund for Order #QB-85492, and promise an executive will call them soon.
- If the pizza has spillage: Initiate a full refund for the damaged Cheese Burst Margherita Pizza.
- If they complain about a rude delivery person: Apologize, promise strict action, and state an executive will call them soon to resolve the matter.
- If they state their order was NEVER received: Reply EXACTLY with "This issue cannot be handled by the chatbot. I am transferring you to a human agent immediately. [TRANSFER]"

IMPORTANT: Do NOT use markdown bold/italics (like ** or ##) in your generated responses. Use plain text with line breaks and emojis for structure. Ensure your tone is highly empathetic and maximum customer satisfaction is achieved."""

API_KEY = os.getenv("GEMINI_API_KEY")
API_URL = os.getenv("GEMINI_API_URL")
PRIMARY_MODEL = os.getenv("GEMINI_API_MODEL")

async def execute_with_model(target_model: str, request_body: Dict[str, Any]) -> str:
    url = f"{API_URL}/{target_model}:generateContent?key={API_KEY}"
    
    response = await http_client.post(url, json=request_body)
    response.raise_for_status()
    
    data = response.json()
    try:
        candidates = data.get("candidates", [])
        if not candidates:
            raise ValueError("No candidates found in the response")
        
        parts = candidates[0].get("content", {}).get("parts", [])
        if not parts:
            raise ValueError("No parts found in the response")
            
        text = parts[0].get("text", "")
        
        # Strip markdown formatting
        text = re.sub(r'\*\*(.*?)\*\*', r'\1', text)
        text = re.sub(r'##\s*(.*)', r'\1', text)
        return text.strip()
    except Exception as e:
        raise ValueError(f"Failed to parse response: {str(e)}")

async def execute_with_failover(models: List[str], request_body: Dict[str, Any]) -> str:
    if not models:
        raise HTTPException(status_code=500, detail="All Gemini fallback models exhausted due to rate/quota limits.")
        
    current_model = models[0]
    remaining_models = models[1:]
    
    try:
        return await execute_with_model(current_model, request_body)
    except httpx.HTTPStatusError as e:
        status = e.response.status_code
        if status in (429, 403, 503, 404):
            print(f"Model {current_model} failed ({status}). Failing over to next...")
            return await execute_with_failover(remaining_models, request_body)
        raise HTTPException(status_code=500, detail=f"API Error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal Error: {str(e)}")

@app.get("/api/health")
async def health():
    return "QuickBite Support Backend is running"

@app.post("/api/chat")
async def chat(request: ChatRequest):
    if not request.messages:
        return {"success": False, "error": "Messages cannot be empty"}
        
    contents = []
    for msg in request.messages:
        contents.append({
            "role": msg.role,
            "parts": [{"text": msg.text}]
        })
        
    request_body = {
        "system_instruction": {"parts": [{"text": SYSTEM_PROMPT}]},
        "contents": contents
    }
    
    # Cascade models using latest Gemini 3.1 and 2.0 series
    model_cascade = [
        PRIMARY_MODEL, 
        "gemini-3.1-flash-lite", 
        "gemini-3.1-flash", 
        "gemini-2.0-flash", 
        "gemini-1.5-flash"
    ]
    unique_models = []
    for m in model_cascade:
        if m and m not in unique_models:
            unique_models.append(m)
            
    try:
        reply = await execute_with_failover(unique_models, request_body)
        return {"success": True, "reply": reply}
    except Exception as e:
        print(f"Chat API Error: {str(e)}")
        # Provide fallback error message
        return {
            "success": True, 
            "reply": f"⚠️ Gemini API Error: {str(e)}\n\nPlease try sending your message again."
        }
