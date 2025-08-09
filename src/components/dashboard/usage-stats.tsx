'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { BarChart3, TrendingUp, Mail, MapPin, Calendar } from 'lucide-react'

// Mock usage data
const mockUsageStats = {
  thisMonth: {
    emailsGenerated: 47,
    leadsScraped: 312,
    creditsUsed: 89,
    webhookCalls: 23
  },
  lastMonth: {
    emailsGenerated: 52,
    leadsScraped: 289,
    creditsUsed: 95,
    webhookCalls: 18
  },
  limits: {
    monthlyEmails: 100,
    monthlyLeads: 500,
    monthlyCredits: 350
  }
}

const calculateProgress = (used: number, limit: number) => {
  return Math.min((used / limit) * 100, 100)
}

const getProgressColor = (percentage: number) => {
  if (percentage >= 90) return 'bg-red-500'
  if (percentage >= 75) return 'bg-yellow-500'
  return 'bg-green-500'
}

const calculateChange = (current: number, previous: number) => {
  if (previous === 0) return current > 0 ? 100 : 0
  return Math.round(((current - previous) / previous) * 100)
}

export function UsageStats() {
  const { thisMonth, lastMonth, limits } = mockUsageStats

  const stats = [
    {
      title: 'Emails Generated',
      icon: Mail,
      current: thisMonth.emailsGenerated,
      previous: lastMonth.emailsGenerated,
      limit: limits.monthlyEmails,
      color: 'text-blue-600'
    },
    {
      title: 'Leads Scraped',
      icon: MapPin,
      current: thisMonth.leadsScraped,
      previous: lastMonth.leadsScraped,
      limit: limits.monthlyLeads,
      color: 'text-green-600'
    },
    {
      title: 'Credits Used',
      icon: BarChart3,
      current: thisMonth.creditsUsed,
      previous: lastMonth.creditsUsed,
      limit: limits.monthlyCredits,
      color: 'text-purple-600'
    }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Usage Statistics
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          This month vs last month
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {stats.map((stat) => {
            const Icon = stat.icon
            const progress = calculateProgress(stat.current, stat.limit)
            const change = calculateChange(stat.current, stat.previous)
            const isPositive = change > 0
            
            return (
              <div key={stat.title} className="space-y-2">
                {/* Stat Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${stat.color}`} />
                    <span className="text-sm font-medium">{stat.title}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs">
                    <TrendingUp className={`h-3 w-3 ${isPositive ? 'text-green-600' : 'text-red-600'}`} />
                    <span className={`font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                      {isPositive ? '+' : ''}{change}%
                    </span>
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="space-y-1">
                  <div className="relative">
                    <Progress 
                      value={progress} 
                      className="h-2"
                    />
                  </div>
                  
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{stat.current} used</span>
                    <span>{stat.limit} limit</span>
                  </div>
                </div>
                
                {/* Usage Status */}
                <div className="text-xs">
                  {progress >= 90 ? (
                    <span className="text-red-600 font-medium">
                      ⚠️ Approaching limit
                    </span>
                  ) : progress >= 75 ? (
                    <span className="text-yellow-600 font-medium">
                      ⚡ High usage
                    </span>
                  ) : (
                    <span className="text-green-600 font-medium">
                      ✅ Good usage
                    </span>
                  )}
                </div>
              </div>
            )
          })}
          
          {/* Monthly Summary */}
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">This Month Summary</span>
              </div>
              <span className="text-muted-foreground">
                {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
              </span>
            </div>
            
            <div className="mt-3 grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-muted-foreground">Total Operations:</span>
                <span className="ml-2 font-medium">
                  {thisMonth.emailsGenerated + thisMonth.leadsScraped}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Webhook Calls:</span>
                <span className="ml-2 font-medium">{thisMonth.webhookCalls}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}