import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../lib/auth'

export async function GET(request: NextRequest) {
    try {
        // Get the user ID from the request headers
        const authHeader = request.headers.get('authorization')
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const token = authHeader.replace('Bearer ', '')
        const { data: { user }, error: authError } = await supabase.auth.getUser(token)
        
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get user's jobs
        const { data: jobs, error } = await supabase
            .from('jobs')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('❌ Get user jobs error:', error)
            return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 })
        }

        return NextResponse.json({
            success: true,
            jobs: jobs || [],
            userId: user.id,
            message: `Found ${jobs?.length || 0} jobs for user`
        })

    } catch (error) {
        console.error('Get user jobs error:', error)
        return NextResponse.json({ 
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    }
} 