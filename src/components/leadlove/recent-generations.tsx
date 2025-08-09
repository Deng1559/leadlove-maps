'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/components/providers'
import { formatCredits } from '@/lib/utils'
import { 
  History, 
  MapPin, 
  Building, 
  CheckCircle, 
  XCircle, 
  Clock, 
  ExternalLink,
  RefreshCw
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface UsageRecord {
  id: string
  tool_name: string
  credits_consumed: number
  search_query: string
  results_count: number
  processing_time_ms: number
  success: boolean
  created_at: string
  workflow_id: string
  error_message?: string
  metadata: {
    businessType: string
    location: string
    serviceOffering: string
    source: string
    isPrivateAccess?: boolean
  }
}

export function RecentGenerations() {
  const [usageHistory, setUsageHistory] = useState<UsageRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { profile } = useAuth()

  const fetchUsageHistory = async () => {
    if (!profile) return
    
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/usage', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch usage history')
      }

      const data = await response.json()
      setUsageHistory(data.records || [])
    } catch (err: any) {
      console.error('Error fetching usage history:', err)
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchUsageHistory()
  }, [profile])

  const getStatusIcon = (success: boolean) => {
    return success ? (
      <CheckCircle className="w-4 h-4 text-green-600" />
    ) : (
      <XCircle className="w-4 h-4 text-red-600" />
    )
  }

  const getStatusBadge = (success: boolean) => {
    return (
      <Badge variant={success ? "default" : "destructive"} className="text-xs">
        {success ? "Completed" : "Failed"}
      </Badge>
    )
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <History className="w-4 h-4" />
            <span>Recent Generations</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-4 h-4 animate-spin mr-2" />
            <span className="text-sm text-muted-foreground">Loading history...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <History className="w-4 h-4" />
            <span>Recent Generations</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <XCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <p className="text-sm text-red-600 mb-3">{error}</p>
            <Button size="sm" variant="outline" onClick={fetchUsageHistory}>
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <History className="w-4 h-4" />
            <span>Recent Generations</span>
          </CardTitle>
          <Button size="sm" variant="ghost" onClick={fetchUsageHistory}>
            <RefreshCw className="w-3 h-3" />
          </Button>
        </div>
        <CardDescription>
          Your last {usageHistory.length} lead generations
        </CardDescription>
      </CardHeader>

      <CardContent>
        {usageHistory.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground mb-3">
              No generations yet
            </p>
            <p className="text-xs text-muted-foreground">
              Your lead generation history will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {usageHistory.slice(0, 5).map((record, index) => (
              <div key={record.id}>
                <div className="flex items-start space-x-3 p-3 hover:bg-muted/50 rounded-lg transition-colors">
                  <div className="mt-1">
                    {getStatusIcon(record.success)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    {/* Business Type & Location */}
                    <div className="flex items-center space-x-2 mb-1">
                      <Building className="w-3 h-3 text-muted-foreground" />
                      <span className="text-sm font-medium capitalize">
                        {record.metadata.businessType}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2 mb-2">
                      <MapPin className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {record.metadata.location}
                      </span>
                    </div>

                    {/* Results & Credits */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-xs">
                          {record.results_count} results
                        </Badge>
                        {record.credits_consumed > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {formatCredits(record.credits_consumed)}
                          </Badge>
                        )}
                        {record.metadata.isPrivateAccess && (
                          <Badge variant="secondary" className="text-xs">
                            Private
                          </Badge>
                        )}
                      </div>
                      
                      {getStatusBadge(record.success)}
                    </div>

                    {/* Time & Source */}
                    <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                      <span>
                        {formatDistanceToNow(new Date(record.created_at), { addSuffix: true })}
                      </span>
                      <span className="capitalize">
                        {record.metadata.source?.replace('_', ' ')}
                      </span>
                    </div>

                    {/* Error Message */}
                    {!record.success && record.error_message && (
                      <p className="text-xs text-red-600 mt-1 truncate">
                        {record.error_message}
                      </p>
                    )}
                  </div>

                  {/* View Details Button */}
                  {record.workflow_id && (
                    <Button size="sm" variant="ghost" className="ml-2">
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                  )}
                </div>

                {index < Math.min(usageHistory.length - 1, 4) && (
                  <Separator className="my-1" />
                )}
              </div>
            ))}

            {/* View All Link */}
            {usageHistory.length > 5 && (
              <div className="pt-2 border-t">
                <Button variant="ghost" size="sm" className="w-full" asChild>
                  <a href="/dashboard/usage">
                    View All History ({usageHistory.length} total)
                    <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}