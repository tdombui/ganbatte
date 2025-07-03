import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

// Initialize Supabase client with service role key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    // Parse Twilio webhook data
    const formData = await request.formData();
    const from = formData.get('From') as string;
    const body = formData.get('Body') as string;

    console.log(`📱 Twilio webhook received from ${from}: ${body}`);

    // Clean phone number (remove +1 if present)
    const cleanPhone = from.replace('+1', '');

    // Get or create customer
    const { data: existingCustomer, error: customerError } = await supabase
      .from('twilio_customers')
      .select('*')
      .eq('phone_number', cleanPhone)
      .single();

    if (customerError && customerError.code !== 'PGRST116') {
      console.error('Error fetching customer:', customerError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    let customer = existingCustomer;

    // Create customer if doesn't exist
    if (!customer) {
      const { data: newCustomer, error: createError } = await supabase
        .from('twilio_customers')
        .insert({
          phone_number: cleanPhone,
          name: `Customer ${cleanPhone.slice(-4)}`, // Temporary name
          sms_consent: false, // Default to false for new customers
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating customer:', createError);
        return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 });
      }

      customer = newCustomer;
      console.log(`✅ Created new customer: ${customer.id}`);
    }

    // Handle SMS consent flow
    if (!customer.sms_consent) {
      const message = body.toLowerCase().trim();
      
      if (message === 'yes' || message === 'y' || message === 'yup') {
        // Customer consented
        await supabase
          .from('twilio_customers')
          .update({ sms_consent: true, consent_date: new Date().toISOString() })
          .eq('id', customer.id);
        
        const consentResponse = `Thank you! You're now opted in to receive delivery updates via SMS. Reply STOP anytime to opt out. What do you need delivered today?`;
        
        const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Message>${consentResponse}</Message>
</Response>`;

        return new NextResponse(twiml, {
          status: 200,
          headers: { 'Content-Type': 'text/xml' },
        });
      } else if (message === 'stop' || message === 'no' || message === 'n') {
        // Customer declined
        const declineResponse = `You're opted out. You won't receive any more messages from us.`;
        
        const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Message>${declineResponse}</Message>
</Response>`;

        return new NextResponse(twiml, {
          status: 200,
          headers: { 'Content-Type': 'text/xml' },
        });
      } else {
        // First message - ask for consent
        const consentMessage = `Welcome to GanbattePM! 🚚 We deliver mission-critical payloads across Southern California. To help you, we need your consent to send SMS updates about your deliveries. Reply YES to continue or STOP to opt out. Standard messaging rates apply.`;
        
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
    if (body.toLowerCase().trim() === 'stop') {
      await supabase
        .from('twilio_customers')
        .update({ sms_consent: false })
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

    // Check if this looks like a job creation request
    const isJobRequest = body.toLowerCase().includes('delivery') || 
                        body.toLowerCase().includes('pickup') || 
                        body.toLowerCase().includes('dropoff') ||
                        body.toLowerCase().includes('job') ||
                        body.toLowerCase().includes('send') ||
                        body.toLowerCase().includes('ship');

    // Process message with OpenAI
    let systemPrompt = `You are a helpful delivery service assistant for Ganbatte. You help customers create delivery jobs via SMS.

Key capabilities:
- Create delivery jobs with pickup/dropoff addresses
- Provide job status updates
- Answer questions about services
- Be friendly and professional

Job creation format:
- Ask for pickup address
- Ask for dropoff address  
- Ask for deadline (if needed)
- Confirm details before creating

Keep responses concise for SMS (under 160 characters when possible).
Always be helpful and professional.`;

    // If this looks like a job request, enhance the prompt
    if (isJobRequest) {
      systemPrompt += `

IMPORTANT: If the customer provides both pickup and dropoff addresses, respond with:
"JOB_CREATE: [pickup_address] to [dropoff_address]"

This will trigger automatic job creation.`;
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: body }
      ],
      max_tokens: 200,
      temperature: 0.7,
    });

    let aiResponse = completion.choices[0]?.message?.content || "I'm sorry, I couldn't process that. Please try again.";

    console.log(`🤖 AI Response: ${aiResponse}`);

    // Check if AI wants to create a job
    if (aiResponse.startsWith('JOB_CREATE:')) {
      const jobDetails = aiResponse.replace('JOB_CREATE:', '').trim();
      const [pickup, dropoff] = jobDetails.split(' to ');
      
      if (pickup && dropoff) {
        // Create the job
        const { data: job, error: jobError } = await supabase
          .from('jobs')
          .insert({
            customer_id: customer.id,
            pickup_address: pickup.trim(),
            dropoff_address: dropoff.trim(),
            description: 'Job created via SMS',
            status: 'pending',
            created_via: 'sms'
          })
          .select()
          .single();

        if (jobError) {
          console.error('Error creating job:', jobError);
          aiResponse = "Sorry, I couldn't create your job. Please try again or contact support.";
        } else {
          console.log(`✅ Created job ${job.id} for customer ${customer.id}`);
          aiResponse = `Perfect! I've created your delivery job #${job.id.slice(-6)}. Pickup: ${pickup.trim()}. Dropoff: ${dropoff.trim()}. We'll notify you when a driver is assigned.`;
        }
      }
    }

    // Return TwiML response
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Message>${aiResponse}</Message>
</Response>`;

    return new NextResponse(twiml, {
      status: 200,
      headers: {
        'Content-Type': 'text/xml',
      },
    });

  } catch (error) {
    console.error('Twilio webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 