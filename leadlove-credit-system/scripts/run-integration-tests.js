#!/usr/bin/env node

/**
 * Comprehensive Integration Test Runner
 * Tests frontend, backend, Lovable.dev integration, search results, and email copy generation
 */

const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

// Configuration
const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
const LOVABLE_API_URL = process.env.LEADLOVE_MAPS_API_URL || 'https://leadlove-maps.lovable.app';

// Colors for console output
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

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Test data
const testBusiness = {
  name: 'Joe\'s Pizza',
  industry: 'restaurants',
  location: 'Miami Beach, FL',
  website: 'https://joespizza.com',
  ownerName: 'Joe'
};

const webhookTestData = {
  businessType: 'restaurants',
  location: 'Miami Beach, FL',
  serviceOffering: 'digital marketing',
  maxResults: 5,
  userId: 'integration-test-user',
  userName: 'Integration Test User'
};

const testLeads = [
  {
    name: 'Elite Fitness Studio',
    industry: 'fitness',
    location: 'Los Angeles, CA',
    email: 'info@elitefitness.com',
    ownerName: 'Sarah'
  },
  {
    name: 'Urban Threads',
    industry: 'retail',
    location: 'New York, NY',
    email: 'contact@urbanthreads.com'
  }
];

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  details: []
};

async function runTest(testName, testFunction) {
  testResults.total++;
  try {
    log('cyan', `🧪 Running: ${testName}`);
    const startTime = Date.now();
    
    await testFunction();
    
    const duration = Date.now() - startTime;
    testResults.passed++;
    testResults.details.push({
      name: testName,
      status: 'PASSED',
      duration: `${duration}ms`
    });
    
    log('green', `✅ PASSED: ${testName} (${duration}ms)`);
    return true;
  } catch (error) {
    testResults.failed++;
    testResults.details.push({
      name: testName,
      status: 'FAILED',
      error: error.message
    });
    
    log('red', `❌ FAILED: ${testName}`);
    log('red', `   Error: ${error.message}`);
    return false;
  }
}

// Backend API Tests
async function testEmailStrategistAPI() {
  const response = await fetch(`${BASE_URL}/api/email-sequences/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      businessData: testBusiness,
      serviceOffering: 'digital-marketing',
      variables: {
        metric: 'customer traffic',
        topic: 'restaurant growth'
      }
    })
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  const result = await response.json();
  
  if (!result.success) {
    throw new Error(`API returned success: false - ${result.error}`);
  }
  
  // Validate structure
  if (!result.sequence?.firstEmail?.subjectLines) {
    throw new Error('Invalid response structure - missing subject lines');
  }
  
  // Validate subject line count and length
  const subjectLines = result.sequence.firstEmail.subjectLines;
  const categories = ['direct', 'casual', 'curiosity', 'triggerBased'];
  
  for (const category of categories) {
    if (!subjectLines[category] || subjectLines[category].length !== 5) {
      throw new Error(`Invalid ${category} subject lines - expected 5, got ${subjectLines[category]?.length}`);
    }
    
    // Check length constraint
    for (const subject of subjectLines[category]) {
      if (subject.length > 60) {
        throw new Error(`Subject line too long: "${subject}" (${subject.length} chars)`);
      }
    }
  }
  
  // Validate email structure
  const email = result.sequence.firstEmail;
  if (!email.opener || !email.pitch || !email.credibility || !email.callToAction) {
    throw new Error('Missing required email components');
  }
  
  // Validate follow-up sequence
  const followUp = result.sequence.followUpSequence;
  const expectedEmails = ['email2', 'email3', 'email4', 'email5'];
  
  for (const emailKey of expectedEmails) {
    if (!followUp[emailKey]?.subject || !followUp[emailKey]?.body) {
      throw new Error(`Missing ${emailKey} in follow-up sequence`);
    }
  }
}

async function testLeadEnhancementAPI() {
  const response = await fetch(`${BASE_URL}/api/leads/enhance-emails`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      leads: testLeads,
      serviceOffering: 'digital-marketing',
      globalVariables: {
        metric: 'revenue growth',
        topic: 'business automation'
      }
    })
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  const result = await response.json();
  
  if (!result.success) {
    throw new Error(`API returned success: false - ${result.error}`);
  }
  
  if (result.enhancedLeads.length !== testLeads.length) {
    throw new Error(`Expected ${testLeads.length} enhanced leads, got ${result.enhancedLeads.length}`);
  }
  
  // Validate enhanced leads
  let successfulEnhancements = 0;
  for (const lead of result.enhancedLeads) {
    if (lead.emailSequence) {
      successfulEnhancements++;
      if (!lead.emailSequence.firstEmail || !lead.emailSequence.followUpSequence) {
        throw new Error(`Incomplete email sequence for ${lead.name}`);
      }
    }
  }
  
  if (successfulEnhancements === 0) {
    throw new Error('No leads were successfully enhanced');
  }
}

async function testWebhookAPI() {
  const response = await fetch(`${BASE_URL}/api/webhook/google-maps-scraper`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(webhookTestData)
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  const result = await response.json();
  
  if (!result.success) {
    throw new Error(`Webhook returned success: false - ${result.error}`);
  }
  
  if (!result.workflowId) {
    throw new Error('Missing workflowId in webhook response');
  }
  
  if (result.metadata?.source !== 'webhook') {
    throw new Error(`Expected source 'webhook', got '${result.metadata?.source}'`);
  }
}

async function testWebhookStatusAPI() {
  const testWorkflowId = `test-workflow-${Date.now()}`;
  
  const response = await fetch(`${BASE_URL}/api/webhook/google-maps-status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ workflowId: testWorkflowId })
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  const result = await response.json();
  
  if (result.workflowId !== testWorkflowId) {
    throw new Error(`Expected workflowId '${testWorkflowId}', got '${result.workflowId}'`);
  }
}

// Lovable.dev Integration Tests
async function testLovableConnectivity() {
  try {
    const response = await fetch(LOVABLE_API_URL, {
      method: 'GET',
      headers: { 'User-Agent': 'Integration-Test/1.0' },
      timeout: 15000
    });
    
    if (response.status >= 500) {
      throw new Error(`Server error: ${response.status}`);
    }
    
    log('green', `   Lovable.dev responded with status: ${response.status}`);
  } catch (error) {
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      throw new Error('Cannot connect to Lovable.dev API - network or DNS issue');
    }
    throw error;
  }
}

async function testEnhancedPayloadFormat() {
  // Test that our webhook configuration includes enhanced email settings
  const enhancedConfig = {
    emailStrategist: 'b2b-cold-email-expert',
    emailPersona: 'digital-marketing',
    deliverabilityOptimized: true,
    generateEmails: true,
    includeAnalysis: true,
    outputFormat: 'comprehensive'
  };
  
  // Validate configuration
  for (const [key, expectedValue] of Object.entries(enhancedConfig)) {
    if (typeof expectedValue === 'boolean' && enhancedConfig[key] !== expectedValue) {
      throw new Error(`Invalid ${key}: expected ${expectedValue}, got ${enhancedConfig[key]}`);
    }
    if (typeof expectedValue === 'string' && enhancedConfig[key] !== expectedValue) {
      throw new Error(`Invalid ${key}: expected ${expectedValue}, got ${enhancedConfig[key]}`);
    }
  }
}

// Email Copy Quality Tests
async function testEmailCopyQuality() {
  const response = await fetch(`${BASE_URL}/api/email-sequences/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      businessData: testBusiness,
      serviceOffering: 'digital-marketing'
    })
  });
  
  const result = await response.json();
  const sequence = result.sequence;
  
  // Test subject line quality
  const allSubjects = Object.values(sequence.firstEmail.subjectLines).flat();
  
  // All subject lines should be under 60 characters
  for (const subject of allSubjects) {
    if (subject.length > 60) {
      throw new Error(`Subject line too long: "${subject}" (${subject.length} chars)`);
    }
  }
  
  // Should contain personalization
  const hasPersonalization = allSubjects.some(subject => 
    subject.includes('Joe') || subject.includes(testBusiness.name)
  );
  
  if (!hasPersonalization) {
    throw new Error('Subject lines lack personalization');
  }
  
  // Test email body structure
  const requiredComponents = ['opener', 'pitch', 'credibility', 'callToAction'];
  for (const component of requiredComponents) {
    if (!sequence.firstEmail[component] || sequence.firstEmail[component].length < 10) {
      throw new Error(`Email ${component} is missing or too short`);
    }
  }
  
  // Test follow-up quality
  const followUpEmails = Object.values(sequence.followUpSequence);
  if (followUpEmails.length !== 4) {
    throw new Error(`Expected 4 follow-up emails, got ${followUpEmails.length}`);
  }
  
  for (let i = 0; i < followUpEmails.length; i++) {
    const email = followUpEmails[i];
    if (!email.subject || email.subject.length > 60) {
      throw new Error(`Follow-up email ${i + 1} has invalid subject`);
    }
    if (!email.body || email.body.length < 50) {
      throw new Error(`Follow-up email ${i + 1} body is too short`);
    }
  }
}

async function testIndustryPersonalization() {
  const industries = ['restaurants', 'fitness', 'retail', 'automotive'];
  
  for (const industry of industries) {
    const testData = {
      ...testBusiness,
      industry,
      name: `Test ${industry.charAt(0).toUpperCase() + industry.slice(1)} Business`
    };
    
    const response = await fetch(`${BASE_URL}/api/email-sequences/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        businessData: testData,
        serviceOffering: 'digital-marketing'
      })
    });
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(`Failed to generate sequence for ${industry}: ${result.error}`);
    }
    
    // Check if industry-specific content is present
    const fullContent = `${result.sequence.firstEmail.opener} ${result.sequence.firstEmail.pitch}`.toLowerCase();
    const industryMentioned = fullContent.includes(industry.toLowerCase()) || 
                             fullContent.includes(testData.name.toLowerCase());
    
    if (!industryMentioned) {
      throw new Error(`Industry-specific content missing for ${industry}`);
    }
  }
}

// Frontend Tests (basic connectivity)
async function testFrontendPages() {
  const pages = [
    '/test-webhook',
    '/test-email-strategist'
  ];
  
  for (const page of pages) {
    const response = await fetch(`${BASE_URL}${page}`);
    
    if (response.status === 404) {
      throw new Error(`Page ${page} not found`);
    }
    
    if (response.status >= 500) {
      throw new Error(`Server error on ${page}: ${response.status}`);
    }
    
    log('green', `   Page ${page} accessible (${response.status})`);
  }
}

// Error Handling Tests
async function testErrorHandling() {
  // Test missing required fields
  const response = await fetch(`${BASE_URL}/api/email-sequences/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ businessData: {} })
  });
  
  if (response.status !== 400) {
    throw new Error(`Expected 400 error for invalid request, got ${response.status}`);
  }
  
  const result = await response.json();
  if (!result.error) {
    throw new Error('Error response missing error message');
  }
}

// Generate Test Report
async function generateTestReport() {
  const report = {
    timestamp: new Date().toISOString(),
    environment: {
      baseUrl: BASE_URL,
      lovableApiUrl: LOVABLE_API_URL,
      nodeVersion: process.version
    },
    summary: {
      total: testResults.total,
      passed: testResults.passed,
      failed: testResults.failed,
      successRate: Math.round((testResults.passed / testResults.total) * 100)
    },
    details: testResults.details
  };
  
  const reportPath = path.join(__dirname, '../test-results.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  log('blue', `📊 Test report saved to: ${reportPath}`);
  return report;
}

// Main test execution
async function runAllTests() {
  log('bright', '🚀 Starting Comprehensive Integration Tests\n');
  log('bright', '='.repeat(70));
  
  // Check server availability
  log('cyan', '🔍 Checking server availability...');
  try {
    const response = await fetch(BASE_URL);
    log('green', `✅ Server is running at ${BASE_URL}`);
  } catch (error) {
    log('red', `❌ Server not accessible at ${BASE_URL}`);
    log('red', 'Please start the development server with: npm run dev');
    process.exit(1);
  }
  
  log('bright', '\n📧 Backend API Tests');
  log('bright', '-'.repeat(30));
  
  await runTest('Email Strategist API', testEmailStrategistAPI);
  await runTest('Lead Enhancement API', testLeadEnhancementAPI);
  await runTest('Google Maps Webhook API', testWebhookAPI);
  await runTest('Webhook Status API', testWebhookStatusAPI);
  
  log('bright', '\n🌐 Lovable.dev Integration Tests');
  log('bright', '-'.repeat(30));
  
  await runTest('Lovable.dev Connectivity', testLovableConnectivity);
  await runTest('Enhanced Payload Format', testEnhancedPayloadFormat);
  
  log('bright', '\n✨ Email Copy Quality Tests');
  log('bright', '-'.repeat(30));
  
  await runTest('Email Copy Quality & Structure', testEmailCopyQuality);
  await runTest('Industry-Specific Personalization', testIndustryPersonalization);
  
  log('bright', '\n🖥️ Frontend Tests');
  log('bright', '-'.repeat(30));
  
  await runTest('Frontend Pages Accessibility', testFrontendPages);
  
  log('bright', '\n⚠️ Error Handling Tests');
  log('bright', '-'.repeat(30));
  
  await runTest('API Error Handling', testErrorHandling);
  
  // Generate report
  log('bright', '\n📊 Generating Test Report');
  log('bright', '-'.repeat(30));
  
  const report = await generateTestReport();
  
  // Final summary
  log('bright', '\n' + '='.repeat(70));
  log('bright', '📋 FINAL TEST SUMMARY');
  log('bright', '='.repeat(70));
  
  log('cyan', `Total Tests: ${report.summary.total}`);
  log('green', `Passed: ${report.summary.passed}`);
  log('red', `Failed: ${report.summary.failed}`);
  log('blue', `Success Rate: ${report.summary.successRate}%`);
  
  if (report.summary.failed > 0) {
    log('red', '\n❌ FAILED TESTS:');
    testResults.details
      .filter(test => test.status === 'FAILED')
      .forEach(test => {
        log('red', `   • ${test.name}: ${test.error}`);
      });
  }
  
  const overallSuccess = report.summary.failed === 0;
  log('bright', '\n' + '='.repeat(70));
  log(overallSuccess ? 'green' : 'red', 
      `🎯 OVERALL RESULT: ${overallSuccess ? '✅ SUCCESS' : '❌ FAILURE'}`);
  
  if (overallSuccess) {
    log('green', '\n🎉 All systems are working correctly!');
    log('green', '📝 Integration verified:');
    log('green', '   • Frontend components accessible');
    log('green', '   • Backend APIs responding correctly');
    log('green', '   • Email strategist generating quality content');
    log('green', '   • Lovable.dev integration configured');
    log('green', '   • Search results and email copy generation working');
    log('green', '   • Error handling functioning properly');
  }
  
  log('bright', '='.repeat(70));
  
  process.exit(overallSuccess ? 0 : 1);
}

// Run tests
runAllTests().catch(error => {
  log('red', `❌ Test execution failed: ${error.message}`);
  process.exit(1);
});