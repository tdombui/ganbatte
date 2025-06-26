'use client'

import { useState, ChangeEvent, useEffect } from 'react'
import SingleLegJobView from '@/app/job/views/SingleLegJobView'
import MultiLegJobView from '@/app/job/views/MultiLegJobView'
import StaffActions from './StaffActions'
import { ParsedJob, JobLeg } from '@/types/job'
import { supabase } from '@/lib/supabaseClient'

interface MultiLegJob extends Omit<ParsedJob, 'deadline' | 'status'> {
    legs: JobLeg[];
    deadline: string;
    status: string;
}

type JobType = ParsedJob | MultiLegJob;

function isMultiLegJob(job: JobType): job is MultiLegJob {
    return 'legs' in job && Array.isArray(job.legs);
}

export default function StaffJobView({ job: initialJob }: { job: JobType }) {
    const [job, setJob] = useState(initialJob)
    const [uploading, setUploading] = useState(false)

    const handleStatusChange = async (newStatus: string) => {
        const res = await fetch('/api/updateJob', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jobId: job.id,
                updates: { status: newStatus },
            }),
        })

        if (res.ok) {
            setJob(prev => ({ ...prev, status: newStatus }))
        } else {
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
        const res = await fetch('/api/updateJob', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jobId: job.id,
                updates: { photo_urls: [...(job.photo_urls || []), publicUrl] }
            }),
        })

        if (res.ok) {
            setJob(prev => ({ ...prev, photo_urls: [...(prev.photo_urls || []), publicUrl] }))
        } else {
            alert('Failed to update job with photo URL')
        }
        setUploading(false)
    }

    const handleDeletePhoto = async (url: string) => {
        if (!window.confirm("Are you sure you want to delete this photo?")) return

        const res = await fetch('/api/deleteJobPhoto', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ jobId: job.id, photoUrl: url }),
        });

        if (res.ok) {
            setJob(prev => ({ ...prev, photo_urls: (prev.photo_urls || []).filter(u => u !== url) }))
        } else {
            const { error } = await res.json()
            alert(`Failed to delete photo: ${error}`)
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
        // Only track if job is in progress and user is staff (add your own staff check logic)
        if (job.status !== 'in_progress') return
        if (typeof window === 'undefined' || !('geolocation' in navigator)) return
        // TODO: Replace with real staff/driver check
        const isStaff = true
        if (!isStaff) return
        const watchId = navigator.geolocation.watchPosition(
            (position) => {
                fetch('/api/updateDriverLocation', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
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
    }, [job.id, job.status])

    return (
        <div className="max-w-xl mx-auto py-12">
            {renderJobView()}
            <StaffActions
                job={{...job, photo_urls: job.photo_urls || []}}
                uploading={uploading}
                onStatusChange={handleStatusChange}
                onFileUpload={handleFileUpload}
                onDeletePhoto={handleDeletePhoto}
            />
        </div>
    )
} 