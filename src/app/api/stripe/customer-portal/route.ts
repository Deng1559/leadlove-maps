import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { stripeService } from '@/lib/stripe/server'

export async function POST(request: NextRequest) {
  try {
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

    // Get user profile with Stripe customer ID
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('stripe_customer_id')
      .eq('auth_id', session.user.id)
      .single()

    if (profileError || !userProfile?.stripe_customer_id) {
      return NextResponse.json(
        { error: 'No billing information found. Please make a purchase first.' },
        { status: 404 }
      )
    }

    // Create customer portal session
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin
    const returnUrl = `${baseUrl}/dashboard/credits`

    const portalSession = await stripeService.createCustomerPortalSession({
      customerId: userProfile.stripe_customer_id,
      returnUrl
    })

    return NextResponse.json({ url: portalSession.url })

  } catch (error: any) {
    console.error('Customer portal creation failed:', error)
    
    return NextResponse.json(
      { error: error.message || 'Failed to create customer portal session' },
      { status: 500 }
    )
  }
}