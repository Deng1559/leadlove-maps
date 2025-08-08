#!/usr/bin/env node

/**
 * LeadLove Maps API Connection Test
 * 
 * This script tests the connection to the LeadLove Maps API to ensure
 * the integration is working properly.
 */

const fetch = require('node-fetch').default || require('node-fetch');
require('dotenv').config({ path: '.env.local' });

const LEADLOVE_API_URL = process.env.LEADLOVE_MAPS_API_URL || 'https://leadlove-maps.lovable.app';
const LEADLOVE_API_KEY = process.env.LEADLOVE_MAPS_API_KEY;

/**
 * Colors for console output
 */
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

/**
 * Log with colors
 */
function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Test basic connectivity to the LeadLove Maps API
 */
async function testBasicConnectivity() {
  log('cyan', '🔌 Testing basic connectivity...');
  
  try {
    const response = await fetch(LEADLOVE_API_URL, {
      method: 'GET',
      headers: {
        'User-Agent': 'LeadLove-Credit-System-Test/1.0'
      },
      timeout: 10000
    });
    
    log('green', `✅ Successfully connected to ${LEADLOVE_API_URL}`);
    log('blue', `   Status: ${response.status} ${response.statusText}`);
    
    return true;
  } catch (error) {
    log('red', `❌ Failed to connect to ${LEADLOVE_API_URL}`);
    log('red', `   Error: ${error.message}`);
    return false;
  }
}

/**
 * Test the generate API endpoint
 */
async function testGenerateEndpoint() {
  log('cyan', '🧪 Testing generate endpoint...');
  
  const testPayload = {
    businessType: 'restaurants',
    location: 'Miami Beach, FL',
    serviceOffering: 'digital marketing',
    countryCode: 'us',
    maxResults: 5,
    userId: 'test-user-123',
    userName: 'Test User',
    source: 'connection_test',
    timestamp: new Date().toISOString(),
    requestId: `test-${Date.now()}`,
    generateEmails: true,
    includeAnalysis: true,
    outputFormat: 'comprehensive'
  };
  
  try {
    const response = await fetch(`${LEADLOVE_API_URL}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'LeadLove-Credit-System-Test/1.0',
        'X-Request-ID': testPayload.requestId,
        'X-Source': 'connection_test',
        ...(LEADLOVE_API_KEY && { 'Authorization': `Bearer ${LEADLOVE_API_KEY}` })
      },
      body: JSON.stringify(testPayload),
      timeout: 30000
    });
    
    const data = await response.json();
    
    if (response.ok) {
      log('green', '✅ Generate endpoint is working');
      log('blue', `   Response: ${JSON.stringify(data, null, 2)}`);
    } else {
      log('yellow', '⚠️ Generate endpoint responded but with error');
      log('yellow', `   Status: ${response.status} ${response.statusText}`);
      log('yellow', `   Response: ${JSON.stringify(data, null, 2)}`);
    }
    
    return { success: response.ok, data };
  } catch (error) {
    log('red', '❌ Failed to test generate endpoint');
    log('red', `   Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Test the status endpoint
 */
async function testStatusEndpoint() {
  log('cyan', '📊 Testing status endpoint...');
  
  const testWorkflowId = `test-${Date.now()}`;
  
  try {
    const response = await fetch(`${LEADLOVE_API_URL}/api/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'LeadLove-Credit-System-Test/1.0',
        'X-Request-ID': testWorkflowId,
        'X-Source': 'connection_test',
        ...(LEADLOVE_API_KEY && { 'Authorization': `Bearer ${LEADLOVE_API_KEY}` })
      },
      body: JSON.stringify({
        workflowId: testWorkflowId,
        requestId: testWorkflowId,
        source: 'connection_test'
      }),
      timeout: 15000
    });
    
    const data = await response.json();
    
    if (response.ok) {
      log('green', '✅ Status endpoint is working');
      log('blue', `   Response: ${JSON.stringify(data, null, 2)}`);
    } else {
      log('yellow', '⚠️ Status endpoint responded but with error');
      log('yellow', `   Status: ${response.status} ${response.statusText}`);
      log('yellow', `   Response: ${JSON.stringify(data, null, 2)}`);
    }
    
    return { success: response.ok, data };
  } catch (error) {
    log('red', '❌ Failed to test status endpoint');
    log('red', `   Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Main test function
 */
async function runConnectionTests() {
  log('bright', '='.repeat(60));
  log('bright', '🚀 LeadLove Maps API Connection Test');
  log('bright', '='.repeat(60));
  
  log('magenta', `API URL: ${LEADLOVE_API_URL}`);
  log('magenta', `API Key: ${LEADLOVE_API_KEY ? '✅ Configured' : '❌ Not configured'}`);
  log('bright', '-'.repeat(60));
  
  const results = {
    connectivity: false,
    generate: false,
    status: false
  };
  
  // Test basic connectivity
  results.connectivity = await testBasicConnectivity();
  
  if (results.connectivity) {
    // Test generate endpoint
    const generateResult = await testGenerateEndpoint();
    results.generate = generateResult.success;
    
    // Test status endpoint
    const statusResult = await testStatusEndpoint();
    results.status = statusResult.success;
  } else {
    log('yellow', '⚠️ Skipping endpoint tests due to connectivity failure');
  }
  
  // Summary
  log('bright', '-'.repeat(60));
  log('bright', '📋 Test Summary:');
  log(results.connectivity ? 'green' : 'red', `   Connectivity: ${results.connectivity ? '✅ PASS' : '❌ FAIL'}`);
  log(results.generate ? 'green' : 'red', `   Generate API: ${results.generate ? '✅ PASS' : '❌ FAIL'}`);
  log(results.status ? 'green' : 'red', `   Status API: ${results.status ? '✅ PASS' : '❌ FAIL'}`);
  
  const overallSuccess = results.connectivity && (results.generate || results.status);
  log('bright', '-'.repeat(60));
  log(overallSuccess ? 'green' : 'red', `🎯 Overall Result: ${overallSuccess ? '✅ SUCCESS' : '❌ FAILURE'}`);
  
  if (!overallSuccess) {
    log('yellow', '\n💡 Troubleshooting Tips:');
    if (!results.connectivity) {
      log('yellow', '   • Check if the LEADLOVE_MAPS_API_URL is correct');
      log('yellow', '   • Verify network connectivity to the API server');
      log('yellow', '   • Check firewall settings');
    }
    if (!results.generate && !results.status) {
      log('yellow', '   • Verify the API endpoints exist (/api/generate, /api/status)');
      log('yellow', '   • Check if LEADLOVE_MAPS_API_KEY is correctly configured');
      log('yellow', '   • Review API authentication requirements');
    }
    log('yellow', '   • Check the LeadLove Maps API documentation');
    log('yellow', '   • Verify the API is running and accessible');
  }
  
  log('bright', '='.repeat(60));
  
  process.exit(overallSuccess ? 0 : 1);
}

// Handle uncaught errors
process.on('unhandledRejection', (error) => {
  log('red', `❌ Unhandled error: ${error.message}`);
  process.exit(1);
});

// Run the tests
runConnectionTests().catch((error) => {
  log('red', `❌ Test execution failed: ${error.message}`);
  process.exit(1);
});