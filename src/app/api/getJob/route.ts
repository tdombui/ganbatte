import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const jobId = searchParams.get('jobId')
        
        if (!jobId) {
            return NextResponse.json({ error: 'Job ID is required' }, { status: 400 })
        }

        const authHeader = request.headers.get('authorization')
        if (!authHeader) {
            return NextResponse.json({ error: 'No authorization header' }, { status: 401 })
        }

        const token = authHeader.replace('Bearer ', '')
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
        
        if (authError || !user) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
        }

        console.log('🔍 Getting job:', jobId, 'for user:', user.id)

        const { data: job, error } = await supabaseAdmin
            .from('jobs')
            .select('*')
            .eq('id', jobId)
            .eq('user_id', user.id)
            .single()

        if (error) {
            console.error('❌ Error fetching job:', error)
            console.error('❌ Error details:', {
                message: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code
            })
            return NextResponse.json({ error: 'Failed to fetch job' }, { status: 500 })
        }

        if (!job) {
            return NextResponse.json({ error: 'Job not found' }, { status: 404 })
        }

        console.log('✅ Found job:', job.id)
        console.log('🔍 Job data structure:', Object.keys(job))
        console.log('🔍 Payment status:', job.payment_status)
        console.log('🔍 Full job data:', JSON.stringify(job, null, 2))
        return NextResponse.json({ job })

    } catch (error) {
        console.error('❌ Unexpected error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
} 