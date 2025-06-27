import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/auth'

export async function GET(request: NextRequest) {
    try {
        console.log('🔍 Listing all jobs...')

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

        // Get all jobs for this user
        const { data: jobs, error } = await supabase
            .from('jobs')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('❌ List jobs error:', error)
            return NextResponse.json({ error: 'Failed to list jobs' }, { status: 500 })
        }

        console.log('🔍 Found jobs:', jobs?.length || 0)
        if (jobs && jobs.length > 0) {
            jobs.forEach(job => {
                console.log('  - Job:', job.id, 'Status:', job.status, 'Created:', job.created_at)
            })
        }

        return NextResponse.json({
            success: true,
            jobs: jobs || [],
            count: jobs?.length || 0,
            userId: user.id
        })

    } catch (error) {
        console.error('❌ List all jobs error:', error)
        return NextResponse.json({ 
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    }
} 