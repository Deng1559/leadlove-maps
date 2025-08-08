@echo off
echo ========================================
echo CONNECTION REFUSED DEBUG SCRIPT
echo ========================================
echo.

echo 🔍 Step 1: Checking Node.js installation...
node --version 2>nul
if errorlevel 1 (
    echo ❌ Node.js not found! Install from: https://nodejs.org/
    echo    Required: Node.js v18 or higher
    pause
    exit /b 1
) else (
    echo ✅ Node.js found
)

echo.
echo 🔍 Step 2: Checking npm installation...
npm --version 2>nul
if errorlevel 1 (
    echo ❌ npm not found!
    pause
    exit /b 1
) else (
    echo ✅ npm found
)

echo.
echo 🔍 Step 3: Changing to project directory...
cd /d "G:\AI - Coding Projects\Telegram.GoogleMaps.Email.Enrichment.n8n\leadlove-credit-system"
if errorlevel 1 (
    echo ❌ Failed to change to project directory
    pause
    exit /b 1
) else (
    echo ✅ Project directory found
)

echo.
echo 🔍 Step 4: Checking if dependencies are installed...
if not exist "node_modules" (
    echo ⚠️  node_modules not found. Installing dependencies...
    call npm install --loglevel=error
    if errorlevel 1 (
        echo ❌ Failed to install dependencies
        pause
        exit /b 1
    )
) else (
    echo ✅ Dependencies found
)

echo.
echo 🔍 Step 5: Checking for running Node processes...
tasklist /FI "IMAGENAME eq node.exe" | find "node.exe" >nul
if not errorlevel 1 (
    echo ⚠️  Node.js processes are already running
    echo    You may need to close them first
    echo.
    tasklist /FI "IMAGENAME eq node.exe"
    echo.
    echo Press Y to kill existing Node processes, or N to continue anyway
    choice /C YN /N /M "[Y/N]: "
    if errorlevel 2 goto :continue
    if errorlevel 1 (
        echo Killing existing Node processes...
        taskkill /F /IM node.exe >nul 2>&1
        timeout /t 2 >nul
    )
)

:continue
echo.
echo 🔍 Step 6: Checking port availability...
netstat -ano | findstr :3000 >nul
if not errorlevel 1 (
    echo ⚠️  Port 3000 is in use
)
netstat -ano | findstr :3001 >nul
if not errorlevel 1 (
    echo ⚠️  Port 3001 is in use
)
netstat -ano | findstr :3002 >nul
if not errorlevel 1 (
    echo ⚠️  Port 3002 is in use
)

echo.
echo 🚀 Step 7: Starting development server...
echo    Server will try ports 3000, 3001, 3002 automatically
echo    Watch for the "Local:" URL in the output below
echo.
echo ========================================
echo SERVER OUTPUT:
echo ========================================

REM Start the server and show output
call npm run dev

echo.
echo ========================================
echo If server started successfully, check the "Local:" URL above
echo Example: http://localhost:3002
echo ========================================
pause