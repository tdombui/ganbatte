const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables from .env.local
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local')
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8')
    const envVars = {}
    
    envContent.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=')
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim()
        if (!value.startsWith('#')) {
          envVars[key.trim()] = value.replace(/^["']|["']$/g, '')
        }
      }
    })
    
    return envVars
  }
  return {}
}

const env = loadEnv()
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables')
  console.error('Please ensure you have:')
  console.error('- NEXT_PUBLIC_SUPABASE_URL')
  console.error('- SUPABASE_SERVICE_ROLE_KEY')
  console.error('\nThese should be in your .env.local file')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function fixSmsJobs() {
  try {
    console.log('🔧 Fixing SMS jobs by linking to existing users...');
    
    // Get all SMS jobs that don't have user_id set
    const { data: smsJobs, error: jobsError } = await supabase
      .from('jobs')
      .select('*')
      .eq('created_via', 'sms')
      .is('user_id', null);
    
    if (jobsError) {
      console.error('❌ Error fetching SMS jobs:', jobsError);
      return;
    }
    
    console.log(`📱 Found ${smsJobs.length} SMS jobs without user_id`);
    
    let linkedCount = 0;
    let skippedCount = 0;
    
    for (const job of smsJobs) {
      console.log(`\n🔍 Processing job ${job.id}:`);
      console.log(`   Pickup: ${job.pickup}`);
      console.log(`   Dropoff: ${job.dropoff}`);
      console.log(`   Created: ${job.created_at}`);
      
      // Find the twilio_customer for this job by looking at recent SMS jobs
      // We'll need to find the phone number that created this job
      // Since we don't have direct phone tracking, we'll look for patterns
      
      // For now, let's check if there are any twilio_customers with matching email patterns
      // This is a simplified approach - in production you'd want more sophisticated matching
      
      // Get all twilio_customers
      const { data: twilioCustomers, error: twilioError } = await supabase
        .from('twilio_customers')
        .select('*');
      
      if (twilioError) {
        console.error('❌ Error fetching twilio_customers:', twilioError);
        continue;
      }
      
      let linked = false;
      
      // Try to find a matching user by checking each twilio_customer
      for (const twilioCustomer of twilioCustomers) {
        if (twilioCustomer.email) {
          // Check if there's a profile with this email
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('id, role')
            .eq('email', twilioCustomer.email)
            .single();
          
          if (!profileError && profile) {
            console.log(`   🔗 Found matching user: ${profile.id} (${profile.role}) for email: ${twilioCustomer.email}`);
            
            // Update the job to link to this user
            const { error: updateError } = await supabase
              .from('jobs')
              .update({
                user_id: profile.id,
                customer_id: profile.role === 'customer' ? profile.id : null
              })
              .eq('id', job.id);
            
            if (updateError) {
              console.error(`   ❌ Error updating job ${job.id}:`, updateError);
            } else {
              console.log(`   ✅ Linked job ${job.id} to user ${profile.id}`);
              linked = true;
              linkedCount++;
              break;
            }
          }
        }
        
        // Also try to match by phone number if we have it
        if (twilioCustomer.phone_number) {
          const { data: profileByPhone, error: phoneError } = await supabase
            .from('profiles')
            .select('id, role')
            .eq('phone', twilioCustomer.phone_number)
            .single();
          
          if (!phoneError && profileByPhone) {
            console.log(`   🔗 Found matching user by phone: ${profileByPhone.id} (${profileByPhone.role}) for phone: ${twilioCustomer.phone_number}`);
            
            // Update the job to link to this user
            const { error: updateError } = await supabase
              .from('jobs')
              .update({
                user_id: profileByPhone.id,
                customer_id: profileByPhone.role === 'customer' ? profileByPhone.id : null
              })
              .eq('id', job.id);
            
            if (updateError) {
              console.error(`   ❌ Error updating job ${job.id}:`, updateError);
            } else {
              console.log(`   ✅ Linked job ${job.id} to user ${profileByPhone.id}`);
              linked = true;
              linkedCount++;
              break;
            }
          }
        }
      }
      
      if (!linked) {
        console.log(`   ⚠️  No matching user found for job ${job.id}`);
        skippedCount++;
      }
    }
    
    console.log(`\n✅ SMS job fix completed!`);
    console.log(`   📊 Linked: ${linkedCount} jobs`);
    console.log(`   📊 Skipped: ${skippedCount} jobs`);
    console.log(`   📊 Total processed: ${smsJobs.length} jobs`);
    
  } catch (error) {
    console.error('🔥 Error in fixSmsJobs:', error);
  }
}

fixSmsJobs(); 