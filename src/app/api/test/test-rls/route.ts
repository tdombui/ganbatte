import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET() {
  try {
    console.log('🔍 Testing RLS policies...')
    
    // Test 1: Get current user
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    
    console.log('🔍 Current user:', user.id, user.email)
    
    // Test 2: Get profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    
    if (profileError) {
      return NextResponse.json({ 
        error: 'Profile access failed', 
        details: profileError 
      }, { status: 500 })
    }
    
    console.log('🔍 Profile found:', profile.role)
    
    // Test 3: Get customer data
    if (profile.role === 'customer') {
      const { data: customer, error: customerError } = await supabaseAdmin
        .from('customers')
        .select('*')
        .eq('id', user.id)
        .single()
      
      if (customerError) {
        return NextResponse.json({ 
          error: 'Customer data access failed', 
          details: customerError,
          user: user.id,
          profile: profile.id,
          role: profile.role
        }, { status: 500 })
      }
      
      return NextResponse.json({ 
        message: 'All tests passed',
        user: user.id,
        profile: profile.id,
        role: profile.role,
        customer: customer.id
      })
    }
    
    return NextResponse.json({ 
      message: 'Profile test passed',
      user: user.id,
      profile: profile.id,
      role: profile.role
    })
    
  } catch (error) {
    console.error('Error testing RLS:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 