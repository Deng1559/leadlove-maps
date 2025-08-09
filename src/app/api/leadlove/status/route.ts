import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const { workflowId, apiKey, freeMode = false } = await request.json()

    if (!workflowId) {
      return NextResponse.json(
        { success: false, error: 'Workflow ID is required' },
        { status: 400 }
      )
    }

    // Check if this is a private API key request (Telegram/backdoor access) or free mode
    const isPrivateAccess = apiKey && apiKey === process.env.LEADLOVE_PRIVATE_API_KEY
    const isFreeMode = freeMode === true
    
    if (!isPrivateAccess && !isFreeMode) {
      // Public access - require authentication
      const cookieStore = cookies()
      const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
      
      const { data: { session }, error: authError } = await supabase.auth.getSession()
      
      if (authError || !session?.user) {
        return NextResponse.json(
          { success: false, error: 'Authentication required for web access' },
          { status: 401 }
        )
      }
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
          'User-Agent': 'LeadLove-Credit-System/1.0',
          'X-Request-ID': workflowId,
          'X-Source': isPrivateAccess ? 'private_api' : (isFreeMode ? 'free_mode' : 'web_frontend'),
          'Authorization': process.env.LEADLOVE_MAPS_API_KEY ? `Bearer ${process.env.LEADLOVE_MAPS_API_KEY}` : undefined
        },
        body: JSON.stringify({
          workflowId,
          requestId: workflowId,
          source: isPrivateAccess ? 'private_api' : (isFreeMode ? 'free_mode' : 'web_frontend')
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
            workflowId
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
          source: isPrivateAccess ? 'private_api' : (isFreeMode ? 'free_mode' : 'web_frontend'),
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
          source: isPrivateAccess ? 'private_api' : (isFreeMode ? 'free_mode' : 'web_frontend'),
          timestamp: new Date().toISOString(),
          statusCheckFailed: true
        }
      })
    }

  } catch (error: any) {
    console.error('Status check API error:', error)
    
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Internal server error',
        message: 'Failed to check workflow status.'
      },
      { status: 500 }
    )
  }
}