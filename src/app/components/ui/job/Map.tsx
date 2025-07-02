// components/ui/job/Map.tsx
'use client'

import { useEffect, useRef } from 'react'

export interface MapProps {
    route?: {
        polyline?: string
        distanceMeters?: number
        duration?: number
    }
    driverLocation?: {
        lat: number
        lng: number
    } | null
}

export default function Map({ route, driverLocation }: MapProps) {
    const mapRef = useRef<HTMLDivElement>(null)
    const mapInstanceRef = useRef<google.maps.Map | null>(null)
    const driverMarkerRef = useRef<google.maps.Marker | null>(null)

    useEffect(() => {
        if (!window.google || !mapRef.current) return

        const map = new window.google.maps.Map(mapRef.current, {
            zoom: 10,
            center: { lat: 33.6846, lng: -117.8265 },
        })
        mapInstanceRef.current = map

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

    // Handle driver location marker
    useEffect(() => {
        if (!window.google || !mapInstanceRef.current || !driverLocation) return

        const map = mapInstanceRef.current

        // Create or update driver marker
        if (driverMarkerRef.current) {
            // Update existing marker position
            driverMarkerRef.current.setPosition(driverLocation)
        } else {
            // Create new driver marker
            driverMarkerRef.current = new window.google.maps.Marker({
                position: driverLocation,
                map: map,
                icon: {
                    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                        <svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="10" cy="10" r="8" fill="#3B82F6" stroke="white" stroke-width="2"/>
                        </svg>
                    `),
                    scaledSize: new window.google.maps.Size(20, 20),
                    anchor: new window.google.maps.Point(10, 10)
                },
                title: 'Driver Location'
            })
        }
    }, [driverLocation])

    return <div ref={mapRef} className="w-full h-[400px] rounded-xl bg-gray-300" />
}
