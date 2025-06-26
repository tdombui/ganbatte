// components/ui/job/Map.tsx
'use client'

import { useEffect, useRef } from 'react'

export interface MapProps {
    route?: {
        polyline?: string
        distanceMeters?: number
        duration?: number
    }
}

export default function Map({ route }: MapProps) {
    const mapRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!window.google || !mapRef.current) return

        const map = new window.google.maps.Map(mapRef.current, {
            zoom: 10,
            center: { lat: 33.6846, lng: -117.8265 },
        })

        // Defensive check for polyline
        if (
            route?.polyline &&
            typeof route.polyline === 'string' &&
            window.google.maps.geometry &&
            window.google.maps.geometry.encoding
        ) {
            const decodedPath = window.google.maps.geometry.encoding.decodePath(route.polyline)

            const routePolyline = new window.google.maps.Polyline({
                path: decodedPath,
                geodesic: true,
                strokeColor: '#00FF99',
                strokeOpacity: 1.0,
                strokeWeight: 4,
            })

            routePolyline.setMap(map)

            const bounds = new window.google.maps.LatLngBounds()
            decodedPath.forEach((point) => bounds.extend(point))
            map.fitBounds(bounds)
        } else {
            console.warn('⚠️ No valid polyline available to display route.')
        }
    }, [route])

    return <div ref={mapRef} className="w-full h-[400px] rounded-xl bg-gray-300" />
}
