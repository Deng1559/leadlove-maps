'use client'

import { useAuth, useCredits } from '@/components/providers'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatCredits } from '@/lib/utils'
import { CreditCard, Plus, Zap } from 'lucide-react'
import Link from 'next/link'

export function CreditBalance() {
  // Handle case where authentication is disabled
  let profile, credits
  try {
    const authHook = useAuth()
    const creditsHook = useCredits()
    profile = authHook?.profile
    credits = creditsHook?.credits
  } catch (error) {
    // Authentication providers not available - use default values
    profile = null
    credits = null
  }

  const displayCredits = credits ?? profile?.credits_available ?? 1000 // Default credits for testing

  const getBalanceColor = (balance: number) => {
    if (balance <= 5) return 'destructive'
    if (balance <= 20) return 'warning' 
    return 'default'
  }

  const getSubscriptionBadge = () => {
    if (!profile?.subscription_status || profile.subscription_status === 'inactive') {
      return null
    }

    const statusColors = {
      active: 'default',
      canceled: 'secondary',
      past_due: 'destructive'
    } as const

    const tierLabels = {
      starter: 'Starter',
      growth: 'Growth', 
      enterprise: 'Enterprise'
    } as const

    return (
      <Badge variant={statusColors[profile.subscription_status as keyof typeof statusColors] || 'secondary'} className="text-xs">
        {tierLabels[profile.subscription_tier as keyof typeof tierLabels] || 'Free'}
      </Badge>
    )
  }

  return (
    <div className="flex items-center space-x-3">
      {/* Subscription Badge */}
      {getSubscriptionBadge()}

      {/* Credit Balance */}
      <div className="flex items-center space-x-2 text-sm">
        <Zap className="h-4 w-4 text-primary" />
        <span className="font-medium">
          {formatCredits(displayCredits)}
        </span>
      </div>

      {/* Buy Credits Button */}
      <Button 
        size="sm" 
        variant="outline"
        asChild
        className="h-8"
      >
        <Link href="/dashboard/credits" className="flex items-center space-x-1">
          <Plus className="h-3 w-3" />
          <span className="hidden sm:inline">Buy</span>
        </Link>
      </Button>
    </div>
  )
}