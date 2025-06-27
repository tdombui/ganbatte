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
    
    // Test if the trigger function exists
    const { error: functionsError } = await supabaseAdmin
      .rpc('handle_new_user')
      .select()
    
    // Test if tables exist and have the right structure
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .limit(1)
    
    const { data: customers, error: customersError } = await supabaseAdmin
      .from('customers')
      .select('*')
      .limit(1)
    
    // Check if RLS is enabled
    const { data: rlsInfo, error: rlsError } = await supabaseAdmin
      .rpc('get_rls_info')
      .select()
    
    return NextResponse.json({ 
      success: true,
      tables: {
        profiles: { exists: !profilesError, error: profilesError?.message, count: profiles?.length || 0 },
        customers: { exists: !customersError, error: customersError?.message, count: customers?.length || 0 }
      },
      trigger: {
        exists: !functionsError,
        error: functionsError?.message
      },
      rls: {
        info: rlsInfo,
        error: rlsError?.message
      }
    })
  } catch (error) {
    return NextResponse.json({ 
      error: 'Test failed', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 