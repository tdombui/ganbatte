import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { phone_number, sms_consent } = await request.json();
    
    console.log('🔍 SMS Opt-in Request:', { phone_number, sms_consent, userId: user.id });

    if (!phone_number || !sms_consent) {
      console.log('❌ Missing required fields:', { phone_number, sms_consent });
      return NextResponse.json({ error: 'Phone number and consent are required' }, { status: 400 });
    }

    // Insert or update the twilio_customers record
    console.log('🔍 Saving to twilio_customers table:', { phone_number, email: user.email });
    
    // First try with just the basic fields to see if the table works
    const { data: twilioData, error: twilioError } = await supabase
      .from('twilio_customers')
      .upsert({
        phone_number: phone_number,
        email: user.email,
        name: user.user_metadata?.full_name || user.email,
        sms_opt_in: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'phone_number'
      });

    if (twilioError) {
      console.error('❌ Error saving SMS opt-in:', twilioError);
      return NextResponse.json({ error: 'Failed to save SMS preferences' }, { status: 500 });
    }
    
    console.log('✅ Saved to twilio_customers:', twilioData);

    // Also update the user's auth profile and customer profile with the phone number
    console.log('🔍 Updating user profile with phone:', phone_number);
    
    // Only update if phone number is not empty
    if (phone_number && phone_number.trim()) {
      try {
        // Update user metadata instead of phone field to avoid SMS verification
        const { data: profileData, error: profileError } = await supabase.auth.updateUser({
          data: { phone_number: phone_number.trim() }
        });

        if (profileError) {
          console.error('❌ Error updating user profile:', profileError);
          // Don't fail the request if profile update fails, but log it
        } else {
          console.log('✅ Updated user profile:', profileData);
        }

        // Update the profiles table with the phone number and SMS opt-in status
        const { data: profileUpdateData, error: profileUpdateError } = await supabase
          .from('profiles')
          .update({ 
            phone: phone_number.trim(),
            sms_opt_in: true
          })
          .eq('id', user.id);

        if (profileUpdateError) {
          console.error('❌ Error updating profile table:', profileUpdateError);
        } else {
          console.log('✅ Updated profile table:', profileUpdateData);
        }

      } catch (error) {
        console.error('❌ Exception updating profiles:', error);
      }
    } else {
      console.log('⚠️ Phone number is empty, skipping profile update');
    }

    return NextResponse.json({ 
      success: true, 
      message: 'SMS preferences saved successfully' 
    });

  } catch (error) {
    console.error('SMS opt-in error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 