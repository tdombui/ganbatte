import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/auth'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const jobId = searchParams.get('id')
        
        if (!jobId) {
            return NextResponse.json({ error: 'Job ID is required' }, { status: 400 })
        }

        console.log('🔍 Looking for job directly:', jobId)

        // Get the user ID from the request headers
        const authHeader = request.headers.get('authorization')
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.log('❌ No auth header found')
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const token = authHeader.replace('Bearer ', '')
        const { data: { user }, error: authError } = await supabase.auth.getUser(token)
        
        if (authError || !user) {
            console.log('❌ Auth error:', authError)
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        console.log('🔍 User authenticated:', user.id)

        // Try to get the job directly
        const { data: job, error } = await supabase
            .from('jobs')
            .select('*')
            .eq('id', jobId)
            .single()

        if (error) {
            console.error('❌ Direct job lookup error:', error)
            return NextResponse.json({ error: 'Job not found' }, { status: 404 })
        }

        if (!job) {
            console.log('❌ Job not found in database:', jobId)
            return NextResponse.json({ error: 'Job not found' }, { status: 404 })
        }

        console.log('🔍 Job found directly:', job.id, 'user_id:', job.user_id, 'requesting user:', user.id)

        // Check if the job belongs to the user
        if (job.user_id !== user.id) {
            console.log('❌ Job does not belong to user. Job user_id:', job.user_id, 'Requesting user:', user.id)
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        console.log('✅ Job authorized and returned:', job.id)
        return NextResponse.json({
            success: true,
            job: job
        })

    } catch (error) {
        console.error('❌ Get job error:', error)
        return NextResponse.json({ 
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    }
} 