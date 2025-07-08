import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET() {
    return NextResponse.json({
        success: true,
        message: 'Debug webhook processing endpoint is accessible',
        instructions: 'Use POST method with jobId, paymentIntentId, and paymentLinkId in the body to test webhook processing',
        example: {
            method: 'POST',
            body: {
                jobId: 'your-job-id-here',
                paymentIntentId: 'pi_test_123',
                paymentLinkId: 'your-payment-link-id'
            }
        }
    })
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { jobId, paymentIntentId, paymentLinkId } = body
        
        console.log('🔍 Debug webhook processing for:', { jobId, paymentIntentId, paymentLinkId })
        
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
            originalJob: job
        })
        
    } catch (error) {
        console.error('❌ Debug webhook processing error:', error)
        return NextResponse.json({ 
            error: 'Debug processing failed',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    }
} 