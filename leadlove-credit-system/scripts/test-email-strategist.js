const fetch = require('node-fetch');

// Configuration
const BASE_URL = 'http://localhost:3000';
const EMAIL_SEQUENCE_ENDPOINT = '/api/email-sequences/generate';
const LEAD_ENHANCEMENT_ENDPOINT = '/api/leads/enhance-emails';

// Test data
const testBusiness = {
  name: 'Joe\'s Pizza',
  industry: 'restaurants',
  location: 'Miami Beach, FL',
  website: 'https://joespizza.com',
  ownerName: 'Joe'
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

async function testEmailSequenceGeneration() {
  console.log('🧪 Testing B2B Cold Email Strategist System...\n');

  try {
    // Test 1: Generate single email sequence
    console.log('📧 Test 1: Generating single email sequence...');
    console.log('Request:', JSON.stringify({
      businessData: testBusiness,
      serviceOffering: 'digital-marketing',
      variables: {
        metric: 'customer traffic',
        topic: 'restaurant growth'
      }
    }, null, 2));

    const sequenceResponse = await fetch(`${BASE_URL}${EMAIL_SEQUENCE_ENDPOINT}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        businessData: testBusiness,
        serviceOffering: 'digital-marketing',
        variables: {
          metric: 'customer traffic',
          topic: 'restaurant growth'
        }
      }),
    });

    const sequenceResult = await sequenceResponse.json();
    console.log('Response Status:', sequenceResponse.status);
    
    if (sequenceResponse.ok) {
      console.log('✅ Email sequence generation successful');
      console.log('\n📋 Generated Content:');
      console.log('Subject Lines (Direct):', sequenceResult.sequence.firstEmail.subjectLines.direct);
      console.log('First Email Opener:', sequenceResult.sequence.firstEmail.opener);
      console.log('Follow-up Emails:', Object.keys(sequenceResult.sequence.followUpSequence));
    } else {
      console.log('❌ Email sequence generation failed');
      console.log('Error:', JSON.stringify(sequenceResult, null, 2));
      return false;
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    return false;
  }

  return true;
}

async function testLeadEnhancement() {
  console.log('\n🔄 Test 2: Enhancing multiple leads...');
  
  try {
    console.log('Request:', JSON.stringify({
      leads: testLeads,
      serviceOffering: 'digital-marketing',
      globalVariables: {
        metric: 'revenue growth',
        topic: 'business automation'
      }
    }, null, 2));

    const enhanceResponse = await fetch(`${BASE_URL}${LEAD_ENHANCEMENT_ENDPOINT}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        leads: testLeads,
        serviceOffering: 'digital-marketing',
        globalVariables: {
          metric: 'revenue growth',
          topic: 'business automation'
        }
      }),
    });

    const enhanceResult = await enhanceResponse.json();
    console.log('Response Status:', enhanceResponse.status);

    if (enhanceResponse.ok) {
      console.log('✅ Lead enhancement successful');
      console.log(`📊 Enhancement Results:`);
      console.log(`   Total Leads: ${enhanceResult.metadata.totalLeads}`);
      console.log(`   Successfully Enhanced: ${enhanceResult.metadata.successfulEnhancements}`);
      console.log(`   Success Rate: ${enhanceResult.metadata.successRate}%`);
      
      // Show sample email for first lead
      if (enhanceResult.enhancedLeads[0]?.emailSequence) {
        const firstLead = enhanceResult.enhancedLeads[0];
        console.log(`\n📧 Sample Email for ${firstLead.name}:`);
        console.log(`   Subject: ${firstLead.emailSequence.firstEmail.subject}`);
        console.log(`   Body Preview: ${firstLead.emailSequence.firstEmail.body.substring(0, 100)}...`);
      }
    } else {
      console.log('❌ Lead enhancement failed');
      console.log('Error:', JSON.stringify(enhanceResult, null, 2));
      return false;
    }

  } catch (error) {
    console.error('❌ Lead enhancement test failed:', error.message);
    return false;
  }

  return true;
}

async function testDeliverabilityFeatures() {
  console.log('\n✨ Test 3: Verifying deliverability improvements...');

  try {
    const response = await fetch(`${BASE_URL}${EMAIL_SEQUENCE_ENDPOINT}`, {
      method: 'GET',
    });

    const info = await response.json();
    
    if (response.ok) {
      console.log('✅ Service information retrieved');
      console.log('📈 Deliverability Features:');
      info.deliverabilityImprovements?.forEach(feature => {
        console.log(`   • ${feature}`);
      });
      
      console.log('\n🎯 Available Features:');
      info.features?.forEach(feature => {
        console.log(`   • ${feature}`);
      });
    } else {
      console.log('❌ Failed to retrieve service information');
      return false;
    }

  } catch (error) {
    console.error('❌ Deliverability test failed:', error.message);
    return false;
  }

  return true;
}

async function runAllTests() {
  console.log('🚀 Starting B2B Cold Email Strategist Tests\n');
  console.log('=' .repeat(60));
  
  const results = {
    sequenceGeneration: false,
    leadEnhancement: false,
    deliverabilityCheck: false
  };
  
  results.sequenceGeneration = await testEmailSequenceGeneration();
  results.leadEnhancement = await testLeadEnhancement();
  results.deliverabilityCheck = await testDeliverabilityFeatures();
  
  console.log('\n' + '='.repeat(60));
  console.log('📋 Test Summary:');
  console.log(`   Email Sequence Generation: ${results.sequenceGeneration ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   Lead Enhancement: ${results.leadEnhancement ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   Deliverability Features: ${results.deliverabilityCheck ? '✅ PASS' : '❌ FAIL'}`);
  
  const overallSuccess = Object.values(results).every(result => result);
  console.log('\n' + '='.repeat(60));
  console.log(`🎯 Overall Result: ${overallSuccess ? '✅ SUCCESS' : '❌ FAILURE'}`);
  
  if (overallSuccess) {
    console.log('\n🎉 B2B Cold Email Strategist System is working correctly!');
    console.log('📝 Key improvements implemented:');
    console.log('   • High-converting subject line variations');
    console.log('   • Structured first email with proven framework');
    console.log('   • 4-email follow-up sequence with varied angles');
    console.log('   • Industry-specific personalization');
    console.log('   • Deliverability-optimized copy and formatting');
    console.log('   • Professional tone with outcome focus');
    console.log('\n🌐 Visit http://localhost:3000/test-email-strategist for web interface');
  } else {
    console.log('\n💡 Troubleshooting:');
    console.log('   • Ensure development server is running (npm run dev)');
    console.log('   • Check that all API endpoints are accessible');
    console.log('   • Verify email strategist library is properly imported');
  }
  
  console.log('='.repeat(60));
  
  return overallSuccess;
}

// Check if server is running
async function checkServer() {
  try {
    const response = await fetch(`${BASE_URL}${EMAIL_SEQUENCE_ENDPOINT}`, {
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
  const success = await runAllTests();
  process.exit(success ? 0 : 1);
})();