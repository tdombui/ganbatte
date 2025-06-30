import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    const cookieStore = await cookies()
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll() {
            // No-op for read-only operations
          },
        },
      }
    )

    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.log('🔍 API: Auth error or no user:', authError?.message)
      return NextResponse.json({ 
        isStaff: false, 
        isAdmin: false,
        error: 'Not authenticated' 
      }, { status: 401 })
    }

    console.log('🔍 API: User authenticated:', user.id)

    // Get user profile to check role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      console.log('🔍 API: Profile error:', profileError?.message)
      return NextResponse.json({ 
        isStaff: false, 
        isAdmin: false,
        error: 'Profile not found' 
      }, { status: 404 })
    }

    const isStaff = profile.role === 'staff' || profile.role === 'admin'
    const isAdmin = profile.role === 'admin'

    console.log('🔍 API: User role:', profile.role, 'isStaff:', isStaff, 'isAdmin:', isAdmin)

    return NextResponse.json({
      isStaff,
      isAdmin,
      role: profile.role
    })

  } catch (error) {
    console.error('Error checking staff permissions:', error)
    return NextResponse.json({ 
      isStaff: false, 
      isAdmin: false,
      error: 'Internal server error' 
    }, { status: 500 })
  }
} 