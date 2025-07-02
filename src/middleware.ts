import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from './lib/supabase/middleware'

// Helper function to check if we should skip auth check
function shouldSkipAuthCheck(pathname: string): boolean {
  // Skip auth check for static assets and API routes
  const skipPatterns = [
    '/_next/',
    '/favicon.ico',
    '/api/',
    '/public/',
    '/auth/callback',
    '/auth/verify',
    '/clear-cookies.html' // Skip the cookie clearing page
  ]
  
  return skipPatterns.some(pattern => pathname.startsWith(pattern))
}



export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  
  // Skip auth check for static assets and certain routes
  if (shouldSkipAuthCheck(pathname)) {
    return NextResponse.next()
  }
  
  // Only log in development
  const isDev = process.env.NODE_ENV === 'development'
  if (isDev) {
    console.log('🔍 Middleware: Processing request for:', pathname)
  }
  
  try {
    const { supabase, response } = createClient(request)

    // Only check session for protected routes or auth page
    const protectedRoutes = ['/staff', '/admin', '/chat', '/jobs', '/profile']
    const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
    const isAuthPage = pathname === '/auth'
    
    // Skip session check for non-protected routes (except auth page)
    if (!isProtectedRoute && !isAuthPage) {
      return response
    }

    // Refresh session if expired - required for Server Components
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (isDev) {
      console.log('🔍 Middleware: Session check:', { 
        hasSession: !!session, 
        userId: session?.user?.id,
        error: error?.message 
      })
    }
    
    if (error) {
      // In production, only log critical errors
      if (isDev || error.message?.includes('rate limit') || error.message?.includes('429')) {
        console.error('Middleware auth error:', error)
      }
      
      // Handle rate limiting specifically - continue without auth check
      if (error.message?.includes('rate limit') || error.message?.includes('429')) {
        if (isDev) {
          console.log('🔍 Middleware: Rate limit detected, continuing without auth check')
        }
        return response
      }
      
      // For other auth errors, clear cookies and redirect to auth
      const authResponse = NextResponse.redirect(new URL('/auth', request.url))
      authResponse.cookies.delete('sb-access-token')
      authResponse.cookies.delete('sb-refresh-token')
      return authResponse
    }

    if (isDev) {
      console.log('🔍 Middleware: Route check:', { 
        pathname,
        isProtectedRoute,
        hasSession: !!session
      })
    }

    // If it's a protected route and no session, redirect to auth
    if (isProtectedRoute && !session) {
      if (isDev) {
        console.log('🔍 Middleware: Redirecting to auth - no session for protected route')
      }
      const redirectUrl = new URL('/auth', request.url)
      redirectUrl.searchParams.set('redirectTo', pathname)
      return NextResponse.redirect(redirectUrl)
    }

    // If user is authenticated and trying to access auth page, redirect to home
    if (session && isAuthPage) {
      if (isDev) {
        console.log('🔍 Middleware: Redirecting to home - authenticated user on auth page')
      }
      return NextResponse.redirect(new URL('/', request.url))
    }

    if (isDev) {
      console.log('🔍 Middleware: Continuing with request')
    }
    // For all other requests, continue
    return response
  } catch (error) {
    // In production, only log critical errors
    if (isDev || (error instanceof Error && 
        (error.message.includes('rate limit') || 
         error.message.includes('429') ||
         error.message.includes('network')))) {
      console.error('Middleware error:', error)
    }
    
    // Don't redirect on every error - only for critical auth issues
    if (error instanceof Error && 
        (error.message.includes('rate limit') || 
         error.message.includes('429') ||
         error.message.includes('network'))) {
      if (isDev) {
        console.log('🔍 Middleware: Non-critical error, continuing without auth check')
      }
      return NextResponse.next()
    }
    
    // If middleware fails critically, redirect to auth page to reset the session
    const redirectUrl = new URL('/auth', request.url)
    redirectUrl.searchParams.set('error', 'session_error')
    const authResponse = NextResponse.redirect(redirectUrl)
    
    // Clear any potentially corrupted cookies
    authResponse.cookies.delete('sb-access-token')
    authResponse.cookies.delete('sb-refresh-token')
    
    return authResponse
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes (handled separately)
     */
    '/((?!_next/static|_next/image|favicon.ico|public/|api/).*)',
  ],
}