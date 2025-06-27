import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  
  // Temporarily disable middleware for testing
  console.log('🔍 Middleware: Temporarily disabled for testing, path:', req.nextUrl.pathname)
  return res
  
  // const supabase = createMiddlewareClient({ req, res })

  // // Get the current user
  // const { data: { user } } = await supabase.auth.getUser()

  // // Check if the route is a staff route
  // const isStaffRoute = req.nextUrl.pathname.startsWith('/staff')
  
  // if (isStaffRoute) {
  //   console.log('🔍 Middleware: Staff route detected:', req.nextUrl.pathname)
  //   console.log('🔍 Middleware: User authenticated:', !!user)
    
  //   // If no user, redirect to sign in
  //   if (!user) {
  //     console.log('🔍 Middleware: No user, redirecting to auth')
  //     const redirectUrl = new URL('/auth/callback', req.url)
  //     redirectUrl.searchParams.set('redirectTo', req.nextUrl.pathname)
  //     return NextResponse.redirect(redirectUrl)
  //   }

  //   // Check if user has staff role
  //   const { data: profile, error } = await supabase
  //     .from('profiles')
  //     .eq('id', user.id)
  //     .single()

  //   console.log('🔍 Middleware: Profile lookup result:', { profile, error })

  //   if (error) {
  //     console.error('🔍 Middleware: Error fetching profile:', error)
  //     // If there's an error fetching profile, redirect to home
  //     return NextResponse.redirect(new URL('/', req.url))
  //   }

  //   if (profile?.role !== 'staff' && profile?.role !== 'admin') {
  //     console.log('🔍 Middleware: User is not staff/admin, redirecting to home')
  //     // Redirect to home page
  //     return NextResponse.redirect(new URL('/', req.url))
  //   }

  //   console.log('🔍 Middleware: User authorized, proceeding')
  // }

  // return res
}

export const config = {
  matcher: [
    '/staff/:path*',
    '/api/staff/:path*',
  ],
} 