import React, { useState, useCallback, ChangeEvent, useEffect } from 'react'
import JobMapClient from '@/app/components/ui/job/JobMapClient'
import Link from 'next/link'
import { ParsedJob } from '@/types/job'
import { formatDeadline } from '@/lib/formatDeadline'
import ProgressBar from '@/app/components/ui/job/ProgressBar'
import { createClient } from '@/lib/supabase/client'
import { useAuthContext } from '../../providers'
import { PRICING, HQ_ADDRESS, HQ_COORDINATES } from '@/lib/config'

export default function SingleLegJobView({ job, onJobUpdate }: { job: ParsedJob; onJobUpdate?: (updatedJob: ParsedJob) => void }) {
    const { user } = useAuthContext()
    const [isEditing, setIsEditing] = useState(false)
    const [editedJob, setEditedJob] = useState(job)

    // Debug logging to see what we're getting
    console.log('🔍 Job data received:', job)
    console.log('🔍 Job parts:', job.parts, 'Type:', typeof job.parts, 'Is array:', Array.isArray(job.parts))

    const [driverLocation, setDriverLocation] = useState<{ lat: number; lng: number } | null>(null)
    const [route, setRoute] = useState<{
        distanceMeters?: number
        duration?: number
    } | null>(null)

    // Get coordinates from job
    const pickupLat = (job as { pickup_lat?: number }).pickup_lat
    const pickupLng = (job as { pickup_lng?: number }).pickup_lng
    const dropoffLat = (job as { dropoff_lat?: number }).dropoff_lat
    const dropoffLng = (job as { dropoff_lng?: number }).dropoff_lng

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

    // Ensure parts is always an array
    const safeParts = Array.isArray(job.parts) ? job.parts : (job.parts ? [job.parts] : [])

    const getDistanceMiles = () => {
        if (route && route.distanceMeters) {
            return (route.distanceMeters / 1609.34).toFixed(1)
        }
        
        // Fallback: calculate distance using coordinates if available
        if (pickupLat && pickupLng && dropoffLat && dropoffLng) {
            const distanceMeters = haversine(pickupLat, pickupLng, dropoffLat, dropoffLng)
            return (distanceMeters / 1609.34).toFixed(1)
        }
        
        return '—'
    }

    const getPrice = () => {
        let distanceMiles: number
        
        if (route && route.distanceMeters) {
            distanceMiles = route.distanceMeters / 1609.34
        } else if (pickupLat && pickupLng && dropoffLat && dropoffLng) {
            // Fallback: calculate distance using coordinates
            const distanceMeters = haversine(pickupLat, pickupLng, dropoffLat, dropoffLng)
            distanceMiles = distanceMeters / 1609.34
        } else {
            return '—'
        }
        
        const partCount = safeParts.length
        
        // Calculate base price using HQ-based total distance
        const basePrice = PRICING.baseRate + distanceMiles * PRICING.perMile + partCount * PRICING.partRate
        
        // Apply discount for advance bookings
        let finalPrice = basePrice
        if (job.deadline) {
            const deadlineTime = new Date(job.deadline).getTime()
            const currentTime = new Date().getTime()
            const hoursUntilDeadline = (deadlineTime - currentTime) / (1000 * 60 * 60)
            
            if (hoursUntilDeadline >= PRICING.advanceBookingHours) {
                finalPrice = basePrice * (1 - PRICING.advanceBookingDiscount)
            }
        }
        
        return finalPrice.toFixed(2)
    }

    const handleRouteLoaded = useCallback((data: { polyline?: string; distanceMeters?: number; duration?: number }) => {
        setRoute(data)
    }, [])

    const getGoogleMapsLink = () => {
        if (!job.pickup || !job.dropoff) return null
        const hq = encodeURIComponent(HQ_ADDRESS)
        const pickup = encodeURIComponent(job.pickup)
        const dropoff = encodeURIComponent(job.dropoff)
        return `https://www.google.com/maps/dir/?api=1&origin=${hq}&destination=${dropoff}&waypoints=${pickup}&travelmode=driving`
    }

    const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        if (name === 'parts') {
            setEditedJob({ ...editedJob, parts: value.split(',').map(p => p.trim()) })
        } else if (name === 'deadline') {
            setEditedJob({ ...editedJob, deadline: new Date(value).toISOString() })
        } else {
            setEditedJob({ ...editedJob, [name]: value })
        }
    }

    const handleSave = async () => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id, ...updates } = editedJob;
        const res = await fetch('/api/updateJob', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ jobId: job.id, updates }),
        });

        if (res.ok) {
            setIsEditing(false)
        } else {
            alert('Failed to update job.')
        }
    }

    // Manual status update functions
    const updateJobStatus = async (newStatus: string) => {
        try {
            const supabase = createClient()
            const { data: { session } } = await supabase.auth.getSession()
            const token = session?.access_token

            if (!token) {
                console.error('No session token available')
                return
            }

            const res = await fetch('/api/updateJob', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    jobId: job.id,
                    updates: { status: newStatus },
                }),
            })

            if (res.ok) {
                console.log(`✅ Job status updated to: ${newStatus}`)
                // Update local state by calling the callback
                const updatedJob = { ...job, status: newStatus }
                console.log(`🔄 Status updated locally to: ${newStatus}`)
                
                // Call the callback to update parent state
                if (onJobUpdate) {
                    onJobUpdate(updatedJob)
                }
            } else {
                console.error('Failed to update job status:', res.status)
            }
        } catch (error) {
            console.error('Error updating job status:', error)
        }
    }

    const handleStartJob = () => updateJobStatus('en_route')
    const handleStartLoading = () => updateJobStatus('loading')
    const handleFinishLoading = () => updateJobStatus('driving')
    const handleCompleteJob = () => updateJobStatus('completed')

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
        if (job.status !== 'planned' && job.status !== 'completed') {
            console.log(`🚗 Starting driver location tracking for job ${job.id} (every 10 seconds)`)
            fetchLocation()
            const interval = setInterval(fetchLocation, 10000)
            return () => {
                console.log(`🛑 Stopping driver location tracking for job ${job.id}`)
                clearInterval(interval)
            }
        }
    }, [job.id, job.status])

    // Calculate progress percentage and status
    const getProgressInfo = () => {
        // Check job status first - if completed, show 100% regardless of driver location
        if (job.status === 'completed') {
            return { percentage: 100, status: 'Job completed', color: 'purple' as const }
        }
        
        // If no driver location and job not completed, show waiting status
        if (!driverLocation) {
            return { percentage: 0, status: 'Waiting to start', color: 'blue' as const }
        }

        if (pickupLat && pickupLng && dropoffLat && dropoffLng) {
            const distToPickup = haversine(driverLocation.lat, driverLocation.lng, pickupLat, pickupLng)
            const distToDropoff = haversine(driverLocation.lat, driverLocation.lng, dropoffLat, dropoffLng)
            
            // Check if pickup is complete (either status is 'driving' or manual confirmation)
            const pickupComplete = job.status === 'driving'
            
            // Auto-complete job only if pickup is complete AND within 50m of dropoff
            if (pickupComplete && distToDropoff <= 50) {
                return { percentage: 100, status: 'Job completed', color: 'purple' as const }
            }
            
            // Determine progress based on GPS position and job status
            if (distToPickup <= 50) {
                // At pickup location (0-50m)
                if (job.status === 'loading') {
                    return { percentage: 40, status: 'Loading items', color: 'yellow' as const }
                } else if (pickupComplete) {
                    return { percentage: 50, status: 'Driving to dropoff', color: 'blue' as const }
                } else {
                    return { percentage: 30, status: 'At pickup location', color: 'green' as const }
                }
            } else if (distToPickup <= 100) {
                // Approaching pickup (50-100m)
                return { percentage: 25, status: 'Approaching pickup', color: 'blue' as const }
            } else if (pickupComplete && distToDropoff <= 100) {
                // At dropoff location (only if pickup is complete)
                return { percentage: 95, status: 'At dropoff location', color: 'green' as const }
            } else {
                // Not at pickup or dropoff - determine direction
                const hqToPickup = haversine(HQ_COORDINATES.lat, HQ_COORDINATES.lng, pickupLat, pickupLng)
                const pickupToDropoff = haversine(pickupLat, pickupLng, dropoffLat, dropoffLng)
                const hqToCurrent = haversine(HQ_COORDINATES.lat, HQ_COORDINATES.lng, driverLocation.lat, driverLocation.lng)
                
                if (pickupComplete) {
                    // Pickup complete - driving to dropoff
                    const distanceFromPickup = haversine(pickupLat, pickupLng, driverLocation.lat, driverLocation.lng)
                    const progress = 50 + Math.floor((distanceFromPickup / pickupToDropoff) * 35)
                    return { percentage: progress, status: 'Driving to dropoff', color: 'blue' as const }
                } else if (distToDropoff < distToPickup) {
                    // Closer to dropoff than pickup (but pickup not complete) - still en route to pickup
                    const progress = Math.floor((hqToCurrent / hqToPickup) * 20)
                    return { percentage: progress, status: 'En route to pickup', color: 'blue' as const }
                } else {
                    // Still en route to pickup
                    const progress = Math.floor((hqToCurrent / hqToPickup) * 20)
                    return { percentage: progress, status: 'En route to pickup', color: 'blue' as const }
                }
            }
        }
        
        // Fallback based on job status only
        switch (job.status) {
            case 'planned':
                return { percentage: 0, status: 'Job planned', color: 'blue' as const }
            case 'en_route':
                return { percentage: 20, status: 'En route to pickup', color: 'blue' as const }
            case 'loading':
                return { percentage: 40, status: 'Loading items', color: 'yellow' as const }
            case 'driving':
                return { percentage: 60, status: 'Driving to dropoff', color: 'blue' as const }
            case 'completed':
                return { percentage: 100, status: 'Job completed', color: 'purple' as const }
            default:
                return { percentage: 0, status: 'Waiting to start', color: 'blue' as const }
        }
    }

    const progressInfo = getProgressInfo()

    // Check if user is staff or admin
    const isStaffOrAdmin = user?.role === 'staff' || user?.role === 'admin'

    return (
        <div className="space-y-6 bg-neutral-800/70 p-6 rounded-xl text-white">
            {/* Header at the top */}
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Job Overview</h1>
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
            <ProgressBar 
                percentage={progressInfo.percentage} 
                status={progressInfo.status} 
                color={progressInfo.color} 
            />
            
            {/* Action Buttons */}
            {isStaffOrAdmin && (
                <div className="flex flex-wrap gap-2 justify-center">
                    {job.status === 'planned' && (
                        <button 
                            onClick={handleStartJob}
                            className="bg-green-500 hover:bg-green-400 text-white font-semibold py-2 px-4 rounded"
                        >
                            🚗 Start Job
                        </button>
                    )}
                    
                    {/* Show loading button when at pickup and not already loading/driving/completed */}
                    {driverLocation && pickupLat && pickupLng && 
                     haversine(driverLocation.lat, driverLocation.lng, pickupLat, pickupLng) < 100 && 
                     job.status && !['loading', 'driving', 'completed'].includes(job.status) && (
                        <button 
                            onClick={handleStartLoading}
                            className="bg-blue-500 hover:bg-blue-400 text-white font-semibold py-2 px-4 rounded"
                        >
                            📦 Start Loading
                        </button>
                    )}
                    
                    {/* Show finish loading button only when status is loading */}
                    {job.status === 'loading' && (
                        <button 
                            onClick={handleFinishLoading}
                            className="bg-orange-500 hover:bg-orange-400 text-white font-semibold py-2 px-4 rounded"
                        >
                            ✅ Finish Loading
                        </button>
                    )}
                    
                    {/* Show completion button when at dropoff and not completed */}
                    {driverLocation && dropoffLat && dropoffLng && 
                     haversine(driverLocation.lat, driverLocation.lng, dropoffLat, dropoffLng) < 100 && 
                     job.status !== 'completed' && (
                        <button 
                            onClick={handleCompleteJob}
                            className="bg-purple-500 hover:bg-purple-400 text-white font-semibold py-2 px-4 rounded"
                        >
                            🎉 Complete Job
                        </button>
                    )}
                </div>
            )}

            {isEditing ? (
                <div className="space-y-4">
                    <div>
                        <label className="block font-semibold">Payload</label>
                        <input type="text" name="parts" value={safeParts.join(', ')} onChange={handleInputChange} className="bg-neutral-900 text-white w-full p-2 rounded" />
                    </div>
                    <div>
                        <label className="block font-semibold">Pickup</label>
                        <input type="text" name="pickup" value={editedJob.pickup} onChange={handleInputChange} className="bg-neutral-900 text-white w-full p-2 rounded" />
                    </div>
                    <div>
                        <label className="block font-semibold">Dropoff</label>
                        <input type="text" name="dropoff" value={editedJob.dropoff} onChange={handleInputChange} className="bg-neutral-900 text-white w-full p-2 rounded" />
                    </div>
                    <div>
                        <label className="block font-semibold">Deadline</label>
                        <input type="datetime-local" name="deadline" value={editedJob.deadline ? editedJob.deadline.slice(0, 16) : ''} onChange={handleInputChange} className="bg-neutral-900 text-white w-full p-2 rounded" />
                    </div>
                </div>
            ) : (
                <span className='space-y-4'>
                    <ul className="space-y-2 bg-white/5 p-4 rounded-xl">
                        <li><strong>Payload:</strong> {safeParts.length > 0 ? safeParts.join(', ') : 'No parts specified'}</li>
                        <li><strong>Pickup:</strong> {job.pickup}</li>
                        <li><strong>Dropoff:</strong> {job.dropoff}</li>
                    </ul>
                    <ul className="space-y-2 bg-white/5 p-4 mb-4 rounded-xl">
                        <li><strong>Route:</strong> HQ → Pickup → Dropoff</li>
                        <li><strong>Total Distance:</strong> {getDistanceMiles()} mi (from {HQ_ADDRESS})</li>
                        <li><strong>Deadline:</strong> {formatDeadline(job.deadline || '')}</li>
                        <li><strong>Estimate:</strong> ${getPrice()}{job.deadline && (new Date(job.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60) >= PRICING.advanceBookingHours ? ` (${PRICING.advanceBookingDiscount * 100}% advance booking discount applied)` : ''}</li>
                        <li><strong>Status:</strong> {job.status || 'No status'}</li>
                    </ul>
                </span>
            )}

            <JobMapClient
                pickup={job.pickup}
                dropoff={job.dropoff}
                driverLocation={driverLocation}
                onRouteLoaded={handleRouteLoaded}
            />

            {getGoogleMapsLink() ? (
                <Link
                    href={getGoogleMapsLink() as string}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-1 bg-lime-500 hover:bg-lime-400 text-black font-semibold py-2 px-4 rounded"
                >
                    Open in Google Maps
                </Link>
            ) : null}
        </div>
    )
}
