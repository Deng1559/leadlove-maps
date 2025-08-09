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
  RefreshCw,
  Filter,
  Download,
  Calendar,
  TrendingUp
} from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'

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

interface UsageSummary {
  totalGenerations: number
  successfulGenerations: number
  failedGenerations: number
  totalCreditsSpent: number
  successRate: number
}

export default function UsagePage() {
  const [usageHistory, setUsageHistory] = useState<UsageRecord[]>([])
  const [summary, setSummary] = useState<UsageSummary>({
    totalGenerations: 0,
    successfulGenerations: 0,
    failedGenerations: 0,
    totalCreditsSpent: 0,
    successRate: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'success' | 'failed'>('all')
  const { profile } = useAuth()

  const fetchUsageHistory = async () => {
    if (!profile) return
    
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/usage?limit=50', {
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
      setSummary(data.summary || {})
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

  const filteredHistory = usageHistory.filter(record => {
    if (filter === 'success') return record.success
    if (filter === 'failed') return !record.success
    return true
  })

  if (isLoading) {
    return (
      <div className="container max-w-6xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Usage History</h1>
          <p className="text-muted-foreground">Track your lead generation activity</p>
        </div>
        <Card>
          <CardContent className="p-12">
            <div className="flex items-center justify-center">
              <RefreshCw className="w-6 h-6 animate-spin mr-3" />
              <span className="text-lg">Loading usage history...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container max-w-6xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Usage History</h1>
          <p className="text-muted-foreground">Track your lead generation activity</p>
        </div>
        <Card>
          <CardContent className="p-12">
            <div className="text-center">
              <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Error Loading History</h3>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={fetchUsageHistory}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Usage History</h1>
        <p className="text-muted-foreground">Track your lead generation activity and monitor credit usage</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Total Generations</CardTitle>
              <TrendingUp className="w-4 h-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalGenerations}</div>
            <p className="text-xs text-muted-foreground">All time activity</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <CheckCircle className="w-4 h-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.successRate}%</div>
            <p className="text-xs text-muted-foreground">
              {summary.successfulGenerations} of {summary.totalGenerations} successful
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Credits Spent</CardTitle>
              <div className="w-4 h-4 rounded-full bg-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCredits(summary.totalCreditsSpent)}</div>
            <p className="text-xs text-muted-foreground">Total consumption</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Failed Attempts</CardTitle>
              <XCircle className="w-4 h-4 text-red-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.failedGenerations}</div>
            <p className="text-xs text-muted-foreground">Requires investigation</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            All ({usageHistory.length})
          </Button>
          <Button
            variant={filter === 'success' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('success')}
          >
            Successful ({summary.successfulGenerations})
          </Button>
          <Button
            variant={filter === 'failed' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('failed')}
          >
            Failed ({summary.failedGenerations})
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm" onClick={fetchUsageHistory}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Usage History */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed History</CardTitle>
          <CardDescription>
            Complete record of your lead generation activities
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredHistory.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">
                {filter === 'all' ? 'No Generation History' : `No ${filter} Generations`}
              </h3>
              <p className="text-muted-foreground mb-4">
                {filter === 'all' 
                  ? 'Your lead generation history will appear here'
                  : `No ${filter} generations found. Try a different filter.`
                }
              </p>
              {filter !== 'all' && (
                <Button variant="outline" onClick={() => setFilter('all')}>
                  Show All Results
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredHistory.map((record, index) => (
                <div key={record.id}>
                  <div className="flex items-start space-x-4 p-4 hover:bg-muted/50 rounded-lg transition-colors">
                    <div className="mt-1">
                      {getStatusIcon(record.success)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      {/* Business Details */}
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="flex items-center space-x-1">
                          <Building className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium capitalize">
                            {record.metadata.businessType}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {record.metadata.location}
                          </span>
                        </div>
                      </div>

                      {/* Service Offering */}
                      {record.metadata.serviceOffering && (
                        <p className="text-sm text-muted-foreground mb-3">
                          {record.metadata.serviceOffering}
                        </p>
                      )}

                      {/* Metrics Row */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <Badge variant="outline" className="text-xs">
                            {record.results_count} results
                          </Badge>
                          {record.credits_consumed > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              {formatCredits(record.credits_consumed)} credits
                            </Badge>
                          )}
                          {record.processing_time_ms && (
                            <Badge variant="outline" className="text-xs">
                              {Math.round(record.processing_time_ms / 1000)}s
                            </Badge>
                          )}
                          {record.metadata.isPrivateAccess && (
                            <Badge variant="secondary" className="text-xs">
                              Private Access
                            </Badge>
                          )}
                        </div>
                        
                        {getStatusBadge(record.success)}
                      </div>

                      {/* Timestamp and Source */}
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>
                            {format(new Date(record.created_at), 'MMM dd, yyyy')} at{' '}
                            {format(new Date(record.created_at), 'HH:mm')}
                          </span>
                          <span className="text-muted-foreground/60">•</span>
                          <span>
                            {formatDistanceToNow(new Date(record.created_at), { addSuffix: true })}
                          </span>
                        </div>
                        <span className="capitalize">
                          {record.metadata.source?.replace('_', ' ') || 'System'}
                        </span>
                      </div>

                      {/* Error Message */}
                      {!record.success && record.error_message && (
                        <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded">
                          <p className="text-xs text-red-700">
                            <strong>Error:</strong> {record.error_message}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Action Button */}
                    {record.workflow_id && (
                      <Button variant="ghost" size="sm">
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  {index < filteredHistory.length - 1 && (
                    <Separator className="my-2" />
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}