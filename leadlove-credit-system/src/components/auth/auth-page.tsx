'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { AuthForm } from '@/components/auth/auth-form'
import { useAuth } from '@/components/providers'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

interface AuthPageProps {
  initialMode: 'signin' | 'signup'
}

export function AuthPage({ initialMode }: AuthPageProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode)
  const { user, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') || '/dashboard'

  // Redirect authenticated users
  useEffect(() => {
    if (!loading && user) {
      router.replace(redirectTo)
    }
  }, [user, loading, router, redirectTo])

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="mt-4 text-sm text-muted-foreground">
              Loading...
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Don't render auth form if user is already authenticated
  if (user) {
    return null
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="flex flex-col items-center space-y-2 text-center">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">LM</span>
            </div>
            <span className="text-xl font-bold text-foreground">LeadLove Maps</span>
          </div>
          <p className="text-sm text-muted-foreground max-w-sm">
            AI-powered lead generation with personalized email sequences
          </p>
        </div>

        {/* Auth Form */}
        <AuthForm 
          mode={mode} 
          onModeChange={setMode}
          redirectTo={redirectTo}
        />

        {/* Features Preview */}
        <div className="text-center space-y-3">
          <p className="text-xs text-muted-foreground font-medium">
            What you get with LeadLove Maps:
          </p>
          <div className="grid grid-cols-1 gap-2 text-xs text-muted-foreground">
            <div className="flex items-center justify-center space-x-2">
              <span className="w-1 h-1 bg-green-500 rounded-full"></span>
              <span>Google Maps business scraping</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <span className="w-1 h-1 bg-green-500 rounded-full"></span>
              <span>AI-generated email sequences</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <span className="w-1 h-1 bg-green-500 rounded-full"></span>
              <span>Cold email platform integration</span>
            </div>
          </div>
        </div>

        {/* Terms */}
        <p className="text-xs text-center text-muted-foreground">
          By signing up, you agree to our{' '}
          <a href="/terms" className="underline hover:text-foreground">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="/privacy" className="underline hover:text-foreground">
            Privacy Policy
          </a>
        </p>
      </div>
    </div>
  )
}