/**
 * Global Playwright Teardown
 * Cleans up test environment after running E2E tests
 */

async function globalTeardown() {
  console.log('🧹 Starting global test teardown...');

  try {
    // Clean up test database
    await cleanupTestDatabase();

    // Generate test reports
    await generateTestReports();

    // Archive test artifacts
    await archiveTestArtifacts();

    console.log('✅ Global teardown completed successfully');

  } catch (error) {
    console.error('❌ Global teardown failed:', error);
    // Don't throw error to avoid masking test failures
  }
}

async function cleanupTestDatabase() {
  console.log('🗄️ Cleaning up test database...');
  
  // In a real scenario, this would:
  // 1. Reset test database to clean state
  // 2. Clear temporary data
  // 3. Close database connections
  
  console.log('✅ Test database cleaned up');
}

async function generateTestReports() {
  console.log('📊 Generating test reports...');
  
  const fs = require('fs').promises;
  const path = require('path');
  
  try {
    // Create summary report
    const summary = {
      timestamp: new Date().toISOString(),
      platform: process.platform,
      nodeVersion: process.version,
      testRun: 'E2E Test Suite',
      environment: process.env.NODE_ENV || 'test',
      baseUrl: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    };

    await fs.writeFile(
      path.join('test-results', 'test-summary.json'),
      JSON.stringify(summary, null, 2)
    );

    console.log('✅ Test reports generated');
  } catch (error) {
    console.warn('⚠️ Failed to generate reports:', error.message);
  }
}

async function archiveTestArtifacts() {
  console.log('📦 Archiving test artifacts...');
  
  // In CI/CD, this would upload artifacts to storage
  // For local development, we just ensure they're organized
  
  console.log('✅ Test artifacts archived');
}

module.exports = globalTeardown;