'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ParsedJob } from '@/types/job'

export default function TestListJobs() {
    const [jobs, setJobs] = useState<(ParsedJob & { created_at: string })[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        async function fetchJobs() {
            try {
                console.log('🔍 Fetching jobs...')
                
                // Get auth headers
                const supabase = createClient()
                const { data: { session } } = await supabase.auth.getSession()
                const headers: HeadersInit = {
                    'Content-Type': 'application/json',
                }
                
                if (session?.access_token) {
                    headers['Authorization'] = `Bearer ${session.access_token}`
                }

                const res = await fetch('/api/list-all-jobs', {
                    headers
                })

                if (!res.ok) {
                    const errorText = await res.text()
                    throw new Error(`HTTP ${res.status}: ${errorText}`)
                }

                const data = await res.json()
                console.log('🔍 Jobs response:', data)
                
                if (data.success) {
                    setJobs(data.jobs)
                } else {
                    setError(data.error || 'Failed to fetch jobs')
                }
            } catch (err) {
                console.error('❌ Error fetching jobs:', err)
                setError(err instanceof Error ? err.message : 'Unknown error')
            } finally {
                setLoading(false)
            }
        }

        fetchJobs()
    }, [])

    if (loading) {
        return <div className="p-8">Loading jobs...</div>
    }

    if (error) {
        return <div className="p-8 text-red-500">Error: {error}</div>
    }

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">Your Jobs ({jobs.length})</h1>
            {jobs.length === 0 ? (
                <p>No jobs found.</p>
            ) : (
                <div className="space-y-4">
                    {jobs.map((job) => (
                        <div key={job.id} className="border p-4 rounded">
                            <h3 className="font-bold">Job ID: {job.id}</h3>
                            <p>Status: {job.status}</p>
                            <p>Pickup: {job.pickup}</p>
                            <p>Dropoff: {job.dropoff}</p>
                            <p>Created: {new Date(job.created_at).toLocaleString()}</p>
                            <a 
                                href={`/job/${job.id}`} 
                                className="text-blue-500 hover:underline"
                            >
                                View Job
                            </a>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
} 