// src/app/api/createMultiLegJob/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! // only use on server
)

async function fetchMultiLegRouteInfo(legs: any[]) {
    if (!legs || legs.length < 1) return { distance_meters: null, duration_seconds: null }
    const origin = legs[0].pickup
    const destination = legs[legs.length - 1].dropoff
    const waypoints = legs.slice(0, -1).map(leg => leg.dropoff)
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&waypoints=${encodeURIComponent(waypoints.join('|'))}&key=${process.env.GOOGLE_MAPS_API_KEY}`
    const res = await fetch(url)
    const data = await res.json()
    const routeLegs = data.routes?.[0]?.legs || []
    const totalDistance = routeLegs.reduce((sum: number, l: any) => sum + (l.distance?.value || 0), 0)
    const totalDuration = routeLegs.reduce((sum: number, l: any) => sum + (l.duration?.value || 0), 0)
    return {
        distance_meters: totalDistance || null,
        duration_seconds: totalDuration || null,
    }
}

export async function POST(req: NextRequest) {
    const body = await req.json()
    console.log('📦 Received job payload:', body)

    const { parts, deadline, legs } = body

    const geocodeAddress = async (address: string) => {
        const res = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${process.env.GOOGLE_MAPS_API_KEY}`
        )
        const data = await res.json()
        return data.results?.[0]?.geometry?.location || null
    }

    const enrichedLegs = await Promise.all(
        legs.map(async (leg: any) => {
            const pickupGeo = await geocodeAddress(leg.pickup)
            const dropoffGeo = await geocodeAddress(leg.dropoff)

            return {
                ...leg,
                pickup_lat: pickupGeo?.lat ?? null,
                pickup_lng: pickupGeo?.lng ?? null,
                dropoff_lat: dropoffGeo?.lat ?? null,
                dropoff_lng: dropoffGeo?.lng ?? null,
            }
        })
    )

    // Fetch route info for the full multi-leg route
    const { distance_meters, duration_seconds } = await fetchMultiLegRouteInfo(legs)

    const { data, error } = await supabase
        .from('jobs')
        .insert([
            {
                parts,
                deadline,
                legs: enrichedLegs, // ✅ now you're inserting the correct data
                status: 'pending',
                created_at: new Date().toISOString(),
                distance_meters,
                duration_seconds,
            },
        ])
        .select()

    if (error) {
        console.error('❌ Supabase error:', error)
        return NextResponse.json({ error: 'Insert failed', details: error }, { status: 500 })
    }

    return NextResponse.json({
        success: true,
        jobId: data?.[0]?.id ?? null,
    })
}
