// Stripe server-side configuration for LeadLove Maps Credit System
import Stripe from 'stripe'

// Initialize Stripe with secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
  typescript: true,
})

export default stripe

// Server-side Stripe operations
export class StripeService {
  private stripe: Stripe

  constructor() {
    const secretKey = process.env.STRIPE_SECRET_KEY
    
    if (!secretKey) {
      throw new Error('Missing STRIPE_SECRET_KEY environment variable')
    }
    
    this.stripe = new Stripe(secretKey, {
      apiVersion: '2023-10-16',
      typescript: true,
    })
  }

  // Create or retrieve Stripe customer
  async createOrGetCustomer(params: {
    email: string
    name?: string
    userId: string
  }): Promise<Stripe.Customer> {
    const { email, name, userId } = params

    // First, try to find existing customer by email
    const existingCustomers = await this.stripe.customers.list({
      email: email,
      limit: 1
    })

    if (existingCustomers.data.length > 0) {
      const customer = existingCustomers.data[0]
      
      // Update metadata with userId if not present
      if (!customer.metadata.userId) {
        return await this.stripe.customers.update(customer.id, {
          metadata: { userId }
        })
      }
      
      return customer
    }

    // Create new customer
    return await this.stripe.customers.create({
      email,
      name: name || undefined,
      metadata: {
        userId
      }
    })
  }

  // Create subscription checkout session
  async createSubscriptionCheckout(params: {
    customerId: string
    priceId: string
    successUrl: string
    cancelUrl: string
    userId: string
  }): Promise<Stripe.Checkout.Session> {
    const { customerId, priceId, successUrl, cancelUrl, userId } = params

    return await this.stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId,
        type: 'subscription'
      },
      subscription_data: {
        metadata: {
          userId
        }
      },
      allow_promotion_codes: true,
      billing_address_collection: 'required',
    })
  }

  // Create one-time payment checkout session
  async createPaymentCheckout(params: {
    customerId: string
    priceId: string
    successUrl: string
    cancelUrl: string
    userId: string
    credits: number
  }): Promise<Stripe.Checkout.Session> {
    const { customerId, priceId, successUrl, cancelUrl, userId, credits } = params

    return await this.stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId,
        type: 'credit_purchase',
        credits: credits.toString()
      },
      allow_promotion_codes: true,
      billing_address_collection: 'required',
    })
  }

  // Get subscription details
  async getSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    return await this.stripe.subscriptions.retrieve(subscriptionId, {
      expand: ['latest_invoice', 'customer']
    })
  }

  // Cancel subscription
  async cancelSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    return await this.stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true
    })
  }

  // Reactivate subscription
  async reactivateSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    return await this.stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: false
    })
  }

  // Update subscription
  async updateSubscription(params: {
    subscriptionId: string
    newPriceId: string
  }): Promise<Stripe.Subscription> {
    const { subscriptionId, newPriceId } = params

    const subscription = await this.stripe.subscriptions.retrieve(subscriptionId)
    
    return await this.stripe.subscriptions.update(subscriptionId, {
      items: [{
        id: subscription.items.data[0].id,
        price: newPriceId,
      }],
      proration_behavior: 'create_prorations',
    })
  }

  // Get customer's payment methods
  async getPaymentMethods(customerId: string): Promise<Stripe.PaymentMethod[]> {
    const paymentMethods = await this.stripe.paymentMethods.list({
      customer: customerId,
      type: 'card',
    })
    
    return paymentMethods.data
  }

  // Create customer portal session
  async createCustomerPortalSession(params: {
    customerId: string
    returnUrl: string
  }): Promise<Stripe.BillingPortal.Session> {
    const { customerId, returnUrl } = params

    return await this.stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    })
  }

  // Construct webhook event
  constructWebhookEvent(
    payload: string | Buffer,
    signature: string,
    secret: string
  ): Stripe.Event {
    return this.stripe.webhooks.constructEvent(payload, signature, secret)
  }

  // Get upcoming invoice for subscription changes
  async getUpcomingInvoice(params: {
    customerId: string
    subscriptionId?: string
    subscriptionItems?: Array<{
      id: string
      price: string
    }>
  }): Promise<Stripe.Invoice> {
    const { customerId, subscriptionId, subscriptionItems } = params

    return await this.stripe.invoices.retrieveUpcoming({
      customer: customerId,
      subscription: subscriptionId,
      subscription_items: subscriptionItems,
    })
  }

  // Create usage record for metered billing (future feature)
  async createUsageRecord(params: {
    subscriptionItemId: string
    quantity: number
    timestamp?: number
  }): Promise<Stripe.UsageRecord> {
    const { subscriptionItemId, quantity, timestamp } = params

    return await this.stripe.subscriptionItems.createUsageRecord(
      subscriptionItemId,
      {
        quantity,
        timestamp: timestamp || Math.floor(Date.now() / 1000),
        action: 'increment',
      }
    )
  }

  // List all products and prices (for admin)
  async listPrices(): Promise<Stripe.Price[]> {
    const prices = await this.stripe.prices.list({
      active: true,
      expand: ['data.product'],
    })
    
    return prices.data
  }

  // Create a new price (for admin)
  async createPrice(params: {
    productId: string
    unitAmount: number
    currency: string
    recurring?: {
      interval: 'month' | 'year'
    }
  }): Promise<Stripe.Price> {
    const { productId, unitAmount, currency, recurring } = params

    return await this.stripe.prices.create({
      product: productId,
      unit_amount: unitAmount,
      currency,
      recurring: recurring || undefined,
    })
  }
}

// Export singleton instance
export const stripeService = new StripeService()

// Helper functions for webhook processing
export const getStripeCustomerFromEvent = (event: Stripe.Event): string | null => {
  const eventObject = event.data.object as any
  
  if (eventObject.customer) {
    return typeof eventObject.customer === 'string' 
      ? eventObject.customer 
      : eventObject.customer.id
  }
  
  return null
}

export const getUserIdFromEvent = (event: Stripe.Event): string | null => {
  const eventObject = event.data.object as any
  
  // Try to get userId from metadata
  if (eventObject.metadata?.userId) {
    return eventObject.metadata.userId
  }
  
  // For subscription events, check subscription metadata
  if (eventObject.subscription?.metadata?.userId) {
    return eventObject.subscription.metadata.userId
  }
  
  return null
}