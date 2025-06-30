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

    // Check if job exists and try to get driver location
    const { data: jobData, error: jobError } = await supabaseAdmin
      .from('jobs')
      .select('id, status, driver_lat, driver_lng')
      .eq('id', jobId)
      .single()

    if (jobError) {
      console.error('Error fetching job:', jobError)
      
      // Check if the error is due to missing columns
      if (jobError.message && jobError.message.includes('column') && jobError.message.includes('does not exist')) {
        return NextResponse.json({
          success: true,
          jobExists: false,
          driverLocationFieldsExist: false,
          error: 'Driver location fields (driver_lat, driver_lng) do not exist in the jobs table',
          message: 'You need to run the SQL script to add these fields to your database'
        })
      }
      
      return NextResponse.json({
        error: 'Failed to fetch job',
        details: jobError
      }, { status: 500 })
    }

    if (!jobData) {
      return NextResponse.json({
        error: 'Job not found'
      }, { status: 404 })
    }

    // Check if driver location fields exist by seeing if we can access them
    const hasDriverLocationFields = jobData.hasOwnProperty('driver_lat') && jobData.hasOwnProperty('driver_lng')

    return NextResponse.json({
      success: true,
      jobExists: true,
      jobStatus: jobData.status,
      driverLocationFieldsExist: hasDriverLocationFields,
      currentDriverLocation: hasDriverLocationFields ? {
        latitude: jobData.driver_lat,
        longitude: jobData.driver_lng
      } : null,
      message: hasDriverLocationFields 
        ? 'Driver location tracking is ready to use!' 
        : 'Driver location fields need to be added to the database'
    })
  } catch (error) {
    console.error('Error in test-driver-location:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 