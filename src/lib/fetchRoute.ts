// lib/fetchRoute.ts
export async function fetchRoute(pickup: string, dropoff: string) {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY
    const url = `https://routes.googleapis.com/directions/v2:computeRoutes`

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': apiKey!,
            'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline',
        },
        body: JSON.stringify({
            origin: { address: pickup },
            destination: { address: dropoff },
            travelMode: 'DRIVE',
        }),
    })

    const data = await response.json()

    const route = data.routes?.[0]
    return {
        polyline: route.polyline.encodedPolyline,
        distanceMeters: route.distanceMeters,
        duration: route.duration,
    }
}
