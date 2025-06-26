import { supabase } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'
import { JobLeg } from '@/types/job'

const geocodeAddress = async (address: string) => {
    if (!address) return null;
    // California center coordinates for biasing
    const californiaCenter = '36.7783,-119.4179'
    const res = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&location=${californiaCenter}&key=${process.env.GOOGLE_MAPS_API_KEY}`
    )
    const data = await res.json()
    return data.results?.[0]?.geometry?.location || null
}

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

export async function POST(req: NextRequest) {
    const { jobId, updates } = await req.json()

    if (!jobId || !updates) {
        return NextResponse.json({ error: 'Missing jobId or updates' }, { status: 400 })
    }

    if (updates.legs && Array.isArray(updates.legs)) {
        updates.legs = await Promise.all(
            updates.legs.map(async (leg: JobLeg) => {
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
    }

    // If pickup or dropoff is being updated, fetch and store route info
    if (updates.pickup || updates.dropoff) {
        const pickup = updates.pickup
        const dropoff = updates.dropoff
        const { distance_meters, duration_seconds } = await fetchRouteInfo(pickup, dropoff)
        updates.distance_meters = distance_meters
        updates.duration_seconds = duration_seconds
    }

    const { data, error } = await supabase
        .from('jobs')
        .update(updates)
        .eq('id', jobId)
        .select()
        .single()

    if (error) {
        console.error('Error updating job:', error)
        return NextResponse.json({ error: 'Failed to update job', details: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, job: data })
} 