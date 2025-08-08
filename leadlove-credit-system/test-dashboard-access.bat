@echo off
echo ========================================
echo DASHBOARD ACCESS TEST
echo ========================================

echo 🔍 Testing dashboard compilation and access...
echo.

echo 📊 Expected Dashboard Features:
echo   ✅ Authentication disabled - direct access
echo   ✅ Credit balance display (1000 test credits)
echo   ✅ Quick actions for lead generation
echo   ✅ Usage statistics with mock data  
echo   ✅ Recent activity feed
echo   ✅ Navigation to all dashboard sections
echo.

echo 🌐 After server starts, test these URLs:
echo   • Homepage: http://localhost:3002/
echo   • Dashboard: http://localhost:3002/dashboard
echo   • Email Test: http://localhost:3002/test-email-strategist
echo   • Webhook Test: http://localhost:3002/test-webhook
echo.

echo ⚡ Starting server and monitoring for compilation...
echo   Watch for: "✓ Compiled /dashboard" (should succeed now)
echo.

cd /d "G:\AI - Coding Projects\Telegram.GoogleMaps.Email.Enrichment.n8n\leadlove-credit-system"

echo ========================================
echo SERVER OUTPUT:
echo ========================================

call npm run dev

pause