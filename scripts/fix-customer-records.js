import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function fixCustomerRecords() {
  try {
    console.log('🔧 Fixing customer records...')
    
    // Get all customer profiles that don't have customer records
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, role')
      .eq('role', 'customer')
    
    if (profilesError) {
      console.error('Error fetching profiles:', profilesError)
      return
    }
    
    console.log(`Found ${profiles.length} customer profiles`)
    
    for (const profile of profiles) {
      console.log(`Checking customer record for ${profile.email}...`)
      
      // Check if customer record exists
      const { data: existingCustomer, error: checkError } = await supabase
        .from('customers')
        .select('id')
        .eq('id', profile.id)
        .single()
      
      if (checkError && checkError.code === 'PGRST116') {
        // Customer record doesn't exist, create it
        console.log(`Creating customer record for ${profile.email}...`)
        
        const { error: insertError } = await supabase
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
        } else {
          console.log(`✅ Created customer record for ${profile.email}`)
        }
      } else if (existingCustomer) {
        console.log(`✅ Customer record already exists for ${profile.email}`)
      } else {
        console.error(`Error checking customer record for ${profile.email}:`, checkError)
      }
    }
    
    console.log('🔧 Customer record fix completed!')
  } catch (error) {
    console.error('Error fixing customer records:', error)
  }
}

fixCustomerRecords() 