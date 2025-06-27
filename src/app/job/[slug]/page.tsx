// src/app/job/[slug]/page.tsx

'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import JobClientView from '../JobClientView'
import { ParsedJob } from '@/types/job'
import AuthModal from '@/app/components/auth/AuthModal'
import { supabase } from '@/lib/auth'

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
                console.log('🔍 USING NEW getJob API - this should appear if new code is running')

                // Get auth headers
                const { data: { session } } = await supabase.auth.getSession()
                const headers: HeadersInit = {
                    'Content-Type': 'application/json',
                }
                
                if (session?.access_token) {
                    headers['Authorization'] = `Bearer ${session.access_token}`
                }

                const res = await fetch(`/api/getJob?id=${slug}`, {
                    headers
                })
                console.log('🔍 getJob response status:', res.status)
                
                if (!res.ok) {
                    const errorText = await res.text()
                    console.error('❌ Failed to fetch job:', res.status, errorText)
                    setError(`Failed to load job (${res.status})`)
                    return
                }

                const data = await res.json()
                console.log('🔍 getJob response:', data)
                
                if (!data.success) {
                    console.error('❌ getJob returned error:', data.error)
                    setError(data.error || 'Failed to load job')
                    return
                }

                console.log('✅ Job found:', data.job.id, data.job.status)
                setJob(data.job)
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
