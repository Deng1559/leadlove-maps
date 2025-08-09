import { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Mail, Zap, Users, BarChart3, ArrowRight } from 'lucide-react'

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
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Navigation */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="h-6 w-6 text-primary" />
              <span className="font-bold text-xl">LeadLove Maps</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/test-email-strategist">
                <Button variant="outline">Test Email Strategist</Button>
              </Link>
              <Link href="/dashboard">
                <Button>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main>
        {/* Hero Section */}
        <section className="py-20 px-4">
          <div className="container mx-auto text-center">
            <div className="inline-flex items-center rounded-full border px-4 py-2 text-sm mb-8">
              <Zap className="h-4 w-4 mr-2 text-yellow-500" />
              B2B Cold Email Strategist System Now Live
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              Transform Google Maps into
              <span className="text-primary block">High-Converting Email Sequences</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              AI-powered lead generation with professional email sequences. 
              Find businesses on Google Maps and generate deliverability-optimized cold emails.
            </p>
            <div className="flex items-center gap-4 justify-center">
              <Link href="/test-email-strategist">
                <Button size="lg" className="gap-2">
                  Test Email Generator <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="outline" size="lg">View Dashboard (No Login Required)</Button>
              </Link>
            </div>
            
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-700 text-center">
                🔓 <strong>Authentication Disabled</strong> - All features accessible without login for testing
              </p>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 px-4 bg-muted/30">
          <div className="container mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">Powered by Advanced Email Strategist</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Our B2B Cold Email Expert generates professional sequences with proven frameworks
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <Card>
                <CardHeader>
                  <Mail className="h-8 w-8 text-primary mb-2" />
                  <CardTitle>4 Subject Line Categories</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Direct, Casual, Curiosity, and Trigger-based subject lines. 
                    20 options per business, all under 60 characters.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <Users className="h-8 w-8 text-primary mb-2" />
                  <CardTitle>5-Email Follow-up Sequence</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Complete structured sequence with opener, pitch, credibility, 
                    and strategic follow-ups timed 2-4 days apart.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <BarChart3 className="h-8 w-8 text-primary mb-2" />
                  <CardTitle>Deliverability Optimized</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Humanized phrasing, outcome-focused messaging, and 
                    industry-specific personalization for maximum engagement.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Test Interfaces Section */}
        <section className="py-20 px-4">
          <div className="container mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">Test The System</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Try our enhanced email strategist system and see the difference
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <Card className="border-primary/20 hover:border-primary/40 transition-colors">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Email Strategist Test
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Generate high-converting email sequences for any business. 
                    Test subject lines, first email, and 4-email follow-up sequence.
                  </p>
                  <Link href="/test-email-strategist">
                    <Button className="w-full">Test Email Generator</Button>
                  </Link>
                </CardContent>
              </Card>
              <Card className="border-primary/20 hover:border-primary/40 transition-colors">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Webhook Integration Test
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Test Google Maps scraping integration with N8N workflows. 
                    Generate leads and email sequences in one workflow.
                  </p>
                  <Link href="/test-webhook">
                    <Button variant="outline" className="w-full">Test Webhook</Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8 px-4">
        <div className="container mx-auto text-center text-muted-foreground">
          <p>&copy; 2024 LeadLove Maps. Enhanced with B2B Cold Email Strategist System.</p>
        </div>
      </footer>
    </div>
  )
}