import { Metadata } from 'next'
import { PricingPlans } from '@/components/pricing/pricing-plans'
import { CreditPurchase } from '@/components/pricing/credit-purchase'
import { BillingHistory } from '@/components/pricing/billing-history'
import { SubscriptionManagement } from '@/components/pricing/subscription-management'

export const metadata: Metadata = {
  title: 'Credits & Billing - LeadLove Maps',
  description: 'Manage your credits, subscription, and billing information.',
}

export default function CreditsPage() {
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Credits & Billing</h1>
        <p className="text-muted-foreground">
          Manage your credits, subscription plans, and billing information.
        </p>
      </div>

      {/* Subscription Management */}
      <SubscriptionManagement />

      {/* Pricing Plans */}
      <div className="space-y-4">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold">Subscription Plans</h2>
          <p className="text-muted-foreground">
            Choose the plan that fits your lead generation needs.
          </p>
        </div>
        <PricingPlans />
      </div>

      {/* One-time Credit Purchase */}
      <div className="space-y-4">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold">Buy Credits</h2>
          <p className="text-muted-foreground">
            Need extra credits? Purchase them one-time without a subscription.
          </p>
        </div>
        <CreditPurchase />
      </div>

      {/* Billing History */}
      <div className="space-y-4">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold">Billing History</h2>
          <p className="text-muted-foreground">
            View your past transactions and credit usage.
          </p>
        </div>
        <BillingHistory />
      </div>
    </div>
  )
}