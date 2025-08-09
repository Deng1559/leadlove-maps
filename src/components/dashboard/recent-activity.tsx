'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import { Mail, MapPin, Zap, Clock } from 'lucide-react'

// Mock recent activity data
const mockActivities = [
  {
    id: 1,
    type: 'email_generated',
    description: 'Generated email sequence for Joe\'s Pizza',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    metadata: { business: 'Joe\'s Pizza', industry: 'restaurants' }
  },
  {
    id: 2,
    type: 'leads_scraped',
    description: 'Scraped 25 leads from Miami Beach restaurants',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    metadata: { count: 25, location: 'Miami Beach, FL' }
  },
  {
    id: 3,
    type: 'email_generated',
    description: 'Generated email sequence for Elite Fitness Studio',
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    metadata: { business: 'Elite Fitness Studio', industry: 'fitness' }
  },
  {
    id: 4,
    type: 'webhook_used',
    description: 'N8N workflow integration completed',
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    metadata: { workflow: 'google-maps-scraper' }
  },
  {
    id: 5,
    type: 'credits_used',
    description: 'Used 15 credits for lead generation',
    timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    metadata: { credits: 15 }
  }
]

const getActivityIcon = (type: string) => {
  switch (type) {
    case 'email_generated':
      return <Mail className="h-4 w-4 text-blue-600" />
    case 'leads_scraped':
      return <MapPin className="h-4 w-4 text-green-600" />
    case 'webhook_used':
      return <Zap className="h-4 w-4 text-purple-600" />
    case 'credits_used':
      return <Zap className="h-4 w-4 text-orange-600" />
    default:
      return <Clock className="h-4 w-4 text-gray-600" />
  }
}

const getActivityBadge = (type: string) => {
  switch (type) {
    case 'email_generated':
      return <Badge variant="outline" className="text-blue-600 border-blue-200">Email</Badge>
    case 'leads_scraped':
      return <Badge variant="outline" className="text-green-600 border-green-200">Leads</Badge>
    case 'webhook_used':
      return <Badge variant="outline" className="text-purple-600 border-purple-200">Webhook</Badge>
    case 'credits_used':
      return <Badge variant="outline" className="text-orange-600 border-orange-200">Credits</Badge>
    default:
      return <Badge variant="outline">Activity</Badge>
  }
}

export function RecentActivity() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {mockActivities.map((activity) => (
            <div key={activity.id} className="flex items-start space-x-3">
              {/* Activity Icon */}
              <div className="flex-shrink-0 mt-0.5">
                {getActivityIcon(activity.type)}
              </div>
              
              {/* Activity Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground truncate">
                    {activity.description}
                  </p>
                  {getActivityBadge(activity.type)}
                </div>
                
                <div className="flex items-center space-x-4 mt-1">
                  <p className="text-xs text-muted-foreground">
                    {formatDate(activity.timestamp)}
                  </p>
                  
                  {/* Activity-specific metadata */}
                  {activity.metadata.business && (
                    <span className="text-xs text-muted-foreground">
                      • {activity.metadata.industry}
                    </span>
                  )}
                  
                  {activity.metadata.count && (
                    <span className="text-xs text-muted-foreground">
                      • {activity.metadata.count} leads
                    </span>
                  )}
                  
                  {activity.metadata.credits && (
                    <span className="text-xs text-muted-foreground">
                      • {activity.metadata.credits} credits
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {/* Empty state fallback */}
          {mockActivities.length === 0 && (
            <div className="text-center py-8">
              <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                No recent activity yet
              </p>
              <p className="text-xs text-muted-foreground">
                Start generating leads to see your activity here
              </p>
            </div>
          )}
        </div>
        
        {/* View All Link */}
        {mockActivities.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <button className="text-sm text-primary hover:text-primary/80 font-medium">
              View all activity →
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}