const fetch = require('node-fetch');

// Configuration
const BASE_URL = 'http://localhost:3000';
const WEBHOOK_ENDPOINT = '/api/webhook/google-maps-scraper';
const STATUS_ENDPOINT = '/api/webhook/google-maps-status';

// Test data
const testData = {
  businessType: 'restaurants',
  location: 'New York, NY',
  serviceOffering: 'digital marketing',
  maxResults: 5,
  userId: 'test-webhook-user',
  userName: 'Test Webhook User'
};

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testWebhookScraper() {
  console.log('🧪 Testing Webhook Google Maps Scraper...\n');

  try {
    // Test 1: Start scraping
    console.log('📡 Step 1: Starting Google Maps scraping...');
    console.log('Request:', JSON.stringify(testData, null, 2));
    
    const startTime = Date.now();
    const scraperResponse = await fetch(`${BASE_URL}${WEBHOOK_ENDPOINT}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });

    const scraperResult = await scraperResponse.json();
    console.log('Response Status:', scraperResponse.status);
    console.log('Response:', JSON.stringify(scraperResult, null, 2));

    if (!scraperResponse.ok) {
      console.error('❌ Scraper request failed');
      return;
    }

    console.log('✅ Scraper request successful');
    
    if (!scraperResult.workflowId) {
      console.log('ℹ️  No workflow ID returned - operation may have completed immediately');
      return;
    }

    // Test 2: Check status
    console.log('\n⏳ Step 2: Checking status...');
    const statusData = { workflowId: scraperResult.workflowId };
    console.log('Status Request:', JSON.stringify(statusData, null, 2));

    const statusResponse = await fetch(`${BASE_URL}${STATUS_ENDPOINT}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(statusData),
    });

    const statusResult = await statusResponse.json();
    console.log('Status Response:', JSON.stringify(statusResult, null, 2));

    if (statusResponse.ok) {
      console.log('✅ Status check successful');
    } else {
      console.log('❌ Status check failed');
    }

    // Test 3: GET endpoints (info)
    console.log('\n📋 Step 3: Testing info endpoints...');
    
    const infoResponse = await fetch(`${BASE_URL}${WEBHOOK_ENDPOINT}`, {
      method: 'GET',
    });

    const infoResult = await infoResponse.json();
    console.log('Info Response:', JSON.stringify(infoResult, null, 2));

    if (infoResponse.ok) {
      console.log('✅ Info endpoint successful');
    } else {
      console.log('❌ Info endpoint failed');
    }

    const totalTime = Date.now() - startTime;
    console.log(`\n⏱️  Total test time: ${totalTime}ms`);

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

async function testBackwardsCompatibility() {
  console.log('\n🔄 Testing Backwards Compatibility...\n');

  try {
    // Test existing API with freeMode
    console.log('📡 Testing existing API with freeMode=true...');
    const freeTestData = {
      ...testData,
      freeMode: true
    };

    console.log('Request:', JSON.stringify(freeTestData, null, 2));

    const response = await fetch(`${BASE_URL}/api/leadlove/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(freeTestData),
    });

    const result = await response.json();
    console.log('Response Status:', response.status);
    console.log('Response:', JSON.stringify(result, null, 2));

    if (response.ok) {
      console.log('✅ Backwards compatibility successful');
    } else {
      console.log('❌ Backwards compatibility failed');
    }

  } catch (error) {
    console.error('❌ Backwards compatibility test failed:', error.message);
  }
}

async function runAllTests() {
  console.log('🚀 Starting Google Maps Scraper Webhook Tests\n');
  console.log('=' .repeat(50));
  
  await testWebhookScraper();
  await testBackwardsCompatibility();
  
  console.log('\n' + '='.repeat(50));
  console.log('🏁 Tests completed');
}

// Check if server is running
async function checkServer() {
  try {
    const response = await fetch(`${BASE_URL}/api/webhook/google-maps-scraper`, {
      method: 'GET',
    });
    return response.ok;
  } catch (error) {
    return false;
  }
}

// Main execution
(async () => {
  console.log('🔍 Checking if server is running...');
  
  const serverRunning = await checkServer();
  
  if (!serverRunning) {
    console.log('❌ Server is not running at', BASE_URL);
    console.log('Please start the development server with: npm run dev');
    process.exit(1);
  }
  
  console.log('✅ Server is running');
  await runAllTests();
})();