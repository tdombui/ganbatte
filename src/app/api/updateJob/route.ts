import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { createClient } from '@supabase/supabase-js'
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

export async function POST(req: Request) {
    try {
        // Get the authorization header
        const authHeader = req.headers.get('authorization')
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.error('Missing or invalid authorization header')
            return NextResponse.json({ error: 'Missing authorization header' }, { status: 401 })
        }

        // Extract the token
        const token = authHeader.replace('Bearer ', '')
        
        // Verify the user with the token
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
        
        if (authError || !user) {
            console.error('Authentication error:', authError)
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
        }

        console.log('🔍 API: User authenticated for job update:', user.id)

        // Create a new Supabase client with the user's token for RLS
        const supabaseWithAuth = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                global: {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            }
        )

        // Check if user is staff/admin for job updates using the authenticated client
        const { data: profile, error: profileError } = await supabaseWithAuth
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if (profileError || !profile) {
            console.error('Profile error:', profileError)
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
        }

        const isStaff = profile.role === 'staff' || profile.role === 'admin'
        if (!isStaff) {
            return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
        }

        const { jobId, updates } = await req.json()

        if (!jobId || !updates) {
            return NextResponse.json({ error: 'Missing jobId or updates' }, { status: 400 })
        }

        console.log('Updating job:', jobId, 'with updates:', updates)

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

        // Use the authenticated client for the update operation
        const { data, error } = await supabaseWithAuth
            .from('jobs')
            .update(updates)
            .eq('id', jobId)
            .select()
            .single()

        if (error) {
            console.error('Error updating job:', error)
            return NextResponse.json({ error: 'Failed to update job', details: error.message }, { status: 500 })
        }

        console.log('Job updated successfully:', data)
        return NextResponse.json({ success: true, job: data })

    } catch (error) {
        console.error('Unexpected error in updateJob:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
} 