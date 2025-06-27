import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export async function GET() {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ 
        error: 'Missing environment variables',
        url: supabaseUrl,
        hasServiceKey: !!supabaseServiceKey
      }, { status: 500 })
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
    
    // Test if tables exist
    const { error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('count')
      .limit(1)
    
    const { error: customersError } = await supabaseAdmin
      .from('customers')
      .select('count')
      .limit(1)
    
    const { error: jobsError } = await supabaseAdmin
      .from('jobs')
      .select('count')
      .limit(1)
    
    return NextResponse.json({ 
      success: true,
      tables: {
        profiles: { exists: !profilesError, error: profilesError?.message },
        customers: { exists: !customersError, error: customersError?.message },
        jobs: { exists: !jobsError, error: jobsError?.message }
      }
    })
  } catch (error) {
    return NextResponse.json({ 
      error: 'Test failed', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 