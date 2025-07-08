import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'

const stripeSecretKey = process.env.STRIPE_SECRET_TEST_KEY || process.env.STRIPE_SECRET_KEY
const stripe = new Stripe(stripeSecretKey!, {
  apiVersion: '2025-05-28.basil',
  typescript: true,
})

interface WebhookResult {
  valid: boolean
  error?: string
  eventType?: string
  eventId?: string
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.text()
        const headersList = await headers()
        const sig = headersList.get('stripe-signature')
        
        console.log('🔍 Testing webhook signature verification')
        console.log('Body length:', body.length)
        console.log('Signature present:', !!sig)
        
        // Test with both webhook secrets
        const secrets = {
            paymentLinks: process.env.STRIPE_PAYMENT_LINKS_WEBHOOK_SECRET,
            main: process.env.STRIPE_WEBHOOK_SECRET
        }
        
        const results: Record<string, WebhookResult> = {}
        
        for (const [name, secret] of Object.entries(secrets)) {
            if (!secret) {
                results[name] = { valid: false, error: 'Secret not set' }
                continue
            }
            
            try {
                const event = stripe.webhooks.constructEvent(body, sig!, secret)
                results[name] = { 
                    valid: true, 
                    eventType: event.type,
                    eventId: event.id 
                }
            } catch (error) {
                results[name] = { 
                    valid: false, 
                    error: error instanceof Error ? error.message : 'Unknown error' 
                }
            }
        }
        
        return NextResponse.json({
            success: true,
            message: 'Webhook secret verification results',
            results,
            environment: {
                hasPaymentLinksSecret: !!secrets.paymentLinks,
                hasMainSecret: !!secrets.main,
                keyType: stripeSecretKey?.startsWith('sk_test_') ? 'TEST' : 'LIVE'
            }
        })
        
    } catch (error) {
        console.error('❌ Webhook secret verification error:', error)
        return NextResponse.json({ 
            error: 'Verification failed',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    }
} 