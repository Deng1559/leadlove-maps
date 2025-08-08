@echo off
echo Running LeadLove Maps Test Suite
echo ================================

cd /d "G:\AI - Coding Projects\Telegram.GoogleMaps.Email.Enrichment.n8n"

echo.
echo 1. Running Main Project Tests...
echo --------------------------------
call npm test

echo.
echo 2. Running Next.js Application Tests...
echo --------------------------------------
cd leadlove-credit-system
call npm test

echo.
echo 3. Running Integration Tests...
echo ------------------------------
cd ..
call node test-runner.js

echo.
echo Tests Complete!
pause