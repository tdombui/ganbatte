// /api/createJob/route.ts

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { ParsedJob } from '@/types/job'

async function geocodeAddress(address: string) {
    if (!address) return { lat: null, lng: null }
    
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

        // Geocode addresses to get coordinates
        console.log('🔍 Geocoding addresses...')
        const pickupCoords = await geocodeAddress(job.pickup)
        const dropoffCoords = await geocodeAddress(job.dropoff)
        
        console.log('🔍 Pickup coordinates:', pickupCoords)
        console.log('🔍 Dropoff coordinates:', dropoffCoords)

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
            pickup_lat: pickupCoords.lat,
            pickup_lng: pickupCoords.lng,
            dropoff_lat: dropoffCoords.lat,
            dropoff_lng: dropoffCoords.lng,
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
