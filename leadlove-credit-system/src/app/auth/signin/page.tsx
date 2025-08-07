import { Metadata } from 'next'
import { AuthPage } from '@/components/auth/auth-page'

export const metadata: Metadata = {
  title: 'Sign In - LeadLove Maps',
  description: 'Sign in to your LeadLove Maps account to access AI-powered lead generation.',
}

export default function SignInPage() {
  return <AuthPage initialMode="signin" />
}