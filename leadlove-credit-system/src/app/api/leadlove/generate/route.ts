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
      userName = 'User',
      freeMode = false // New parameter to bypass credit system
    } = await request.json()

    // Validate required fields
    if (!businessType || !location) {
      return NextResponse.json(
        { error: 'Business type and location are required' },
        { status: 400 }
      )
    }

    // Check if this is a private API key request (Telegram/backdoor access) or free mode
    const isPrivateAccess = apiKey && apiKey === process.env.LEADLOVE_PRIVATE_API_KEY
    const isFreeMode = freeMode === true
    
    let authenticatedUserId: string | null = null
    let userProfile: any = null

    if (isPrivateAccess || isFreeMode) {
      // Private access or free mode - skip credit system and user authentication
      console.log(`Processing request with ${isPrivateAccess ? 'private API key' : 'free mode'} access`)
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

    // Get LeadLove Maps API configuration
    const environment = process.env.NODE_ENV === 'production' ? 'production' : 'development'
    const leadloveApiUrl = process.env.LEADLOVE_MAPS_API_URL || 'https://leadlove-maps.lovable.app'
    const leadloveEndpoint = '/api/generate' // Default API endpoint

    // Prepare payload for LeadLove Maps API
    const leadlovePayload = {
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
      source: isPrivateAccess ? 'private_api' : (isFreeMode ? 'free_mode' : 'web_frontend'),
      timestamp: new Date().toISOString(),
      requestId: `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      
      // Processing configuration
      generateEmails: true,
      includeAnalysis: true,
      outputFormat: 'comprehensive',
      
      // Enhanced email configuration
      emailStrategist: 'b2b-cold-email-expert',
      emailPersona: serviceOffering || 'digital-marketing',
      deliverabilityOptimized: true,
      
      // Credit system info (for tracking)
      creditsConsumed: (isPrivateAccess || isFreeMode) ? 0 : calculateCreditCost('leadlove_maps', { maxResults }),
      creditsRemaining: (isPrivateAccess || isFreeMode) ? null : (userProfile?.credits_available || 0) - calculateCreditCost('leadlove_maps', { maxResults }),
      isPrivateAccess,
      isFreeMode
    }

    // Call LeadLove Maps API
    const startTime = Date.now()
    
    try {
      const leadloveResponse = await fetch(`${leadloveApiUrl}${leadloveEndpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'LeadLove-Credit-System/1.0',
          'X-Request-ID': leadlovePayload.requestId,
          'X-Source': leadlovePayload.source,
          'X-Free-Mode': isFreeMode ? 'true' : 'false',
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
              credits_consumed: (isPrivateAccess || isFreeMode) ? 0 : calculateCreditCost('leadlove_maps', { maxResults }),
              search_query: `${businessType} in ${location} for ${serviceOffering}`,
              results_count: result.results?.length || 0,
              processing_time_ms: processingTime,
              success: true,
              workflow_id: result.workflowId || leadlovePayload.requestId,
              metadata: {
                source: leadlovePayload.source,
                businessType,
                location,
                serviceOffering,
                maxResults,
                isPrivateAccess,
                isFreeMode
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
        workflowId: result.workflowId || leadlovePayload.requestId,
        results: result.results || result.data || [],
        metadata: {
          processingTime: processingTime,
          creditsConsumed: (isPrivateAccess || isFreeMode) ? 0 : calculateCreditCost('leadlove_maps', { maxResults }),
          creditsRemaining: (isPrivateAccess || isFreeMode) ? null : (userProfile?.credits_available || 0) - calculateCreditCost('leadlove_maps', { maxResults }),
          source: leadlovePayload.source,
          timestamp: leadlovePayload.timestamp,
          requestId: leadlovePayload.requestId
        },
        estimatedTime: result.estimatedTime || '2-3 minutes',
        message: result.message || 'Lead generation completed successfully'
      })

    } catch (fetchError: any) {
      console.error('LeadLove Maps API request failed:', fetchError)

      // If this was a credit-consuming request, we should consider refunding
      if (authenticatedUserId && !isPrivateAccess && !isFreeMode) {
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
              reference_id: leadlovePayload.requestId
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
              workflow_id: leadlovePayload.requestId,
              metadata: {
                source: leadlovePayload.source,
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
          requestId: leadlovePayload.requestId,
          refunded: !isPrivateAccess && !isFreeMode // Credits were refunded for paid users
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