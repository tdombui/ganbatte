import { createClient } from '@supabase/supabase-js'

// Test script to debug webhook issues
async function testWebhook() {
  console.log('🔍 Testing webhook functionality...')
  
  // Test environment variables
  console.log('\n📋 Environment Check:')
  console.log('STRIPE_SECRET_TEST_KEY:', process.env.STRIPE_SECRET_TEST_KEY ? 'SET' : 'NOT SET')
  console.log('STRIPE_PAYMENT_LINKS_WEBHOOK_SECRET:', process.env.STRIPE_PAYMENT_LINKS_WEBHOOK_SECRET ? 'SET' : 'NOT SET')
  
  // Test Supabase connection
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase environment variables')
    return
  }
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  
  try {
    // Test database connection
    console.log('\n🔗 Testing Supabase connection...')
    const { data, error } = await supabase
      .from('jobs')
      .select('id, payment_status, stripe_payment_link_id')
      .limit(1)
    
    if (error) {
      console.error('❌ Supabase connection failed:', error)
      return
    }
    
    console.log('✅ Supabase connection successful')
    console.log('Sample job data:', data)
    
    // Test webhook endpoint
    console.log('\n🌐 Testing webhook endpoint...')
    const response = await fetch('http://localhost:3000/api/test/webhook-test', {
      method: 'GET'
    })
    
    if (response.ok) {
      const result = await response.json()
      console.log('✅ Webhook endpoint accessible:', result)
    } else {
      console.error('❌ Webhook endpoint not accessible')
    }
    
    // Test debug endpoint
    console.log('\n🔧 Testing debug endpoint...')
    const debugResponse = await fetch('http://localhost:3000/api/test/debug-webhook', {
      method: 'GET'
    })
    
    if (debugResponse.ok) {
      const debugResult = await debugResponse.json()
      console.log('✅ Debug endpoint accessible:', debugResult)
    } else {
      console.error('❌ Debug endpoint not accessible')
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

// Run the test
testWebhook().catch(console.error) 