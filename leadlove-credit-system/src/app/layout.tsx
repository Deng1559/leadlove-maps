import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from '@/components/ui/toaster'
import { Providers } from '@/components/providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'LeadLove Maps Credit System',
  description: 'AI-powered lead generation with credit-based usage system',
  keywords: 'lead generation, AI, business leads, email sequences, cold email',
  authors: [{ name: 'LeadLove Maps Team' }],
  openGraph: {
    title: 'LeadLove Maps Credit System',
    description: 'AI-powered lead generation with credit-based usage system',
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    siteName: 'LeadLove Maps',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <div className="min-h-screen bg-background">
            {children}
          </div>
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}