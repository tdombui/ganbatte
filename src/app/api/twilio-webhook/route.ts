import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { OpenAI } from 'openai';

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 SMS webhook started');
    
    // Get the request body
    const body = await request.text();
    console.log('📝 Request body received:', body.substring(0, 200) + '...');
    
    const formData = new URLSearchParams(body);
    
    const from = formData.get('From') || '';
    const messageBody = formData.get('Body') || '';
    const phoneNumber = from.replace('+', '');
    
    console.log(`📱 SMS received from ${from}: ${messageBody}`);
    console.log(`📞 Phone number: ${phoneNumber}`);
    
    // Check environment variables
    console.log('🔍 Checking environment variables...');
    console.log('OPENAI_API_KEY exists:', !!process.env.OPENAI_API_KEY);
    console.log('SUPABASE_URL exists:', !!process.env.SUPABASE_URL);
    console.log('SUPABASE_SERVICE_ROLE_KEY exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
    
    // Initialize OpenAI early
    if (!process.env.OPENAI_API_KEY) {
      console.error('❌ OPENAI_API_KEY is not set');
      const errorResponse = "I'm having trouble processing your request. Please try again.";
      
      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Message>${errorResponse}</Message>
</Response>`;

      return new NextResponse(twiml, {
        status: 200,
        headers: { 'Content-Type': 'text/xml' },
      });
    }
    
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    // Test database operations
    console.log(`🔍 Testing database operations for phone: ${phoneNumber}`);
    
    // Find or create customer
    const customerResult = await supabaseAdmin
      .from('twilio_customers')
      .select('*')
      .eq('phone_number', phoneNumber)
      .single();
    
    let customer = customerResult.data;
    const customerError = customerResult.error;
    
    if (customerError && customerError.code === 'PGRST116') {
      // Customer doesn't exist, create one
      console.log(`🔍 Creating new twilio_customer for phone: ${phoneNumber}`);
      
      const { data: newCustomer, error: createError } = await supabaseAdmin
        .from('twilio_customers')
        .insert({
          phone_number: phoneNumber,
          name: 'SMS Customer',
          sms_opt_in: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_active: true,
          last_interaction: new Date().toISOString()
        })
        .select()
        .single();
      
      if (createError) {
        console.error('❌ Error creating customer:', createError);
        console.error('❌ Error details:', {
          message: createError.message,
          details: createError.details,
          hint: createError.hint,
          code: createError.code
        });
        return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 });
      }
      
      customer = newCustomer;
      console.log(`✅ Created new customer: ${customer.id}`);
    } else if (customerError) {
      console.error('❌ Error finding customer:', customerError);
      return NextResponse.json({ error: 'Failed to find customer' }, { status: 500 });
    } else {
      console.log(`✅ Found existing customer: ${customer.id}`);
    }
    
    // Try to find or create a main customer record for this SMS user
    console.log('🔍 Looking for main customer record...');
    let mainCustomerId = null;
    
    // First, try to find an existing customer by phone number
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('phone', phoneNumber)
      .single();
    
    if (existingProfile) {
      console.log(`✅ Found existing profile with phone: ${existingProfile.id}`);
      mainCustomerId = existingProfile.id;
    } else {
      console.log('🔍 No existing profile found, creating SMS customer without main customer record');
      // For SMS customers, we'll use null for customer_id and user_id
      mainCustomerId = null;
    }
    
    // Handle consent flow
    if (!customer.sms_opt_in) {
      if (messageBody.toLowerCase().trim() === 'yes') {
        // Opt in
        await supabaseAdmin
          .from('twilio_customers')
          .update({ sms_opt_in: true })
          .eq('id', customer.id);
        
                 const welcomeMessage = `Welcome to Zukujet! You're now opted in for delivery services. Send me pickup and dropoff addresses to create a delivery job.`;
        
        const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Message>${welcomeMessage}</Message>
</Response>`;
        
        return new NextResponse(twiml, {
          status: 200,
          headers: { 'Content-Type': 'text/xml' },
        });
      } else {
        // Ask for consent
                 const consentMessage = `Welcome to Zukujet! Reply YES to receive delivery help via SMS. Reply STOP to opt out.`;
        
        const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Message>${consentMessage}</Message>
</Response>`;
        
        return new NextResponse(twiml, {
          status: 200,
          headers: { 'Content-Type': 'text/xml' },
        });
      }
    }
    
    // Handle STOP command for opted-in customers
    if (messageBody.toLowerCase().trim() === 'stop') {
      await supabaseAdmin
        .from('twilio_customers')
        .update({ sms_opt_in: false })
        .eq('id', customer.id);
      
      const stopResponse = `You've been opted out. You won't receive any more messages from us.`;
      
      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Message>${stopResponse}</Message>
</Response>`;
      
      return new NextResponse(twiml, {
        status: 200,
        headers: { 'Content-Type': 'text/xml' },
      });
    }
    
    // Check for job status updates (e.g., "status job123")
    const statusUpdateMatch = messageBody.toLowerCase().match(/^status\s+(\w+)$/);
    if (statusUpdateMatch) {
      const jobId = statusUpdateMatch[1];
      console.log(`🔍 Checking status for job: ${jobId}`);
      
      const { data: job, error: jobError } = await supabaseAdmin
        .from('jobs')
        .select('*')
        .eq('id', jobId)
        .single();
      
      if (jobError || !job) {
        const errorResponse = `Job ${jobId} not found. Please check your job ID and try again.`;
        const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Message>${errorResponse}</Message>
</Response>`;
        return new NextResponse(twiml, {
          status: 200,
          headers: { 'Content-Type': 'text/xml' },
        });
      }
      
      const statusResponse = `Job ${jobId.slice(-6)} Status: ${job.status}\nPickup: ${job.pickup}\nDropoff: ${job.dropoff}\nCreated: ${new Date(job.created_at).toLocaleDateString()}`;
      
      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Message>${statusResponse}</Message>
</Response>`;
      
      return new NextResponse(twiml, {
        status: 200,
        headers: { 'Content-Type': 'text/xml' },
      });
    }
    
    // Check for partial job completion
    console.log('🔍 Checking for partial job completion...');
    const { data: partialJobs, error: partialJobsError } = await supabaseAdmin
      .from('jobs')
      .select('*')
      .eq('status', 'pending_address')
      .eq('created_via', 'sms')
      .order('created_at', { ascending: false })
      .limit(1);
    
    console.log('🔍 Partial jobs found:', partialJobs?.length || 0);
    if (partialJobs && partialJobs.length > 0) {
      console.log('🔍 Latest partial job:', partialJobs[0].id);
    }
    
    // Check if this is a default address confirmation (even if no partial jobs found)
    if (messageBody.toLowerCase().trim() === 'yes' || messageBody.toLowerCase().trim() === 'y') {
      console.log('🔍 Processing default address confirmation...');
      
      // Find the most recent completed job for this customer
      const { data: recentJobs, error: recentJobsError } = await supabaseAdmin
        .from('jobs')
        .select('*')
        .eq('created_via', 'sms')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (!recentJobsError && recentJobs && recentJobs.length > 0) {
        const recentJob = recentJobs[0];
        console.log(`🔍 Found recent completed job: ${recentJob.id}`);
        
        // Save the dropoff address as default (since that was the vague one)
        if (recentJob.dropoff) {
          await supabaseAdmin
            .from('twilio_customers')
            .update({ 
              default_address: recentJob.dropoff,
              updated_at: new Date().toISOString()
            })
            .eq('id', customer.id);
          
          console.log(`✅ Saved dropoff address as default: ${recentJob.dropoff}`);
        }
        
        const confirmationMessage = `✅ Default address saved! ${recentJob.dropoff}\n\nView job: https://ganbatte-liart.vercel.app/job/${recentJob.id}`;
        
        const twiml = `<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<Response>\n    <Message>${confirmationMessage}</Message>\n</Response>`;
        
        return new NextResponse(twiml, {
          status: 200,
          headers: { 'Content-Type': 'text/xml' },
        });
      } else {
        console.log('🔍 No recent completed jobs found for default address save');
      }
    }
    
    if (!partialJobsError && partialJobs && partialJobs.length > 0) {
      const partialJob = partialJobs[0];
      console.log(`🔍 Found partial job: ${partialJob.id}`);
      
      // Check if this is a default address confirmation
      if (messageBody.toLowerCase().trim() === 'yes' || messageBody.toLowerCase().trim() === 'y') {
        // Save as default address
        console.log('🔍 Saving address as default...');
        
        // Determine which address to save as default
        const addressToSave = partialJob.needs_pickup_address ? partialJob.pickup : partialJob.dropoff;
        const addressType = partialJob.needs_pickup_address ? 'pickup' : 'dropoff';
        
        if (addressToSave) {
          await supabaseAdmin
            .from('twilio_customers')
            .update({ 
              default_address: addressToSave,
              updated_at: new Date().toISOString()
            })
            .eq('id', customer.id);
          
          console.log(`✅ Saved ${addressType} address as default: ${addressToSave}`);
        }
        
        // Continue with job completion
        const { data: completedJob, error: completeError } = await supabaseAdmin
          .from('jobs')
          .update({
            status: 'pending',
            needs_pickup_address: false,
            needs_dropoff_address: false,
            updated_at: new Date().toISOString()
          })
          .eq('id', partialJob.id)
          .select()
          .single();
        
        if (completeError) {
          console.error('❌ Error completing job:', completeError);
          const errorResponse = "I'm having trouble completing your job. Please try again.";
          const twiml = `<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<Response>\n    <Message>${errorResponse}</Message>\n</Response>`;
          return new NextResponse(twiml, {
            status: 200,
            headers: { 'Content-Type': 'text/xml' },
          });
        }
        
        const confirmationMessage = `✅ Job created successfully!\n\nJob ID: ${completedJob.id.slice(0, 8)}\nPickup: ${completedJob.pickup}\nDropoff: ${completedJob.dropoff}\nStatus: ${completedJob.status}\n\nView job: https://ganbatte-liart.vercel.app/job/${completedJob.id}`;
        
        const twiml = `<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<Response>\n    <Message>${confirmationMessage}</Message>\n</Response>`;
        
        return new NextResponse(twiml, {
          status: 200,
          headers: { 'Content-Type': 'text/xml' },
        });
      }
      
      // Parse the new message to get missing addresses
      const newPrompt = `
You're an assistant for a parts delivery service called Ganbatte. When a customer sends a message, your job is to extract these fields and return them as JSON only — no backticks, no markdown, no explanations.

Message: ${messageBody}

CONTEXT: This is a follow-up message to complete a delivery job. The customer may be providing additional addresses or clarifying previous information.

EXTRACTION GUIDELINES:
- parts: Extract any items, parts, or things being delivered (e.g., "wheels", "engine parts", "documents", "michelin")
- pickup: Extract the pickup address or location (can be coordinates like "40.7128, -74.0060" or street addresses)
- dropoff: Extract the delivery address or location (can be coordinates like "40.7128, -74.0060" or street addresses)
- deadline: Extract ANY time reference, including natural language like "next tuesday", "tomorrow", "by 5pm", "asap", "urgent", etc. Keep the original text as-is.

IMPORTANT: If the message only contains one address, extract it appropriately. If it's clearly a pickup address, put it in pickup. If it's clearly a dropoff address, put it in dropoff.

Return a JSON object with:
{
  "parts": [],
  "pickup": "",
  "dropoff": "",
  "deadline": ""
}
`;

      let completion;
      try {
        completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: newPrompt }],
          temperature: 0.2,
          max_tokens: 300,
        });
        console.log('🔍 SMS ParseJob: OpenAI response received for partial job');
      } catch (openaiError: unknown) {
        console.error('❌ OpenAI API error:', openaiError);
        console.error('❌ OpenAI error message:', openaiError instanceof Error ? openaiError.message : 'Unknown error');
        const errorResponse = "Sorry, I'm having trouble processing your request (AI error). Please try again later.";
        const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Message>${errorResponse}</Message>
</Response>`;
        return new NextResponse(twiml, {
          status: 200,
          headers: { 'Content-Type': 'text/xml' },
        });
      }

      const content = completion.choices[0].message.content || '';
      const cleanJson = content
        .replace(/^```json\s*/, '')
        .replace(/^```\s*/, '')
        .replace(/\s*```$/, '')
        .trim();

      console.log('✅ Cleaned AI output for partial job:', cleanJson);
      
      let parsed;
      try {
        parsed = JSON.parse(cleanJson);
        console.log('✅ Successfully parsed JSON for partial job:', parsed);
      } catch (error) {
        console.error('❌ Failed to parse AI response as JSON:', error);
        const errorResponse = "I'm having trouble understanding your request. Could you please provide the complete address clearly?";
        const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Message>${errorResponse}</Message>
</Response>`;
        return new NextResponse(twiml, {
          status: 200,
          headers: { 'Content-Type': 'text/xml' },
        });
      }
      
      // Update the partial job with the new address information
      let updatedPickup = partialJob.pickup;
      let updatedDropoff = partialJob.dropoff;
      let needsPickupAddress = partialJob.needs_pickup_address;
      let needsDropoffAddress = partialJob.needs_dropoff_address;
      
      console.log('🔍 Partial job current state:', {
        existingPickup: updatedPickup,
        existingDropoff: updatedDropoff,
        needsPickup: needsPickupAddress,
        needsDropoff: needsDropoffAddress,
        newParsedPickup: parsed.pickup,
        newParsedDropoff: parsed.dropoff
      });
      
      // Always use the previous address if the new message is empty
      if (needsPickupAddress) {
        if (parsed.pickup && parsed.pickup.trim() !== '') {
          updatedPickup = parsed.pickup;
          needsPickupAddress = false;
          console.log('✅ Updated pickup address:', updatedPickup);
        } else {
          updatedPickup = partialJob.pickup;
          console.log('✅ Keeping existing pickup address:', updatedPickup);
        }
      }
      
      if (needsDropoffAddress) {
        if (parsed.dropoff && parsed.dropoff.trim() !== '') {
          updatedDropoff = parsed.dropoff;
          needsDropoffAddress = false;
          console.log('✅ Updated dropoff address:', updatedDropoff);
        } else {
          updatedDropoff = partialJob.dropoff;
          console.log('✅ Keeping existing dropoff address:', updatedDropoff);
        }
      }
      
      // Check if we have all required addresses
      if (!needsPickupAddress && !needsDropoffAddress && updatedPickup && updatedDropoff) {
        // Complete the job
        console.log('✅ Completing partial job with all addresses');
        
        const { data: completedJob, error: completeError } = await supabaseAdmin
          .from('jobs')
          .update({
            pickup: updatedPickup,
            dropoff: updatedDropoff,
            status: 'pending',
            needs_pickup_address: false,
            needs_dropoff_address: false,
            updated_at: new Date().toISOString()
          })
          .eq('id', partialJob.id)
          .select()
          .single();
        
        if (completeError) {
          console.error('❌ Error completing job:', completeError);
          const errorResponse = "I'm having trouble completing your job. Please try again.";
          const twiml = `<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<Response>\n    <Message>${errorResponse}</Message>\n</Response>`;
          return new NextResponse(twiml, {
            status: 200,
            headers: { 'Content-Type': 'text/xml' },
          });
        }
        
        // Ask if they want to save the clarified address as default (if it was previously vague)
        let saveDefaultPrompt = '';
        if (partialJob.needs_pickup_address && updatedPickup) {
          saveDefaultPrompt = `\n\nWould you like to save \"${updatedPickup}\" as your default pickup address? Reply YES/Y to save.`;
        } else if (partialJob.needs_dropoff_address && updatedDropoff) {
          saveDefaultPrompt = `\n\nWould you like to save \"${updatedDropoff}\" as your default dropoff address? Reply YES/Y to save.`;
        }
        
        const confirmationMessage = `✅ Job created successfully!\n\nJob ID: ${completedJob.id.slice(0, 8)}\nPickup: ${completedJob.pickup}\nDropoff: ${completedJob.dropoff}\nStatus: ${completedJob.status}${saveDefaultPrompt}\n\nView job: https://ganbatte-liart.vercel.app/job/${completedJob.id}`;
        
        const twiml = `<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<Response>\n    <Message>${confirmationMessage}</Message>\n</Response>`;
        
        return new NextResponse(twiml, {
          status: 200,
          headers: { 'Content-Type': 'text/xml' },
        });
      } else {
        // Update the partial job but still need more addresses
        const { error: updateError } = await supabaseAdmin
          .from('jobs')
          .update({
            pickup: updatedPickup,
            dropoff: updatedDropoff,
            needs_pickup_address: needsPickupAddress,
            needs_dropoff_address: needsDropoffAddress,
            updated_at: new Date().toISOString()
          })
          .eq('id', partialJob.id);
        
        if (updateError) {
          console.error('❌ Error updating partial job:', updateError);
        }
        
        let clarificationMessage = "I still need more specific addresses. ";
        
        if (needsPickupAddress && needsDropoffAddress) {
          clarificationMessage += "Please provide both pickup and dropoff addresses.";
        } else if (needsPickupAddress) {
          clarificationMessage += `Please provide the pickup address. (Dropoff: ${updatedDropoff})`;
        } else {
          clarificationMessage += `Please provide the dropoff address. (Pickup: ${updatedPickup})`;
        }
        
        clarificationMessage += `\n\nJob ID: ${partialJob.id.slice(0, 8)}`;
        
        const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Message>${clarificationMessage}</Message>
</Response>`;
        
        return new NextResponse(twiml, {
          status: 200,
          headers: { 'Content-Type': 'text/xml' },
        });
      }
    }
    
    // Update last interaction
    await supabaseAdmin
      .from('twilio_customers')
      .update({ last_interaction: new Date().toISOString() })
      .eq('id', customer.id);
    
    // Test OpenAI parsing
    console.log('🔍 Testing OpenAI parsing...');
    
    const prompt = `
You're an assistant for a parts delivery service called Ganbatte. When a customer sends a message, your job is to extract these fields and return them as JSON only — no backticks, no markdown, no explanations.

Message: ${messageBody}

EXTRACTION GUIDELINES:
- parts: Extract any items, parts, or things being delivered (e.g., "wheels", "engine parts", "documents", "michelin")
- pickup: Extract the pickup address or location (can be coordinates like "40.7128, -74.0060" or street addresses)
- dropoff: Extract the delivery address or location (can be coordinates like "40.7128, -74.0060" or street addresses)
- deadline: Extract ANY time reference, including natural language like "next tuesday", "tomorrow", "by 5pm", "asap", "urgent", etc. Keep the original text as-is.

Return a JSON object with:
{
  "parts": [],
  "pickup": "",
  "dropoff": "",
  "deadline": ""
}
`;

    console.log('🔍 SMS ParseJob: Calling OpenAI...');
    let completion;
    try {
      completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
        max_tokens: 300,
      });
      console.log('🔍 SMS ParseJob: OpenAI response received');
    } catch (openaiError: unknown) {
      console.error('❌ OpenAI API error:', openaiError);
      console.error('❌ OpenAI error message:', openaiError instanceof Error ? openaiError.message : 'Unknown error');
      // Respond with a helpful error message
      const errorResponse = "Sorry, I'm having trouble processing your request (AI error). Please try again later.";
      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Message>${errorResponse}</Message>
</Response>`;
      return new NextResponse(twiml, {
        status: 200,
        headers: { 'Content-Type': 'text/xml' },
      });
    }
    const content = completion.choices[0].message.content || '';
    const cleanJson = content
      .replace(/^```json\s*/, '')
      .replace(/^```\s*/, '')
      .replace(/\s*```$/, '')
      .trim();

    console.log('✅ Cleaned AI output:', cleanJson);
    
    let parsed;
    try {
      parsed = JSON.parse(cleanJson);
      console.log('✅ Successfully parsed JSON:', parsed);
    } catch (error) {
      console.error('❌ Failed to parse AI response as JSON:', error);
      const errorResponse = "I'm having trouble understanding your request. Could you please provide the pickup and dropoff addresses clearly?";
      
      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Message>${errorResponse}</Message>
</Response>`;

      return new NextResponse(twiml, {
        status: 200,
        headers: { 'Content-Type': 'text/xml' },
      });
    }
    
    // Check for vague addresses
    const vagueAddressPatterns = [
      /my shop/i,
      /my store/i,
      /my office/i,
      /my house/i,
      /my home/i,
      /my place/i,
      /here/i,
      /there/i,
      /this place/i,
      /that place/i
    ];
    
    const isVagueAddress = (address: string) => {
      return vagueAddressPatterns.some(pattern => pattern.test(address));
    };
    
    const pickupIsVague = isVagueAddress(parsed.pickup || '');
    const dropoffIsVague = isVagueAddress(parsed.dropoff || '');
    
    console.log('🔍 Address vagueness check:', {
      pickup: { address: parsed.pickup, isVague: pickupIsVague },
      dropoff: { address: parsed.dropoff, isVague: dropoffIsVague }
    });
    
          // If we have vague addresses, ask for clarification
      if (pickupIsVague || dropoffIsVague) {
        let clarificationMessage = "";
        
        // Check if customer has a default address via profiles -> customers
        let defaultAddress = null;
        if (mainCustomerId) {
          const { data: customerData } = await supabaseAdmin
            .from('customers')
            .select('default_address')
            .eq('id', mainCustomerId)
            .single();
          
          defaultAddress = customerData?.default_address;
        }
        
        if (pickupIsVague && dropoffIsVague) {
          clarificationMessage = "What's the pickup address? And what's the delivery address?";
        } else if (pickupIsVague) {
          clarificationMessage = `What's the pickup address? (Dropoff: ${parsed.dropoff})`;
        } else {
          // Dropoff is vague - check if we have a default address
          if (defaultAddress) {
            clarificationMessage = `I'll use your default address: ${defaultAddress}`;
            
            // Update the parsed data to use the default address
            parsed.dropoff = defaultAddress;
          } else {
            clarificationMessage = `What's the delivery address? (Pickup: ${parsed.pickup})`;
          }
        }
        
        // If we now have both addresses (after using default), create the job directly
        if (!pickupIsVague && !isVagueAddress(parsed.dropoff || '') && parsed.pickup && parsed.dropoff) {
          console.log('🔍 Creating job with default address');
          
          const { data: newJob, error: jobError } = await supabaseAdmin
            .from('jobs')
            .insert({
              customer_id: mainCustomerId,
              user_id: mainCustomerId,
              pickup: parsed.pickup,
              dropoff: parsed.dropoff,
              parts: parsed.parts || [],
              deadline: parsed.deadline || '',
              status: 'pending',
              created_via: 'sms',
              needs_pickup_address: false,
              needs_dropoff_address: false
            })
            .select()
            .single();
          
          if (jobError) {
            console.error('❌ Error creating job:', jobError);
            const errorResponse = "I'm having trouble creating your job. Please try again.";
            const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Message>${errorResponse}</Message>
</Response>`;
            return new NextResponse(twiml, {
              status: 200,
              headers: { 'Content-Type': 'text/xml' },
            });
          }
          
          const confirmationMessage = `✅ Job created successfully!\n\nJob ID: ${newJob.id.slice(0, 8)}\nPickup: ${newJob.pickup}\nDropoff: ${newJob.dropoff}\nStatus: ${newJob.status}\n\nView job: https://ganbatte-liart.vercel.app/job/${newJob.id}`;
          
          const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Message>${confirmationMessage}</Message>
</Response>`;

          return new NextResponse(twiml, {
            status: 200,
            headers: { 'Content-Type': 'text/xml' },
          });
        }
      
      // Store partial job data for later completion
      const partialJobData = {
        customer_id: mainCustomerId, // Use main customer ID or null
        user_id: mainCustomerId, // Use main customer ID or null
        pickup: pickupIsVague ? '' : parsed.pickup,
        dropoff: dropoffIsVague ? '' : parsed.dropoff,
        parts: parsed.parts || [],
        deadline: parsed.deadline || '',
        status: 'pending_address',
        created_via: 'sms',
        needs_pickup_address: pickupIsVague,
        needs_dropoff_address: dropoffIsVague
      };
      
      // Store in database for later completion
      const { data: partialJob, error: partialJobError } = await supabaseAdmin
        .from('jobs')
        .insert(partialJobData)
        .select()
        .single();
      
      if (partialJobError) {
        console.error('❌ Error creating partial job:', partialJobError);
        clarificationMessage = "I'm having trouble processing your request. Please try again.";
      } else {
        console.log(`✅ Created partial job ${partialJob.id} waiting for address clarification`);
        clarificationMessage += `\n\nJob ID: ${partialJob.id.slice(0, 8)}`;
      }
      
      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Message>${clarificationMessage}</Message>
</Response>`;

      return new NextResponse(twiml, {
        status: 200,
        headers: { 'Content-Type': 'text/xml' },
      });
    }
    
    // Create full job when all addresses are clear
    console.log('🔍 Creating full job with clear addresses');
    
    const { data: newJob, error: jobError } = await supabaseAdmin
      .from('jobs')
      .insert({
        customer_id: mainCustomerId,
        user_id: mainCustomerId,
        pickup: parsed.pickup || '',
        dropoff: parsed.dropoff || '',
        parts: parsed.parts || [],
        deadline: parsed.deadline || '',
        status: 'pending',
        created_via: 'sms',
        needs_pickup_address: false,
        needs_dropoff_address: false
      })
      .select()
      .single();
    
    if (jobError) {
      console.error('❌ Error creating job:', jobError);
      const errorResponse = "I'm having trouble creating your job. Please try again.";
      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Message>${errorResponse}</Message>
</Response>`;
      return new NextResponse(twiml, {
        status: 200,
        headers: { 'Content-Type': 'text/xml' },
      });
    }
    
    const confirmationMessage = `✅ Job created successfully!\n\nJob ID: ${newJob.id.slice(0, 8)}\nPickup: ${newJob.pickup}\nDropoff: ${newJob.dropoff}\nStatus: ${newJob.status}\n\nView job: https://ganbatte-liart.vercel.app/job/${newJob.id}`;
    
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Message>${confirmationMessage}</Message>
</Response>`;

    return new NextResponse(twiml, {
      status: 200,
      headers: { 'Content-Type': 'text/xml' },
    });

  } catch (error) {
    console.error('🔥 SMS webhook error:', error);
    console.error('🔥 Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('🔥 Error message:', error instanceof Error ? error.message : 'No message');
    console.error('🔥 Error type:', typeof error);
    
    const errorResponse = "Sorry, I'm having trouble processing your request. Please try again or contact support.";
    
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Message>${errorResponse}</Message>
</Response>`;

    return new NextResponse(twiml, {
      status: 200,
      headers: { 'Content-Type': 'text/xml' },
    });
  }
} 