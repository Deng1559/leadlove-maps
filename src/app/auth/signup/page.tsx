import { Metadata } from 'next'
import { AuthPage } from '@/components/auth/auth-page'

export const metadata: Metadata = {
  title: 'Sign Up - LeadLove Maps',
  description: 'Create your LeadLove Maps account and get 10 free credits to start generating leads.',
}

export default function SignUpPage() {
  return <AuthPage initialMode="signup" />
}