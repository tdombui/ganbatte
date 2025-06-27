// /api/createJob/route.ts

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/auth'
import { ParsedJob } from '@/types/job'

async function fetchRouteInfo(pickup: string, dropoff: string) {
    if (!pickup || !dropoff) return { distance_meters: null, duration_seconds: null }
    const res = await fetch(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(pickup)}&destination=${encodeURIComponent(dropoff)}&key=${process.env.GOOGLE_MAPS_API_KEY}`
    )
    const data = await res.json()
    const leg = data.routes?.[0]?.legs?.[0]
    return {
        distance_meters: leg?.distance?.value ?? null,
        duration_seconds: leg?.duration?.value ?? null,
    }
}

export async function POST(req: Request) {
    try {
        const job: ParsedJob = await req.json()
        console.log('🔍 Creating job:', job)

        // Get the user ID from the request headers (set by the client)
        const authHeader = req.headers.get('authorization')
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.log('❌ No auth header found')
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Verify the user token and get user info
        const token = authHeader.replace('Bearer ', '')
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
        
        if (authError || !user) {
            console.log('❌ Auth error:', authError)
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        console.log('🔍 User authenticated:', user.id)

        // Fetch route info
        const { distance_meters, duration_seconds } = await fetchRouteInfo(job.pickup, job.dropoff)

        // Get user profile to determine customer_id
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        // Explicit mapping to match your DB column names
        const insertPayload = {
            parts: job.parts || [],
            pickup: job.pickup,
            dropoff: job.dropoff,
            deadline: job.deadline,
            deadline_display: job.deadlineDisplay,
            distance_meters,
            duration_seconds,
            status: 'planned', // Set default status
            user_id: user.id, // Associate with authenticated user
            customer_id: profile?.role === 'customer' ? user.id : null, // Set customer_id if user is customer
        }

        console.log('🔍 Inserting job with payload:', insertPayload)
        console.log('🔍 User ID being used:', user.id)
        console.log('🔍 Profile role:', profile?.role)

        const { data, error } = await supabaseAdmin.from('jobs').insert([insertPayload]).select()

        if (error) {
            console.error('🔥 Supabase insert error:', error)
            return NextResponse.json({ error: 'Failed to save job' }, { status: 500 })
        }

        console.log('🔍 Job created successfully:', data[0])
        
        // Verify the job was actually saved
        const { data: verifyJob, error: verifyError } = await supabaseAdmin
            .from('jobs')
            .select('*')
            .eq('id', data[0].id)
            .single()
            
        if (verifyError) {
            console.error('🔥 Job verification failed:', verifyError)
        } else {
            console.log('🔍 Job verified in database:', verifyJob.id)
        }
        
        return NextResponse.json({ job: data[0] })
    } catch (err) {
        console.error('🔥 /api/createJob error:', err)
        return NextResponse.json({ error: 'Invalid job payload' }, { status: 400 })
    }
}
