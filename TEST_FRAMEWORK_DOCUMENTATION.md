# 📋 LeadLove Maps Test Automation Framework Documentation

## Overview

This comprehensive test automation framework provides enterprise-grade testing capabilities for the LeadLove Maps credit system, covering all aspects from unit testing to end-to-end validation with Windows compatibility and CI/CD integration.

## 🏗️ Framework Architecture

```
leadlove-credit-system/
├── __tests__/
│   ├── accessibility/          # WCAG compliance testing
│   ├── api/                   # API unit tests  
│   ├── components/            # React component tests
│   ├── contract/              # API contract validation
│   ├── e2e/                   # End-to-end test setup
│   ├── factories/             # Test data generation
│   ├── lib/                   # Utility function tests
│   ├── mocks/                 # Advanced mock servers
│   ├── monitoring/            # Metrics & monitoring
│   ├── performance/           # Load & performance tests
│   ├── security/             # Security vulnerability tests
│   ├── setup.js              # Jest configuration
│   ├── utils/                # Test utilities
│   └── visual/               # Visual regression tests
├── scripts/
│   ├── run-tests.js          # Node.js test runner
│   └── run-tests-windows.ps1 # PowerShell test runner
├── playwright.config.js      # Playwright configuration
└── jest.config.js           # Jest configuration
```

## 🚀 Getting Started

### Prerequisites

- **Node.js**: >= 18.0.0
- **npm**: Latest version
- **PowerShell** (Windows): For Windows test execution
- **Git**: For version control integration

### Installation

```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install

# Install additional testing dependencies
npm install -D @faker-js/faker axe-playwright ajv ajv-formats
```

### Quick Start

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run E2E tests
npx playwright test

# Windows PowerShell execution
.\scripts\run-tests-windows.ps1 -TestSuite all -Coverage
```

## 📊 Test Categories

### 1. Unit Tests (60% of test suite)
**Location**: `__tests__/api/`, `__tests__/lib/`, `__tests__/components/`
**Technology**: Jest + React Testing Library
**Coverage**: 70% minimum threshold

```javascript
// Example unit test
describe('Credit Calculator', () => {
  test('calculates correct cost for basic generation', () => {
    const cost = calculateCreditCost('leadlove_maps', { maxResults: 10 });
    expect(cost).toBe(3);
  });
});
```

### 2. Integration Tests (20% of test suite)
**Location**: `__tests__/api/`
**Technology**: Supertest + Mock servers
**Focus**: API endpoint integration, database operations

```javascript
// Example integration test
describe('Lead Generation API Integration', () => {
  test('creates workflow and deducts credits', async () => {
    const response = await request(app)
      .post('/api/leadlove/generate')
      .send({ businessType: 'restaurants', location: 'Miami' })
      .expect(200);
      
    expect(response.body.workflowId).toBeDefined();
    // Verify credit deduction in database
  });
});
```

### 3. End-to-End Tests (5% of test suite)
**Location**: `__tests__/e2e/`
**Technology**: Playwright (cross-browser)
**Coverage**: Chrome, Firefox, Safari, Mobile

```javascript
// Example E2E test
test('complete lead generation workflow', async ({ page }) => {
  await page.goto('/dashboard/generate');
  await page.fill('input[name="businessType"]', 'restaurants');
  await page.fill('input[name="location"]', 'Miami Beach');
  await page.click('button[type="submit"]');
  
  await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
});
```

### 4. Visual Regression Tests (5% of test suite)
**Location**: `__tests__/visual/`
**Technology**: Playwright Screenshots
**Coverage**: Desktop, Mobile, Dark Mode

```javascript
// Example visual test
test('dashboard layout visual regression', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page).toHaveScreenshot('dashboard-overview.png');
});
```

### 5. Accessibility Tests (5% of test suite)
**Location**: `__tests__/accessibility/`
**Technology**: Axe-core + Playwright
**Standards**: WCAG 2.1 AA compliance

```javascript
// Example accessibility test
test('dashboard accessibility compliance', async ({ page }) => {
  await page.goto('/dashboard');
  await injectAxe(page);
  await checkA11y(page, null, {
    detailedReport: true,
    detailedReportOptions: { html: true }
  });
});
```

### 6. Security Tests (3% of test suite)
**Location**: `__tests__/security/`
**Technology**: Playwright + Custom validators
**Coverage**: OWASP Top 10, Input validation

```javascript
// Example security test
test('prevents SQL injection attacks', async ({ request }) => {
  const maliciousInput = "'; DROP TABLE users; --";
  const response = await request.post('/api/leadlove/generate', {
    data: { businessType: maliciousInput, location: 'Miami' }
  });
  
  expect(response.status()).toBe(400);
  expect(await response.text()).not.toContain('sql');
});
```

### 7. Performance Tests (2% of test suite)
**Location**: `__tests__/performance/`
**Technology**: Playwright + Custom metrics
**Thresholds**: API < 500ms, Page load < 3s

```javascript
// Example performance test
test('API response time under load', async ({ request }) => {
  const requests = Array.from({ length: 10 }, () =>
    request.get('/api/usage')
  );
  
  const startTime = Date.now();
  await Promise.all(requests);
  const totalTime = Date.now() - startTime;
  
  expect(totalTime / 10).toBeLessThan(500); // Average < 500ms
});
```

## 🔧 Configuration

### Jest Configuration (`jest.config.js`)
```javascript
module.exports = createJestConfig({
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.js'],
  testEnvironment: 'jsdom',
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
});
```

### Playwright Configuration (`playwright.config.js`)
```javascript
module.exports = defineConfig({
  testDir: './__tests__/e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: devices['Desktop Chrome'] },
    { name: 'firefox', use: devices['Desktop Firefox'] },
    { name: 'webkit', use: devices['Desktop Safari'] },
    { name: 'Mobile Chrome', use: devices['Pixel 5'] },
    { name: 'Mobile Safari', use: devices['iPhone 12'] },
  ],
});
```

## 🪟 Windows Compatibility

### PowerShell Test Runner
The framework includes a comprehensive PowerShell script for Windows environments:

```powershell
# Run all tests with coverage
.\scripts\run-tests-windows.ps1 -TestSuite all -Coverage

# Run specific test suite
.\scripts\run-tests-windows.ps1 -TestSuite e2e -Browser firefox -Headed

# CI mode
.\scripts\run-tests-windows.ps1 -CI -Workers 1
```

### Windows-Specific Features
- **Cross-platform process management**: pm2 for consistent process handling
- **Path resolution**: Node.js path module for Windows path compatibility
- **Environment setup**: PowerShell-native directory creation and management
- **Error handling**: Windows-specific error code handling

## 🔄 CI/CD Integration

### GitHub Actions Pipeline
```yaml
# .github/workflows/test-automation.yml
name: Test Automation Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      - run: npm ci
      - run: npm run test:ci

  e2e-tests:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        browser: [chromium, firefox, webkit]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      - run: npm ci
      - run: npx playwright install --with-deps ${{ matrix.browser }}
      - run: npx playwright test --project=${{ matrix.browser }}
```

### Quality Gates
- **Unit Tests**: Must pass with 70% coverage
- **Security Tests**: Zero critical vulnerabilities
- **E2E Tests**: Core user journeys must pass
- **Performance**: Response times within thresholds
- **Accessibility**: WCAG 2.1 AA compliance

## 📊 Test Data Management

### Data Factories
```javascript
// Test data generation with Faker.js
const factory = new TestDataFactory(12345); // Consistent seed

const user = factory.createUser({
  credits: 100,
  subscription_tier: 'pro'
});

const business = factory.createBusiness({
  rating: 4.5,
  business_status: 'OPERATIONAL'
});
```

### Mock Servers
```javascript
// Advanced mock server with scenario simulation
const mockServer = new AdvancedMockServer(3001);
await mockServer.start();

// Configure test scenarios
mockServer.setDelay('/api/usage', 100); // 100ms delay
mockServer.setFailureRate('/api/generate', 0.1); // 10% failure rate
```

## 📈 Monitoring & Reporting

### Test Metrics Collection
```javascript
const metricsCollector = new TestMetricsCollector();

// Record test execution
await metricsCollector.recordTestRun({
  totalTests: 150,
  passedTests: 148,
  failedTests: 2,
  duration: 45000
});

// Generate dashboard
const dashboard = await metricsCollector.generateDashboard();
```

### Key Metrics Tracked
- **Coverage Trends**: Statement, branch, function, line coverage over time
- **Performance Trends**: Response times, throughput, memory usage
- **Reliability Metrics**: Success rate, flakiness rate, stability
- **Test Health Score**: Overall framework health assessment

### Dashboard Features
- **Real-time Metrics**: Live test execution statistics
- **Trend Analysis**: Historical performance and quality trends
- **Alert System**: Automatic threshold violation notifications
- **Recommendations**: AI-powered suggestions for improvement

## 🚨 Troubleshooting

### Common Issues

#### Windows Path Issues
```powershell
# Solution: Use PowerShell script
.\scripts\run-tests-windows.ps1 -TestSuite unit
```

#### Playwright Browser Installation
```bash
# Install all browsers
npx playwright install

# Install specific browser
npx playwright install chromium
```

#### Jest Memory Issues
```bash
# Increase Node.js memory
export NODE_OPTIONS="--max-old-space-size=4096"
npm test
```

#### Port Conflicts
```bash
# Kill process on port 3000
npx kill-port 3000
```

### Debugging Tests

#### Jest Debugging
```bash
# Debug specific test
npm test -- --testNamePattern="specific test" --verbose

# Run in debug mode
node --inspect-brk node_modules/.bin/jest --runInBand
```

#### Playwright Debugging
```bash
# Run in headed mode
npx playwright test --headed

# Debug mode
npx playwright test --debug

# Generate trace
npx playwright test --trace on
```

## 📚 Best Practices

### Test Writing Guidelines

1. **Arrange-Act-Assert Pattern**
```javascript
test('should calculate credit cost correctly', () => {
  // Arrange
  const params = { tool: 'leadlove_maps', maxResults: 10 };
  
  // Act
  const cost = calculateCreditCost(params);
  
  // Assert
  expect(cost).toBe(3);
});
```

2. **Descriptive Test Names**
```javascript
// Good ✅
test('should reject generation request when user has insufficient credits');

// Bad ❌
test('credit test');
```

3. **Test Independence**
```javascript
// Each test should be independent
beforeEach(() => {
  // Reset state
  cleanDatabase();
  resetMocks();
});
```

4. **Mock External Dependencies**
```javascript
// Mock external APIs
jest.mock('../services/googleMaps', () => ({
  searchBusinesses: jest.fn().mockResolvedValue([])
}));
```

### Performance Guidelines

1. **Parallel Execution**: Run tests in parallel where possible
2. **Test Data Cleanup**: Clean up test data after each test
3. **Mock Heavy Operations**: Mock database queries and API calls
4. **Optimize Selectors**: Use efficient selectors in E2E tests

### Security Guidelines

1. **No Hardcoded Secrets**: Use environment variables
2. **Test Data Isolation**: Separate test and production data
3. **Input Validation**: Test all input validation scenarios
4. **Authentication Testing**: Verify auth boundaries

## 📞 Support & Maintenance

### Framework Maintenance

1. **Regular Updates**: Keep testing dependencies updated
2. **Browser Updates**: Update Playwright browsers monthly
3. **Metric Analysis**: Review test metrics weekly
4. **Performance Monitoring**: Monitor test execution times

### Getting Help

1. **Documentation**: Check this documentation first
2. **Issue Tracking**: Use GitHub issues for bug reports
3. **Code Review**: Peer review for test additions
4. **Knowledge Sharing**: Document learnings and improvements

---

## 📋 Quick Reference

### Essential Commands

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test suite
npm test -- --testPathPattern=api

# Run E2E tests
npx playwright test

# Run E2E tests in headed mode
npx playwright test --headed

# Generate test report
npm run test:report

# Windows PowerShell
.\scripts\run-tests-windows.ps1 -TestSuite all
```

### File Locations

| Test Type | Location | Command |
|-----------|----------|---------|
| Unit Tests | `__tests__/api/`, `__tests__/lib/` | `npm test` |
| Component Tests | `__tests__/components/` | `npm test` |
| E2E Tests | `__tests__/e2e/` | `npx playwright test` |
| Visual Tests | `__tests__/visual/` | `npx playwright test --grep visual` |
| Accessibility | `__tests__/accessibility/` | `npx playwright test --grep a11y` |
| Security Tests | `__tests__/security/` | `npx playwright test security/` |
| Performance | `__tests__/performance/` | `npx playwright test performance/` |

### Quality Thresholds

| Metric | Minimum | Target | Excellent |
|--------|---------|--------|-----------|
| Code Coverage | 70% | 85% | 95% |
| API Response Time | < 500ms | < 200ms | < 100ms |
| Page Load Time | < 3s | < 1.5s | < 1s |
| Success Rate | 95% | 98% | 99.5% |
| Flakiness Rate | < 2% | < 1% | < 0.5% |

This comprehensive test automation framework ensures reliable, maintainable, and scalable testing for the LeadLove Maps credit system with full Windows compatibility and enterprise-grade features.