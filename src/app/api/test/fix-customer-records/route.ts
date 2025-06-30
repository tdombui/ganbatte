import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST() {
  try {
    console.log('🔧 Fixing customer records...')
    
    // Get all customer profiles that don't have customer records
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, role')
      .eq('role', 'customer')
    
    if (profilesError) {
      console.error('Error fetching profiles:', profilesError)
      return NextResponse.json({ error: 'Failed to fetch profiles' }, { status: 500 })
    }
    
    console.log(`Found ${profiles.length} customer profiles`)
    
    const results = []
    
    for (const profile of profiles) {
      console.log(`Checking customer record for ${profile.email}...`)
      
      // Check if customer record exists
      const { data: existingCustomer, error: checkError } = await supabaseAdmin
        .from('customers')
        .select('id')
        .eq('id', profile.id)
        .single()
      
      if (checkError && checkError.code === 'PGRST116') {
        // Customer record doesn't exist, create it
        console.log(`Creating customer record for ${profile.email}...`)
        
        const { error: insertError } = await supabaseAdmin
          .from('customers')
          .insert({
            id: profile.id,
            billing_address: null,
            preferred_payment_method: null,
            credit_limit: 0,
            is_active: true,
            notes: null
          })
        
        if (insertError) {
          console.error(`Failed to create customer record for ${profile.email}:`, insertError)
          results.push({ email: profile.email, status: 'failed', error: insertError.message })
        } else {
          console.log(`✅ Created customer record for ${profile.email}`)
          results.push({ email: profile.email, status: 'created' })
        }
      } else if (existingCustomer) {
        console.log(`✅ Customer record already exists for ${profile.email}`)
        results.push({ email: profile.email, status: 'exists' })
      } else {
        console.error(`Error checking customer record for ${profile.email}:`, checkError)
        results.push({ email: profile.email, status: 'error', error: checkError?.message })
      }
    }
    
    console.log('🔧 Customer record fix completed!')
    return NextResponse.json({ 
      message: 'Customer records fixed', 
      results,
      total: profiles.length 
    })
  } catch (error) {
    console.error('Error fixing customer records:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 