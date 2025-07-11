import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixCustomerRecords() {
  try {
    console.log('🔧 Starting customer record fix...');

    // Get all profiles with phone numbers
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, phone, email, full_name, sms_opt_in')
      .not('phone', 'is', null);

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      return;
    }

    console.log(`📱 Found ${profiles.length} profiles with phone numbers`);

    for (const profile of profiles) {
      console.log(`\n🔍 Processing profile: ${profile.full_name} (${profile.phone})`);

      // Check if there's a matching twilio_customer record
      const { data: twilioCustomer, error: twilioError } = await supabase
        .from('twilio_customers')
        .select('*')
        .eq('phone_number', profile.phone)
        .single();

      if (twilioError && twilioError.code !== 'PGRST116') {
        console.error(`Error fetching twilio_customer for ${profile.phone}:`, twilioError);
        continue;
      }

      if (twilioCustomer) {
        console.log(`✅ Found matching twilio_customer: ${twilioCustomer.id}`);
        
        // Update twilio_customer with profile data and sync consent
        const updateData = {
          name: profile.full_name || twilioCustomer.name,
          email: profile.email || twilioCustomer.email,
          sms_consent: profile.sms_opt_in || twilioCustomer.sms_consent
        };

        const { error: updateError } = await supabase
          .from('twilio_customers')
          .update(updateData)
          .eq('id', twilioCustomer.id);

        if (updateError) {
          console.error(`Error updating twilio_customer ${twilioCustomer.id}:`, updateError);
        } else {
          console.log(`✅ Updated twilio_customer ${twilioCustomer.id} with profile data`);
        }

        // Also update the profile with twilio_customer data if needed
        if (profile.sms_opt_in && !twilioCustomer.sms_consent) {
          const { error: profileUpdateError } = await supabase
            .from('profiles')
            .update({ sms_opt_in: true })
            .eq('id', profile.id);

          if (profileUpdateError) {
            console.error(`Error updating profile ${profile.id}:`, profileUpdateError);
          } else {
            console.log(`✅ Updated profile ${profile.id} SMS consent`);
          }
        }

      } else {
        console.log(`❌ No matching twilio_customer found for ${profile.phone}`);
        
        // Create a new twilio_customer record for this profile
        const { data: newTwilioCustomer, error: createError } = await supabase
          .from('twilio_customers')
          .insert({
            phone_number: profile.phone,
            name: profile.full_name || `Customer ${profile.phone.slice(-4)}`,
            email: profile.email,
            sms_consent: profile.sms_opt_in || false
          })
          .select()
          .single();

        if (createError) {
          console.error(`Error creating twilio_customer for ${profile.phone}:`, createError);
        } else {
          console.log(`✅ Created new twilio_customer: ${newTwilioCustomer.id}`);
        }
      }
    }

    // Now check for twilio_customers without matching profiles
    const { data: twilioCustomers, error: twilioCustomersError } = await supabase
      .from('twilio_customers')
      .select('*');

    if (twilioCustomersError) {
      console.error('Error fetching twilio_customers:', twilioCustomersError);
      return;
    }

    console.log(`\n📱 Found ${twilioCustomers.length} twilio_customers`);

    for (const twilioCustomer of twilioCustomers) {
      const { data: matchingProfile } = await supabase
        .from('profiles')
        .select('id, sms_opt_in')
        .eq('phone', twilioCustomer.phone_number)
        .single();

      if (!matchingProfile) {
        console.log(`⚠️  Twilio customer ${twilioCustomer.id} (${twilioCustomer.phone_number}) has no matching profile`);
      }
    }

    console.log('\n✅ Customer record fix completed!');

  } catch (error) {
    console.error('🔥 Error in fixCustomerRecords:', error);
  }
}

// Run the fix
fixCustomerRecords(); 