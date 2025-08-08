# LeadLove Maps Troubleshooting Guide

## 🚨 Current Issue: Bash Environment Configuration

### Problem
- **Error**: `cygpath: command not found`
- **Impact**: Cannot execute bash commands (npm, git, test scripts)
- **Scope**: Affects all command-line operations through Claude Code

### Root Cause Analysis
1. **Missing Cygwin**: `cygpath` utility not found in system PATH
2. **Git Bash Misconfiguration**: Git for Windows bash environment incomplete
3. **PATH Issues**: Bash shell cannot locate required utilities

## 🔧 Immediate Solutions

### Solution 1: Use Native Windows Commands
```cmd
# Instead of bash, use Windows Command Prompt
cd /d "G:\AI - Coding Projects\Telegram.GoogleMaps.Email.Enrichment.n8n"
npm test

# Or PowerShell
cd "G:\AI - Coding Projects\Telegram.GoogleMaps.Email.Enrichment.n8n"
npm test
```

### Solution 2: Fix Git Bash Environment
```bash
# Check if Git for Windows is properly installed
git --version

# Reinstall Git for Windows with full bash environment
# Download from: https://git-scm.com/download/win
# Ensure "Git Bash Here" option is selected during installation
```

### Solution 3: Alternative Command Execution
```cmd
# Use node directly for tests
node test-runner.js
node test-workflow-validation.js

# Navigate to Next.js app
cd leadlove-credit-system
npm test
```

## 🧪 Test Execution Workarounds

### Main Project Tests
```cmd
cd /d "G:\AI - Coding Projects\Telegram.GoogleMaps.Email.Enrichment.n8n"
node test-runner.js
```

### Next.js Application Tests
```cmd
cd /d "G:\AI - Coding Projects\Telegram.GoogleMaps.Email.Enrichment.n8n\leadlove-credit-system"
npm test
npm run test:coverage
npm run test:watch
```

### Individual Test Components
```cmd
# Workflow validation only
node test-workflow-validation.js

# Environment setup
node test-environment-setup.js

# Build validation
node build-validation.js
```

## 📊 Expected Test Results

### Main Project (test-runner.js)
- **Integration Tests**: 5 scenarios (Telegram/Frontend webhooks)
- **E2E Tests**: 5 workflows (complete user journeys)
- **Performance Tests**: 5 metrics (response times, throughput)
- **Expected Duration**: 30-60 seconds

### Next.js App (Jest)
- **Unit Tests**: API routes, components, utilities
- **Coverage Target**: 70% minimum
- **Test Files**: 5 test suites with mocking
- **Expected Duration**: 10-30 seconds

## 🔍 Validation Steps

### 1. Environment Check
```cmd
# Verify Node.js
node --version

# Verify npm
npm --version

# Check project dependencies
npm list --depth=0
```

### 2. Test Dependencies
```cmd
cd leadlove-credit-system
npm list --depth=0

# Should show:
# - jest
# - @testing-library/react
# - @testing-library/jest-dom
```

### 3. Port Availability
```cmd
# Test runner uses port 3001
netstat -an | findstr :3001
```

## ⚡ Quick Fixes

### If Node.js Missing
1. Install Node.js from https://nodejs.org
2. Choose LTS version
3. Restart terminal after installation

### If npm Dependencies Missing
```cmd
# Main project
npm install

# Next.js app
cd leadlove-credit-system
npm install
```

### If Port 3001 in Use
- Change port in test-environment-setup.js
- Or stop conflicting service

## 🎯 Success Indicators

### Successful Test Execution Shows:
- ✅ All integration tests pass
- ✅ Jest tests complete with coverage report
- ✅ Performance metrics within targets
- ✅ No critical errors or failures

### Performance Targets:
- Response time: <1000ms
- Memory usage: <100MB increase
- Throughput: >10 requests/second
- Success rate: >95%

## 📈 Next Steps After Resolution

1. **Run Complete Test Suite**: Execute all test categories
2. **Review Coverage Reports**: Ensure 70%+ code coverage
3. **Analyze Performance Metrics**: Verify targets are met
4. **Fix Any Failures**: Address specific test failures
5. **CI/CD Integration**: Set up automated testing pipeline

---

*Generated: $(date)*
*Issue: Bash environment configuration preventing command execution*
*Priority: High - blocks all automated testing*