import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { 
      businessType, 
      location, 
      serviceOffering = 'digital marketing',
      countryCode = 'us',
      maxResults = 20,
      userId,
      userName = 'User'
    } = await request.json()

    // Validate required fields
    if (!businessType || !location) {
      return NextResponse.json(
        { error: 'Business type and location are required' },
        { status: 400 }
      )
    }

    // Get LeadLove Maps API configuration
    const leadloveApiUrl = process.env.LEADLOVE_MAPS_API_URL || 'https://leadlove-maps.lovable.app'
    const leadloveEndpoint = '/api/generate'

    // Prepare payload for LeadLove Maps API
    const leadlovePayload = {
      // Core search parameters
      businessType,
      location,
      serviceOffering,
      countryCode,
      maxResults: Math.min(maxResults, 50), // Cap at 50 for safety
      
      // User identification
      userId: userId || `webhook-${Date.now()}`,
      userName,
      
      // Request metadata
      source: 'webhook',
      timestamp: new Date().toISOString(),
      requestId: `webhook-req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      
      // Processing configuration
      generateEmails: true,
      includeAnalysis: true,
      outputFormat: 'comprehensive',
      
      // Enhanced email configuration
      emailStrategist: 'b2b-cold-email-expert',
      emailPersona: serviceOffering || 'digital-marketing',
      deliverabilityOptimized: true,
      
      // Free service - no credit system
      isPrivateAccess: false,
      isFreeService: true
    }

    // Call LeadLove Maps API
    const startTime = Date.now()
    
    try {
      const leadloveResponse = await fetch(`${leadloveApiUrl}${leadloveEndpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'GoogleMaps-Webhook-Scraper/1.0',
          'X-Request-ID': leadlovePayload.requestId,
          'X-Source': 'webhook',
          'Authorization': process.env.LEADLOVE_MAPS_API_KEY ? `Bearer ${process.env.LEADLOVE_MAPS_API_KEY}` : undefined
        },
        body: JSON.stringify(leadlovePayload),
        // Increased timeout for lead generation process
        signal: AbortSignal.timeout(180000) // 3 minutes
      })

      const processingTime = Date.now() - startTime

      if (!leadloveResponse.ok) {
        throw new Error(`LeadLove Maps API failed: ${leadloveResponse.status} ${leadloveResponse.statusText}`)
      }

      const result = await leadloveResponse.json()

      // Return success response in webhook format
      return NextResponse.json({
        success: true,
        workflowId: result.workflowId || leadlovePayload.requestId,
        results: result.results || result.data || [],
        metadata: {
          processingTime: processingTime,
          source: 'webhook',
          timestamp: leadlovePayload.timestamp,
          requestId: leadlovePayload.requestId,
          businessType,
          location,
          serviceOffering,
          maxResults,
          resultsCount: result.results?.length || 0
        },
        estimatedTime: result.estimatedTime || '2-3 minutes',
        message: result.message || 'Google Maps scraping completed successfully'
      })

    } catch (fetchError: any) {
      console.error('LeadLove Maps API request failed:', fetchError)

      return NextResponse.json(
        { 
          error: 'Google Maps scraping service is currently unavailable',
          message: 'Please try again in a few minutes. If this issue persists, contact support.',
          requestId: leadlovePayload.requestId,
          metadata: {
            source: 'webhook',
            timestamp: new Date().toISOString(),
            businessType,
            location,
            processingTime: Date.now() - startTime
          }
        },
        { status: 503 }
      )
    }

  } catch (error: any) {
    console.error('Google Maps webhook scraper error:', error)
    
    return NextResponse.json(
      { 
        error: error.message || 'Internal server error',
        message: 'An unexpected error occurred. Please try again.',
        metadata: {
          source: 'webhook',
          timestamp: new Date().toISOString()
        }
      },
      { status: 500 }
    )
  }
}

// GET method for webhook verification/testing
export async function GET() {
  return NextResponse.json({
    service: 'Google Maps Scraper Webhook',
    status: 'active',
    version: '1.0',
    endpoints: {
      scrape: 'POST /api/webhook/google-maps-scraper',
      status: 'GET /api/webhook/google-maps-scraper'
    },
    requiredFields: ['businessType', 'location'],
    optionalFields: ['serviceOffering', 'countryCode', 'maxResults', 'userId', 'userName'],
    limits: {
      maxResults: 50
    },
    timestamp: new Date().toISOString()
  })
}