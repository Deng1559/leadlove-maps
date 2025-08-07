'use client'

import { useState } from 'react'
import { useAuth } from '@/components/providers'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { getSubscriptionTierInfo, formatStripePrice } from '@/lib/stripe/client'
import { Check, Zap, Star } from 'lucide-react'
import { cn } from '@/lib/utils'

const tiers = ['starter', 'growth', 'enterprise'] as const

export function PricingPlans() {
  const [isLoading, setIsLoading] = useState<string | null>(null)
  const { profile } = useAuth()
  const { toast } = useToast()

  const handleSubscribe = async (tier: typeof tiers[number]) => {
    setIsLoading(tier)

    try {
      const tierInfo = getSubscriptionTierInfo(tier)
      
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: tierInfo.priceId,
          mode: 'subscription'
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session')
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url
    } catch (error: any) {
      toast({
        title: 'Subscription Error',
        description: error.message || 'Failed to start subscription process.',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(null)
    }
  }

  const isCurrentTier = (tier: typeof tiers[number]) => {
    return profile?.subscription_tier === tier && profile?.subscription_status === 'active'
  }

  const getButtonText = (tier: typeof tiers[number]) => {
    if (isCurrentTier(tier)) {
      return 'Current Plan'
    }
    
    if (profile?.subscription_status === 'active') {
      return 'Switch Plan'
    }
    
    return 'Get Started'
  }

  const getButtonVariant = (tier: typeof tiers[number]) => {
    if (isCurrentTier(tier)) {
      return 'secondary'
    }
    
    if (tier === 'growth') {
      return 'gradient'
    }
    
    return 'default'
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {tiers.map((tier) => {
        const tierInfo = getSubscriptionTierInfo(tier)
        const isPopular = tier === 'growth'
        const isCurrent = isCurrentTier(tier)
        
        return (
          <Card 
            key={tier}
            className={cn(
              'relative',
              isPopular && 'border-primary shadow-lg',
              isCurrent && 'ring-2 ring-primary ring-offset-2'
            )}
          >
            {isPopular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-gradient-to-r from-primary to-primary/80">
                  <Star className="w-3 h-3 mr-1" />
                  Most Popular
                </Badge>
              </div>
            )}

            {isCurrent && (
              <div className="absolute -top-3 right-4">
                <Badge variant="success">
                  Current Plan
                </Badge>
              </div>
            )}

            <CardHeader className="text-center pb-4">
              <CardTitle className="text-xl">
                {tierInfo.name}
              </CardTitle>
              <CardDescription>
                {tierInfo.description}
              </CardDescription>
              <div className="pt-4">
                <span className="text-4xl font-bold">
                  {formatStripePrice(tierInfo.price)}
                </span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
                <Zap className="w-4 h-4 text-primary" />
                <span>{tierInfo.credits} credits included</span>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <ul className="space-y-3">
                {tierInfo.features.map((feature, index) => (
                  <li key={index} className="flex items-start space-x-3">
                    <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>

            <CardFooter>
              <Button
                className="w-full"
                variant={getButtonVariant(tier)}
                onClick={() => handleSubscribe(tier)}
                disabled={isLoading === tier || isCurrent}
                loading={isLoading === tier}
              >
                {getButtonText(tier)}
              </Button>
            </CardFooter>
          </Card>
        )
      })}
    </div>
  )
}