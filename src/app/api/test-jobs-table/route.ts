import { NextResponse } from 'next/server'
import { supabase } from '../../../lib/auth'

export async function GET() {
  try {
    // Test basic connection to jobs table
    const { data: jobs, error } = await supabase
      .from('jobs')
      .select('*')
      .limit(5)

    if (error) {
      return NextResponse.json({ 
        error: 'Database error', 
        details: error.message,
        code: error.code
      }, { status: 500 })
    }

    // Test specific job lookup
    const { data: specificJob, error: specificError } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', '0c546da1-4c84-4130-a4cf-ff2256a3dd3f')
      .single()

    return NextResponse.json({
      success: true,
      totalJobs: jobs?.length || 0,
      sampleJobs: jobs?.map(job => ({ id: job.id, status: job.status, created_at: job.created_at })) || [],
      specificJob: specificJob ? { 
        id: specificJob.id, 
        status: specificJob.status, 
        created_at: specificJob.created_at,
        user_id: specificJob.user_id
      } : null,
      specificJobError: specificError ? specificError.message : null,
      message: 'Jobs table access test completed'
    })

  } catch (error) {
    console.error('Test jobs table error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 