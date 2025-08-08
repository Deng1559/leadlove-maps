@echo off
echo ========================================
echo CLEAN SERVER START
echo ========================================

REM Kill any existing Node processes
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 >nul

REM Change to project directory
cd /d "G:\AI - Coding Projects\Telegram.GoogleMaps.Email.Enrichment.n8n\leadlove-credit-system"

REM Clear any port locks
echo Clearing port locks...
netsh int ip reset >nul 2>&1

echo.
echo 🚀 Starting clean development server...
echo.

REM Start with explicit port to avoid conflicts
set PORT=3003
echo Starting on port %PORT%...
call npm run dev -- -p %PORT%

pause