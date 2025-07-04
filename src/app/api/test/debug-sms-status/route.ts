import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const debugInfo: Record<string, unknown> = {
      userId: user.id,
      userPhone: user.phone,
      userMetadata: user.user_metadata,
      timestamp: new Date().toISOString()
    };

    // Try to query profiles table
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('phone, sms_opt_in')
        .eq('id', user.id)
        .single();

      debugInfo.profileData = profileData;
      debugInfo.profileError = profileError;
    } catch (error) {
      debugInfo.profileError = error;
    }

    // Try to query twilio_customers table
    try {
      const { data: twilioData, error: twilioError } = await supabase
        .from('twilio_customers')
        .select('phone_number, sms_opt_in, user_id')
        .eq('user_id', user.id)
        .maybeSingle();

      debugInfo.twilioData = twilioData;
      debugInfo.twilioError = twilioError;
    } catch (error) {
      debugInfo.twilioError = error;
    }

    return NextResponse.json(debugInfo);

  } catch (error) {
    console.error('Debug SMS status error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 