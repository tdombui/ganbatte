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
    const { phoneNumber, message, conversationHistory } = await request.json();

    console.log(`📱 Creating job for ${phoneNumber}: ${message}`);

    // Get customer
    const { data: customer, error: customerError } = await supabase
      .from('twilio_customers')
      .select('*')
      .eq('phone_number', phoneNumber)
      .single();

    if (customerError || !customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Use OpenAI to extract job details from conversation
    const systemPrompt = `You are a job creation assistant. Extract delivery job details from the conversation.

Extract and return ONLY a JSON object with these fields:
- pickup_address: string (required)
- dropoff_address: string (required) 
- deadline: string (optional, ISO date format)
- description: string (optional, brief description)
- customer_name: string (optional)

If any required fields are missing, return null for the entire object.
Be strict about requiring both addresses.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Conversation history: ${conversationHistory}\n\nLatest message: ${message}` }
      ],
      max_tokens: 300,
      temperature: 0.1,
    });

    const aiResponse = completion.choices[0]?.message?.content || "";
    
    let jobData;
    try {
      jobData = JSON.parse(aiResponse);
    } catch {
      console.log('Failed to parse AI response as JSON:', aiResponse);
      return NextResponse.json({ 
        success: false, 
        message: "I need more details. Please provide pickup and dropoff addresses." 
      });
    }

    if (!jobData || !jobData.pickup_address || !jobData.dropoff_address) {
      return NextResponse.json({ 
        success: false, 
        message: "I need both pickup and dropoff addresses to create your delivery job." 
      });
    }

    // Create the job
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .insert({
        customer_id: customer.id,
        pickup_address: jobData.pickup_address,
        dropoff_address: jobData.dropoff_address,
        deadline: jobData.deadline || null,
        description: jobData.description || 'Job created via SMS',
        status: 'pending',
        created_via: 'sms'
      })
      .select()
      .single();

    if (jobError) {
      console.error('Error creating job:', jobError);
      return NextResponse.json({ error: 'Failed to create job' }, { status: 500 });
    }

    console.log(`✅ Created job ${job.id} for customer ${customer.id}`);

    return NextResponse.json({ 
      success: true, 
      message: `Great! I've created your delivery job #${job.id.slice(-6)}. Pickup: ${jobData.pickup_address}. Dropoff: ${jobData.dropoff_address}. We'll notify you when a driver is assigned.`,
      jobId: job.id
    });

  } catch (error) {
    console.error('Create job error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 