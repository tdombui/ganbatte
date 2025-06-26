import { useState, useCallback, ChangeEvent } from 'react'
import JobMapClient from '@/app/components/ui/job/JobMapClient'
import Link from 'next/link'
import { ParsedJob } from '@/types/job'
import { formatDeadline } from '@/lib/formatDeadline'

export default function SingleLegJobView({ job }: { job: ParsedJob }) {
    const [isEditing, setIsEditing] = useState(false)
    const [editedJob, setEditedJob] = useState(job)

    const [route, setRoute] = useState<{
        distanceMeters: number
        duration: number
    } | null>(null)

    const getDistanceMiles = () => route ? (route.distanceMeters / 1609.34).toFixed(1) : '—'

    const getPrice = () => {
        if (!route) return '—'
        const baseRate = 30
        const perMile = 1.25
        const partRate = 5
        const partCount = job.parts?.length || 0
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

    return (
        <div className="space-y-6 bg-neutral-800/70 p-6 rounded-xl text-white">
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
                        <input type="text" name="parts" value={editedJob.parts.join(', ')} onChange={handleInputChange} className="bg-neutral-900 text-white w-full p-2 rounded" />
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
                        <li><strong>Payload:</strong> {job.parts?.join(', ')}</li>
                        <li><strong>Pickup:</strong> {job.pickup}</li>
                        <li><strong>Dropoff:</strong> {job.dropoff}</li>
                    </ul>
                    <ul className="space-y-2 bg-white/5 p-4 mb-4 rounded-xl">
                        <li><strong>Distance:</strong> {getDistanceMiles()} mi</li>
                        <li><strong>Deadline:</strong> {formatDeadline(job.deadline || '')}</li>
                        <li><strong>Estimate:</strong> ${getPrice()}</li>
                        <li><strong>Status:</strong> Pending</li>
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
