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
    
    // Test 1: Check if RLS is enabled on profiles table
    const { data: rlsEnabled, error: rlsError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .limit(1)
    
    // Test 2: Try to manually insert a profile (this should work with service role)
    const testUserId = '11111111-1111-1111-1111-111111111111'
    const { data: insertData, error: insertError } = await supabaseAdmin
      .from('profiles')
      .insert([{
        id: testUserId,
        email: 'test-rls@example.com',
        full_name: 'Test RLS User',
        role: 'customer'
      }])
      .select()
    
    // Test 3: Clean up the test data
    if (!insertError) {
      await supabaseAdmin
        .from('profiles')
        .delete()
        .eq('id', testUserId)
    }
    
    // Test 4: Check if the trigger function can be called manually
    const { data: functionTest, error: functionError } = await supabaseAdmin
      .rpc('handle_new_user')
      .select()
    
    return NextResponse.json({ 
      success: true,
      tests: {
        rlsQuery: { 
          success: !rlsError, 
          error: rlsError?.message,
          data: rlsEnabled
        },
        manualInsert: { 
          success: !insertError, 
          error: insertError?.message,
          data: insertData
        },
        functionCall: { 
          success: !functionError, 
          error: functionError?.message,
          data: functionTest
        }
      }
    })
  } catch (error) {
    return NextResponse.json({ 
      error: 'Test failed', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 