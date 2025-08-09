import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { stripeService, getUserIdFromEvent } from '@/lib/stripe/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import Stripe from 'stripe'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = headers().get('Stripe-Signature')!
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

  if (!webhookSecret) {
    console.error('Missing STRIPE_WEBHOOK_SECRET environment variable')
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 500 }
    )
  }

  let event: Stripe.Event

  try {
    // Verify webhook signature
    event = stripeService.constructWebhookEvent(body, signature, webhookSecret)
  } catch (error: any) {
    console.error('Webhook signature verification failed:', error.message)
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    )
  }

  // Initialize Supabase client
  const cookieStore = cookies()
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

  try {
    // Handle different webhook events
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event, supabase)
        break

      case 'customer.subscription.created':
        await handleSubscriptionCreated(event, supabase)
        break

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event, supabase)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event, supabase)
        break

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event, supabase)
        break

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event, supabase)
        break

      case 'customer.subscription.trial_will_end':
        await handleTrialWillEnd(event, supabase)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })

  } catch (error: any) {
    console.error('Webhook processing error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

// Handle successful checkout completion
async function handleCheckoutCompleted(event: Stripe.Event, supabase: any) {
  const session = event.data.object as Stripe.Checkout.Session
  
  console.log('Processing checkout completed:', session.id)

  const userId = session.metadata?.userId
  if (!userId) {
    console.error('No userId in checkout session metadata')
    return
  }

  // Update user's Stripe customer ID
  if (session.customer) {
    await supabase
      .from('users')
      .update({ stripe_customer_id: session.customer })
      .eq('id', userId)
  }

  // Handle different checkout types
  if (session.metadata?.type === 'credit_purchase') {
    // One-time credit purchase
    const credits = parseInt(session.metadata.credits || '0')
    
    if (credits > 0) {
      // Add credits to user account
      const { error } = await supabase
        .rpc('add_credits', {
          user_uuid: userId,
          credits_to_add: credits,
          transaction_type: 'purchase',
          description: `Credit purchase via Stripe - ${credits} credits`,
          reference_id: session.id
        })

      if (error) {
        console.error('Error adding credits:', error)
      } else {
        console.log(`Added ${credits} credits to user ${userId}`)
      }
    }
  } else if (session.metadata?.type === 'subscription') {
    // Subscription setup - will be handled by subscription.created event
    console.log('Subscription checkout completed, waiting for subscription.created event')
  }
}

// Handle subscription creation
async function handleSubscriptionCreated(event: Stripe.Event, supabase: any) {
  const subscription = event.data.object as Stripe.Subscription
  
  console.log('Processing subscription created:', subscription.id)

  const userId = subscription.metadata?.userId
  if (!userId) {
    console.error('No userId in subscription metadata')
    return
  }

  // Get subscription details
  const priceId = subscription.items.data[0]?.price.id
  const customerId = subscription.customer as string

  // Determine tier and credits based on price ID
  let tier = 'starter'
  let credits = 100
  let priceInCents = 1000

  if (priceId === process.env.STRIPE_PRICE_GROWTH_MONTHLY) {
    tier = 'growth'
    credits = 350
    priceInCents = 3500
  } else if (priceId === process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY) {
    tier = 'enterprise'
    credits = 1500
    priceInCents = 12500
  }

  // Create subscription record
  const { error: subscriptionError } = await supabase
    .from('subscriptions')
    .insert({
      user_id: userId,
      stripe_subscription_id: subscription.id,
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      credits_per_month: credits,
      price_cents: priceInCents
    })

  if (subscriptionError) {
    console.error('Error creating subscription record:', subscriptionError)
    return
  }

  // Update user subscription status
  const { error: userError } = await supabase
    .from('users')
    .update({
      subscription_status: 'active',
      subscription_tier: tier,
      stripe_customer_id: customerId
    })
    .eq('id', userId)

  if (userError) {
    console.error('Error updating user subscription status:', userError)
    return
  }

  // Add initial subscription credits
  const { error: creditsError } = await supabase
    .rpc('add_credits', {
      user_uuid: userId,
      credits_to_add: credits,
      transaction_type: 'refill',
      description: `${tier.charAt(0).toUpperCase() + tier.slice(1)} subscription activation - ${credits} credits`,
      reference_id: subscription.id
    })

  if (creditsError) {
    console.error('Error adding subscription credits:', creditsError)
  } else {
    console.log(`Added ${credits} subscription credits to user ${userId}`)
  }
}

// Handle subscription updates
async function handleSubscriptionUpdated(event: Stripe.Event, supabase: any) {
  const subscription = event.data.object as Stripe.Subscription
  
  console.log('Processing subscription updated:', subscription.id)

  const userId = subscription.metadata?.userId
  if (!userId) {
    console.error('No userId in subscription metadata')
    return
  }

  // Update subscription record
  const { error: subscriptionError } = await supabase
    .from('subscriptions')
    .update({
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('stripe_subscription_id', subscription.id)

  if (subscriptionError) {
    console.error('Error updating subscription record:', subscriptionError)
    return
  }

  // Update user subscription status
  const newStatus = subscription.status === 'active' ? 'active' : 
                   subscription.status === 'past_due' ? 'past_due' : 
                   subscription.status === 'canceled' ? 'canceled' : 'inactive'

  const { error: userError } = await supabase
    .from('users')
    .update({ subscription_status: newStatus })
    .eq('id', userId)

  if (userError) {
    console.error('Error updating user subscription status:', userError)
  }

  console.log(`Updated subscription ${subscription.id} status to ${subscription.status}`)
}

// Handle subscription deletion/cancellation
async function handleSubscriptionDeleted(event: Stripe.Event, supabase: any) {
  const subscription = event.data.object as Stripe.Subscription
  
  console.log('Processing subscription deleted:', subscription.id)

  const userId = subscription.metadata?.userId
  if (!userId) {
    console.error('No userId in subscription metadata')
    return
  }

  // Update subscription record
  const { error: subscriptionError } = await supabase
    .from('subscriptions')
    .update({
      status: 'canceled',
      updated_at: new Date().toISOString()
    })
    .eq('stripe_subscription_id', subscription.id)

  if (subscriptionError) {
    console.error('Error updating subscription record:', subscriptionError)
  }

  // Update user subscription status
  const { error: userError } = await supabase
    .from('users')
    .update({ 
      subscription_status: 'canceled',
      subscription_tier: 'starter' // Reset to starter tier
    })
    .eq('id', userId)

  if (userError) {
    console.error('Error updating user subscription status:', userError)
  }

  console.log(`Canceled subscription ${subscription.id} for user ${userId}`)
}

// Handle successful invoice payment (monthly billing)
async function handleInvoicePaymentSucceeded(event: Stripe.Event, supabase: any) {
  const invoice = event.data.object as Stripe.Invoice
  
  // Only process subscription invoices, not one-time payments
  if (!invoice.subscription) {
    return
  }

  console.log('Processing invoice payment succeeded:', invoice.id)

  const subscriptionId = invoice.subscription as string
  
  // Get subscription from database
  const { data: subscription, error: subError } = await supabase
    .from('subscriptions')
    .select('user_id, credits_per_month')
    .eq('stripe_subscription_id', subscriptionId)
    .single()

  if (subError || !subscription) {
    console.error('Subscription not found for invoice:', invoice.id)
    return
  }

  // Refill monthly credits
  const { error: creditsError } = await supabase
    .rpc('add_credits', {
      user_uuid: subscription.user_id,
      credits_to_add: subscription.credits_per_month,
      transaction_type: 'refill',
      description: `Monthly subscription refill - ${subscription.credits_per_month} credits`,
      reference_id: invoice.id
    })

  if (creditsError) {
    console.error('Error refilling monthly credits:', creditsError)
  } else {
    console.log(`Refilled ${subscription.credits_per_month} credits for user ${subscription.user_id}`)
  }
}

// Handle failed invoice payment
async function handleInvoicePaymentFailed(event: Stripe.Event, supabase: any) {
  const invoice = event.data.object as Stripe.Invoice
  
  if (!invoice.subscription) {
    return
  }

  console.log('Processing invoice payment failed:', invoice.id)

  const subscriptionId = invoice.subscription as string
  
  // Get subscription from database
  const { data: subscription, error: subError } = await supabase
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_subscription_id', subscriptionId)
    .single()

  if (subError || !subscription) {
    console.error('Subscription not found for failed invoice:', invoice.id)
    return
  }

  // Update user status to past_due
  const { error: userError } = await supabase
    .from('users')
    .update({ subscription_status: 'past_due' })
    .eq('id', subscription.user_id)

  if (userError) {
    console.error('Error updating user to past_due status:', userError)
  }

  // Future enhancement: Send notification email to user about failed payment
  console.log(`Payment failed for user ${subscription.user_id}, status set to past_due`)
}

// Handle trial ending soon
async function handleTrialWillEnd(event: Stripe.Event, supabase: any) {
  const subscription = event.data.object as Stripe.Subscription
  
  console.log('Processing trial will end:', subscription.id)

  const userId = subscription.metadata?.userId
  if (!userId) {
    console.error('No userId in subscription metadata')
    return
  }

  // Future enhancement: Send notification email to user about trial ending
  console.log(`Trial ending soon for user ${userId}`)
}