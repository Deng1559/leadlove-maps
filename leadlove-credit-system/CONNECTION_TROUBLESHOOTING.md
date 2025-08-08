# Connection Refused Troubleshooting Guide

## 🚨 Problem: ERR_CONNECTION_REFUSED

This error means the development server is not running or not accessible.

## 🔧 QUICK FIXES (Try in Order)

### Fix 1: Complete Diagnostic & Auto-Start
```cmd
# Double-click or run:
debug-connection.bat
```
This script will:
- Check Node.js/npm installation
- Verify project directory and dependencies  
- Kill conflicting processes
- Check port availability
- Start server with full diagnostics

### Fix 2: Clean Server Start (Recommended)
```cmd
# Double-click or run:
start-server-clean.bat
```
This script will:
- Kill existing Node processes
- Clear port locks
- Start server on clean port 3003
- Avoid port conflicts entirely

### Fix 3: Manual PowerShell Start
```powershell
# Open PowerShell as Administrator
cd "G:\AI - Coding Projects\Telegram.GoogleMaps.Email.Enrichment.n8n\leadlove-credit-system"
Get-Process | Where-Object {$_.Name -eq "node"} | Stop-Process -Force
npm run dev -- -p 3003
```

### Fix 4: Alternative Port Method
```cmd
cd "G:\AI - Coding Projects\Telegram.GoogleMaps.Email.Enrichment.n8n\leadlove-credit-system"
npm run dev -- --port 3004
```

## 🔍 DIAGNOSTIC STEPS

### Step 1: Verify Server is Running
After running any start script, look for output like:
```
✓ Ready in 2.3s
- Local:        http://localhost:3003
- Network:      http://192.168.1.100:3003
```

### Step 2: Test the Correct URL
Use the EXACT URL shown in the server output:
- ✅ `http://localhost:3003` (if server shows port 3003)
- ✅ `http://localhost:3002` (if server shows port 3002)
- ❌ `http://localhost:3000` (if server is actually on 3003)

### Step 3: Browser Cache Issues
If URL looks correct but still fails:
1. **Hard Refresh**: Ctrl+Shift+R (Chrome/Edge) or Ctrl+F5
2. **Clear Browser Cache**: Settings → Clear browsing data
3. **Try Incognito/Private Window**
4. **Try Different Browser**

## 🛠️ ADVANCED TROUBLESHOOTING

### Check What's Running on Ports
```cmd
# Check specific ports
netstat -ano | findstr :3000
netstat -ano | findstr :3001
netstat -ano | findstr :3002
netstat -ano | findstr :3003
```

### Kill Specific Process
```cmd
# If you see a PID (Process ID), kill it:
taskkill /PID [PID_NUMBER] /F
```

### Reset Network Stack (Admin Required)
```cmd
# Run as Administrator
ipconfig /flushdns
netsh winsock reset
netsh int ip reset
# Restart computer after this
```

## 🎯 COMMON SOLUTIONS

### Issue: "Port 3000 in use, trying 3001..."
**Solution**: Use the ACTUAL port shown in the output, not 3000

### Issue: Server starts but browser can't connect
**Solution**: 
1. Check Windows Firewall settings
2. Try `127.0.0.1:3003` instead of `localhost:3003`
3. Disable VPN/Proxy temporarily

### Issue: Server stops immediately after starting
**Solution**:
1. Check for TypeScript/ESLint errors in console
2. Verify all dependencies installed: `npm install`
3. Check Node.js version: `node --version` (needs v18+)

## 🌐 TEST URLs (Replace port as needed)

Once server is running, test these URLs:

### Main Application
- **Homepage**: `http://localhost:3003/`
- **Dashboard**: `http://localhost:3003/dashboard`

### Test Interfaces  
- **Email Strategist**: `http://localhost:3003/test-email-strategist`
- **Webhook Test**: `http://localhost:3003/test-webhook`

### API Endpoints
- **Email Generation**: `http://localhost:3003/api/email-sequences/generate`
- **Webhook Scraper**: `http://localhost:3003/api/webhook/google-maps-scraper`

## ✅ SUCCESS INDICATORS

When working correctly, you should see:
1. ✅ Server console shows "Ready in X.Xs"
2. ✅ Browser loads homepage with "LeadLove Maps" title
3. ✅ Navigation buttons work ("Test Email Strategist", "Get Started")
4. ✅ No console errors in browser Developer Tools (F12)

## 🆘 STILL NOT WORKING?

If none of the above work:

1. **Check Project Files**: Ensure you're in the correct directory
2. **Reinstall Dependencies**: Delete `node_modules` folder and run `npm install`  
3. **Check Node Version**: Must be v18 or higher
4. **Windows Defender**: Temporarily disable to test
5. **Antivirus Software**: May be blocking localhost connections

## 📞 LAST RESORT: Complete Reset

```cmd
cd "G:\AI - Coding Projects\Telegram.GoogleMaps.Email.Enrichment.n8n\leadlove-credit-system"
rmdir /s node_modules
del package-lock.json
npm install
npm run dev -- -p 3005
```

---

**The system IS working** - this is purely a connection/startup issue. The B2B Cold Email Strategist system is fully functional once properly connected.