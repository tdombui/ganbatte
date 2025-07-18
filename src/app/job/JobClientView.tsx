'use client'
import { useState, ChangeEvent } from 'react'
import SmartNavbar from '../components/nav/SmartNavbar'
import SingleLegJobView from '@/app/job/views/SingleLegJobView'
import MultiLegJobView from '@/app/job/views/MultiLegJobView'
import CustomerActions from './CustomerActions'
import { ParsedJob } from '@/types/job'
import { createClient } from '@/lib/supabase/client'

interface MultiLegJob {
    id: string
    parts: string[]
    deadline: string
    status: string
    photo_urls?: string[]
    legs: Array<{
        part: string
        pickup: string
        dropoff: string
        pickup_lat: number
        pickup_lng: number
        dropoff_lat: number
        dropoff_lng: number
    }>
}

type JobType = ParsedJob | MultiLegJob

function isMultiLegJob(job: JobType): job is MultiLegJob {
    return Array.isArray((job as MultiLegJob).legs) && typeof (job as MultiLegJob).status === 'string';
}

export default function JobClientView({ job: initialJob }: { job: JobType }) {
    const [job, setJob] = useState(initialJob)
    const [uploading, setUploading] = useState(false)
    const [invoiceLoading, setInvoiceLoading] = useState(false)
    const [paymentLoading, setPaymentLoading] = useState(false)

    const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            alert('File size must be less than 10MB')
            return
        }

        console.log('Starting file upload:', { fileName: file.name, fileSize: file.size, fileType: file.type })
        setUploading(true)
        
        try {
            // Sanitize filename to prevent issues
            const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
            const filePath = `${job.id}/${Date.now()}-${sanitizedFileName}`
            console.log('File path:', filePath)

            // 1. Upload to Supabase Storage from the browser
            const supabase = createClient()
            const { error: uploadError } = await supabase.storage.from('job-photos').upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
            })
            
            if (uploadError) {
                console.error('Upload error:', uploadError)
                alert('Upload failed: ' + uploadError.message)
                return
            }

            console.log('File uploaded successfully to storage')

            // 2. Get the public URL
            const { data } = supabase.storage.from('job-photos').getPublicUrl(filePath)
            const publicUrl = data?.publicUrl
            if (!publicUrl) {
                console.error('Failed to get public URL')
                alert('Failed to get public URL')
                return
            }

            console.log('Public URL:', publicUrl)

            // 3. Call API to update the jobs table
            const { data: { session } } = await supabase.auth.getSession()
            const token = session?.access_token

            if (!token) {
                console.error('No session token available')
                alert('No session token available. Please refresh the page and try again.')
                return
            }

            console.log('Updating job with file URL')

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

            console.log('Update job response status:', res.status)

            if (res.ok) {
                const responseData = await res.json()
                console.log('Job updated successfully:', responseData)
                setJob(prev => ({ ...prev, photo_urls: [...(prev.photo_urls || []), publicUrl] }))
            } else {
                const errorData = await res.json().catch(() => ({}))
                console.error('Failed to update job with file URL:', errorData)
                alert('Failed to update job with file URL: ' + (errorData.error || 'Unknown error'))
            }
        } catch (error) {
            console.error('Unexpected error in file upload:', error)
            alert('Unexpected error during upload. Please try again.')
        } finally {
            setUploading(false)
            // Clear the input to allow re-uploading the same file
            e.target.value = ''
        }
    }

    const handleDeletePhoto = async (url: string) => {
        if (!window.confirm("Are you sure you want to delete this file?")) return

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
            console.error('Failed to delete file:', error)
            alert(`Failed to delete file: ${error}`)
        }
    }

    const handleCreateInvoice = async () => {
        setInvoiceLoading(true)
        try {
            const supabase = createClient()
            const { data: { session } } = await supabase.auth.getSession()
            
            if (!session?.access_token) {
                alert('No session token available. Please refresh the page and try again.')
                return
            }

            // Calculate amount based on job details (you can customize this logic)
            const baseAmount = 30 // Base rate
            const distanceMultiplier = ('distance_meters' in job && job.distance_meters) ? (job.distance_meters as number) / 1000 * 1.25 : 0 // $1.25 per mile
            const partsMultiplier = job.parts ? job.parts.length * 5 : 0 // $5 per part
            const amount = baseAmount + distanceMultiplier + partsMultiplier

            const res = await fetch('/api/invoices/create', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    jobId: job.id,
                    amount: amount,
                    currency: 'USD',
                    notes: `Invoice for job ${job.id}`
                }),
            })

            if (res.ok) {
                alert('Invoice created and sent successfully!')
                // Optionally redirect to invoice page
                // window.location.href = `/invoice/${data.invoice.id}`
            } else {
                const errorData = await res.json()
                alert('Failed to create invoice: ' + (errorData.error || 'Unknown error'))
            }
        } catch (error) {
            console.error('Error creating invoice:', error)
            alert('Error creating invoice. Please try again.')
        } finally {
            setInvoiceLoading(false)
        }
    }

    const handleMakePayment = async () => {
        setPaymentLoading(true)
        try {
            const supabase = createClient()
            const { data: { session } } = await supabase.auth.getSession()
            
            if (!session?.access_token) {
                alert('No session token available. Please refresh the page and try again.')
                return
            }

            // Calculate amount based on job details
            const baseAmount = 30 // Base rate
            const distanceMultiplier = ('distance_meters' in job && job.distance_meters) ? (job.distance_meters as number) / 1000 * 1.25 : 0 // $1.25 per mile
            const partsMultiplier = job.parts ? job.parts.length * 5 : 0 // $5 per part
            const amount = baseAmount + distanceMultiplier + partsMultiplier

            // Create payment link
            const res = await fetch('/api/payment-links/create', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    amount: amount,
                    description: `Job ${job.id} - Delivery Service`,
                    jobId: job.id,
                    metadata: { jobId: job.id, type: 'one_time_payment' }
                }),
            })

            if (res.ok) {
                const data = await res.json()
                // Redirect to Stripe payment link
                window.location.href = data.paymentLink.url
            } else {
                const errorData = await res.json()
                alert('Failed to create payment link: ' + (errorData.error || 'Unknown error'))
            }
        } catch (error) {
            console.error('Error creating payment link:', error)
            alert('Error creating payment link. Please try again.')
        } finally {
            setPaymentLoading(false)
        }
    }

    if (isMultiLegJob(job)) {
        return (
            <>
                <SmartNavbar />
                <div className="mt-16 max-w-xl mx-auto py-12">
                    <MultiLegJobView job={job} />
                    <CustomerActions
                        job={job}
                        uploading={uploading}
                        onFileUpload={handleFileUpload}
                        onDeletePhoto={handleDeletePhoto}
                        onCreateInvoice={handleCreateInvoice}
                        invoiceLoading={invoiceLoading}
                        onMakePayment={handleMakePayment}
                        paymentLoading={paymentLoading}
                    />
                </div>
            </>
        );
    } else {
        return (
            <>
                <SmartNavbar />
                <div className="mt-16 max-w-xl mx-auto py-12">
                    <SingleLegJobView job={job} onJobUpdate={() => {}} />
                    <CustomerActions
                        job={job}
                        uploading={uploading}
                        onFileUpload={handleFileUpload}
                        onDeletePhoto={handleDeletePhoto}
                        onCreateInvoice={handleCreateInvoice}
                        invoiceLoading={invoiceLoading}
                        onMakePayment={handleMakePayment}
                        paymentLoading={paymentLoading}
                    />
                </div>
            </>
        );
    }
}
