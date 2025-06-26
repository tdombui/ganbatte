'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'

// Load map dynamically on client only
const Map = dynamic(() => import('./Map'), { ssr: false })

interface JobMapClientProps {
    pickup: string
    dropoff: string
    onRouteLoaded?: (routeData: {
        polyline: string
        distanceMeters: number
        duration: number
    }) => void
}

export default function JobMapClient({ pickup, dropoff, onRouteLoaded }: JobMapClientProps) {
    const [routeData, setRouteData] = useState<{
        polyline: string
        distanceMeters: number
        duration: number
    } | null>(null)

    useEffect(() => {
        const fetchRoute = async () => {
            try {
                const res = await fetch(`/api/mapRoute?pickup=${encodeURIComponent(pickup)}&dropoff=${encodeURIComponent(dropoff)}`)
                const data = await res.json()
                console.log('Calling onRouteLoaded with:', data)
                setRouteData(data)
                if (onRouteLoaded) onRouteLoaded(data)
            } catch (err) {
                console.error('Failed to load route:', err)
            }
        }

        fetchRoute()
        // ❌ Don't include `onRouteLoaded`
    }, [pickup, dropoff])



    if (!routeData) return <p>Loading map...</p>

    return <Map route={routeData} />
}
