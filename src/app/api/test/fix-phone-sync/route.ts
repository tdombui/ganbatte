import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🔍 Fixing phone sync for user:', user.id)

    // Get phone number from twilio_customers
    const { data: twilioData, error: twilioError } = await supabase
      .from('twilio_customers')
      .select('phone_number, sms_opt_in')
      .eq('email', user.email)
      .single()

    if (twilioError || !twilioData) {
      return NextResponse.json({ 
        error: 'No twilio_customers record found',
        details: twilioError?.message 
      }, { status: 404 })
    }

    console.log('🔍 Found twilio_customers data:', twilioData)

    // Update profiles table with phone number from twilio_customers
    const { data: profileUpdateData, error: profileUpdateError } = await supabase
      .from('profiles')
      .update({ 
        phone: twilioData.phone_number,
        sms_opt_in: twilioData.sms_opt_in
      })
      .eq('id', user.id)
      .select()

    if (profileUpdateError) {
      console.error('❌ Error updating profiles table:', profileUpdateError)
      return NextResponse.json({ 
        error: 'Failed to update profiles table',
        details: profileUpdateError.message 
      }, { status: 500 })
    }

    console.log('✅ Updated profiles table:', profileUpdateData)

    // Also ensure user metadata is updated
    const { error: userUpdateError } = await supabase.auth.updateUser({
      data: { phone_number: twilioData.phone_number }
    })

    if (userUpdateError) {
      console.error('❌ Error updating user metadata:', userUpdateError)
    } else {
      console.log('✅ Updated user metadata')
    }

    return NextResponse.json({
      success: true,
      message: 'Phone number synchronized successfully',
      data: {
        phone_number: twilioData.phone_number,
        sms_opt_in: twilioData.sms_opt_in,
        profiles_updated: profileUpdateData
      }
    })

  } catch (error) {
    console.error('Fix phone sync error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 