import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  const results = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    tests: [] as any[]
  }

  // Test 1: Check environment variables
  const leadloveApiUrl = process.env.LEADLOVE_MAPS_API_URL || 'https://leadlove-maps.lovable.app'
  const leadloveApiKey = process.env.LEADLOVE_MAPS_API_KEY
  
  results.tests.push({
    name: 'Environment Configuration',
    status: 'info',
    details: {
      apiUrl: leadloveApiUrl,
      apiKeyConfigured: !!leadloveApiKey,
      apiKeyLength: leadloveApiKey?.length || 0
    }
  })

  // Test 2: Basic connectivity
  try {
    const connectivityResponse = await fetch(leadloveApiUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'LeadLove-Credit-System-Test/1.0'
      },
      signal: AbortSignal.timeout(10000)
    })

    results.tests.push({
      name: 'Basic Connectivity',
      status: connectivityResponse.ok ? 'success' : 'warning',
      details: {
        status: connectivityResponse.status,
        statusText: connectivityResponse.statusText,
        headers: Object.fromEntries(connectivityResponse.headers.entries())
      }
    })
  } catch (error: any) {
    results.tests.push({
      name: 'Basic Connectivity',
      status: 'error',
      details: {
        error: error.message,
        code: error.code
      }
    })
  }

  // Test 3: Generate API endpoint
  try {
    const testPayload = {
      businessType: 'restaurants',
      location: 'Miami Beach, FL',
      serviceOffering: 'digital marketing',
      countryCode: 'us',
      maxResults: 5,
      userId: 'test-user-123',
      userName: 'Connection Test',
      source: 'connection_test',
      timestamp: new Date().toISOString(),
      requestId: `test-${Date.now()}`,
      generateEmails: true,
      includeAnalysis: true,
      outputFormat: 'comprehensive'
    }

    const generateResponse = await fetch(`${leadloveApiUrl}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'LeadLove-Credit-System-Test/1.0',
        'X-Request-ID': testPayload.requestId,
        'X-Source': 'connection_test',
        ...(leadloveApiKey && { 'Authorization': `Bearer ${leadloveApiKey}` })
      },
      body: JSON.stringify(testPayload),
      signal: AbortSignal.timeout(30000)
    })

    const generateData = await generateResponse.json()

    results.tests.push({
      name: 'Generate API Endpoint',
      status: generateResponse.ok ? 'success' : 'warning',
      details: {
        status: generateResponse.status,
        statusText: generateResponse.statusText,
        response: generateData
      }
    })
  } catch (error: any) {
    results.tests.push({
      name: 'Generate API Endpoint',
      status: 'error',
      details: {
        error: error.message,
        code: error.code
      }
    })
  }

  // Test 4: Status API endpoint
  try {
    const testWorkflowId = `test-${Date.now()}`
    
    const statusResponse = await fetch(`${leadloveApiUrl}/api/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'LeadLove-Credit-System-Test/1.0',
        'X-Request-ID': testWorkflowId,
        'X-Source': 'connection_test',
        ...(leadloveApiKey && { 'Authorization': `Bearer ${leadloveApiKey}` })
      },
      body: JSON.stringify({
        workflowId: testWorkflowId,
        requestId: testWorkflowId,
        source: 'connection_test'
      }),
      signal: AbortSignal.timeout(15000)
    })

    const statusData = await statusResponse.json()

    results.tests.push({
      name: 'Status API Endpoint',
      status: statusResponse.ok ? 'success' : 'warning',
      details: {
        status: statusResponse.status,
        statusText: statusResponse.statusText,
        response: statusData
      }
    })
  } catch (error: any) {
    results.tests.push({
      name: 'Status API Endpoint',
      status: 'error',
      details: {
        error: error.message,
        code: error.code
      }
    })
  }

  // Calculate overall status
  const hasErrors = results.tests.some(test => test.status === 'error')
  const hasWarnings = results.tests.some(test => test.status === 'warning')
  
  const overallStatus = hasErrors ? 'error' : hasWarnings ? 'warning' : 'success'

  return NextResponse.json({
    ...results,
    overallStatus,
    summary: {
      total: results.tests.length,
      success: results.tests.filter(t => t.status === 'success').length,
      warning: results.tests.filter(t => t.status === 'warning').length,
      error: results.tests.filter(t => t.status === 'error').length
    },
    recommendations: generateRecommendations(results.tests)
  })
}

function generateRecommendations(tests: any[]): string[] {
  const recommendations: string[] = []
  
  const envTest = tests.find(t => t.name === 'Environment Configuration')
  const connectivityTest = tests.find(t => t.name === 'Basic Connectivity')
  const generateTest = tests.find(t => t.name === 'Generate API Endpoint')
  const statusTest = tests.find(t => t.name === 'Status API Endpoint')

  if (!envTest?.details.apiKeyConfigured) {
    recommendations.push('Configure LEADLOVE_MAPS_API_KEY environment variable')
  }

  if (connectivityTest?.status === 'error') {
    recommendations.push('Check network connectivity and firewall settings')
    recommendations.push('Verify LEADLOVE_MAPS_API_URL is correct and accessible')
  }

  if (generateTest?.status === 'error' || statusTest?.status === 'error') {
    recommendations.push('Verify API endpoints exist and are correctly implemented')
    recommendations.push('Check API authentication requirements')
    recommendations.push('Review LeadLove Maps API documentation')
  }

  if (generateTest?.details?.status === 404 || statusTest?.details?.status === 404) {
    recommendations.push('API endpoints may not be implemented yet - this is expected for a new integration')
  }

  if (recommendations.length === 0) {
    recommendations.push('All tests passed - integration looks good!')
  }

  return recommendations
}