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
        message: 'Payment Link Webhook Debug endpoint',
        instructions: 'Use POST with jobId and paymentLinkId to test webhook processing',
        environment: {
            hasStripeKey: !!stripeSecretKey,
            keyType: stripeSecretKey?.startsWith('sk_test_') ? 'TEST' : 'LIVE'
        }
    })
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { jobId, paymentLinkId, paymentIntentId } = body
        
        console.log('🔍 Debug Payment Link webhook processing for:', { jobId, paymentLinkId, paymentIntentId })
        
        if (!jobId) {
            return NextResponse.json({ error: 'Job ID is required' }, { status: 400 })
        }
        
        // Test finding the job
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
        
        // If payment link ID is provided, test retrieving it from Stripe
        let paymentLinkMetadata = null
        if (paymentLinkId) {
            try {
                const paymentLink = await stripe.paymentLinks.retrieve(paymentLinkId)
                paymentLinkMetadata = paymentLink.metadata
                console.log('✅ Retrieved payment link metadata:', paymentLinkMetadata)
            } catch (error) {
                console.error('❌ Error retrieving payment link:', error)
            }
        }
        
        // Test updating the job
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
        
        return NextResponse.json({
            success: true,
            message: 'Job payment status updated successfully',
            job: updateData?.[0],
            originalJob: job,
            paymentLinkMetadata
        })
        
    } catch (error) {
        console.error('❌ Debug Payment Link webhook error:', error)
        return NextResponse.json({ 
            error: 'Debug processing failed',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    }
} 