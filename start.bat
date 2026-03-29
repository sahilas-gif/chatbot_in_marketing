@echo off
echo ════════════════════════════════════════════════════════
echo   QuickBite Support — Full Stack Development Server
echo ════════════════════════════════════════════════════════
echo.

:: Set Java path
set JAVA_HOME=C:\Program Files\Java\jdk-25
set PATH=%JAVA_HOME%\bin;%PATH%

:: Maven path (cached by wrapper)
set MVN_HOME=%USERPROFILE%\.m2\wrapper\dists\apache-maven-3.9.9-bin\33b4b2b4\apache-maven-3.9.9

echo [1/2] Starting Spring Boot backend on port 8080...
cd /d "%~dp0backend"
set MAVEN_PROJECTBASEDIR=%cd%
start "QuickBite Backend" cmd /k ""%MVN_HOME%\bin\mvn.cmd" spring-boot:run"

echo [2/2] Starting React frontend on port 5173...
cd /d "%~dp0frontend"
timeout /t 5 /nobreak > nul
start "" "http://localhost:5173"
call npm run dev

echo.
echo ════════════════════════════════════════════════════════
echo   Press Ctrl+C to stop
echo ════════════════════════════════════════════════════════
