import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { OpenAI } from 'openai';
import { validateAddress } from '@/lib/validateAddress';
import { normalizeDeadline } from '@/lib/normalizeDeadline';

export async function POST(request: NextRequest) {
  try {
    // Get the request body
    const body = await request.text();
    const formData = new URLSearchParams(body);
    
    const from = formData.get('From') || '';
    const messageBody = formData.get('Body') || '';
    const phoneNumber = from.replace('+', '');
    
    console.log(`📱 SMS received from ${from}: ${messageBody}`);
    
    // Create Supabase client
    const supabase = await createClient();
    
    // Rate limiting (simplified for now)
    const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
    const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
    const RATE_LIMIT_MAX_REQUESTS = 10; // 10 requests per minute per phone
    
    function checkRateLimit(phoneNumber: string): boolean {
      const now = Date.now();
      const record = rateLimitMap.get(phoneNumber);
      
      if (!record || now > record.resetTime) {
        rateLimitMap.set(phoneNumber, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
        return true;
      }
      
      if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
        return false;
      }
      
      record.count++;
      return true;
    }
    
    // Rate limiting
    if (!checkRateLimit(phoneNumber)) {
      console.log(`⚠️ Rate limit exceeded for ${phoneNumber}`);
      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Message>Too many requests. Please wait a moment before sending another message.</Message>
</Response>`;
      
      return new NextResponse(twiml, {
        status: 200,
        headers: { 'Content-Type': 'text/xml' },
      });
    }
    
    // Find or create customer
    let { data: customer, error: customerError } = await supabase
      .from('twilio_customers')
      .select('*')
      .eq('phone_number', phoneNumber)
      .single();
    
    if (customerError && customerError.code === 'PGRST116') {
      // Customer doesn't exist, create one
      const { data: newCustomer, error: createError } = await supabase
        .from('twilio_customers')
        .insert({
          phone_number: phoneNumber,
          name: 'SMS Customer',
          sms_opt_in: false
        })
        .select()
        .single();
      
      if (createError) {
        console.error('Error creating customer:', createError);
        return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 });
      }
      
      customer = newCustomer;
    } else if (customerError) {
      console.error('Error finding customer:', customerError);
      return NextResponse.json({ error: 'Failed to find customer' }, { status: 500 });
    }
    
    // Handle consent flow
    if (!customer.sms_opt_in) {
      if (messageBody.toLowerCase().trim() === 'yes') {
        // Opt in
        await supabase
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
      await supabase
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
    await supabase
      .from('twilio_customers')
      .update({ last_interaction: new Date().toISOString() })
      .eq('id', customer.id);
    
    // Initialize OpenAI
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    // Use the same sophisticated parsing approach as parseJob
    const prompt = `
You're an assistant for a parts delivery service called Ganbatte. When a customer sends a message, your job is to extract these fields and return them as JSON only — no backticks, no markdown, no explanations.

Message: ${messageBody}

EXTRACTION GUIDELINES:
- parts: Extract any items, parts, or things being delivered (e.g., "wheels", "engine parts", "documents", "michelin")
- pickup: Extract the pickup address or location (can be coordinates like "40.7128, -74.0060" or street addresses)
- dropoff: Extract the delivery address or location (can be coordinates like "40.7128, -74.0060" or street addresses)
- deadline: Extract ANY time reference, including natural language like "next tuesday", "tomorrow", "by 5pm", "asap", "urgent", etc. Keep the original text as-is.

COORDINATE HANDLING: If the customer provides GPS coordinates in any format (e.g., "40.7128, -74.0060", "34.0522, -118.2437", "33°11'58.5\"N 117°22'27.6\"W"), extract them exactly as provided. Do not try to convert coordinates to addresses.

Return a JSON object with:
{
  "parts": [],
  "pickup": "",
  "dropoff": "",
  "deadline": ""
}

Examples of deadline extraction:
- "next tues by 2pm" → deadline: "next tues by 2pm"
- "tomorrow at 3pm" → deadline: "tomorrow at 3pm" 
- "as soon as possible" → deadline: "as soon as possible"
- "by Friday" → deadline: "by Friday"
- "urgent delivery" → deadline: "urgent delivery"

Examples of coordinate extraction:
- "pickup at 40.7128, -74.0060" → pickup: "40.7128, -74.0060"
- "deliver to 34.0522, -118.2437" → dropoff: "34.0522, -118.2437"
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
    } catch (error) {
      console.error('Failed to parse AI response as JSON:', error);
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

    console.log('🔍 SMS ParseJob: Validating addresses...');
    const pickupCheck = await validateAddress(parsed.pickup || '');
    const dropoffCheck = await validateAddress(parsed.dropoff || '');

    console.log('🔍 Address validation results:', {
      pickup: { address: parsed.pickup, valid: pickupCheck.valid },
      dropoff: { address: parsed.dropoff, valid: dropoffCheck.valid }
    });

    // Normalize deadline
    console.log('🔍 SMS ParseJob: Normalizing deadline...');
    const normalized = normalizeDeadline(parsed.deadline ?? '');
    parsed.deadline = normalized.iso;
    parsed.deadlineDisplay = normalized.display;

    // Check if we have both valid addresses
    if (pickupCheck.valid && dropoffCheck.valid) {
      console.log('✅ Both addresses valid, creating job');
      
      // Try to find existing user by phone number
      let userId = null;
      let customerId = null;
      
      if (customer.email) {
        // Check if there's a profile with this email
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id, role')
          .eq('email', customer.email)
          .single();
        
        if (!profileError && profile) {
          userId = profile.id;
          // If user is a customer, set customer_id to their profile id
          if (profile.role === 'customer') {
            customerId = profile.id;
          }
          console.log(`🔗 Linking SMS job to existing user: ${userId} (${profile.role})`);
        }
      }
      
      // If no match by email, try to find by phone number directly
      if (!userId) {
        const { data: profileByPhone, error: phoneError } = await supabase
          .from('profiles')
          .select('id, role')
          .eq('phone', phoneNumber)
          .single();
        
        if (!phoneError && profileByPhone) {
          userId = profileByPhone.id;
          if (profileByPhone.role === 'customer') {
            customerId = profileByPhone.id;
          }
          console.log(`🔗 Linking SMS job to existing user by phone: ${userId} (${profileByPhone.role})`);
        }
      }
      
      // Create the job with user linking if found
      const { data: job, error: jobError } = await supabase
        .from('jobs')
        .insert({
          customer_id: customerId,
          user_id: userId,
          pickup: parsed.pickup,
          dropoff: parsed.dropoff,
          parts: parsed.parts || [],
          status: 'pending',
          created_via: 'sms',
          deadline: parsed.deadline || null
        })
        .select()
        .single();

      if (jobError) {
        console.error('Error creating job:', jobError);
        const errorResponse = "Sorry, I couldn't create your job. Please try again or contact support.";
        
        const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Message>${errorResponse}</Message>
</Response>`;

        return new NextResponse(twiml, {
          status: 200,
          headers: { 'Content-Type': 'text/xml' },
        });
      } else {
        console.log(`✅ Created SMS job ${job.id} for customer ${customer.id}${userId ? ` (linked to user ${userId})` : ''}`);
        const deadlineText = parsed.deadlineDisplay ? ` by ${parsed.deadlineDisplay}` : '';
        const partsText = parsed.parts?.length > 0 ? ` for ${parsed.parts.join(', ')}` : '';
        
        let successResponse = `Perfect! I've created your delivery job #${job.id.slice(-6)}${partsText}. Pickup: ${parsed.pickup}. Dropoff: ${parsed.dropoff}${deadlineText}. We'll notify you when a driver is assigned.`;
        
        // Add account creation suggestion if job wasn't linked to a user
        if (!userId) {
          successResponse += `\n\n💡 To view and manage your jobs online, create an account at https://ganbatte-liart.vercel.app and use this phone number.`;
        }
        
        const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Message>${successResponse}</Message>
</Response>`;

        return new NextResponse(twiml, {
          status: 200,
          headers: { 'Content-Type': 'text/xml' },
        });
      }
    } else {
      // Invalid addresses
      const errorResponse = "I couldn't validate one or both addresses. Please provide clear pickup and dropoff addresses.";
      
      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Message>${errorResponse}</Message>
</Response>`;

      return new NextResponse(twiml, {
        status: 200,
        headers: { 'Content-Type': 'text/xml' },
      });
    }

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