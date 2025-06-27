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
    
    // Test 1: Check if we can query the profiles table
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .limit(5)
    
    // Test 2: Check if we can query the customers table
    const { data: customers, error: customersError } = await supabaseAdmin
      .from('customers')
      .select('*')
      .limit(5)
    
    // Test 3: Check if RLS is enabled on profiles table
    const { error: rlsError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .limit(1)
    
    // Test 4: Try to insert a test profile (this should fail if RLS is blocking)
    const testUserId = '00000000-0000-0000-0000-000000000000'
    const { data: insertData, error: insertError } = await supabaseAdmin
      .from('profiles')
      .insert([{
        id: testUserId,
        email: 'test@example.com',
        full_name: 'Test User',
        role: 'customer'
      }])
      .select()
    
    // Test 5: Clean up the test data
    if (!insertError) {
      await supabaseAdmin
        .from('profiles')
        .delete()
        .eq('id', testUserId)
    }
    
    return NextResponse.json({ 
      success: true,
      tests: {
        profilesQuery: { 
          success: !profilesError, 
          error: profilesError?.message, 
          count: profiles?.length || 0 
        },
        customersQuery: { 
          success: !customersError, 
          error: customersError?.message, 
          count: customers?.length || 0 
        },
        rlsTest: { 
          success: !rlsError, 
          error: rlsError?.message 
        },
        insertTest: { 
          success: !insertError, 
          error: insertError?.message,
          data: insertData
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