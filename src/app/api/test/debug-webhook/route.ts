import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'

export async function GET() {
    try {
        console.log('🔍 Debug webhook configuration')
        
        // Check environment variables
        const envCheck = {
            hasStripeSecretKey: !!process.env.STRIPE_SECRET_KEY,
            hasStripeTestKey: !!process.env.STRIPE_SECRET_TEST_KEY,
            hasPaymentLinksWebhookSecret: !!process.env.STRIPE_PAYMENT_LINKS_WEBHOOK_SECRET,
            hasWebhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
            paymentLinksSecretPrefix: process.env.STRIPE_PAYMENT_LINKS_WEBHOOK_SECRET?.substring(0, 10) + '...' || 'NOT_SET',
            webhookSecretPrefix: process.env.STRIPE_WEBHOOK_SECRET?.substring(0, 10) + '...' || 'NOT_SET'
        }
        
        console.log('🔍 Environment check:', envCheck)
        
        // Test Stripe connection
        const stripeSecretKey = process.env.STRIPE_SECRET_TEST_KEY || process.env.STRIPE_SECRET_KEY
        let stripeTest: { connected: boolean; error: string | null } = { connected: false, error: null }
        
        if (stripeSecretKey) {
            try {
                const stripe = new Stripe(stripeSecretKey, {
                    apiVersion: '2025-05-28.basil',
                    typescript: true,
                })
                
                // Test a simple API call
                await stripe.accounts.retrieve()
                stripeTest = { connected: true, error: null }
            } catch (error) {
                stripeTest = { connected: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
        
        return NextResponse.json({
            success: true,
            timestamp: new Date().toISOString(),
            environment: envCheck,
            stripeTest
        })
        
    } catch (error) {
        console.error('❌ Debug webhook error:', error)
        return NextResponse.json({ 
            error: 'Debug endpoint failed',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        console.log('🔍 Testing webhook signature verification')
        
        const body = await request.text()
        const headersList = await headers()
        const sig = headersList.get('stripe-signature')
        const endpointSecret = process.env.STRIPE_PAYMENT_LINKS_WEBHOOK_SECRET
        
        console.log('🔍 Webhook test data:', {
            hasBody: !!body,
            bodyLength: body.length,
            hasSignature: !!sig,
            hasEndpointSecret: !!endpointSecret,
            signaturePrefix: sig?.substring(0, 20) + '...' || 'NOT_SET',
            endpointSecretPrefix: endpointSecret?.substring(0, 10) + '...' || 'NOT_SET'
        })
        
        if (!sig || !endpointSecret) {
            return NextResponse.json({ 
                error: 'Missing signature or endpoint secret',
                hasSignature: !!sig,
                hasEndpointSecret: !!endpointSecret
            }, { status: 400 })
        }
        
        // Test signature verification
        const stripeSecretKey = process.env.STRIPE_SECRET_TEST_KEY || process.env.STRIPE_SECRET_KEY
        if (!stripeSecretKey) {
            return NextResponse.json({ error: 'No Stripe secret key available' }, { status: 500 })
        }
        
        const stripe = new Stripe(stripeSecretKey, {
            apiVersion: '2025-05-28.basil',
            typescript: true,
        })
        
        try {
            const event = stripe.webhooks.constructEvent(body, sig, endpointSecret)
            return NextResponse.json({
                success: true,
                eventType: event.type,
                eventId: event.id
            })
        } catch (err) {
            return NextResponse.json({
                error: 'Signature verification failed',
                details: err instanceof Error ? err.message : 'Unknown error'
            }, { status: 400 })
        }
        
    } catch (error) {
        console.error('❌ Webhook test error:', error)
        return NextResponse.json({ 
            error: 'Webhook test failed',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    }
} 