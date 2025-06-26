// /api/createJob/route.ts

import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
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

        // Fetch route info
        const { distance_meters, duration_seconds } = await fetchRouteInfo(job.pickup, job.dropoff)

        // Explicit mapping to match your DB column names
        const insertPayload = {
            parts: job.parts,
            pickup: job.pickup,
            dropoff: job.dropoff,
            deadline: job.deadline,
            deadline_display: job.deadlineDisplay,
            distance_meters,
            duration_seconds,
        }

        const { data, error } = await supabase.from('jobs').insert([insertPayload]).select()

        if (error) {
            console.error('🔥 Supabase insert error:', error)
            return NextResponse.json({ error: 'Failed to save job' }, { status: 500 })
        }

        return NextResponse.json({ job: data[0] })
    } catch (err) {
        console.error('🔥 /api/createJob error:', err)
        return NextResponse.json({ error: 'Invalid job payload' }, { status: 400 })
    }
}
