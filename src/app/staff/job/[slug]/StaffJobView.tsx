'use client'

import { useState, ChangeEvent, useEffect } from 'react'
import SingleLegJobView from '@/app/job/views/SingleLegJobView'
import MultiLegJobView from '@/app/job/views/MultiLegJobView'
import StaffActions from './StaffActions'
import { ParsedJob, JobLeg } from '@/types/job'
import { createClient } from '@/lib/supabase/client'
import UnifiedNavbar from '@/app/components/nav/UnifiedNavbar'

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
        const supabase = createClient()
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
        if (!file) {
            console.log('🔍 No file selected')
            return
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            alert('File size must be less than 10MB')
            return
        }

        console.log('🔍 Starting file upload:', { 
            fileName: file.name, 
            fileSize: file.size, 
            fileType: file.type,
            lastModified: file.lastModified
        })
        setUploading(true)
        
        try {
            // Sanitize filename to prevent issues
            const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
            const filePath = `${job.id}/${Date.now()}-${sanitizedFileName}`
            console.log('🔍 File path:', filePath)

            // 1. Upload to Supabase Storage from the browser
            const supabase = createClient()
            console.log('🔍 Uploading to Supabase storage...')
            
            const { error: uploadError } = await supabase.storage.from('job-photos').upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
            })
            
            if (uploadError) {
                console.error('🔍 Upload error:', uploadError)
                alert('Upload failed: ' + uploadError.message)
                setUploading(false)
                return
            }

            console.log('🔍 File uploaded successfully to storage')

            // 2. Get the public URL
            console.log('🔍 Getting public URL...')
            const { data } = supabase.storage.from('job-photos').getPublicUrl(filePath)
            const publicUrl = data?.publicUrl
            if (!publicUrl) {
                console.error('🔍 Failed to get public URL')
                alert('Failed to get public URL')
                setUploading(false)
                return
            }

            console.log('🔍 Public URL:', publicUrl)

            // 3. Call API to update the jobs table
            console.log('🔍 Getting session token...')
            const { data: { session } } = await supabase.auth.getSession()
            const token = session?.access_token

            if (!token) {
                console.error('🔍 No session token available')
                alert('No session token available. Please refresh the page and try again.')
                setUploading(false)
                return
            }

            console.log('🔍 Updating job with file URL...')

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

            console.log('🔍 Update job response status:', res.status)

            if (res.ok) {
                const responseData = await res.json()
                console.log('🔍 Job updated successfully:', responseData)
                setJob(prev => ({ ...prev, photo_urls: [...(prev.photo_urls || []), publicUrl] }))
                alert('File uploaded successfully!')
            } else {
                const errorData = await res.json().catch(() => ({}))
                console.error('🔍 Failed to update job with file URL:', errorData)
                alert('Failed to update job with file URL: ' + (errorData.error || 'Unknown error'))
            }
        } catch (error) {
            console.error('🔍 Unexpected error in file upload:', error)
            alert('Unexpected error during upload. Please try again.')
        } finally {
            console.log('🔍 Upload process completed, setting uploading to false')
            setUploading(false)
            // Clear the input to allow re-uploading the same file
            e.target.value = ''
        }
    }

    const handleDeletePhoto = async (url: string) => {
        if (!window.confirm("Are you sure you want to delete this photo?")) return

        const supabase = createClient()
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

    const handleConfirmPickup = async () => {
        console.log('Confirming pickup complete for job:', job.id)
        
        try {
            // Get the current session token
            const supabase = createClient()
            const { data: { session } } = await supabase.auth.getSession()
            const token = session?.access_token

            if (!token) {
                console.error('No session token available')
                alert('No session token available. Please refresh the page and try again.')
                return
            }

            console.log('Sending confirm pickup request')

            const res = await fetch('/api/updateJob', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    jobId: job.id,
                    updates: { status: 'driving' },
                }),
            })

            console.log('Confirm pickup response status:', res.status)

            if (res.ok) {
                const responseData = await res.json()
                console.log('Pickup confirmed successfully:', responseData)
                setJob(prev => ({ ...prev, status: 'driving' }))
            } else {
                const errorData = await res.json().catch(() => ({ error: 'Failed to parse error response' }))
                console.error('Failed to confirm pickup:', errorData)
                alert('Failed to confirm pickup: ' + (errorData.error || 'Unknown error'))
            }
        } catch (error) {
            console.error('Unexpected error confirming pickup:', error)
            alert('Unexpected error confirming pickup. Please try again.')
        }
    }

    const handleStartJob = async () => {
        console.log('Starting job:', job.id)
        
        try {
            // Get the current session token
            const supabase = createClient()
            const { data: { session } } = await supabase.auth.getSession()
            const token = session?.access_token

            if (!token) {
                console.error('No session token available')
                alert('No session token available. Please refresh the page and try again.')
                return
            }

            console.log('Sending start job request')

            const res = await fetch('/api/updateJob', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    jobId: job.id,
                    updates: { status: 'currently driving' },
                }),
            })

            console.log('Start job response status:', res.status)

            if (res.ok) {
                const responseData = await res.json()
                console.log('Job started successfully:', responseData)
                setJob(prev => ({ ...prev, status: 'currently driving' }))
            } else {
                const errorData = await res.json().catch(() => ({}))
                console.error('Failed to start job:', errorData)
                alert('Failed to start job: ' + (errorData.error || 'Unknown error'))
            }
        } catch (error) {
            console.error('Unexpected error starting job:', error)
            alert('Unexpected error starting job. Please try again.')
        }
    }

    const handlePauseJob = async () => {
        console.log('Pausing job:', job.id)
        
        try {
            // Get the current session token
            const supabase = createClient()
            const { data: { session } } = await supabase.auth.getSession()
            const token = session?.access_token

            if (!token) {
                console.error('No session token available')
                alert('No session token available. Please refresh the page and try again.')
                return
            }

            console.log('Sending pause job request')

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

            console.log('Pause job response status:', res.status)

            if (res.ok) {
                const responseData = await res.json()
                console.log('Job paused successfully:', responseData)
                setJob(prev => ({ ...prev, status: 'booked' }))
            } else {
                const errorData = await res.json().catch(() => ({ error: 'Failed to parse error response' }))
                console.error('Failed to pause job:', errorData)
                alert('Failed to pause/stop job: ' + (errorData.error || 'Unknown error'))
            }
        } catch (error) {
            console.error('Unexpected error pausing job:', error)
            alert('Unexpected error pausing job. Please try again.')
        }
    }

    const renderJobView = () => {
        if (isMultiLegJob(job)) {
            return <MultiLegJobView job={job} />
        }
        return <SingleLegJobView job={job} onJobUpdate={(updatedJob) => setJob(updatedJob)} />
    }

    // Driver-side GPS tracking
    useEffect(() => {
        // Only track if job is currently driving and user is staff
        if (job.status !== 'currently driving') {
            console.log(`📍 GPS tracking not active - job status: ${job.status}`)
            return
        }
        if (typeof window === 'undefined' || !('geolocation' in navigator)) {
            console.log('📍 GPS tracking not available - no geolocation support')
            return
        }
        if (!isStaff) {
            console.log('📍 GPS tracking not available - user is not staff')
            return
        }
        
        console.log('🚗 Starting GPS tracking for driver location...')
        
        const watchId = navigator.geolocation.watchPosition(
            async (position) => {
                console.log(`📍 GPS location received: ${position.coords.latitude}, ${position.coords.longitude}`)
                
                const supabase = createClient()
                const { data: { session } } = await supabase.auth.getSession()
                const token = session?.access_token

                const res = await fetch('/api/updateDriverLocation', {
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
                
                if (res.ok) {
                    console.log('✅ Driver location updated successfully')
                } else {
                    console.error('❌ Failed to update driver location:', res.status)
                }
            },
            (error) => {
                console.error('❌ Error getting GPS location:', error)
            },
            { enableHighAccuracy: true, maximumAge: 10000, timeout: 20000 }
        )
        
        console.log('📍 GPS tracking started with watch ID:', watchId)
        
        return () => {
            console.log('🛑 Stopping GPS tracking')
            navigator.geolocation.clearWatch(watchId)
        }
    }, [job.id, job.status, isStaff])

    if (!isStaff) {
        return (
            <>
                <UnifiedNavbar />
                <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
                    <div className="text-white text-lg">Access denied</div>
                </div>
            </>
        )
    }

    return (
        <>
            <UnifiedNavbar />
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
                    onConfirmPickup={handleConfirmPickup}
                />
            </div>
        </>
    )
} 