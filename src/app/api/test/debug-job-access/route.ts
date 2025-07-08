import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const jobId = searchParams.get('jobId')
        const userId = searchParams.get('userId')
        
        console.log('🔍 Debug job access for:', { jobId, userId })
        
        if (!jobId) {
            return NextResponse.json({ error: 'Job ID is required' }, { status: 400 })
        }

        // Check if job exists at all
        const { data: allJobs, error: allJobsError } = await supabaseAdmin
            .from('jobs')
            .select('id, user_id, customer_id, status, payment_status')
            .eq('id', jobId)

        console.log('🔍 All jobs with this ID:', { allJobs, allJobsError })

        // Check if user exists
        let userCheck: { exists: boolean; user: unknown; error: unknown } = { exists: false, user: null, error: null }
        if (userId) {
            const { data: user, error: userError } = await supabaseAdmin
                .from('profiles')
                .select('id, email, role')
                .eq('id', userId)
                .single()
            
            userCheck = { exists: !!user, user, error: userError }
        }

        // Check webhook configuration
        const webhookConfig = {
            hasStripeWebhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
            hasStripeSecretKey: !!process.env.STRIPE_SECRET_KEY,
            webhookSecretPrefix: process.env.STRIPE_WEBHOOK_SECRET?.substring(0, 10) + '...' || 'NOT_SET'
        }

        return NextResponse.json({
            success: true,
            timestamp: new Date().toISOString(),
            jobId,
            userId,
            jobCheck: {
                exists: allJobs && allJobs.length > 0,
                count: allJobs?.length || 0,
                jobs: allJobs,
                error: allJobsError
            },
            userCheck,
            webhookConfig
        })
        
    } catch (error) {
        console.error('❌ Debug job access error:', error)
        return NextResponse.json({ 
            error: 'Debug endpoint failed',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    }
} 