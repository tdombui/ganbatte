import { useState, useCallback, ChangeEvent, useEffect } from 'react'
import JobMapClient from '@/app/components/ui/job/JobMapClient'
import Link from 'next/link'
import { ParsedJob } from '@/types/job'
import { formatDeadline } from '@/lib/formatDeadline'
import ProgressBar from '@/app/components/ui/job/ProgressBar'

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
    const [completed, setCompleted] = useState<number[]>([])
    const [current, setCurrent] = useState(0)

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
        return (baseRate + distanceMiles * perMile + partCount * partRate).toFixed(2)
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

    const progressNodes = ['Start', 'Pickup', 'Dropoff']

    // Fetch driver location
    useEffect(() => {
        async function fetchLocation() {
            try {
                const res = await fetch(`/api/getDriverLocation?jobId=${job.id}`)
                if (!res.ok) return
                const data = await res.json()
                if (data && data.latitude && data.longitude) {
                    setDriverLocation({ lat: data.latitude, lng: data.longitude })
                }
            } catch {
                // Ignore fetch errors
            }
        }
        if (job.status === 'active' || job.status === 'currently driving') {
            fetchLocation()
            const interval = setInterval(fetchLocation, 10000)
            return () => clearInterval(interval)
        }
    }, [job.id, job.status])

    // Calculate progress
    useEffect(() => {
        if (!driverLocation) return
        const completedNodes: number[] = [0] // Start is always complete
        let curr = 0
        // Calculate distance to pickup
        const pickupLat = (job as { pickup_lat?: number }).pickup_lat
        const pickupLng = (job as { pickup_lng?: number }).pickup_lng
        const dropoffLat = (job as { dropoff_lat?: number }).dropoff_lat
        const dropoffLng = (job as { dropoff_lng?: number }).dropoff_lng
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
        if (pickupLat && pickupLng) {
            const distToPickup = haversine(driverLocation.lat, driverLocation.lng, pickupLat, pickupLng)
            if (distToPickup < 100) {
                completedNodes.push(1)
                curr = 2 // Next: Dropoff
            } else {
                curr = 1 // En route to Pickup
            }
        }
        if (dropoffLat && dropoffLng && completedNodes.includes(1)) {
            const distToDropoff = haversine(driverLocation.lat, driverLocation.lng, dropoffLat, dropoffLng)
            if (distToDropoff < 100) {
                completedNodes.push(2)
                curr = 2
            }
        }
        setCompleted(completedNodes)
        setCurrent(curr)
    }, [driverLocation, job.id])

    return (
        <div className="space-y-6 bg-neutral-800/70 p-6 rounded-xl text-white">
            {(job.status === 'active' || job.status === 'currently driving') && (
                <ProgressBar nodes={progressNodes} current={current} completed={completed} />
            )}
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
                        <li><strong>Estimate:</strong> ${getPrice()}</li>
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
