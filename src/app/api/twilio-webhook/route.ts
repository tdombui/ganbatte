import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { OpenAI } from 'openai';

export async function POST(request: NextRequest) {
  try {
    // Get the request body
    const body = await request.text();
    const formData = new URLSearchParams(body);
    
    const from = formData.get('From') || '';
    const messageBody = formData.get('Body') || '';
    const phoneNumber = from.replace('+', '');
    
    console.log(`📱 SMS received from ${from}: ${messageBody}`);
    
    // Test database operations
    console.log(`🔍 Testing database operations for phone: ${phoneNumber}`);
    
    // Find or create customer
    let { data: customer, error: customerError } = await supabaseAdmin
      .from('twilio_customers')
      .select('*')
      .eq('phone_number', phoneNumber)
      .single();
    
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
    
    // Handle consent flow
    if (!customer.sms_opt_in) {
      if (messageBody.toLowerCase().trim() === 'yes') {
        // Opt in
        await supabaseAdmin
          .from('twilio_customers')
          .update({ sms_opt_in: true })
          .eq('id', customer.id);
        
        const welcomeMessage = `Welcome to GanbattePM! You're now opted in for delivery services. Send me pickup and dropoff addresses to create a delivery job.`;
        
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
        const consentMessage = `Welcome to GanbattePM! Reply YES to receive delivery help via SMS. Reply STOP to opt out.`;
        
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
    
    // Update last interaction
    await supabaseAdmin
      .from('twilio_customers')
      .update({ last_interaction: new Date().toISOString() })
      .eq('id', customer.id);
    
    // Test OpenAI parsing
    console.log('🔍 Testing OpenAI parsing...');
    
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
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
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      max_tokens: 300,
    });

    console.log('🔍 SMS ParseJob: OpenAI response received');
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
      let clarificationMessage = "I need more specific addresses to create your delivery job. ";
      
      if (pickupIsVague && dropoffIsVague) {
        clarificationMessage += "Please provide the complete pickup address and delivery address.";
      } else if (pickupIsVague) {
        clarificationMessage += `Please provide the complete pickup address. (Dropoff: ${parsed.dropoff})`;
      } else {
        clarificationMessage += `Please provide the complete delivery address. (Pickup: ${parsed.pickup})`;
      }
      
      // Store partial job data for later completion
      const partialJobData = {
        customer_id: customer.id,
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
        clarificationMessage += `\n\nJob ID: ${partialJob.id.slice(-6)}`;
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
    
    // Simple response for testing (when addresses are clear)
    const testResponse = `Hello! I received your message: "${messageBody}". Database operations successful. Customer ID: ${customer.id}. OpenAI parsing successful. Parsed data: ${JSON.stringify(parsed)}. Addresses are clear and ready for job creation.`;
    
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Message>${testResponse}</Message>
</Response>`;

    return new NextResponse(twiml, {
      status: 200,
      headers: { 'Content-Type': 'text/xml' },
    });

  } catch (error) {
    console.error('🔥 SMS webhook error:', error);
    
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