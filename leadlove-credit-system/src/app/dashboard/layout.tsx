import { AuthGuard } from '@/components/auth/auth-guard'
import { DashboardNav } from '@/components/dashboard/dashboard-nav'
import { CreditBalance } from '@/components/dashboard/credit-balance'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dashboard - LeadLove Maps',
  description: 'Manage your credits, view usage history, and generate leads with AI-powered email sequences.',
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        {/* Navigation Header */}
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto flex h-14 items-center px-4">
            <DashboardNav />
            <div className="ml-auto">
              <CreditBalance />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-6">
          {children}
        </main>
      </div>
    </AuthGuard>
  )
}