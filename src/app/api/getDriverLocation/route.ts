import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get('jobId')

    if (!jobId) {
      return NextResponse.json(
        { error: 'Missing required parameter: jobId' },
        { status: 400 }
      )
    }

    // Get the driver location from the jobs table
    const { data, error } = await supabaseAdmin
      .from('jobs')
      .select('driver_lat, driver_lng')
      .eq('id', jobId)
      .single()

    if (error) {
      console.error('Error fetching driver location:', error)
      
      // Check if the error is due to missing columns
      if (error.message && error.message.includes('column') && error.message.includes('does not exist')) {
        return NextResponse.json({
          latitude: null,
          longitude: null
        })
      }
      
      return NextResponse.json(
        { error: 'Failed to fetch driver location' },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      )
    }

    // Return the location data in the format expected by the frontend
    return NextResponse.json({
      latitude: data.driver_lat,
      longitude: data.driver_lng
    })
  } catch (error) {
    console.error('Error in getDriverLocation:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 