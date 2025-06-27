import { NextResponse } from 'next/server'
import { supabase } from '@/lib/auth'

export async function POST(req: Request) {
  try {
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.error('Authentication error:', authError)
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Check if user is staff/admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      console.error('Profile error:', profileError)
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const isStaff = profile.role === 'staff' || profile.role === 'admin'
    if (!isStaff) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { jobId, latitude, longitude } = await req.json()
    
    if (!jobId || !latitude || !longitude) {
      return NextResponse.json({ error: 'Missing jobId or coordinates' }, { status: 400 })
    }

    console.log('Updating driver location for job:', jobId, 'lat:', latitude, 'lng:', longitude)

    const { error } = await supabase.from('driver_locations').upsert([
      {
        job_id: jobId,
        latitude,
        longitude,
        updated_at: new Date().toISOString(),
      },
    ], { onConflict: 'job_id' })
    
    if (error) {
      console.error('Error updating driver location:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('Driver location updated successfully')
    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Unexpected error in updateDriverLocation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 