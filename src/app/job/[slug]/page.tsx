// src/app/job/[slug]/page.tsx

'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/auth'
import JobClientView from '../JobClientView'
import { ParsedJob } from '@/types/job'

export default function JobPage() {
    const params = useParams()
    const slug = params.slug as string
    const [job, setJob] = useState<ParsedJob | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        async function fetchJob() {
            try {
                console.log('🔍 Looking for job with ID:', slug)

                const { data: job, error } = await supabase
                    .from('jobs')
                    .select('*')
                    .eq('id', slug)
                    .single()

                if (error) {
                    console.error('❌ Job lookup error:', error)
                    setError('Job not found')
                    return
                }

                if (!job) {
                    console.log('❌ Job not found:', slug)
                    setError('Job not found')
                    return
                }

                console.log('✅ Job found:', job.id, job.status)
                setJob(job)
            } catch (err) {
                console.error('❌ Job fetch error:', err)
                setError('Failed to load job')
            } finally {
                setLoading(false)
            }
        }

        if (slug) {
            fetchJob()
        }
    }, [slug])

    if (loading) {
        return (
            <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
                <div className="text-white text-lg">Loading job...</div>
            </div>
        )
    }

    if (error || !job) {
        return (
            <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
                <div className="text-white text-lg">Job not found</div>
            </div>
        )
    }

    return <JobClientView job={job} />
}
