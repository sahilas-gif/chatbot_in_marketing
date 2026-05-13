@echo off
echo ════════════════════════════════════════════════════════
echo   QuickBite Support — Full Stack Development Server
echo ════════════════════════════════════════════════════════
echo.

echo [1/2] Starting Python FastAPI backend on port 8080...
cd /d "%~dp0backend"
if not exist "venv\" (
    echo Creating virtual environment...
    python -m venv venv
)
start "QuickBite Backend" cmd /k "venv\Scripts\activate && pip install -r requirements.txt && uvicorn main:app --port 8080"

echo [2/2] Starting React frontend on port 5173...
cd /d "%~dp0frontend"
if not exist "node_modules\" (
    echo Installing frontend dependencies...
    call npm install
)
timeout /t 5 /nobreak > nul
start "" "http://localhost:5173"
call npm run dev

echo.
echo ════════════════════════════════════════════════════════
echo   Press Ctrl+C to stop
echo ════════════════════════════════════════════════════════
