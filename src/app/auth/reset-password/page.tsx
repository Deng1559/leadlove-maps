'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Lock, Loader2 } from 'lucide-react'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isValidSession, setIsValidSession] = useState(false)
  const [checking, setChecking] = useState(true)
  
  const searchParams = useSearchParams()
  const router = useRouter()
  const supabase = createClientComponentClient()
  const { toast } = useToast()

  // Check if we have a valid password reset session
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        // Check if the user came from a password reset email
        const accessToken = searchParams.get('access_token')
        const refreshToken = searchParams.get('refresh_token')
        const type = searchParams.get('type')
        
        if (type === 'recovery' && accessToken && refreshToken) {
          // Set the session from URL parameters
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })
          
          if (!error) {
            setIsValidSession(true)
          } else {
            console.error('Error setting session:', error)
            toast({
              title: 'Invalid reset link',
              description: 'This password reset link is invalid or has expired.',
              variant: 'destructive'
            })
            router.push('/auth/signin')
          }
        } else if (session) {
          setIsValidSession(true)
        } else {
          toast({
            title: 'Access denied',
            description: 'You need a valid password reset link to access this page.',
            variant: 'destructive'
          })
          router.push('/auth/signin')
        }
      } catch (error) {
        console.error('Session check error:', error)
        router.push('/auth/signin')
      } finally {
        setChecking(false)
      }
    }

    checkSession()
  }, [searchParams, router, supabase.auth, toast])

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      toast({
        title: 'Passwords do not match',
        description: 'Please make sure both passwords are identical.',
        variant: 'destructive'
      })
      return
    }

    if (password.length < 6) {
      toast({
        title: 'Password too short',
        description: 'Password must be at least 6 characters long.',
        variant: 'destructive'
      })
      return
    }

    setIsLoading(true)

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) throw error

      toast({
        title: 'Password updated successfully',
        description: 'Your password has been reset. You can now sign in with your new password.',
        variant: 'success'
      })

      // Sign out and redirect to sign in page
      await supabase.auth.signOut()
      router.push('/auth/signin?message=password_updated')
    } catch (error: any) {
      console.error('Password reset error:', error)
      toast({
        title: 'Password reset failed',
        description: error.message || 'Failed to update your password.',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="mt-4 text-sm text-muted-foreground">
              Verifying reset link...
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!isValidSession) {
    return null // Will be redirected
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
        </div>

        {/* Reset Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Reset Your Password</CardTitle>
            <CardDescription className="text-center">
              Enter your new password below to complete the reset process.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordReset} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your new password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9"
                    required
                    disabled={isLoading}
                    minLength={6}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm your new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-9"
                    required
                    disabled={isLoading}
                    minLength={6}
                  />
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                Password must be at least 6 characters long
              </p>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
                loading={isLoading}
              >
                Update Password
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Back to Sign In */}
        <div className="text-center">
          <button
            onClick={() => router.push('/auth/signin')}
            className="text-sm text-muted-foreground hover:text-foreground underline"
            disabled={isLoading}
          >
            Back to Sign In
          </button>
        </div>
      </div>
    </div>
  )
}