@echo off
echo =========================================
echo Starting LeadLove Email Strategist Demo
echo =========================================

echo.
echo 🚀 Starting development server...
echo.

cd /d "G:\AI - Coding Projects\Telegram.GoogleMaps.Email.Enrichment.n8n\leadlove-credit-system"

echo 📦 Installing dependencies if needed...
call npm install --silent

echo.
echo 🌐 Starting Next.js development server...
echo.
echo Available test interfaces:
echo   • Email Strategist Test: http://localhost:3000/test-email-strategist
echo   • Webhook Test: http://localhost:3000/test-webhook
echo   • Main API Docs: http://localhost:3000/api/email-sequences/generate
echo.
echo Press Ctrl+C to stop the server
echo.

start "" "http://localhost:3000/test-email-strategist"
call npm run dev