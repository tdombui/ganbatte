import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET() {
  try {
    // Test jobs table access
    const { data: jobs, error } = await supabaseAdmin
      .from('jobs')
      .select('*')
      .limit(5)

    if (error) {
      return NextResponse.json({ 
        success: false, 
        error: error.message,
        details: error
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      jobs,
      count: jobs?.length || 0
    })

  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 