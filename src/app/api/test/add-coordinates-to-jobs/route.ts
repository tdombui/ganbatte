import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

async function geocodeAddress(address: string) {
    if (!address) return { lat: null, lng: null }
    
    try {
        const res = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${process.env.GOOGLE_MAPS_API_KEY}`
        )
        const data = await res.json()
        
        if (data.results && data.results.length > 0) {
            const location = data.results[0].geometry.location
            return { lat: location.lat, lng: location.lng }
        }
    } catch (error) {
        console.error('🔥 Geocoding error for address:', address, error)
    }
    
    return { lat: null, lng: null }
}

export async function GET() {
    try {
        // Get all jobs that don't have coordinates
        const { data: jobs, error: fetchError } = await supabaseAdmin
            .from('jobs')
            .select('id, pickup, dropoff, pickup_lat, pickup_lng, dropoff_lat, dropoff_lng')
            .or('pickup_lat.is.null,pickup_lng.is.null,dropoff_lat.is.null,dropoff_lng.is.null')

        if (fetchError) {
            console.error('🔥 Error fetching jobs:', fetchError)
            return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 })
        }

        console.log(`🔍 Found ${jobs?.length || 0} jobs without coordinates`)

        const results = []

        for (const job of jobs || []) {
            console.log(`🔍 Processing job ${job.id}:`)
            console.log(`  Pickup: ${job.pickup}`)
            console.log(`  Dropoff: ${job.dropoff}`)

            // Geocode addresses
            const pickupCoords = await geocodeAddress(job.pickup)
            const dropoffCoords = await geocodeAddress(job.dropoff)

            console.log(`  Pickup coordinates:`, pickupCoords)
            console.log(`  Dropoff coordinates:`, dropoffCoords)

            // Update the job with coordinates
            const { error: updateError } = await supabaseAdmin
                .from('jobs')
                .update({
                    pickup_lat: pickupCoords.lat,
                    pickup_lng: pickupCoords.lng,
                    dropoff_lat: dropoffCoords.lat,
                    dropoff_lng: dropoffCoords.lng,
                })
                .eq('id', job.id)

            if (updateError) {
                console.error(`🔥 Error updating job ${job.id}:`, updateError)
                results.push({ jobId: job.id, success: false, error: updateError.message })
            } else {
                console.log(`✅ Successfully updated job ${job.id}`)
                results.push({ jobId: job.id, success: true, pickupCoords, dropoffCoords })
            }
        }

        return NextResponse.json({
            message: `Processed ${jobs?.length || 0} jobs`,
            results
        })

    } catch (error) {
        console.error('🔥 Unexpected error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
} 