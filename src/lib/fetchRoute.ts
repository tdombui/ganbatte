// lib/fetchRoute.ts

// Helper function to convert DMS coordinates to decimal
function dmsToDecimal(dmsString: string): { lat: number; lng: number } | null {
    const dmsPattern = /^(\d+)°(\d+)'(\d+\.?\d*)"([NS])\s+(\d+)°(\d+)'(\d+\.?\d*)"([EW])$/i
    const match = dmsString.trim().match(dmsPattern)
    
    if (match) {
        const latDegrees = parseInt(match[1])
        const latMinutes = parseInt(match[2])
        const latSeconds = parseFloat(match[3])
        const latDirection = match[4].toUpperCase()
        
        const lngDegrees = parseInt(match[5])
        const lngMinutes = parseInt(match[6])
        const lngSeconds = parseFloat(match[7])
        const lngDirection = match[8].toUpperCase()
        
        let lat = latDegrees + (latMinutes / 60) + (latSeconds / 3600)
        let lng = lngDegrees + (lngMinutes / 60) + (lngSeconds / 3600)
        
        if (latDirection === 'S') lat = -lat
        if (lngDirection === 'W') lng = -lng
        
        return { lat, lng }
    }
    return null
}

// Helper function to check if string is decimal coordinates
function isDecimalCoordinates(coordString: string): { lat: number; lng: number } | null {
    const decimalPattern = /^(-?\d+\.?\d*),\s*(-?\d+\.?\d*)$/
    const match = coordString.trim().match(decimalPattern)
    
    if (match) {
        return {
            lat: parseFloat(match[1]),
            lng: parseFloat(match[2])
        }
    }
    return null
}

import { HQ_ADDRESS } from './config'

export async function fetchRoute(pickup: string, dropoff: string) {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY
    const url = `https://routes.googleapis.com/directions/v2:computeRoutes`

    // Calculate total route: HQ → pickup → dropoff → HQ
    // We'll use waypoints to create a multi-stop route
    
    // Check if pickup is coordinates
    let pickupLocation: { address: string } | { location: { latLng: { latitude: number; longitude: number } } }
    const pickupDecimal = isDecimalCoordinates(pickup)
    const pickupDms = dmsToDecimal(pickup)
    
    if (pickupDecimal) {
        pickupLocation = { location: { latLng: { latitude: pickupDecimal.lat, longitude: pickupDecimal.lng } } }
    } else if (pickupDms) {
        pickupLocation = { location: { latLng: { latitude: pickupDms.lat, longitude: pickupDms.lng } } }
    } else {
        pickupLocation = { address: pickup }
    }

    // Check if dropoff is coordinates
    let dropoffLocation: { address: string } | { location: { latLng: { latitude: number; longitude: number } } }
    const dropoffDecimal = isDecimalCoordinates(dropoff)
    const dropoffDms = dmsToDecimal(dropoff)
    
    if (dropoffDecimal) {
        dropoffLocation = { location: { latLng: { latitude: dropoffDecimal.lat, longitude: dropoffDecimal.lng } } }
    } else if (dropoffDms) {
        dropoffLocation = { location: { latLng: { latitude: dropoffDms.lat, longitude: dropoffDms.lng } } }
    } else {
        dropoffLocation = { address: dropoff }
    }

    console.log('🔍 fetchRoute: Processing route (HQ → pickup → dropoff)', {
        hq: HQ_ADDRESS,
        pickup,
        dropoff,
        pickupType: pickupDecimal ? 'decimal_coords' : pickupDms ? 'dms_coords' : 'address',
        dropoffType: dropoffDecimal ? 'decimal_coords' : dropoffDms ? 'dms_coords' : 'address'
    })

    // Calculate route: HQ → pickup → dropoff
    // We need to include the pickup coordinates as a waypoint
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': apiKey!,
            'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline,routes.legs',
        },
        body: JSON.stringify({
            origin: { address: HQ_ADDRESS },
            destination: dropoffLocation,
            intermediates: [pickupLocation], // Use intermediates instead of waypoints
            travelMode: 'DRIVE',
        }),
    })

    const data = await response.json()

    if (!data.routes || data.routes.length === 0) {
        console.error('❌ fetchRoute: No routes found', data)
        return {
            polyline: null,
            distanceMeters: null,
            duration: null,
        }
    }

    const route = data.routes[0]
    
    // Calculate total distance and duration from all legs
    let totalDistanceMeters = 0
    let totalDurationSeconds = 0
    
    if (route.legs) {
        route.legs.forEach((leg: { distanceMeters?: number; duration?: number }) => {
            totalDistanceMeters += leg.distanceMeters || 0
            totalDurationSeconds += leg.duration || 0
        })
    }

    console.log('🔍 fetchRoute: Route calculated', {
        totalDistanceMeters,
        totalDurationSeconds,
        legs: route.legs?.length || 0
    })

    return {
        polyline: route.polyline?.encodedPolyline || null,
        distanceMeters: totalDistanceMeters || route.distanceMeters || null,
        duration: totalDurationSeconds || route.duration || null,
    }
}
