'use client'

import { useState } from 'react'
import { useAuth } from '@/components/providers'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { formatCredits, formatCurrency, formatDate, getSubscriptionTierColor, getStatusColor } from '@/lib/utils'
import { CreditCard, ExternalLink, Calendar, Zap, AlertTriangle } from 'lucide-react'

export function SubscriptionManagement() {
  const [isLoading, setIsLoading] = useState(false)
  const { profile } = useAuth()
  const { toast } = useToast()

  const handleManageBilling = async () => {
    setIsLoading(true)

    try {
      const response = await fetch('/api/stripe/customer-portal', {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create customer portal session')
      }

      // Redirect to Stripe Customer Portal
      window.location.href = data.url
    } catch (error: any) {
      toast({
        title: 'Portal Error',
        description: error.message || 'Failed to access billing portal.',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Don't show if user has no subscription history
  if (!profile?.stripe_customer_id) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CreditCard className="w-5 h-5" />
            <span>Current Plan</span>
          </CardTitle>
          <CardDescription>
            You're currently on the free plan with trial credits.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Free Plan</p>
              <p className="text-sm text-muted-foreground">
                {formatCredits(profile?.credits_available || 0)} available
              </p>
            </div>
            <Badge variant="secondary">Free</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Upgrade to a paid plan to get monthly credit refills and access to advanced features.
          </p>
        </CardContent>
      </Card>
    )
  }

  const subscriptionInfo = {
    tier: profile?.subscription_tier || 'starter',
    status: profile?.subscription_status || 'inactive',
    creditsAvailable: profile?.credits_available || 0,
    creditsUsed: profile?.credits_used || 0,
    lastRefill: profile?.last_refill_date
  }

  const tierLabels = {
    starter: 'Starter Plan',
    growth: 'Growth Plan', 
    enterprise: 'Enterprise Plan'
  }

  const statusLabels = {
    active: 'Active',
    inactive: 'Inactive',
    canceled: 'Canceled',
    past_due: 'Past Due'
  }

  return (
    <div className="space-y-6">
      {/* Current Subscription */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CreditCard className="w-5 h-5" />
            <span>Current Subscription</span>
          </CardTitle>
          <CardDescription>
            Manage your subscription and billing information.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Plan Info */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">
                {tierLabels[subscriptionInfo.tier as keyof typeof tierLabels] || 'Unknown Plan'}
              </p>
              <p className="text-sm text-muted-foreground">
                {formatCredits(subscriptionInfo.creditsAvailable)} available • {formatCredits(subscriptionInfo.creditsUsed)} used this period
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Badge 
                className={getSubscriptionTierColor(subscriptionInfo.tier)}
              >
                {subscriptionInfo.tier.charAt(0).toUpperCase() + subscriptionInfo.tier.slice(1)}
              </Badge>
              <Badge 
                className={getStatusColor(subscriptionInfo.status)}
              >
                {statusLabels[subscriptionInfo.status as keyof typeof statusLabels] || subscriptionInfo.status}
              </Badge>
            </div>
          </div>

          {/* Last Refill */}
          {subscriptionInfo.lastRefill && (
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>Last refill: {formatDate(subscriptionInfo.lastRefill)}</span>
            </div>
          )}

          {/* Status Messages */}
          {subscriptionInfo.status === 'past_due' && (
            <div className="flex items-start space-x-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-800">
                  Payment Required
                </p>
                <p className="text-sm text-yellow-700">
                  Your subscription payment has failed. Please update your payment method to continue using premium features.
                </p>
              </div>
            </div>
          )}

          {subscriptionInfo.status === 'canceled' && (
            <div className="flex items-start space-x-2 p-3 bg-red-50 border border-red-200 rounded-md">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800">
                  Subscription Canceled
                </p>
                <p className="text-sm text-red-700">
                  Your subscription has been canceled. You can still use your remaining credits, but won't receive monthly refills.
                </p>
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={handleManageBilling}
            disabled={isLoading}
            loading={isLoading}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Manage Billing
          </Button>
          
          {subscriptionInfo.status === 'active' && (
            <p className="text-sm text-muted-foreground">
              Manage payments, invoices, and subscription settings
            </p>
          )}
        </CardFooter>
      </Card>

      {/* Credit Usage Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="w-5 h-5 text-primary" />
            <span>Credit Usage</span>
          </CardTitle>
          <CardDescription>
            Your credit usage for the current billing period.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4">
            {/* Usage Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Credits Used</span>
                <span>{subscriptionInfo.creditsUsed} / {subscriptionInfo.creditsAvailable + subscriptionInfo.creditsUsed}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-primary rounded-full h-2 transition-all duration-300"
                  style={{
                    width: `${Math.min((subscriptionInfo.creditsUsed / (subscriptionInfo.creditsAvailable + subscriptionInfo.creditsUsed)) * 100, 100)}%`
                  }}
                />
              </div>
            </div>

            {/* Usage Stats */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium">{formatCredits(subscriptionInfo.creditsAvailable)}</p>
                <p className="text-muted-foreground">Remaining</p>
              </div>
              <div>
                <p className="font-medium">{formatCredits(subscriptionInfo.creditsUsed)}</p>
                <p className="text-muted-foreground">Used This Period</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}