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
    
    // Check the current function definition
    const { data: functionDef, error: functionError } = await supabaseAdmin
      .rpc('pg_get_functiondef', { func_oid: 'handle_new_user()' })
      .select()
    
    // Check if we can manually call the function with a test user
    const testUserId = '22222222-2222-2222-2222-222222222222'
    const { data: manualCall, error: manualError } = await supabaseAdmin
      .rpc('handle_new_user_test', { 
        user_id: testUserId,
        user_email: 'test@example.com',
        user_full_name: 'Test User'
      })
      .select()
    
    // Check the schema of the profiles table
    const { data: tableInfo, error: tableError } = await supabaseAdmin
      .rpc('get_table_info', { table_name: 'profiles' })
      .select()
    
    return NextResponse.json({ 
      success: true,
      debug: {
        functionDefinition: functionDef,
        functionError: functionError?.message,
        manualCall: manualCall,
        manualError: manualError?.message,
        tableInfo: tableInfo,
        tableError: tableError?.message
      }
    })
  } catch (error) {
    return NextResponse.json({ 
      error: 'Debug failed', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 