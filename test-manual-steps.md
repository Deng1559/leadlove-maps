# Manual Test Execution Steps

## 🚨 Issue Resolution: Bypass Bash Environment

**Problem:** `cygpath: command not found` prevents bash execution
**Solution:** Direct Windows command execution

## 📋 Step-by-Step Manual Execution

### Option 1: Use test-direct.bat (Recommended)
1. **Navigate** to project folder: `G:\AI - Coding Projects\Telegram.GoogleMaps.Email.Enrichment.n8n`
2. **Double-click** `test-direct.bat`
3. **Wait** for completion and review results

### Option 2: Manual Command Prompt Execution

#### Step 1: Open Command Prompt
```cmd
# Press Win+R, type "cmd", press Enter
cd /d "G:\AI - Coding Projects\Telegram.GoogleMaps.Email.Enrichment.n8n"
```

#### Step 2: Verify Environment
```cmd
node --version
npm --version
```

#### Step 3: Install Dependencies (if needed)
```cmd
# Main project
npm install

# Next.js app
cd leadlove-credit-system
npm install
cd ..
```

#### Step 4: Run Tests Directly
```cmd
# Main test suite
node test-runner.js

# Workflow validation
node test-workflow-validation.js

# Environment setup
node test-environment-setup.js

# Next.js tests
cd leadlove-credit-system
npm test
```

### Option 3: PowerShell Execution
```powershell
# Open PowerShell as Administrator
cd "G:\AI - Coding Projects\Telegram.GoogleMaps.Email.Enrichment.n8n"
node test-runner.js

# Next.js tests
cd leadlove-credit-system
npm test
```

## 📊 Expected Results

### Main Project Tests (test-runner.js)
```
🚀 LeadLove Maps Complete Test Suite
====================================
Starting comprehensive system validation...

🔧 Setting up test environment...
✅ Test environment ready on port 3001

🔍 Running workflow validation...
✅ Workflow validation passed

🔗 Running integration tests...
✅ Integration tests passed

🎯 Running end-to-end tests...
✅ End-to-end tests passed

⚡ Running performance tests...
✅ Performance tests passed

📊 OVERALL SUMMARY
✅ ALL TESTS PASSED
• Total Duration: XXs
• Tests Passed: XX/XX
• Success Rate: 100%

🎯 DEPLOYMENT READINESS
🟢 READY for production deployment
```

### Next.js Tests (Jest)
```
 PASS  __tests__/api/leadlove/generate.test.js
 PASS  __tests__/api/usage/route.test.js
 PASS  __tests__/api/webhooks/stripe.test.js
 PASS  __tests__/components/leadlove/lead-generation-form.test.jsx
 PASS  __tests__/lib/utils.test.js

Test Suites: 5 passed, 5 total
Tests:       XX passed, XX total
Snapshots:   0 total
Time:        X.XXXs
Coverage:    XX% of statements (XX/XX)
             XX% of branches (XX/XX)
             XX% of functions (XX/XX)
             XX% of lines (XX/XX)
```

## 🔧 Troubleshooting Common Issues

### Issue: "node: command not found"
**Solution:**
1. Install Node.js from https://nodejs.org
2. Choose LTS version
3. Restart command prompt
4. Verify with `node --version`

### Issue: "Module not found" errors
**Solution:**
```cmd
# Install dependencies
npm install

# For Next.js app
cd leadlove-credit-system
npm install
```

### Issue: Port 3001 already in use
**Solution:**
1. Close other applications using port 3001
2. Or modify port in `test-environment-setup.js`

### Issue: Jest tests fail to start
**Solution:**
```cmd
cd leadlove-credit-system
npm install
npm test -- --passWithNoTests
```

## ✅ Success Validation

**Tests are working correctly if you see:**
- ✅ No critical errors in console output
- ✅ Test suites complete successfully
- ✅ Coverage reports generate (Jest)
- ✅ Performance metrics within targets
- ✅ Final deployment readiness assessment

**Performance Targets Met:**
- Response times <1000ms
- Memory usage reasonable
- All integration points working
- Error handling functioning

## 📈 After Successful Test Execution

1. **Review Results:** Check for any test failures or warnings
2. **Coverage Analysis:** Ensure Jest coverage meets 70% target
3. **Performance Review:** Verify metrics are within acceptable ranges
4. **Fix Issues:** Address any failing tests
5. **Documentation:** Update test results in project documentation

---

**Quick Commands Summary:**
```cmd
# Complete test suite
test-direct.bat

# Individual components
node test-runner.js
node test-workflow-validation.js
cd leadlove-credit-system && npm test
```