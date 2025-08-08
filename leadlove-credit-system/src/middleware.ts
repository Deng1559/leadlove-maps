import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  
  // SECURITY: RE-ENABLED AUTHENTICATION PROTECTION
  const supabase = createMiddlewareClient({ req, res })

  // Refresh session if expired - required for Server Components
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Get pathname for routing logic
  const pathname = req.nextUrl.pathname

  // Public routes that don't require authentication
  const publicRoutes = [
    '/',
    '/auth/signin',
    '/auth/signup', 
    '/auth/callback',
    '/auth/reset-password',
    '/terms',
    '/privacy',
    '/api/webhooks/stripe',
  ]

  // API routes that require authentication - EXPANDED FOR PHASE 2-4
  const protectedApiRoutes = [
    '/api/credits',
    '/api/usage',
    '/api/subscriptions',
    '/api/leadlove',
    '/api/enrichment',
    '/api/google-sheets',
    '/api/google-drive', 
    '/api/snov',
    '/api/feedback',
    '/api/roadmap',
  ]

  // Check if route is public
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  )

  // Check if this is a protected API route
  const isProtectedApiRoute = protectedApiRoutes.some(route =>
    pathname.startsWith(route)
  )

  // Allow access to public routes
  if (isPublicRoute && !pathname.startsWith('/dashboard')) {
    // If user is authenticated and trying to access auth pages, redirect to dashboard
    if (session && (pathname.startsWith('/auth/signin') || pathname.startsWith('/auth/signup'))) {
      const redirectTo = req.nextUrl.searchParams.get('redirect') || '/dashboard'
      return NextResponse.redirect(new URL(redirectTo, req.url))
    }
    return res
  }

  // Protected routes - require authentication
  if (!session) {
    // For API routes, return 401
    if (pathname.startsWith('/api/') && isProtectedApiRoute) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // For protected pages, redirect to signin with return URL
    const redirectUrl = new URL('/auth/signin', req.url)
    redirectUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // For authenticated users accessing dashboard or other protected routes
  if (session && pathname.startsWith('/dashboard')) {
    // Check if user profile exists in our database
    try {
      const { data: userProfile } = await supabase
        .from('users')
        .select('id, email, subscription_status')
        .eq('auth_id', session.user.id)
        .single()

      // If no profile exists, it might be a new user
      if (!userProfile) {
        // This will be handled by the database trigger, but we can add a small delay
        // to allow the trigger to process
        const { data: newProfile } = await supabase
          .from('users')
          .select('id')
          .eq('auth_id', session.user.id)
          .single()

        if (!newProfile) {
          // If still no profile, there might be an issue
          console.warn('User profile not found after trigger should have created it')
        }
      }
    } catch (error) {
      console.error('Error checking user profile:', error)
      // Continue to allow access - the app will handle profile creation
    }
  }

  // Rate limiting for API routes (simple implementation)
  if (pathname.startsWith('/api/') && isProtectedApiRoute) {
    const ip = req.ip ?? '127.0.0.1'
    const userAgent = req.headers.get('user-agent') ?? 'unknown'
    
    // In production, you'd want to use a proper rate limiting solution like Upstash
    // For now, we'll just add headers for monitoring
    res.headers.set('X-User-ID', session.user.id)
    res.headers.set('X-Request-IP', ip)
  }

  return res
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}