import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import Stripe from 'stripe'

const stripeSecretKey = process.env.STRIPE_SECRET_TEST_KEY || process.env.STRIPE_SECRET_KEY
const stripe = new Stripe(stripeSecretKey!, {
  apiVersion: '2025-05-28.basil',
  typescript: true,
})

export async function GET() {
    return NextResponse.json({
        success: true,
        message: 'Comprehensive webhook debug endpoint',
        environment: {
            hasStripeKey: !!stripeSecretKey,
            keyType: stripeSecretKey?.startsWith('sk_test_') ? 'TEST' : 'LIVE',
            hasPaymentLinksWebhookSecret: !!process.env.STRIPE_PAYMENT_LINKS_WEBHOOK_SECRET,
            hasWebhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
            baseUrl: process.env.NEXT_PUBLIC_BASE_URL || 'https://ganbatte-dbls5do03-tdombuis-projects.vercel.app'
        }
    })
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { jobId, paymentLinkId, paymentIntentId, action } = body
        
        console.log('🔍 Comprehensive webhook debug for:', { jobId, paymentLinkId, paymentIntentId, action })
        
        if (!jobId) {
            return NextResponse.json({ error: 'Job ID is required' }, { status: 400 })
        }
        
        // Test 1: Find the job
        console.log('🔍 Test 1: Finding job...')
        const { data: job, error: findError } = await supabaseAdmin
            .from('jobs')
            .select('*')
            .eq('id', jobId)
            .single()
            
        if (findError) {
            console.error('❌ Error finding job:', findError)
            return NextResponse.json({ 
                error: 'Job not found',
                details: findError.message 
            }, { status: 404 })
        }
        
        console.log('✅ Found job:', job)
        
        // Test 2: Check payment link if provided
        let paymentLinkData = null
        if (paymentLinkId) {
            console.log('🔍 Test 2: Retrieving payment link from Stripe...')
            try {
                const paymentLink = await stripe.paymentLinks.retrieve(paymentLinkId)
                paymentLinkData = {
                    id: paymentLink.id,
                    url: paymentLink.url,
                    metadata: paymentLink.metadata,
                    active: paymentLink.active
                }
                console.log('✅ Retrieved payment link:', paymentLinkData)
            } catch (error) {
                console.error('❌ Error retrieving payment link:', error)
                paymentLinkData = { error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
        
        // Test 3: Check payment intent if provided
        let paymentIntentData = null
        if (paymentIntentId) {
            console.log('🔍 Test 3: Retrieving payment intent from Stripe...')
            try {
                const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)
                paymentIntentData = {
                    id: paymentIntent.id,
                    status: paymentIntent.status,
                    amount: paymentIntent.amount,
                    metadata: paymentIntent.metadata,
                    payment_method_types: paymentIntent.payment_method_types
                }
                console.log('✅ Retrieved payment intent:', paymentIntentData)
            } catch (error) {
                console.error('❌ Error retrieving payment intent:', error)
                paymentIntentData = { error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
        
        // Test 4: Simulate webhook processing
        if (action === 'simulate_webhook') {
            console.log('🔍 Test 4: Simulating webhook processing...')
            
            const { data: updateData, error: updateError } = await supabaseAdmin
                .from('jobs')
                .update({
                    payment_status: 'paid',
                    stripe_payment_intent_id: paymentIntentId || 'test_payment_intent',
                    paid_at: new Date().toISOString(),
                    status: 'pending'
                })
                .eq('id', jobId)
                .select()
                
            if (updateError) {
                console.error('❌ Error updating job:', updateError)
                return NextResponse.json({ 
                    error: 'Failed to update job',
                    details: updateError.message 
                }, { status: 500 })
            }
            
            console.log('✅ Successfully updated job:', updateData)
        }
        
        // Test 5: Check for related jobs
        console.log('🔍 Test 5: Checking for related jobs...')
        const { data: relatedJobs, error: relatedError } = await supabaseAdmin
            .from('jobs')
            .select('id, payment_status, stripe_payment_link_id, stripe_payment_intent_id')
            .or(`stripe_payment_link_id.eq.${paymentLinkId || 'none'},stripe_payment_intent_id.eq.${paymentIntentId || 'none'}`)
            .limit(5)
            
        if (relatedError) {
            console.error('❌ Error finding related jobs:', relatedError)
        } else {
            console.log('✅ Found related jobs:', relatedJobs)
        }
        
        return NextResponse.json({
            success: true,
            message: 'Comprehensive webhook debug completed',
            job,
            paymentLink: paymentLinkData,
            paymentIntent: paymentIntentData,
            relatedJobs,
            environment: {
                hasStripeKey: !!stripeSecretKey,
                keyType: stripeSecretKey?.startsWith('sk_test_') ? 'TEST' : 'LIVE',
                baseUrl: process.env.NEXT_PUBLIC_BASE_URL || 'https://ganbatte-dbls5do03-tdombuis-projects.vercel.app'
            }
        })
        
    } catch (error) {
        console.error('❌ Comprehensive webhook debug error:', error)
        return NextResponse.json({ 
            error: 'Debug processing failed',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    }
} 