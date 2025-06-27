import { NextResponse } from 'next/server'
import { supabase } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization')
    console.log('🔍 Auth header:', authHeader ? 'Present' : 'Missing')

    // Try to get the current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    console.log('🔍 Session:', session ? `User ${session.user.id}` : 'No session')
    console.log('🔍 Session error:', sessionError)

    // Try to get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    console.log('🔍 User:', user ? `User ${user.id}` : 'No user')
    console.log('🔍 User error:', userError)

    // Check if we can access the profiles table
    let profileData = null
    let profileError = null
    if (user) {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      profileData = data
      profileError = error
      console.log('🔍 Profile data:', profileData ? 'Found' : 'Not found')
      console.log('🔍 Profile error:', profileError)
    }

    return NextResponse.json({
      success: true,
      hasAuthHeader: !!authHeader,
      hasSession: !!session,
      hasUser: !!user,
      userId: user?.id,
      profileData,
      errors: {
        sessionError: sessionError?.message,
        userError: userError?.message,
        profileError: profileError?.message
      }
    })
  } catch (error) {
    console.error('❌ Test auth error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 