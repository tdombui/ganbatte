// /api/createJob/route.ts

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { ParsedJob } from '@/types/job'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

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
        const { data: { user }, error: authError } = await supabase.auth.getUser(token)
        
        if (authError || !user) {
            console.log('❌ Auth error:', authError)
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        console.log('🔍 User authenticated:', user.id)

        // Fetch route info
        const { distance_meters, duration_seconds } = await fetchRouteInfo(job.pickup, job.dropoff)

        // Get user profile to determine customer_id
        const { data: profile } = await supabase
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

        const { data, error } = await supabase.from('jobs').insert([insertPayload]).select()

        if (error) {
            console.error('🔥 Supabase insert error:', error)
            return NextResponse.json({ error: 'Failed to save job' }, { status: 500 })
        }

        console.log('🔍 Job created successfully:', data[0])
        return NextResponse.json({ job: data[0] })
    } catch (err) {
        console.error('🔥 /api/createJob error:', err)
        return NextResponse.json({ error: 'Invalid job payload' }, { status: 400 })
    }
}
