import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
    return NextResponse.json({
        success: true,
        message: 'Webhook Configuration Check',
        timestamp: new Date().toISOString(),
        environment: {
            // Enterprise webhook (original)
            hasStripeWebhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
            stripeWebhookSecretPrefix: process.env.STRIPE_WEBHOOK_SECRET?.substring(0, 10) + '...' || 'NOT_SET',
            
            // Payment links webhook (new)
            hasPaymentLinksWebhookSecret: !!process.env.STRIPE_PAYMENT_LINKS_WEBHOOK_SECRET,
            paymentLinksSecretPrefix: process.env.STRIPE_PAYMENT_LINKS_WEBHOOK_SECRET?.substring(0, 10) + '...' || 'NOT_SET',
            
            // Stripe keys
            hasStripeSecretKey: !!process.env.STRIPE_SECRET_KEY,
            hasStripeTestKey: !!process.env.STRIPE_SECRET_TEST_KEY,
            keyType: (process.env.STRIPE_SECRET_TEST_KEY || process.env.STRIPE_SECRET_KEY)?.startsWith('sk_test_') ? 'TEST' : 'LIVE',
            
            // URLs
            baseUrl: process.env.NEXT_PUBLIC_BASE_URL || 'https://ganbatte-dbls5do03-tdombuis-projects.vercel.app',
            enterpriseWebhookUrl: 'https://ganbatte-dbls5do03-tdombuis-projects.vercel.app/api/webhooks/stripe',
            paymentLinksWebhookUrl: 'https://ganbatte-dbls5do03-tdombuis-projects.vercel.app/api/webhooks/stripe-payment-links'
        },
        instructions: [
            '1. Check your Stripe Dashboard → Webhooks',
            '2. Verify which endpoint URLs are configured',
            '3. Ensure the correct webhook secret is being used',
            '4. Test both endpoints to see which one receives events'
        ]
    })
}

export async function POST(request: NextRequest) {
    const body = await request.text()
    
    return NextResponse.json({
        success: true,
        message: 'Webhook test endpoint received POST request',
        timestamp: new Date().toISOString(),
        bodyLength: body.length,
        hasBody: !!body,
        headers: {
            'stripe-signature': request.headers.get('stripe-signature') ? 'present' : 'missing',
            'content-type': request.headers.get('content-type'),
            'user-agent': request.headers.get('user-agent')
        }
    })
} 