import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

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
    
    // Simple response for testing
    const testResponse = `Hello! I received your message: "${messageBody}". Database operations successful. Customer ID: ${customer.id}`;
    
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