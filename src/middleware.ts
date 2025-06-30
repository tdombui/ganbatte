import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from './lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  console.log('🔍 Middleware: Processing request for:', request.nextUrl.pathname)
  
  try {
    const { supabase, response } = createClient(request)

    // Refresh session if expired - required for Server Components
    const { data: { session }, error } = await supabase.auth.getSession()
    
    console.log('🔍 Middleware: Session check:', { 
      hasSession: !!session, 
      userId: session?.user?.id,
      error: error?.message 
    })
    
    if (error) {
      console.error('Middleware auth error:', error)
      // If there's an auth error, clear the session and redirect to auth
      const authResponse = NextResponse.redirect(new URL('/auth', request.url))
      authResponse.cookies.delete('sb-access-token')
      authResponse.cookies.delete('sb-refresh-token')
      return authResponse
    }

    // Define protected routes
    const protectedRoutes = ['/staff', '/admin', '/chat', '/jobs', '/profile']
    const isProtectedRoute = protectedRoutes.some(route => 
      request.nextUrl.pathname.startsWith(route)
    )

    console.log('🔍 Middleware: Route check:', { 
      pathname: request.nextUrl.pathname,
      isProtectedRoute,
      hasSession: !!session
    })

    // If it's a protected route and no session, redirect to auth
    if (isProtectedRoute && !session) {
      console.log('🔍 Middleware: Redirecting to auth - no session for protected route')
      const redirectUrl = new URL('/auth', request.url)
      redirectUrl.searchParams.set('redirectTo', request.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }

    // If user is authenticated and trying to access auth page, redirect to home
    if (session && request.nextUrl.pathname === '/auth') {
      console.log('🔍 Middleware: Redirecting to home - authenticated user on auth page')
      return NextResponse.redirect(new URL('/', request.url))
    }

    console.log('🔍 Middleware: Continuing with request')
    // For all other requests, continue
    return response
  } catch (error) {
    console.error('Middleware error:', error)
    
    // If middleware fails, redirect to auth page to reset the session
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