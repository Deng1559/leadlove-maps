import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { calculateCreditCost, hasEnoughCredits } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    const { 
      businessType, 
      location, 
      serviceOffering = 'digital marketing',
      countryCode = 'us',
      maxResults = 20,
      apiKey, // For Telegram/private access
      userId, // For Telegram users
      userName = 'User'
    } = await request.json()

    // Validate required fields
    if (!businessType || !location) {
      return NextResponse.json(
        { error: 'Business type and location are required' },
        { status: 400 }
      )
    }

    // Check if this is a private API key request (Telegram/backdoor access)
    const isPrivateAccess = apiKey && apiKey === process.env.LEADLOVE_PRIVATE_API_KEY
    
    let authenticatedUserId: string | null = null
    let userProfile: any = null

    if (isPrivateAccess) {
      // Private access - skip credit system and user authentication
      console.log('Processing request with private API key access')
    } else {
      // Public access - require authentication and credit system
      const cookieStore = cookies()
      const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
      
      const { data: { session }, error: authError } = await supabase.auth.getSession()
      
      if (authError || !session?.user) {
        return NextResponse.json(
          { error: 'Authentication required for web access' },
          { status: 401 }
        )
      }

      // Get user profile and credit balance
      const { data: profile, error: profileError } = await supabase
        .from('user_credit_summary')
        .select('*')
        .eq('user_id', session.user.id)
        .single()

      if (profileError || !profile) {
        return NextResponse.json(
          { error: 'User profile not found' },
          { status: 404 }
        )
      }

      authenticatedUserId = profile.user_id
      userProfile = profile

      // Calculate credit cost for this operation
      const creditCost = calculateCreditCost('leadlove_maps', { maxResults })
      
      // Check if user has enough credits
      if (!hasEnoughCredits(profile.credits_available || 0, creditCost)) {
        return NextResponse.json(
          { 
            error: 'Insufficient credits',
            required: creditCost,
            available: profile.credits_available || 0,
            message: `You need ${creditCost} credits to generate ${maxResults} leads. You have ${profile.credits_available || 0} credits available.`
          },
          { status: 402 } // Payment Required
        )
      }

      // Consume credits before processing
      const { error: consumeError } = await supabase
        .rpc('consume_credits', {
          user_uuid: authenticatedUserId,
          credits_to_consume: creditCost,
          tool_used: 'leadlove_maps',
          metadata: {
            businessType,
            location,
            serviceOffering,
            maxResults,
            source: 'web_frontend'
          }
        })

      if (consumeError) {
        console.error('Error consuming credits:', consumeError)
        return NextResponse.json(
          { error: 'Failed to process credit transaction' },
          { status: 500 }
        )
      }

      console.log(`Consumed ${creditCost} credits for user ${authenticatedUserId}`)
    }

    // Get webhook configuration based on environment
    const environment = process.env.NODE_ENV === 'production' ? 'production' : 'development'
    const webhookUrl = process.env.N8N_WEBHOOK_URL || 'http://localhost:5678/webhook'
    const frontendEndpoint = '/leadlove-credit-system'

    // Prepare payload for n8n workflow
    const workflowPayload = {
      // Core search parameters
      businessType,
      location,
      serviceOffering,
      countryCode,
      maxResults: Math.min(maxResults, 50), // Cap at 50 for safety
      
      // User identification
      userId: authenticatedUserId || userId || `temp-${Date.now()}`,
      userName: userProfile?.full_name || userName,
      userEmail: userProfile?.email,
      
      // Request metadata
      source: isPrivateAccess ? 'private_api' : 'web_frontend',
      timestamp: new Date().toISOString(),
      requestId: `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      
      // Credit system info (for tracking, not enforcement)
      creditsConsumed: isPrivateAccess ? 0 : calculateCreditCost('leadlove_maps', { maxResults }),
      creditsRemaining: isPrivateAccess ? null : (userProfile?.credits_available || 0) - calculateCreditCost('leadlove_maps', { maxResults }),
      isPrivateAccess,
      
      // Processing configuration
      generateEmails: true,
      includeAnalysis: true,
      outputFormat: 'comprehensive'
    }

    // Call n8n workflow
    const startTime = Date.now()
    
    try {
      const n8nResponse = await fetch(`${webhookUrl}${frontendEndpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'LeadLove-Credit-System/1.0',
          'X-Request-ID': workflowPayload.requestId,
          'X-Source': workflowPayload.source
        },
        body: JSON.stringify(workflowPayload),
        // Increased timeout for lead generation process
        signal: AbortSignal.timeout(180000) // 3 minutes
      })

      const processingTime = Date.now() - startTime

      if (!n8nResponse.ok) {
        throw new Error(`n8n workflow failed: ${n8nResponse.status} ${n8nResponse.statusText}`)
      }

      const result = await n8nResponse.json()

      // Track usage for authenticated users (both private and public)
      if (authenticatedUserId) {
        const trackingUserId = authenticatedUserId
        
        try {
          const cookieStore = cookies()
          const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
          
          await supabase
            .from('usage_tracking')
            .insert({
              user_id: trackingUserId,
              tool_name: 'leadlove_maps',
              credits_consumed: isPrivateAccess ? 0 : calculateCreditCost('leadlove_maps', { maxResults }),
              search_query: `${businessType} in ${location} for ${serviceOffering}`,
              results_count: result.results?.length || 0,
              processing_time_ms: processingTime,
              success: true,
              workflow_id: result.workflowId || workflowPayload.requestId,
              metadata: {
                source: workflowPayload.source,
                businessType,
                location,
                serviceOffering,
                maxResults,
                isPrivateAccess
              }
            })
        } catch (trackingError) {
          console.error('Error tracking usage:', trackingError)
          // Don't fail the request if tracking fails
        }
      }

      // Return success response
      return NextResponse.json({
        success: true,
        workflowId: result.workflowId || workflowPayload.requestId,
        results: result.results || [],
        metadata: {
          processingTime: processingTime,
          creditsConsumed: isPrivateAccess ? 0 : calculateCreditCost('leadlove_maps', { maxResults }),
          creditsRemaining: isPrivateAccess ? null : (userProfile?.credits_available || 0) - calculateCreditCost('leadlove_maps', { maxResults }),
          source: workflowPayload.source,
          timestamp: workflowPayload.timestamp,
          requestId: workflowPayload.requestId
        },
        estimatedTime: '2-3 minutes',
        message: 'Lead generation completed successfully'
      })

    } catch (fetchError: any) {
      console.error('n8n workflow request failed:', fetchError)

      // If this was a credit-consuming request, we should consider refunding
      if (authenticatedUserId && !isPrivateAccess) {
        try {
          const cookieStore = cookies()
          const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
          
          // Refund credits due to processing failure
          await supabase
            .rpc('add_credits', {
              user_uuid: authenticatedUserId,
              credits_to_add: calculateCreditCost('leadlove_maps', { maxResults }),
              transaction_type: 'refund',
              description: 'Refund for failed lead generation request',
              reference_id: workflowPayload.requestId
            })

          // Track failed usage
          await supabase
            .from('usage_tracking')
            .insert({
              user_id: authenticatedUserId,
              tool_name: 'leadlove_maps',
              credits_consumed: 0, // No credits consumed due to failure
              search_query: `${businessType} in ${location} for ${serviceOffering}`,
              results_count: 0,
              processing_time_ms: Date.now() - startTime,
              success: false,
              error_message: fetchError.message,
              workflow_id: workflowPayload.requestId,
              metadata: {
                source: workflowPayload.source,
                businessType,
                location,
                serviceOffering,
                maxResults,
                refunded: true
              }
            })
        } catch (refundError) {
          console.error('Error processing refund:', refundError)
        }
      }

      return NextResponse.json(
        { 
          error: 'Lead generation service is currently unavailable',
          message: 'Please try again in a few minutes. If this issue persists, contact support.',
          requestId: workflowPayload.requestId,
          refunded: !isPrivateAccess // Credits were refunded for paid users
        },
        { status: 503 }
      )
    }

  } catch (error: any) {
    console.error('Lead generation API error:', error)
    
    return NextResponse.json(
      { 
        error: error.message || 'Internal server error',
        message: 'An unexpected error occurred. Please try again.'
      },
      { status: 500 }
    )
  }
}