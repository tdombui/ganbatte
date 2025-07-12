import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Get the request body
    const body = await request.text();
    const formData = new URLSearchParams(body);
    
    const from = formData.get('From') || '';
    const messageBody = formData.get('Body') || '';
    
    console.log(`📱 SMS received from ${from}: ${messageBody}`);
    
    // Simple response for testing
    const testResponse = `Hello! I received your message: "${messageBody}". This is a test response.`;
    
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