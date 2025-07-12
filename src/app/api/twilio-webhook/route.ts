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
    
    // Simple response for testing
    const testResponse = `Hello! I received your message: "${messageBody}". Database operations successful. Customer ID: ${customer.id}. OpenAI parsing successful. Parsed data: ${JSON.stringify(parsed)}`;
    
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