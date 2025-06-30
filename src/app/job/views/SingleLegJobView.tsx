import React, { useState, useCallback, ChangeEvent, useEffect } from 'react'
import JobMapClient from '@/app/components/ui/job/JobMapClient'
import Link from 'next/link'
import { ParsedJob } from '@/types/job'
import { formatDeadline } from '@/lib/formatDeadline'
import ProgressBar from '@/app/components/ui/job/ProgressBar'
import { createClient } from '@/lib/supabase/client'

export default function SingleLegJobView({ job }: { job: ParsedJob }) {
    const [isEditing, setIsEditing] = useState(false)
    const [editedJob, setEditedJob] = useState(job)

    // Debug logging to see what we're getting
    console.log('🔍 Job data received:', job)
    console.log('🔍 Job parts:', job.parts, 'Type:', typeof job.parts, 'Is array:', Array.isArray(job.parts))

    const [route, setRoute] = useState<{
        distanceMeters: number
        duration: number
    } | null>(null)

    const [driverLocation, setDriverLocation] = useState<{ lat: number; lng: number } | null>(null)
    const [completed, setCompleted] = useState<number[]>([0])
    const [current, setCurrent] = useState(0)

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

    const getDistanceMiles = () => route ? (route.distanceMeters / 1609.34).toFixed(1) : '—'

    const getPrice = () => {
        if (!route) return '—'
        const baseRate = 30
        const perMile = 1.25
        const partRate = 5
        const partCount = safeParts.length
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

    const handleRouteLoaded = useCallback((data: { polyline: string; distanceMeters: number; duration: number }) => {
        setRoute(data)
    }, [])

    const getGoogleMapsLink = () => {
        if (!job.pickup || !job.dropoff) return null
        const origin = encodeURIComponent(job.pickup)
        const destination = encodeURIComponent(job.dropoff)
        return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`
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

    // 7-node progress bar
    const progressNodes = [
        'Start',
        'En Route', 
        'Pickup',
        'Loading',
        'Driving',
        'Dropoff',
        'Complete'
    ]

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
                // Update local state instead of reloading page
                // This keeps GPS tracking active
                // Note: We'll need to update the job prop from parent component
                // For now, just log the success
                console.log(`🔄 Status updated locally to: ${newStatus}`)
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

    // Calculate progress
    useEffect(() => {
        if (!driverLocation) return
        
        console.log('📍 Progress calculation debug:')
        console.log('  Driver location:', driverLocation)
        console.log('  Pickup coordinates:', { lat: pickupLat, lng: pickupLng })
        console.log('  Dropoff coordinates:', { lat: dropoffLat, lng: dropoffLng })
        console.log('  Current job status:', job.status)
        
        if (pickupLat && pickupLng && dropoffLat && dropoffLng) {
            const distToPickup = haversine(driverLocation.lat, driverLocation.lng, pickupLat, pickupLng)
            const distToDropoff = haversine(driverLocation.lat, driverLocation.lng, dropoffLat, dropoffLng)
            
            console.log('  Distance to pickup:', distToPickup, 'meters')
            console.log('  Distance to dropoff:', distToDropoff, 'meters')
            
            // Determine current progress based on GPS position ONLY
            let completedNodes: number[] = [0] // Start is always complete
            let currentStep = 0
            
            // Pure GPS-based logic - ignore job.status for visual progress
            if (distToPickup < 100) {
                // At pickup location
                completedNodes = [0, 1, 2] // Start, En Route, Pickup complete
                currentStep = 3 // Loading (regardless of job.status)
            } else if (distToDropoff < 100) {
                // At dropoff location
                completedNodes = [0, 1, 2, 3, 4] // Start, En Route, Pickup, Loading, Driving complete
                currentStep = 5 // Dropoff
            } else if (distToPickup < distToDropoff) {
                // Closer to pickup than dropoff - en route to pickup
                completedNodes = [0] // Start complete
                currentStep = 1 // En Route
            } else {
                // Closer to dropoff than pickup - driving to dropoff
                completedNodes = [0, 1, 2, 3] // Start, En Route, Pickup, Loading complete
                currentStep = 4 // Driving
            }
            
            console.log('  Final progress state:', { 
                completed: completedNodes, 
                currentStep,
                distToPickup: Math.round(distToPickup),
                distToDropoff: Math.round(distToDropoff)
            })
            
            setCompleted(completedNodes)
            setCurrent(currentStep)
        } else {
            console.log('  ❌ No pickup/dropoff coordinates available in job data')
            setCompleted([0])
            setCurrent(0)
        }
    }, [driverLocation, job.id, job.status])

    return (
        <div className="space-y-6 bg-neutral-800/70 p-6 rounded-xl text-white">
            <ProgressBar nodes={progressNodes} current={current} completed={completed} />
            
            {/* Action Buttons */}
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
            
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Job Overview</h1>
                {!isEditing ? (
                    <button onClick={() => setIsEditing(true)} className="bg-blue-500 hover:bg-blue-400 text-white font-semibold py-2 px-4 rounded">
                        Edit
                    </button>
                ) : (
                    <div className="flex gap-2">
                        <button onClick={handleSave} className="bg-green-500 hover:bg-green-400 text-white font-semibold py-2 px-4 rounded">
                            Save
                        </button>
                        <button onClick={() => { setIsEditing(false); setEditedJob(job); }} className="bg-red-500 hover:bg-red-400 text-white font-semibold py-2 px-4 rounded">
                            Cancel
                        </button>
                    </div>
                )}
            </div>

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
                        <li><strong>Distance:</strong> {getDistanceMiles()} mi</li>
                        <li><strong>Deadline:</strong> {formatDeadline(job.deadline || '')}</li>
                        <li><strong>Estimate:</strong> ${getPrice()}{job.deadline && (new Date(job.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60) >= 24 ? ' (25% advance booking discount applied)' : ''}</li>
                        <li><strong>Status:</strong> {job.status || 'No status'}</li>
                    </ul>
                </span>
            )}

            <JobMapClient
                pickup={job.pickup}
                dropoff={job.dropoff}
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
