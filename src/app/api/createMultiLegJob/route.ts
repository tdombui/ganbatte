// src/app/api/createMultiLegJob/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

interface Leg {
    part: string
    pickup: string
    dropoff: string
}

interface EnrichedLeg extends Leg {
    pickup_lat: number | null
    pickup_lng: number | null
    dropoff_lat: number | null
    dropoff_lng: number | null
}

interface RouteLeg {
    distance?: { value: number }
    duration?: { value: number }
}

async function fetchMultiLegRouteInfo(legs: Leg[]) {
    if (!legs || legs.length < 1) return { distance_meters: null, duration_seconds: null }
    const origin = legs[0].pickup
    const destination = legs[legs.length - 1].dropoff
    const waypoints = legs.slice(0, -1).map(leg => leg.dropoff)
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&waypoints=${encodeURIComponent(waypoints.join('|'))}&key=${process.env.GOOGLE_MAPS_API_KEY}`
    const res = await fetch(url)
    const data = await res.json()
    const routeLegs = data.routes?.[0]?.legs || []
    const totalDistance = routeLegs.reduce((sum: number, l: RouteLeg) => sum + (l.distance?.value || 0), 0)
    const totalDuration = routeLegs.reduce((sum: number, l: RouteLeg) => sum + (l.duration?.value || 0), 0)
    return {
        distance_meters: totalDistance || null,
        duration_seconds: totalDuration || null,
    }
}

export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get('authorization')
        if (!authHeader) {
            return NextResponse.json({ error: 'No authorization header' }, { status: 401 })
        }

        const token = authHeader.replace('Bearer ', '')
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
        
        if (authError || !user) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
        }

        const body = await req.json()
        console.log('📦 Received job payload:', body)

        const { parts, deadline, legs } = body

        const geocodeAddress = async (address: string) => {
            // Check if address is already coordinates (decimal degrees format: lat, lng)
            const decimalCoordinatePattern = /^(-?\d+\.?\d*),\s*(-?\d+\.?\d*)$/
            const decimalMatch = address.trim().match(decimalCoordinatePattern)
            
            if (decimalMatch) {
                const lat = parseFloat(decimalMatch[1])
                const lng = parseFloat(decimalMatch[2])
                console.log('✅ Decimal coordinates detected, skipping geocoding:', { lat, lng })
                return { lat, lng }
            }

            // Check if address is coordinates (DMS format: degrees°minutes'seconds"N/S longitude°minutes'seconds"E/W)
            const dmsCoordinatePattern = /^(\d+)°(\d+)'(\d+\.?\d*)"([NS])\s+(\d+)°(\d+)'(\d+\.?\d*)"([EW])$/i
            const dmsMatch = address.trim().match(dmsCoordinatePattern)
            
            if (dmsMatch) {
                // Convert DMS to decimal degrees
                const latDegrees = parseInt(dmsMatch[1])
                const latMinutes = parseInt(dmsMatch[2])
                const latSeconds = parseFloat(dmsMatch[3])
                const latDirection = dmsMatch[4].toUpperCase()
                
                const lngDegrees = parseInt(dmsMatch[5])
                const lngMinutes = parseInt(dmsMatch[6])
                const lngSeconds = parseFloat(dmsMatch[7])
                const lngDirection = dmsMatch[8].toUpperCase()
                
                let lat = latDegrees + (latMinutes / 60) + (latSeconds / 3600)
                let lng = lngDegrees + (lngMinutes / 60) + (lngSeconds / 3600)
                
                if (latDirection === 'S') lat = -lat
                if (lngDirection === 'W') lng = -lng
                
                console.log('✅ DMS coordinates detected, converted to decimal:', { lat, lng })
                return { lat, lng }
            }
            
            // California center coordinates for biasing
            const californiaCenter = '36.7783,-119.4179'
            const res = await fetch(
                `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&location=${californiaCenter}&key=${process.env.GOOGLE_MAPS_API_KEY}`
            )
            const data = await res.json()
            return data.results?.[0]?.geometry?.location || null
        }

        const enrichedLegs = await Promise.all(
            legs.map(async (leg: Leg): Promise<EnrichedLeg> => {
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

        const { data, error } = await supabaseAdmin
            .from('jobs')
            .insert([
                {
                    user_id: user.id,
                    parts,
                    deadline,
                    legs: enrichedLegs,
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

        console.log('✅ Job created successfully:', data?.[0]?.id)
        return NextResponse.json({
            success: true,
            jobId: data?.[0]?.id ?? null,
        })

    } catch (error) {
        console.error('❌ Unexpected error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
