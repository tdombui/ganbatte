import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/auth'

export async function GET() {
    try {
        console.log('🔍 Debug: Listing ALL jobs in database (bypassing RLS)...')

        // Use admin client to bypass RLS
        const { data: jobs, error } = await supabaseAdmin
            .from('jobs')
            .select('*')
            .order('created_at', { ascending: false })

        if (error) {
            console.error('❌ Debug jobs error:', error)
            return NextResponse.json({ error: 'Failed to list jobs' }, { status: 500 })
        }

        console.log('🔍 Debug: Found jobs:', jobs?.length || 0)
        if (jobs && jobs.length > 0) {
            jobs.forEach(job => {
                console.log('  - Job:', job.id, 'User ID:', job.user_id, 'Status:', job.status, 'Created:', job.created_at)
            })
        }

        return NextResponse.json({
            success: true,
            jobs: jobs || [],
            count: jobs?.length || 0,
            message: 'All jobs in database (admin view)'
        })

    } catch (error) {
        console.error('❌ Debug all jobs error:', error)
        return NextResponse.json({ 
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    }
} 