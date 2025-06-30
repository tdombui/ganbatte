import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'

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

        // Verify the user
        const supabase = createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        
        if (authError || !user) {
            console.error('Authentication error:', authError)
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
        }

        console.log('🔍 User authenticated:', user.id)

        // Test 1: Try to get the job directly
        console.log('🔍 Test 1: Direct job lookup...')
        const { data: job, error: jobError } = await supabase
            .from('jobs')
            .select('*')
            .eq('id', jobId)
            .single()

        console.log('🔍 Job lookup result:', { job: !!job, error: jobError?.message })

        // Test 2: Try to get all jobs
        console.log('🔍 Test 2: Getting all jobs...')
        const { data: allJobs, error: allJobsError } = await supabase
            .from('jobs')
            .select('*')
            .limit(5)

        console.log('🔍 All jobs result:', { count: allJobs?.length, error: allJobsError?.message })

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