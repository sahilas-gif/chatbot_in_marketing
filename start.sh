#!/bin/bash

echo "════════════════════════════════════════════════════════"
echo "  QuickBite Support — Full Stack Development Server"
echo "════════════════════════════════════════════════════════"
echo ""

# Get the directory where this script lives
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# ─── 1/3  Install frontend dependencies if needed ─────────
if [ ! -d "$SCRIPT_DIR/frontend/node_modules" ]; then
  echo "[0/2] Installing frontend dependencies..."
  (cd "$SCRIPT_DIR/frontend" && npm install)
  echo ""
fi

# ─── 2/3  Start Python backend on port 8080 ──────────
echo "[1/2] Starting Python FastAPI backend on port 8080..."
(
  cd "$SCRIPT_DIR/backend"
  if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
  fi
  source venv/bin/activate
  pip install -r requirements.txt > /dev/null 2>&1
  uvicorn main:app --port 8080
) &
BACKEND_PID=$!

# Give the backend a few seconds to start
sleep 5

# ─── 3/3  Start React/Vite frontend on port 5173 ──────────
echo "[2/2] Starting React frontend on port 5173..."
echo ""

# Open the browser after a short delay
(sleep 3 && open "http://localhost:5173") &

(cd "$SCRIPT_DIR/frontend" && npm run dev)

# ─── Cleanup: kill backend when frontend stops ────────────
echo ""
echo "Shutting down backend..."
kill $BACKEND_PID 2>/dev/null
wait $BACKEND_PID 2>/dev/null

echo ""
echo "════════════════════════════════════════════════════════"
echo "  All servers stopped. Goodbye!"
echo "════════════════════════════════════════════════════════"
