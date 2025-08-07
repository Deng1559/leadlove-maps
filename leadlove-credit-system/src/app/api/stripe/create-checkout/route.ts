import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { stripeService } from '@/lib/stripe/server'
import { STRIPE_CONFIG } from '@/lib/stripe/client'

export async function POST(request: NextRequest) {
  try {
    const { priceId, mode = 'subscription' } = await request.json()

    if (!priceId) {
      return NextResponse.json(
        { error: 'Price ID is required' },
        { status: 400 }
      )
    }

    // Get authenticated user
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    
    if (authError || !session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get user profile from database
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('auth_id', session.user.id)
      .single()

    if (profileError || !userProfile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      )
    }

    // Create or get Stripe customer
    const customer = await stripeService.createOrGetCustomer({
      email: session.user.email!,
      name: userProfile.full_name || undefined,
      userId: userProfile.id
    })

    // Update user with Stripe customer ID if not already set
    if (!userProfile.stripe_customer_id) {
      await supabase
        .from('users')
        .update({ stripe_customer_id: customer.id })
        .eq('id', userProfile.id)
    }

    // Generate URLs
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin
    const successUrl = `${baseUrl}/dashboard/credits?success=true&session_id={CHECKOUT_SESSION_ID}`
    const cancelUrl = `${baseUrl}/dashboard/credits?canceled=true`

    let session_url: string

    if (mode === 'subscription') {
      // Create subscription checkout
      const checkoutSession = await stripeService.createSubscriptionCheckout({
        customerId: customer.id,
        priceId,
        successUrl,
        cancelUrl,
        userId: userProfile.id
      })
      
      session_url = checkoutSession.url!
    } else {
      // Determine credits for one-time purchase
      let credits = 0
      if (priceId === STRIPE_CONFIG.CREDIT_PRICES.CREDITS_50) {
        credits = STRIPE_CONFIG.CREDITS.CREDITS_50
      } else if (priceId === STRIPE_CONFIG.CREDIT_PRICES.CREDITS_200) {
        credits = STRIPE_CONFIG.CREDITS.CREDITS_200
      } else {
        return NextResponse.json(
          { error: 'Invalid price ID for credit purchase' },
          { status: 400 }
        )
      }

      // Create payment checkout
      const checkoutSession = await stripeService.createPaymentCheckout({
        customerId: customer.id,
        priceId,
        successUrl,
        cancelUrl,
        userId: userProfile.id,
        credits
      })
      
      session_url = checkoutSession.url!
    }

    return NextResponse.json({ url: session_url })

  } catch (error: any) {
    console.error('Stripe checkout creation failed:', error)
    
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}