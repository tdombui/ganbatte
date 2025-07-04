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

    // Check if table exists by trying to select from it
    const { data: sampleData, error: tableError } = await supabase
      .from('twilio_customers')
      .select('*')
      .limit(1);
    
    if (tableError) {
      return NextResponse.json({ 
        error: 'Failed to access twilio_customers table', 
        details: tableError,
        tableExists: false
      }, { status: 500 });
    }

    // Check existing records
    const { data: records, error: recordsError } = await supabase
      .from('twilio_customers')
      .select('*')
      .limit(5);

    if (recordsError) {
      return NextResponse.json({ error: 'Failed to get records', details: recordsError }, { status: 500 });
    }

    // Check user profile
    const { data: profile, error: profileError } = await supabase.auth.getUser();

    return NextResponse.json({
      tableExists: true,
      sampleData: sampleData,
      existingRecords: records,
      userProfile: {
        id: profile?.user?.id,
        email: profile?.user?.email,
        phone: profile?.user?.phone,
        user_metadata: profile?.user?.user_metadata
      },
      userProfileError: profileError
    });

  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 