// src/app/job/[slug]/page.tsx

'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import JobClientView from '../JobClientView'
import { ParsedJob } from '@/types/job'
import AuthModal from '@/app/components/auth/AuthModal'

export default function JobPage() {
    const params = useParams()
    const slug = params.slug as string
    const { loading: authLoading, isAuthenticated } = useAuth()
    const [job, setJob] = useState<ParsedJob | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [showAuthModal, setShowAuthModal] = useState(false)

    useEffect(() => {
        if (authLoading) return

        if (!isAuthenticated) {
            setShowAuthModal(true)
            setLoading(false)
            return
        }

        async function fetchJob() {
            try {
                console.log('🔍 Looking for job with ID:', slug)

                const res = await fetch(`/api/getUserJobs`)
                if (!res.ok) {
                    console.error('❌ Failed to fetch jobs:', res.status)
                    setError('Failed to load job')
                    return
                }

                const { jobs } = await res.json()
                const foundJob = jobs.find((j: ParsedJob) => j.id === slug)

                if (!foundJob) {
                    console.log('❌ Job not found:', slug)
                    setError('Job not found')
                    return
                }

                console.log('✅ Job found:', foundJob.id, foundJob.status)
                setJob(foundJob)
            } catch (err) {
                console.error('❌ Job fetch error:', err)
                setError('Failed to load job')
            } finally {
                setLoading(false)
            }
        }

        if (slug && isAuthenticated) {
            fetchJob()
        }
    }, [slug, authLoading, isAuthenticated])

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
                <div className="text-white text-lg">Loading job...</div>
            </div>
        )
    }

    if (!isAuthenticated) {
        return (
            <>
                <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
                    <div className="text-white text-lg">Please sign in to view this job</div>
                </div>
                <AuthModal 
                    isOpen={showAuthModal} 
                    onClose={() => setShowAuthModal(false)} 
                />
            </>
        )
    }

    if (error || !job) {
        return (
            <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
                <div className="text-white text-lg">{error || 'Job not found'}</div>
            </div>
        )
    }

    return <JobClientView job={job} />
}
