import { NextResponse } from 'next/server'
import { supabase } from '@/lib/auth'

export async function GET() {
  try {
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ 
        isStaff: false, 
        isAdmin: false,
        error: 'Not authenticated' 
      }, { status: 401 })
    }

    // Get user profile to check role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ 
        isStaff: false, 
        isAdmin: false,
        error: 'Profile not found' 
      }, { status: 404 })
    }

    const isStaff = profile.role === 'staff' || profile.role === 'admin'
    const isAdmin = profile.role === 'admin'

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