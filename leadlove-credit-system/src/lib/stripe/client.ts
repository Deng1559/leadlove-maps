// Stripe client configuration for LeadLove Maps Credit System
import { loadStripe, Stripe } from '@stripe/stripe-js'

let stripePromise: Promise<Stripe | null>

// Initialize Stripe client with publishable key
const getStripe = (): Promise<Stripe | null> => {
  if (!stripePromise) {
    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
    
    if (!publishableKey) {
      console.error('Missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY environment variable')
      return Promise.resolve(null)
    }
    
    stripePromise = loadStripe(publishableKey)
  }
  
  return stripePromise
}

export default getStripe

// Stripe configuration constants for scaled pricing
export const STRIPE_CONFIG = {
  // Subscription products (monthly)
  SUBSCRIPTION_PRICES: {
    STARTER: process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER_MONTHLY || 'price_starter_monthly',
    GROWTH: process.env.NEXT_PUBLIC_STRIPE_PRICE_GROWTH_MONTHLY || 'price_growth_monthly', 
    ENTERPRISE: process.env.NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE_MONTHLY || 'price_enterprise_monthly'
  },
  
  // One-time credit purchases
  CREDIT_PRICES: {
    CREDITS_50: process.env.NEXT_PUBLIC_STRIPE_PRICE_CREDITS_50 || 'price_credits_50',
    CREDITS_200: process.env.NEXT_PUBLIC_STRIPE_PRICE_CREDITS_200 || 'price_credits_200'
  },
  
  // Pricing tiers (in cents)
  PRICING: {
    STARTER_MONTHLY: 1000, // $10.00/month (reduced from $20)
    GROWTH_MONTHLY: 3500,  // $35.00/month (reduced from $70)
    ENTERPRISE_MONTHLY: 12500, // $125.00/month (reduced from $250)
    CREDITS_50: 1500,      // $15.00 for 50 credits
    CREDITS_200: 5000,     // $50.00 for 200 credits
  },
  
  // Credit allocations
  CREDITS: {
    STARTER_MONTHLY: 100,
    GROWTH_MONTHLY: 350,   // Reduced from 500
    ENTERPRISE_MONTHLY: 1500, // Reduced from 2000
    TRIAL_CREDITS: 10,
    CREDITS_50: 50,
    CREDITS_200: 200
  }
} as const

// Helper function to format price for display
export const formatStripePrice = (priceInCents: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(priceInCents / 100)
}

// Get price info by tier
export const getSubscriptionTierInfo = (tier: 'starter' | 'growth' | 'enterprise') => {
  const tierInfo = {
    starter: {
      name: 'Starter',
      price: STRIPE_CONFIG.PRICING.STARTER_MONTHLY,
      credits: STRIPE_CONFIG.CREDITS.STARTER_MONTHLY,
      priceId: STRIPE_CONFIG.SUBSCRIPTION_PRICES.STARTER,
      description: 'Perfect for small businesses and testing',
      features: [
        '100 credits monthly',
        'Google Maps lead scraping',
        'AI email sequences',
        'Basic support',
        'CSV export'
      ]
    },
    growth: {
      name: 'Growth', 
      price: STRIPE_CONFIG.PRICING.GROWTH_MONTHLY,
      credits: STRIPE_CONFIG.CREDITS.GROWTH_MONTHLY,
      priceId: STRIPE_CONFIG.SUBSCRIPTION_PRICES.GROWTH,
      description: 'For growing agencies and teams',
      features: [
        '350 credits monthly',
        'Priority processing',
        'Advanced analytics',
        'Email support',
        'Multiple export formats',
        'Team collaboration'
      ]
    },
    enterprise: {
      name: 'Enterprise',
      price: STRIPE_CONFIG.PRICING.ENTERPRISE_MONTHLY,
      credits: STRIPE_CONFIG.CREDITS.ENTERPRISE_MONTHLY, 
      priceId: STRIPE_CONFIG.SUBSCRIPTION_PRICES.ENTERPRISE,
      description: 'For large organizations',
      features: [
        '1500 credits monthly',
        'Dedicated support',
        'Custom integrations',
        'API access',
        'Advanced reporting',
        'White-label options',
        'SLA guarantee'
      ]
    }
  }
  
  return tierInfo[tier]
}

// Get one-time credit purchase info
export const getCreditPackageInfo = (packageType: 'credits_50' | 'credits_200') => {
  const packageInfo = {
    credits_50: {
      name: '50 Credits',
      price: STRIPE_CONFIG.PRICING.CREDITS_50,
      credits: STRIPE_CONFIG.CREDITS.CREDITS_50,
      priceId: STRIPE_CONFIG.CREDIT_PRICES.CREDITS_50,
      description: 'One-time credit purchase',
      pricePerCredit: STRIPE_CONFIG.PRICING.CREDITS_50 / STRIPE_CONFIG.CREDITS.CREDITS_50
    },
    credits_200: {
      name: '200 Credits',
      price: STRIPE_CONFIG.PRICING.CREDITS_200,
      credits: STRIPE_CONFIG.CREDITS.CREDITS_200,
      priceId: STRIPE_CONFIG.CREDIT_PRICES.CREDITS_200,
      description: 'Bulk credit purchase with savings',
      pricePerCredit: STRIPE_CONFIG.PRICING.CREDITS_200 / STRIPE_CONFIG.CREDITS.CREDITS_200
    }
  }
  
  return packageInfo[packageType]
}

// Calculate savings for bulk purchases
export const calculateSavings = (packageType: 'credits_200'): number => {
  const credits200 = getCreditPackageInfo('credits_200')
  const credits50 = getCreditPackageInfo('credits_50')
  
  if (packageType === 'credits_200') {
    const regularPrice = (credits200.credits / credits50.credits) * credits50.price
    return regularPrice - credits200.price
  }
  
  return 0
}

// Validate Stripe configuration
export const validateStripeConfig = (): boolean => {
  const required = [
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    process.env.STRIPE_SECRET_KEY
  ]
  
  const missing = required.filter(key => !key)
  
  if (missing.length > 0) {
    console.error('Missing required Stripe environment variables')
    return false
  }
  
  return true
}