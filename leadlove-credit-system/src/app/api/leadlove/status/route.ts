import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const { workflowId, apiKey } = await request.json()

    if (!workflowId) {
      return NextResponse.json(
        { error: 'Workflow ID is required' },
        { status: 400 }
      )
    }

    // Check if this is a private API key request (Telegram/backdoor access)
    const isPrivateAccess = apiKey && apiKey === process.env.LEADLOVE_PRIVATE_API_KEY
    
    if (!isPrivateAccess) {
      // Public access - require authentication
      const cookieStore = cookies()
      const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
      
      const { data: { session }, error: authError } = await supabase.auth.getSession()
      
      if (authError || !session?.user) {
        return NextResponse.json(
          { error: 'Authentication required for web access' },
          { status: 401 }
        )
      }
    }

    // Get webhook configuration
    const webhookUrl = process.env.N8N_WEBHOOK_URL || 'http://localhost:5678/webhook'
    const statusEndpoint = '/leadlove-status'

    // Check workflow status with n8n
    try {
      const n8nResponse = await fetch(`${webhookUrl}${statusEndpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'LeadLove-Credit-System/1.0',
          'X-Request-ID': workflowId,
          'X-Source': isPrivateAccess ? 'private_api' : 'web_frontend'
        },
        body: JSON.stringify({
          workflowId,
          requestId: workflowId,
          source: isPrivateAccess ? 'private_api' : 'web_frontend'
        }),
        signal: AbortSignal.timeout(30000) // 30 seconds timeout
      })

      if (!n8nResponse.ok) {
        // If n8n returns 404, workflow might be completed or not found
        if (n8nResponse.status === 404) {
          return NextResponse.json({
            success: false,
            completed: false,
            status: 'not_found',
            message: 'Workflow not found. It may have completed or expired.',
            workflowId
          })
        }

        throw new Error(`n8n status check failed: ${n8nResponse.status} ${n8nResponse.statusText}`)
      }

      const result = await n8nResponse.json()

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
          source: isPrivateAccess ? 'private_api' : 'web_frontend',
          timestamp: new Date().toISOString()
        }
      })

    } catch (fetchError: any) {
      console.error('n8n status check failed:', fetchError)

      // Return a generic "processing" status if we can't reach n8n
      return NextResponse.json({
        success: true,
        workflowId,
        status: 'processing',
        completed: false,
        progress: 50,
        currentStep: 'Processing your request...',
        message: 'Status check unavailable, but your request is being processed.',
        metadata: {
          source: isPrivateAccess ? 'private_api' : 'web_frontend',
          timestamp: new Date().toISOString(),
          statusCheckFailed: true
        }
      })
    }

  } catch (error: any) {
    console.error('Status check API error:', error)
    
    return NextResponse.json(
      { 
        error: error.message || 'Internal server error',
        message: 'Failed to check workflow status.'
      },
      { status: 500 }
    )
  }
}