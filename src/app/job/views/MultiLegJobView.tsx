'use client'

import { useEffect, useRef, useState, ChangeEvent } from 'react'
import { formatDeadline } from '@/lib/formatDeadline'
import { JobLeg } from '@/types/job'
import ProgressBar from '@/app/components/ui/job/ProgressBar'
import { useAuthContext } from '../../providers'

interface MultiLegJobViewProps {
    job: {
        id: string
        parts: string[]
        deadline: string
        status: string
        legs: JobLeg[]
    }
}

export default function MultiLegJobView({ job }: MultiLegJobViewProps) {
    const { user } = useAuthContext()
    const mapRef = useRef<HTMLDivElement>(null)
    const [isEditing, setIsEditing] = useState(false)
    const [editedJob, setEditedJob] = useState(job)
    const [route, setRoute] = useState<{
        distanceMeters: number
        duration: number
    } | null>(null)
    const [driverLocation, setDriverLocation] = useState<{ lat: number; lng: number } | null>(null)

    // Check if user is staff or admin
    const isStaffOrAdmin = user?.role === 'staff' || user?.role === 'admin'

    // Haversine function for distance calculation
    function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
        const toRad = (x: number) => (x * Math.PI) / 180
        const R = 6371e3
        const dLat = toRad(lat2 - lat1)
        const dLon = toRad(lon2 - lon1)
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2)
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
        return R * c
    }

    useEffect(() => {
        if (isEditing || !window.google || !mapRef.current || !Array.isArray(job.legs)) return

        const validLegs = job.legs.filter((leg): leg is JobLeg & { pickup_lat: number; pickup_lng: number; dropoff_lat: number; dropoff_lng: number } =>
            leg.pickup_lat !== null && leg.pickup_lng !== null && leg.dropoff_lat !== null && leg.dropoff_lng !== null
        )

        if (validLegs.length < 2) {
            console.warn('Not enough legs to build route.')
            return
        }

        const map = new google.maps.Map(mapRef.current, {
            zoom: 10,
            center: { lat: 33.6846, lng: -117.8265 },
        })

        const origin = {
            lat: validLegs[0].pickup_lat,
            lng: validLegs[0].pickup_lng,
        }

        const destination = {
            lat: validLegs[validLegs.length - 1].dropoff_lat,
            lng: validLegs[validLegs.length - 1].dropoff_lng,
        }

        const waypoints = validLegs.slice(0, -1).flatMap((leg, idx) => {
            return [
                { location: { lat: leg.dropoff_lat, lng: leg.dropoff_lng }, stopover: true },
                { location: { lat: validLegs[idx + 1].pickup_lat, lng: validLegs[idx + 1].pickup_lng }, stopover: true },
            ]
        })

        const directionsService = new google.maps.DirectionsService()
        const directionsRenderer = new google.maps.DirectionsRenderer({ map })

        directionsService.route(
            {
                origin,
                destination,
                waypoints,
                travelMode: google.maps.TravelMode.DRIVING,
                optimizeWaypoints: false,
            },
            (result, status) => {
                if (status === 'OK' && result) {
                    directionsRenderer.setDirections(result)
                    const totalDistance = result.routes[0].legs.reduce((total, leg) => total + (leg.distance?.value || 0), 0)
                    const totalDuration = result.routes[0].legs.reduce((total, leg) => total + (leg.duration?.value || 0), 0)
                    setRoute({ distanceMeters: totalDistance, duration: totalDuration })
                } else {
                    console.error('Directions request failed due to ', status)
                }
            }
        )
    }, [job, isEditing])

    // Fetch driver location
    useEffect(() => {
        async function fetchLocation() {
            try {
                console.log(`📍 Fetching driver location for job ${job.id}...`)
                const res = await fetch(`/api/getDriverLocation?jobId=${job.id}`)
                if (!res.ok) {
                    console.log(`❌ Failed to fetch driver location: ${res.status}`)
                    return
                }
                const data = await res.json()
                if (data && data.latitude && data.longitude) {
                    console.log(`✅ Driver location updated: ${data.latitude}, ${data.longitude}`)
                    setDriverLocation({ lat: data.latitude, lng: data.longitude })
                } else {
                    console.log(`⏳ No driver location available yet (null coordinates)`)
                }
            } catch (error) {
                console.log(`❌ Error fetching driver location:`, error)
            }
        }
        if (job.status === 'active' || job.status === 'currently driving') {
            console.log(`🚗 Starting driver location tracking for job ${job.id} (every 10 seconds)`)
            fetchLocation()
            const interval = setInterval(fetchLocation, 10000)
            return () => {
                console.log(`🛑 Stopping driver location tracking for job ${job.id}`)
                clearInterval(interval)
            }
        }
    }, [job.id, job.status])

    const getGoogleMapsLink = () => {
        const validLegs = job.legs?.filter(
            (leg) =>
                leg.pickup_lat && leg.pickup_lng && leg.dropoff_lat && leg.dropoff_lng
        )

        if (!validLegs?.length) return undefined

        const origin = `${validLegs[0].pickup_lat},${validLegs[0].pickup_lng}`
        const destination = `${validLegs[validLegs.length - 1].dropoff_lat},${validLegs[validLegs.length - 1].dropoff_lng}`

        const allWaypoints = validLegs.flatMap((leg) => [
            `${leg.pickup_lat},${leg.pickup_lng}`,
            `${leg.dropoff_lat},${leg.dropoff_lng}`,
        ])

        const middleWaypoints = allWaypoints.filter(
            (point) => point !== origin && point !== destination
        )

        return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving&waypoints=${encodeURIComponent(middleWaypoints.join('|'))}`
    }

    const getDistanceMiles = () => route ? (route.distanceMeters / 1609.34).toFixed(1) : '—'

    const getPrice = () => {
        if (!route) return '—'
        const baseRate = 30
        const perMile = 1.25
        const partRate = 5
        const partCount = job.parts?.length || 0
        const distanceMiles = route.distanceMeters / 1609.34
        
        // Calculate base price
        const basePrice = baseRate + distanceMiles * perMile + partCount * partRate
        
        // Apply 25% discount for advance bookings (24+ hours)
        let finalPrice = basePrice
        if (job.deadline) {
            const deadlineTime = new Date(job.deadline).getTime()
            const currentTime = new Date().getTime()
            const hoursUntilDeadline = (deadlineTime - currentTime) / (1000 * 60 * 60)
            
            if (hoursUntilDeadline >= 24) {
                finalPrice = basePrice * 0.75 // 25% discount
            }
        }
        
        return finalPrice.toFixed(2)
    }

    const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setEditedJob(prev => {
            if (name === 'parts') {
                const newParts = value.split(',').map(p => p.trim());
                const newLegs = newParts.map((part, index) => {
                    const existingLeg = prev.legs[index] || {};
                    return {
                        ...existingLeg,
                        part: part,
                        pickup: existingLeg.pickup || '',
                        dropoff: existingLeg.dropoff || '',
                        pickup_lat: existingLeg.pickup_lat || 0,
                        pickup_lng: existingLeg.pickup_lng || 0,
                        dropoff_lat: existingLeg.dropoff_lat || 0,
                        dropoff_lng: existingLeg.dropoff_lng || 0,
                    };
                });
                return { ...prev, parts: newParts, legs: newLegs };
            }
            return { ...prev, [name]: value };
        });
    };

    const handleLegInputChange = (index: number, field: 'pickup' | 'dropoff', value: string) => {
        const newLegs = [...editedJob.legs];
        newLegs[index] = { ...newLegs[index], [field]: value };
        setEditedJob({ ...editedJob, legs: newLegs });
    };

    const handleSave = async () => {
        const { id, ...updates } = editedJob;
        const res = await fetch('/api/updateJob', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ jobId: id, updates }),
        });

        if (res.ok) {
            setIsEditing(false);
        } else {
            alert('Failed to update job.');
        }
    };

    // Calculate progress percentage and status for multi-leg jobs
    const getProgressInfo = () => {
        if (!driverLocation) {
            return { percentage: 0, status: 'Waiting to start', color: 'blue' as const }
        }

        // Calculate progress based on completed legs and current position
        const totalLegs = job.legs.length
        let completedLegs = 0
        let currentStatus = 'En route to first pickup'

        // Check which legs are completed based on driver location
        for (let i = 0; i < job.legs.length; i++) {
            const leg = job.legs[i]
            if (leg.pickup_lat && leg.pickup_lng && leg.dropoff_lat && leg.dropoff_lng) {
                const distToPickup = haversine(driverLocation.lat, driverLocation.lng, leg.pickup_lat, leg.pickup_lng)
                const distToDropoff = haversine(driverLocation.lat, driverLocation.lng, leg.dropoff_lat, leg.dropoff_lng)
                
                if (distToDropoff < 100) {
                    // At dropoff for this leg
                    completedLegs = i + 1
                    if (i === job.legs.length - 1) {
                        currentStatus = 'Job completed'
                    } else {
                        currentStatus = `En route to pickup ${i + 2}`
                    }
                } else if (distToPickup < 100) {
                    // At pickup for this leg
                    completedLegs = i
                    currentStatus = `At pickup ${i + 1}`
                } else {
                    // Not at this leg yet
                    break
                }
            }
        }

        const percentage = Math.min(100, (completedLegs / totalLegs) * 100)
        
        // Determine color based on progress
        let color: 'blue' | 'green' | 'yellow' | 'purple' = 'blue'
        if (percentage >= 100) color = 'purple'
        else if (percentage >= 75) color = 'green'
        else if (percentage >= 50) color = 'yellow'

        return { percentage, status: currentStatus, color }
    }

    const progressInfo = getProgressInfo()

    return (
        <div className=" space-y-6 bg-neutral-800/70 p-6 rounded-xl text-white">
            {/* Header at the top */}
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Multi-Trip Job Overview</h1>
                {isStaffOrAdmin && !isEditing ? (
                    <button onClick={() => setIsEditing(true)} className="bg-blue-500 hover:bg-blue-400 text-white font-semibold py-2 px-4 rounded">
                        Edit
                    </button>
                ) : isStaffOrAdmin && isEditing ? (
                    <div className="flex gap-2">
                        <button onClick={handleSave} className="bg-green-500 hover:bg-green-400 text-white font-semibold py-2 px-4 rounded">
                            Save
                        </button>
                        <button onClick={() => { setIsEditing(false); setEditedJob(job); }} className="bg-red-500 hover:bg-red-400 text-white font-semibold py-2 px-4 rounded">
                            Cancel
                        </button>
                    </div>
                ) : null}
            </div>

            {/* Progress Bar */}
            {(job.status === 'active' || job.status === 'currently driving') && (
                <ProgressBar 
                    percentage={progressInfo.percentage} 
                    status={progressInfo.status} 
                    color={progressInfo.color} 
                />
            )}

            {isEditing ? (
                <div>
                    <label className="block font-semibold">Payload</label>
                    <input type="text" name="parts" value={editedJob.parts.join(', ')} onChange={handleInputChange} className="bg-neutral-900 text-white w-full p-2 rounded" />
                </div>
            ) : (
                 <ul className="space-y-2 bg-white/5 p-4 rounded-xl">
                    <li><strong>Payload:</strong> {job.parts?.join(', ')}</li>
                </ul>
            )}

            <div className="space-y-4">
                {editedJob.legs?.map((leg, idx) => (
                    <div key={idx} className="bg-white/5 p-3 rounded">
                        <p><strong>{leg.part}</strong></p>
                        {isEditing ? (
                            <>
                                <div>
                                    <label className="block font-semibold text-sm">Pickup #{idx + 1}</label>
                                    <input type="text" value={leg.pickup} onChange={(e) => handleLegInputChange(idx, 'pickup', e.target.value)} className="bg-neutral-900 text-white w-full p-2 rounded mt-1" />
                                </div>
                                <div>
                                    <label className="block font-semibold text-sm mt-2">Dropoff #{idx + 1}</label>
                                    <input type="text" value={leg.dropoff} onChange={(e) => handleLegInputChange(idx, 'dropoff', e.target.value)} className="bg-neutral-900 text-white w-full p-2 rounded mt-1" />
                                </div>
                            </>
                        ) : (
                            <>
                                <p>Pickup #{idx + 1}: {leg.pickup}</p>
                                <p>Dropoff #{idx + 1}: {leg.dropoff}</p>
                            </>
                        )}
                    </div>
                ))}
            </div>

            {isEditing ? (
                <div className="space-y-4">
                     <div>
                        <label className="block font-semibold">Deadline</label>
                        <input type="datetime-local" name="deadline" value={editedJob.deadline ? editedJob.deadline.slice(0, 16) : ''} onChange={handleInputChange} className="bg-neutral-900 text-white w-full p-2 rounded" />
                    </div>
                    <p><strong>Distance:</strong> {getDistanceMiles()} mi</p>
                    <p><strong>Estimate:</strong> ${getPrice()}</p>
                </div>
            ) : (
                <ul className="space-y-2 bg-white/5 p-4 rounded-xl">
                    <li><strong>Distance:</strong> {getDistanceMiles()} mi</li>
                    <li><strong>Deadline:</strong> {formatDeadline(job.deadline || '')}</li>
                    <li><strong>Estimate:</strong> ${getPrice()}{job.deadline && (new Date(job.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60) >= 24 ? ' (25% advance booking discount applied)' : ''}</li>
                    <li><strong>Status:</strong> {job.status || 'Pending'}</li>
                </ul>
            )}


            {!isEditing && (
                <>
                    <div ref={mapRef} className="w-full h-[400px] rounded-xl bg-gray-300" />
                    {getGoogleMapsLink() && (
                        <div className="pt-4">
                            <a
                                href={getGoogleMapsLink()}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-block bg-lime-500 hover:bg-lime-400 text-black font-bold py-2 px-4 rounded transition"
                            >
                                Open in Google Maps
                            </a>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}
