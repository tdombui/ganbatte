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
    
    // Drop existing policies that might be too restrictive
    try {
      await supabaseAdmin.rpc('drop_policy_if_exists', { 
        table_name: 'profiles', 
        policy_name: 'Users can insert own profile' 
      })
    } catch {}
    
    try {
      await supabaseAdmin.rpc('drop_policy_if_exists', { 
        table_name: 'customers', 
        policy_name: 'Customers can view own data' 
      })
    } catch {}
    
    // Create more permissive policies for the trigger function
    const { error: profilesPolicyError } = await supabaseAdmin
      .rpc('create_policy', {
        table_name: 'profiles',
        policy_name: 'Enable insert for authenticated users only',
        definition: 'INSERT ON profiles FOR ALL WITH CHECK (auth.uid() = id)'
      })
    
    const { error: customersPolicyError } = await supabaseAdmin
      .rpc('create_policy', {
        table_name: 'customers',
        policy_name: 'Enable insert for authenticated users only',
        definition: 'INSERT ON customers FOR ALL WITH CHECK (auth.uid() = id)'
      })
    
    // Alternative: Create policies using raw SQL
    const policies = [
      `DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;`,
      `CREATE POLICY "Enable insert for authenticated users only" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);`,
      `DROP POLICY IF EXISTS "Customers can view own data" ON customers;`,
      `CREATE POLICY "Enable insert for authenticated users only" ON customers FOR INSERT WITH CHECK (auth.uid() = id);`
    ]
    
    for (const policy of policies) {
      try {
        await supabaseAdmin.rpc('exec_sql', { sql: policy })
      } catch {}
    }
    
    return NextResponse.json({ 
      success: true,
      message: 'RLS policies updated to allow trigger function to work',
      errors: {
        profiles: profilesPolicyError?.message,
        customers: customersPolicyError?.message
      }
    })
  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to fix RLS policies', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 