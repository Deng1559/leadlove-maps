@echo off
echo =========================================
echo Starting LeadLove Email Strategist Demo
echo =========================================

echo.
echo 🚀 Initializing system...
echo.

REM Change to project directory using Windows syntax
cd /d "G:\AI - Coding Projects\Telegram.GoogleMaps.Email.Enrichment.n8n\leadlove-credit-system"

REM Check Node.js version
echo 📋 Checking Node.js...
node --version
if errorlevel 1 (
    echo ❌ Node.js not found. Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Install dependencies quietly
echo 📦 Installing dependencies...
call npm install --loglevel=error
if errorlevel 1 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo 🌐 Starting Next.js development server...
echo.
echo Available test interfaces:
echo   • Email Strategist Test: http://localhost:3000/test-email-strategist
echo   • Webhook Test: http://localhost:3000/test-webhook
echo   • API Info: http://localhost:3000/api/email-sequences/generate
echo.
echo ⚡ Server starting... Opening browser in 5 seconds
echo Press Ctrl+C to stop the server
echo.

REM Start browser after a short delay
timeout /t 5 /nobreak > nul
start "" "http://localhost:3000/test-email-strategist"

REM Start the development server
call npm run dev