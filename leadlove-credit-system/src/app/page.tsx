import { Metadata } from 'next'
import { Hero } from '@/components/home/hero'
import { Features } from '@/components/home/features'
import { Pricing } from '@/components/home/pricing'
import { CTA } from '@/components/home/cta'
import { Navigation } from '@/components/navigation'
import { Footer } from '@/components/footer'

export const metadata: Metadata = {
  title: 'LeadLove Maps - AI-Powered Lead Generation with Credit System',
  description: 'Transform Google Maps businesses into qualified leads with AI-generated email sequences. Start with 10 free credits, then choose from flexible pricing plans.',
  keywords: 'lead generation, AI email sequences, Google Maps scraping, cold email, business leads, digital marketing',
  openGraph: {
    title: 'LeadLove Maps - AI-Powered Lead Generation',
    description: 'Generate high-quality business leads with AI-powered email sequences. Integrate with Snov.io, Apollo.io, and other cold email platforms.',
    type: 'website',
  }
}

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Navigation />
      <main>
        <Hero />
        <Features />
        <Pricing />
        <CTA />
      </main>
      <Footer />
    </div>
  )
}