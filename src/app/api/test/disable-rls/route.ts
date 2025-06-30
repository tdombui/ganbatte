import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST() {
  try {
    console.log('🔧 Temporarily disabling RLS for testing...')
    
    // Disable RLS on customers table
    const { error: customersError } = await supabaseAdmin
      .rpc('exec_sql', { sql: 'ALTER TABLE customers DISABLE ROW LEVEL SECURITY;' })
    
    if (customersError) {
      console.error('Error disabling RLS on customers:', customersError)
    } else {
      console.log('✅ RLS disabled on customers table')
    }
    
    // Disable RLS on staff table
    const { error: staffError } = await supabaseAdmin
      .rpc('exec_sql', { sql: 'ALTER TABLE staff DISABLE ROW LEVEL SECURITY;' })
    
    if (staffError) {
      console.error('Error disabling RLS on staff:', staffError)
    } else {
      console.log('✅ RLS disabled on staff table')
    }
    
    return NextResponse.json({ 
      message: 'RLS temporarily disabled for testing',
      customers: !customersError,
      staff: !staffError
    })
  } catch (error) {
    console.error('Error disabling RLS:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 