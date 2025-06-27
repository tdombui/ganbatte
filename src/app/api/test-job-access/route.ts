import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/auth'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const jobId = searchParams.get('id')
        
        if (!jobId) {
            return NextResponse.json({ error: 'Job ID is required' }, { status: 400 })
        }

        console.log('🔍 Testing job access for ID:', jobId)

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

        // Test 1: Try to get the job directly
        console.log('🔍 Test 1: Direct job lookup...')
        const { data: job, error: jobError } = await supabase
            .from('jobs')
            .select('*')
            .eq('id', jobId)
            .single()

        if (jobError) {
            console.error('❌ Direct job lookup error:', jobError)
            return NextResponse.json({ 
                error: 'Job lookup failed', 
                details: jobError.message,
                code: jobError.code 
            }, { status: 500 })
        }

        if (!job) {
            console.log('❌ Job not found in database:', jobId)
            return NextResponse.json({ error: 'Job not found' }, { status: 404 })
        }

        console.log('🔍 Job found:', job.id, 'user_id:', job.user_id, 'requesting user:', user.id)

        // Test 2: Check if the job belongs to the user
        if (job.user_id !== user.id) {
            console.log('❌ Job does not belong to user. Job user_id:', job.user_id, 'Requesting user:', user.id)
            return NextResponse.json({ 
                error: 'Job does not belong to user',
                jobUserId: job.user_id,
                requestingUserId: user.id
            }, { status: 403 })
        }

        // Test 3: Try to get user's profile
        console.log('🔍 Test 3: Getting user profile...')
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()

        if (profileError) {
            console.error('❌ Profile lookup error:', profileError)
        } else {
            console.log('🔍 Profile found:', profile.role)
        }

        console.log('✅ Job access test successful')
        return NextResponse.json({
            success: true,
            job: {
                id: job.id,
                user_id: job.user_id,
                status: job.status,
                pickup: job.pickup,
                dropoff: job.dropoff
            },
            user: {
                id: user.id,
                role: profile?.role
            },
            message: 'Job access test completed successfully'
        })

    } catch (error) {
        console.error('❌ Test job access error:', error)
        return NextResponse.json({ 
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    }
} 