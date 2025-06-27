'use client'

import { useState, ChangeEvent, useEffect } from 'react'
import SingleLegJobView from '@/app/job/views/SingleLegJobView'
import MultiLegJobView from '@/app/job/views/MultiLegJobView'
import StaffActions from './StaffActions'
import { ParsedJob, JobLeg } from '@/types/job'
import { supabase } from '@/lib/auth'
import Navbar from '@/app/components/nav/Navbar'

interface MultiLegJob extends Omit<ParsedJob, 'deadline' | 'status'> {
    legs: JobLeg[];
    deadline: string;
    status: string;
}

type JobType = ParsedJob | MultiLegJob;

function isMultiLegJob(job: JobType): job is MultiLegJob {
    return 'legs' in job && Array.isArray(job.legs);
}

export default function StaffJobView({ job: initialJob, isStaff }: { job: JobType; isStaff: boolean }) {
    const [job, setJob] = useState(initialJob)
    const [uploading, setUploading] = useState(false)

    const handleStatusChange = async (newStatus: string) => {
        // Get the current session token
        const { data: { session } } = await supabase.auth.getSession()
        const token = session?.access_token

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
            setJob(prev => ({ ...prev, status: newStatus }))
        } else {
            const errorData = await res.json().catch(() => ({}))
            console.error('Failed to update status:', errorData)
            alert('Failed to update status.')
        }
    }

    const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setUploading(true)
        const filePath = `${job.id}/${Date.now()}-${file.name}`

        // 1. Upload to Supabase Storage from the browser
        const { error: uploadError } = await supabase.storage.from('job-photos').upload(filePath, file)
        if (uploadError) {
            alert('Upload failed: ' + uploadError.message)
            setUploading(false)
            return
        }

        // 2. Get the public URL
        const { data } = supabase.storage.from('job-photos').getPublicUrl(filePath)
        const publicUrl = data?.publicUrl
        if (!publicUrl) {
            alert('Failed to get public URL')
            setUploading(false)
            return
        }

        // 3. Call API to update the jobs table
        const { data: { session } } = await supabase.auth.getSession()
        const token = session?.access_token

        const res = await fetch('/api/updateJob', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                jobId: job.id,
                updates: { photo_urls: [...(job.photo_urls || []), publicUrl] }
            }),
        })

        if (res.ok) {
            setJob(prev => ({ ...prev, photo_urls: [...(prev.photo_urls || []), publicUrl] }))
        } else {
            const errorData = await res.json().catch(() => ({}))
            console.error('Failed to update job with photo URL:', errorData)
            alert('Failed to update job with photo URL')
        }
        setUploading(false)
    }

    const handleDeletePhoto = async (url: string) => {
        if (!window.confirm("Are you sure you want to delete this photo?")) return

        const { data: { session } } = await supabase.auth.getSession()
        const token = session?.access_token

        const res = await fetch('/api/deleteJobPhoto', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ jobId: job.id, photoUrl: url }),
        });

        if (res.ok) {
            setJob(prev => ({ ...prev, photo_urls: (prev.photo_urls || []).filter(u => u !== url) }))
        } else {
            const { error } = await res.json()
            console.error('Failed to delete photo:', error)
            alert(`Failed to delete photo: ${error}`)
        }
    }

    const handleStartJob = async () => {
        // Get the current session token
        const { data: { session } } = await supabase.auth.getSession()
        const token = session?.access_token

        const res = await fetch('/api/updateJob', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                jobId: job.id,
                updates: { status: 'active' },
            }),
        })
        if (res.ok) {
            setJob(prev => ({ ...prev, status: 'active' }))
        } else {
            const errorData = await res.json().catch(() => ({}))
            console.error('Failed to start job:', errorData)
            alert('Failed to start job.')
        }
    }

    const handlePauseJob = async () => {
        // Get the current session token
        const { data: { session } } = await supabase.auth.getSession()
        const token = session?.access_token

        const res = await fetch('/api/updateJob', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                jobId: job.id,
                updates: { status: 'booked' },
            }),
        })
        if (res.ok) {
            setJob(prev => ({ ...prev, status: 'booked' }))
        } else {
            const errorData = await res.json().catch(() => ({}))
            console.error('Failed to pause/stop job:', errorData)
            alert('Failed to pause/stop job.')
        }
    }

    const renderJobView = () => {
        if (isMultiLegJob(job)) {
            return <MultiLegJobView job={job} />
        }
        return <SingleLegJobView job={job} />
    }

    // Driver-side GPS tracking
    useEffect(() => {
        // Only track if job is currently driving and user is staff
        if (job.status !== 'currently driving') return
        if (typeof window === 'undefined' || !('geolocation' in navigator)) return
        if (!isStaff) return
        
        const watchId = navigator.geolocation.watchPosition(
            async (position) => {
                const { data: { session } } = await supabase.auth.getSession()
                const token = session?.access_token

                fetch('/api/updateDriverLocation', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        jobId: job.id,
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                    }),
                })
            },
            (error) => {
                console.error('Error getting location:', error)
            },
            { enableHighAccuracy: true, maximumAge: 10000, timeout: 20000 }
        )
        return () => navigator.geolocation.clearWatch(watchId)
    }, [job.id, job.status, isStaff])

    if (!isStaff) {
        return (
            <>
                <Navbar />
                <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
                    <div className="text-white text-lg">Access denied</div>
                </div>
            </>
        )
    }

    return (
        <>
            <Navbar />
            <div className="mt-16 max-w-xl mx-auto py-12">
                {renderJobView()}
                {(job.status === 'active' || job.status === 'currently driving') && (
                    <button
                        onClick={handlePauseJob}
                        className="bg-yellow-600 hover:bg-yellow-700 px-6 py-3 rounded text-white w-full font-semibold mb-4 mt-4"
                    >
                        Pause/Stop Job
                    </button>
                )}
                {job.status !== 'active' && job.status !== 'completed' && (
                    <button
                        onClick={handleStartJob}
                        className="bg-emerald-600 hover:bg-emerald-700 px-6 py-3 rounded text-white w-full font-semibold mb-4 mt-4"
                    >
                        Start Job
                    </button>
                )}
                <StaffActions
                    job={{...job, photo_urls: job.photo_urls || []}}
                    uploading={uploading}
                    onStatusChange={handleStatusChange}
                    onFileUpload={handleFileUpload}
                    onDeletePhoto={handleDeletePhoto}
                />
            </div>
        </>
    )
} 