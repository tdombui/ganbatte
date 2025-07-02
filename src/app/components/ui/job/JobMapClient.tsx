'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'

// Load map dynamically on client only
const Map = dynamic(() => import('./Map'), { ssr: false })

interface JobMapClientProps {
    pickup: string
    dropoff: string
    driverLocation?: {
        lat: number
        lng: number
    } | null
    onRouteLoaded?: (routeData: {
        polyline?: string
        distanceMeters?: number
        duration?: number
    }) => void
}

export default function JobMapClient({ pickup, dropoff, driverLocation, onRouteLoaded }: JobMapClientProps) {
    const [routeData, setRouteData] = useState<{
        polyline?: string
        distanceMeters?: number
        duration?: number
    } | null>(null)

    useEffect(() => {
        const fetchRoute = async () => {
            try {
                const res = await fetch(`/api/mapRoute?pickup=${encodeURIComponent(pickup)}&dropoff=${encodeURIComponent(dropoff)}`)
                const data = await res.json()
                console.log('🔍 Route data received:', data)
                
                if (data && (data.distanceMeters || data.polyline)) {
                    setRouteData(data)
                    if (onRouteLoaded) onRouteLoaded(data)
                } else {
                    console.log('⚠️ Route data is incomplete, but coordinates are available for distance calculation')
                    // Even if route data is incomplete, we can still show the map with coordinates
                    setRouteData({ polyline: undefined, distanceMeters: undefined, duration: undefined })
                }
            } catch (err) {
                console.error('❌ Failed to load route:', err)
                // Set empty route data so map can still render with coordinates
                setRouteData({ polyline: undefined, distanceMeters: undefined, duration: undefined })
            }
        }

        fetchRoute()
    }, [pickup, dropoff, onRouteLoaded])



    if (!routeData) return <p>Loading map...</p>

    return <Map route={routeData} driverLocation={driverLocation} />
}
