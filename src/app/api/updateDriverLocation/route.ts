import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const { jobId, latitude, longitude } = await request.json()

    console.log(`📍 Updating driver location for job ${jobId}: ${latitude}, ${longitude}`)

    if (!jobId || latitude === undefined || longitude === undefined) {
      console.log('❌ Missing required fields:', { jobId, latitude, longitude })
      return NextResponse.json(
        { error: 'Missing required fields: jobId, latitude, longitude' },
        { status: 400 }
      )
    }

    // Update the job with the new driver location
    const { data, error } = await supabaseAdmin
      .from('jobs')
      .update({
        driver_lat: latitude,
        driver_lng: longitude
      })
      .eq('id', jobId)
      .select()

    if (error) {
      console.error('❌ Supabase error updating driver location:', error)
      console.error('❌ Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      
      // Check if the error is due to missing columns
      if (error.message && error.message.includes('column') && error.message.includes('does not exist')) {
        console.log('❌ Driver location columns do not exist in database')
        return NextResponse.json(
          { error: 'Driver location tracking not yet configured. Please contact support.' },
          { status: 501 }
        )
      }
      
      return NextResponse.json(
        { error: 'Failed to update driver location', details: error.message },
        { status: 500 }
      )
    }

    console.log('✅ Driver location updated successfully:', data)
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('❌ Unexpected error in updateDriverLocation:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 