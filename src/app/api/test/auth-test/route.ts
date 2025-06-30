import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'

export async function GET(req: Request) {
  try {
    // Get the authorization header
    const authHeader = req.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('Missing or invalid authorization header')
      return NextResponse.json({ error: 'Missing authorization header' }, { status: 401 })
    }

    // Verify the user with the token
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.error('Authentication error:', authError)
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, full_name, email')
      .eq('id', user.id)
      .single()

    if (profileError) {
      return NextResponse.json({ 
        error: 'Profile not found',
        status: 'authenticated_no_profile',
        user: { id: user.id, email: user.email }
      }, { status: 404 })
    }

    return NextResponse.json({
      status: 'authenticated',
      user: {
        id: user.id,
        email: user.email,
        role: profile.role,
        full_name: profile.full_name
      },
      message: 'Authentication test successful'
    })

  } catch (error) {
    console.error('Auth test error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      status: 'error'
    }, { status: 500 })
  }
} 