import { Metadata } from 'next'
import { DashboardOverview } from '@/components/dashboard/dashboard-overview'
import { QuickActions } from '@/components/dashboard/quick-actions'
import { RecentActivity } from '@/components/dashboard/recent-activity'
import { UsageStats } from '@/components/dashboard/usage-stats'

export const metadata: Metadata = {
  title: 'Dashboard - LeadLove Maps',
  description: 'Your LeadLove Maps dashboard with credit balance, usage statistics, and quick actions.',
}

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <DashboardOverview />

      {/* Quick Actions */}
      <QuickActions />

      {/* Stats and Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <UsageStats />
        <RecentActivity />
      </div>
    </div>
  )
}