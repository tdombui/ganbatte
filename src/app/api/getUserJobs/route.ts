import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
    try {
        // Get the user ID from the request headers
        const authHeader = request.headers.get('authorization')
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const token = authHeader.replace('Bearer ', '')
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
        
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        console.log('🔍 Getting jobs for user:', user.id)

        // Get user's jobs
        const { data: jobs, error } = await supabaseAdmin
            .from('jobs')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('❌ Error fetching jobs:', error)
            return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 })
        }

        console.log('✅ Found jobs:', jobs?.length || 0)
        return NextResponse.json({
            success: true,
            jobs: jobs || [],
            userId: user.id,
            message: `Found ${jobs?.length || 0} jobs for user`
        })

    } catch (error) {
        console.error('❌ Unexpected error:', error)
        return NextResponse.json({ 
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    }
} 