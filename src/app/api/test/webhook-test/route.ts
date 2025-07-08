import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
    return NextResponse.json({
        success: true,
        message: 'Webhook endpoint is accessible',
        timestamp: new Date().toISOString(),
        environment: {
            hasStripeSecretKey: !!process.env.STRIPE_SECRET_KEY,
            hasPaymentLinksWebhookSecret: !!process.env.STRIPE_PAYMENT_LINKS_WEBHOOK_SECRET,
            paymentLinksSecretPrefix: process.env.STRIPE_PAYMENT_LINKS_WEBHOOK_SECRET?.substring(0, 10) + '...' || 'NOT_SET'
        }
    })
}

export async function POST(request: NextRequest) {
    const body = await request.text()
    
    return NextResponse.json({
        success: true,
        message: 'Webhook endpoint received POST request',
        timestamp: new Date().toISOString(),
        bodyLength: body.length,
        hasBody: !!body
    })
} 