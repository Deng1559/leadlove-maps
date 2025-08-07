'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/components/providers'
import { formatCredits } from '@/lib/utils'
import { 
  Search, 
  Zap, 
  CreditCard, 
  BarChart3, 
  ArrowRight,
  Sparkles 
} from 'lucide-react'
import Link from 'next/link'

export function QuickActions() {
  const { profile } = useAuth()

  const actions = [
    {
      title: 'Generate Leads',
      description: 'Create AI-powered email sequences from Google Maps businesses',
      icon: Search,
      href: '/dashboard/generate',
      color: 'bg-blue-500',
      badge: `${calculateCreditCost()} credits`,
      primary: true
    },
    {
      title: 'Buy Credits',
      description: 'Purchase additional credits or upgrade your subscription',
      icon: CreditCard,
      href: '/dashboard/credits',
      color: 'bg-green-500',
      badge: 'Starting at $10/mo'
    },
    {
      title: 'Usage Analytics',
      description: 'View your lead generation history and performance',
      icon: BarChart3,
      href: '/dashboard/usage',
      color: 'bg-purple-500',
      badge: 'Track progress'
    },
    {
      title: 'API Integration',
      description: 'Integrate LeadLove Maps with your existing tools',
      icon: Sparkles,
      href: '/dashboard/api',
      color: 'bg-orange-500',
      badge: 'Advanced'
    }
  ]

  function calculateCreditCost(): number {
    // Default cost for LeadLove Maps lead generation
    return 3
  }

  const canAffordLeadGeneration = (profile?.credits_available || 0) >= calculateCreditCost()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Quick Actions</h2>
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Zap className="w-4 h-4 text-primary" />
          <span>{formatCredits(profile?.credits_available || 0)} available</span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {actions.map((action, index) => {
          const Icon = action.icon
          const isLeadGeneration = action.href === '/dashboard/generate'
          const isDisabled = isLeadGeneration && !canAffordLeadGeneration

          return (
            <Card 
              key={index} 
              className={`relative group hover:shadow-lg transition-all duration-200 ${
                action.primary ? 'ring-2 ring-primary/20' : ''
              } ${
                isDisabled ? 'opacity-60' : 'hover:-translate-y-1'
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className={`w-10 h-10 rounded-lg ${action.color} flex items-center justify-center`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <Badge variant={action.primary ? 'default' : 'secondary'} className="text-xs">
                    {action.badge}
                  </Badge>
                </div>
                <CardTitle className="text-lg">{action.title}</CardTitle>
                <CardDescription className="text-sm">
                  {action.description}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="pt-0">
                {isDisabled ? (
                  <div className="space-y-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full" 
                      disabled
                    >
                      Need {calculateCreditCost()} Credits
                    </Button>
                    <Button 
                      variant="default" 
                      size="sm" 
                      className="w-full" 
                      asChild
                    >
                      <Link href="/dashboard/credits">
                        Buy Credits
                        <ArrowRight className="w-3 h-3 ml-1" />
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <Button 
                    variant={action.primary ? 'default' : 'outline'} 
                    size="sm" 
                    className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors" 
                    asChild
                  >
                    <Link href={action.href}>
                      Get Started
                      <ArrowRight className="w-3 h-3 ml-1" />
                    </Link>
                  </Button>
                )}
              </CardContent>

              {action.primary && (
                <div className="absolute -top-2 -right-2">
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                    <Sparkles className="w-3 h-3 text-primary-foreground" />
                  </div>
                </div>
              )}
            </Card>
          )
        })}
      </div>

      {/* Credit Warning */}
      {(profile?.credits_available || 0) <= 5 && (
        <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-3">
              <Zap className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-900">
                  Low Credit Balance
                </p>
                <p className="text-sm text-yellow-800 mt-1">
                  You have {formatCredits(profile?.credits_available || 0)} remaining. 
                  Consider purchasing more credits or upgrading to a subscription plan for monthly refills.
                </p>
                <div className="flex space-x-2 mt-3">
                  <Button size="sm" variant="outline" asChild>
                    <Link href="/dashboard/credits">
                      Buy Credits
                    </Link>
                  </Button>
                  <Button size="sm" asChild>
                    <Link href="/dashboard/credits">
                      View Plans
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}