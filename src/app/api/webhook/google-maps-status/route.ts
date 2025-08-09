import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { workflowId } = await request.json()

    if (!workflowId) {
      return NextResponse.json(
        { error: 'Workflow ID is required' },
        { status: 400 }
      )
    }

    // Get LeadLove Maps API configuration
    const leadloveApiUrl = process.env.LEADLOVE_MAPS_API_URL || 'https://leadlove-maps.lovable.app'
    const statusEndpoint = '/api/status'

    // Check workflow status with LeadLove Maps API
    try {
      const leadloveResponse = await fetch(`${leadloveApiUrl}${statusEndpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'GoogleMaps-Webhook-Scraper/1.0',
          'X-Request-ID': workflowId,
          'X-Source': 'webhook',
          'Authorization': process.env.LEADLOVE_MAPS_API_KEY ? `Bearer ${process.env.LEADLOVE_MAPS_API_KEY}` : undefined
        },
        body: JSON.stringify({
          workflowId,
          requestId: workflowId,
          source: 'webhook'
        }),
        signal: AbortSignal.timeout(30000) // 30 seconds timeout
      })

      if (!leadloveResponse.ok) {
        // If LeadLove Maps API returns 404, workflow might be completed or not found
        if (leadloveResponse.status === 404) {
          return NextResponse.json({
            success: false,
            completed: false,
            status: 'not_found',
            message: 'Workflow not found. It may have completed or expired.',
            workflowId,
            metadata: {
              source: 'webhook',
              timestamp: new Date().toISOString()
            }
          })
        }

        throw new Error(`LeadLove Maps API status check failed: ${leadloveResponse.status} ${leadloveResponse.statusText}`)
      }

      const result = await leadloveResponse.json()

      // Return status information
      return NextResponse.json({
        success: true,
        workflowId,
        status: result.status || 'processing',
        completed: result.completed || false,
        progress: result.progress || 0,
        currentStep: result.currentStep || 'Processing request...',
        estimatedTimeRemaining: result.estimatedTimeRemaining || null,
        results: result.results || null,
        metadata: {
          source: 'webhook',
          timestamp: new Date().toISOString()
        }
      })

    } catch (fetchError: any) {
      console.error('LeadLove Maps API status check failed:', fetchError)

      // Return a generic "processing" status if we can't reach LeadLove Maps API
      return NextResponse.json({
        success: true,
        workflowId,
        status: 'processing',
        completed: false,
        progress: 50,
        currentStep: 'Processing your request...',
        message: 'Status check unavailable, but your request is being processed.',
        metadata: {
          source: 'webhook',
          timestamp: new Date().toISOString(),
          statusCheckFailed: true
        }
      })
    }

  } catch (error: any) {
    console.error('Status check webhook error:', error)
    
    return NextResponse.json(
      { 
        error: error.message || 'Internal server error',
        message: 'Failed to check workflow status.',
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
    service: 'Google Maps Scraper Status Webhook',
    status: 'active',
    version: '1.0',
    endpoints: {
      status: 'POST /api/webhook/google-maps-status'
    },
    requiredFields: ['workflowId'],
    timestamp: new Date().toISOString()
  })
}