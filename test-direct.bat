@echo off
echo LeadLove Maps Direct Test Execution
echo ===================================

echo Checking Node.js installation...
node --version
if errorlevel 1 (
    echo ERROR: Node.js not found. Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)

echo Checking npm installation...
npm --version
if errorlevel 1 (
    echo ERROR: npm not found
    pause
    exit /b 1
)

cd /d "G:\AI - Coding Projects\Telegram.GoogleMaps.Email.Enrichment.n8n"

echo.
echo Current directory: %CD%
echo.

echo 1. Checking project dependencies...
echo ------------------------------------
if not exist node_modules (
    echo Installing dependencies...
    npm install
    if errorlevel 1 (
        echo ERROR: Failed to install dependencies
        pause
        exit /b 1
    )
)

echo.
echo 2. Running direct Node.js tests...
echo ----------------------------------
echo Running test-runner.js directly...
node test-runner.js
echo.

echo 3. Running Next.js application tests...
echo --------------------------------------
cd leadlove-credit-system
if not exist node_modules (
    echo Installing Next.js app dependencies...
    npm install
    if errorlevel 1 (
        echo ERROR: Failed to install Next.js dependencies
        pause
        exit /b 1
    )
)

echo Running Jest tests...
npm test -- --passWithNoTests --verbose
echo.

cd ..
echo.
echo 4. Running individual test components...
echo --------------------------------------
echo Running workflow validation...
node test-workflow-validation.js
echo.

echo Running environment setup test...
node test-environment-setup.js
echo.

echo.
echo ========================================
echo Test execution completed!
echo Check output above for any errors.
echo ========================================
pause