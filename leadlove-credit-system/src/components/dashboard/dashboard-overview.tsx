'use client'

import { useAuth } from '@/components/providers'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCredits, formatDate } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Zap, User, Calendar, TrendingUp } from 'lucide-react'

export function DashboardOverview() {
  // Handle case where authentication is disabled
  let user, profile
  try {
    const authHook = useAuth()
    user = authHook?.user
    profile = authHook?.profile
  } catch (error) {
    // Authentication providers not available - use default values
    user = { 
      email: 'test@example.com',
      created_at: new Date().toISOString()
    }
    profile = { 
      full_name: 'Test User',
      credits_available: 1000,
      credits_used: 50,
      subscription_status: 'active',
      subscription_tier: 'growth'
    }
  }

  const getWelcomeMessage = () => {
    const name = profile?.full_name?.split(' ')[0] || 'there'
    const hour = new Date().getHours()
    
    if (hour < 12) return `Good morning, ${name}!`
    if (hour < 17) return `Good afternoon, ${name}!`
    return `Good evening, ${name}!`
  }

  const getSubscriptionInfo = () => {
    if (!profile?.subscription_status || profile.subscription_status === 'inactive') {
      return {
        title: 'Free Account',
        description: 'Upgrade to get more credits monthly',
        variant: 'secondary' as const
      }
    }

    const tierInfo = {
      starter: { title: 'Starter Plan', description: '100 credits monthly' },
      growth: { title: 'Growth Plan', description: '350 credits monthly' },
      enterprise: { title: 'Enterprise Plan', description: '1500 credits monthly' }
    }

    const info = tierInfo[profile.subscription_tier as keyof typeof tierInfo]
    
    return {
      title: info?.title || 'Subscription Active',
      description: info?.description || 'Premium features included',
      variant: 'default' as const
    }
  }

  const subscriptionInfo = getSubscriptionInfo()

  return (
    <div className="space-y-4">
      {/* Welcome Header */}
      <div className="flex flex-col space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">
          {getWelcomeMessage()}
        </h1>
        <p className="text-muted-foreground">
          Here's what's happening with your LeadLove Maps account today.
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Credit Balance */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Available Credits
            </CardTitle>
            <Zap className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCredits(profile?.credits_available || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {profile?.credits_used || 0} used this month
            </p>
          </CardContent>
        </Card>

        {/* Subscription Status */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Subscription
            </CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Badge variant={subscriptionInfo.variant} className="text-xs">
                {subscriptionInfo.title}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {subscriptionInfo.description}
            </p>
          </CardContent>
        </Card>

        {/* Account Age */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Member Since
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {user?.created_at ? formatDate(user.created_at) : 'Recently'}
            </div>
            <p className="text-xs text-muted-foreground">
              Account created
            </p>
          </CardContent>
        </Card>

        {/* Success Rate Placeholder */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Success Rate
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              98%
            </div>
            <p className="text-xs text-muted-foreground">
              Lead generation success
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Status */}
      {profile?.subscription_status === 'inactive' && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              <div>
                <p className="font-medium text-blue-900">
                  Ready to scale your lead generation?
                </p>
                <p className="text-sm text-blue-700 mt-1">
                  Upgrade to a paid plan for monthly credit refills and priority support.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}