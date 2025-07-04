import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🔍 Debug phone sync for user:', user.id)

    // Check profiles table
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('phone, sms_opt_in')
      .eq('id', user.id)
      .single()

    // Check twilio_customers table
    const { data: twilioData, error: twilioError } = await supabase
      .from('twilio_customers')
      .select('phone_number, sms_opt_in')
      .eq('email', user.email)

    // Get user metadata
    const userMetadata = user.user_metadata

    const debugInfo = {
      userId: user.id,
      userEmail: user.email,
      timestamp: new Date().toISOString(),
      
      // User auth metadata
      userMetadata: {
        phone_number: userMetadata?.phone_number || null,
        full_name: userMetadata?.full_name || null
      },
      
      // Profiles table
      profiles: {
        phone: profileData?.phone || null,
        sms_opt_in: profileData?.sms_opt_in || null,
        error: profileError?.message || null
      },
      
      // Twilio customers table
      twilio_customers: {
        phone_number: twilioData?.[0]?.phone_number || null,
        sms_opt_in: twilioData?.[0]?.sms_opt_in || null,
        count: twilioData?.length || 0,
        error: twilioError?.message || null
      },
      
      // Synchronization status
      syncStatus: {
        phoneNumbersMatch: (userMetadata?.phone_number === profileData?.phone) && 
                           (profileData?.phone === twilioData?.[0]?.phone_number),
        smsOptInConsistent: (profileData?.sms_opt_in === twilioData?.[0]?.sms_opt_in),
        hasPhoneInAllTables: !!(userMetadata?.phone_number && profileData?.phone && twilioData?.[0]?.phone_number)
      }
    }

    console.log('🔍 Phone sync debug info:', debugInfo)
    
    return NextResponse.json({
      success: true,
      debug: debugInfo
    })

  } catch (error) {
    console.error('Debug phone sync error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 