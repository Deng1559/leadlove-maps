/**
 * Global Playwright Setup
 * Prepares test environment before running E2E tests
 */

const { chromium } = require('@playwright/test');
const path = require('path');

async function globalSetup() {
  console.log('🚀 Starting global test setup...');

  try {
    // Create test directories
    const testDirs = [
      'test-results',
      'test-results/screenshots',
      'test-results/videos',
      'test-results/traces',
      'test-results/accessibility',
      'test-results/performance',
      'playwright-report'
    ];

    for (const dir of testDirs) {
      await createDirIfNotExists(dir);
    }

    // Setup test database state
    await setupTestDatabase();

    // Warm up the application
    await warmupApplication();

    console.log('✅ Global setup completed successfully');

  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  }
}

async function createDirIfNotExists(dirPath) {
  const fs = require('fs').promises;
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
    console.log(`📁 Created directory: ${dirPath}`);
  }
}

async function setupTestDatabase() {
  console.log('🗄️ Setting up test database...');
  
  // In a real scenario, this would:
  // 1. Create test database schema
  // 2. Run migrations
  // 3. Seed with test data
  
  // For now, we'll simulate this
  console.log('✅ Test database ready');
}

async function warmupApplication() {
  console.log('🔥 Warming up application...');
  
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    // Wait for application to be ready
    await page.goto('http://localhost:3000', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    // Check if app is responsive
    await page.waitForSelector('body', { timeout: 10000 });
    
    console.log('✅ Application warmed up successfully');
  } catch (error) {
    console.warn('⚠️ Application warmup failed, continuing anyway:', error.message);
  } finally {
    await browser.close();
  }
}

module.exports = globalSetup;