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
    const { phoneNumber, message } = await request.json();

    console.log(`🧪 Test webhook: ${phoneNumber} - ${message}`);

    // Clean phone number (remove +1 if present)
    const cleanPhone = phoneNumber.replace('+1', '');

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
          name: `Test Customer ${cleanPhone.slice(-4)}`,
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating customer:', createError);
        return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 });
      }

      customer = newCustomer;
      console.log(`✅ Created test customer: ${customer.id}`);
    }

    // Update last interaction
    await supabase
      .from('twilio_customers')
      .update({ last_interaction: new Date().toISOString() })
      .eq('id', customer.id);

    // Check if this looks like a job creation request
    const isJobRequest = message.toLowerCase().includes('delivery') || 
                        message.toLowerCase().includes('pickup') || 
                        message.toLowerCase().includes('dropoff') ||
                        message.toLowerCase().includes('job') ||
                        message.toLowerCase().includes('send') ||
                        message.toLowerCase().includes('ship');

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
        { role: "user", content: message }
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
            description: 'Job created via SMS test',
            status: 'pending',
            created_via: 'sms'
          })
          .select()
          .single();

        if (jobError) {
          console.error('Error creating job:', jobError);
          aiResponse = "Sorry, I couldn't create your job. Please try again or contact support.";
        } else {
          console.log(`✅ Created test job ${job.id} for customer ${customer.id}`);
          aiResponse = `Perfect! I've created your delivery job #${job.id.slice(-6)}. Pickup: ${pickup.trim()}. Dropoff: ${dropoff.trim()}. We'll notify you when a driver is assigned.`;
        }
      }
    }

    return NextResponse.json({ 
      success: true,
      customer: {
        id: customer.id,
        phone_number: customer.phone_number,
        name: customer.name
      },
      response: aiResponse,
      isJobRequest,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Test webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 