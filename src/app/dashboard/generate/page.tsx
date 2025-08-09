import { Metadata } from 'next'
import { LeadGenerationForm } from '@/components/leadlove/lead-generation-form'
import { CreditCostCalculator } from '@/components/leadlove/credit-cost-calculator'
import { RecentGenerations } from '@/components/leadlove/recent-generations'

export const metadata: Metadata = {
  title: 'Generate Leads - LeadLove Maps',
  description: 'Generate AI-powered email sequences from Google Maps businesses.',
}

export default function GenerateLeadsPage() {
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Generate Leads</h1>
        <p className="text-muted-foreground">
          Transform Google Maps businesses into qualified leads with AI-generated email sequences.
        </p>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Lead Generation Form - Takes up 2/3 of the space */}
        <div className="lg:col-span-2">
          <LeadGenerationForm />
        </div>

        {/* Sidebar - Takes up 1/3 of the space */}
        <div className="space-y-6">
          {/* Credit Cost Calculator */}
          <CreditCostCalculator />
          
          {/* Recent Generations */}
          <RecentGenerations />
        </div>
      </div>
    </div>
  )
}