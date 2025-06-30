'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import StaffJobView from './StaffJobView'
import { createClient } from '@/lib/supabase/client'
import { ParsedJob, JobLeg } from '@/types/job'
import { redirect } from 'next/navigation'

interface MultiLegJob extends Omit<ParsedJob, 'deadline' | 'status'> {
    legs: JobLeg[];
    deadline: string;
    status: string;
}

type JobType = ParsedJob | MultiLegJob;

export default function StaffJobPage() {
    const params = useParams()
    const slug = params.slug as string
    const [job, setJob] = useState<JobType | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [userRole, setUserRole] = useState<string | null>(null)

    useEffect(() => {
        const checkAuthAndFetchJob = async () => {
            try {
                console.log('🔍 StaffJobPage: Starting auth and job fetch...')
                
                // Get current user
                const { data: { user }, error: authError } = await createClient().auth.getUser()
                
                if (authError || !user) {
                    console.log('🔍 StaffJobPage: No authenticated user')
                    redirect('/')
                    return
                }

                console.log('🔍 StaffJobPage: User authenticated:', user.id)

                // Check if user is staff/admin
                const { data: profile, error: profileError } = await createClient()
                    .from('profiles')
                    .select('role')
                    .eq('id', user.id)
                    .single()

                if (profileError) {
                    console.error('🔍 StaffJobPage: Error fetching profile:', profileError)
                    redirect('/')
                    return
                }

                const isStaff = profile?.role === 'staff' || profile?.role === 'admin'
                console.log('🔍 StaffJobPage: User role:', profile?.role, 'Is staff:', isStaff)
                
                if (!isStaff) {
                    console.log('🔍 StaffJobPage: User is not staff, redirecting to /')
                    redirect('/')
                }

                setUserRole(profile?.role || null)

                // Fetch job data
                console.log('🔍 StaffJobPage: Fetching job with ID:', slug)
                
                const { data: jobData, error: jobError } = await createClient()
                    .from('jobs')
                    .select('*')
                    .eq('id', slug)
                    .single()

                if (jobError) {
                    console.error('🔍 StaffJobPage: Error fetching job:', jobError)
                    setError(jobError.message)
                    return
                }

                if (!jobData) {
                    console.log('🔍 StaffJobPage: Job not found')
                    setError('Job not found')
                    return
                }

                console.log('🔍 StaffJobPage: Job found:', jobData.id)
                setJob(jobData as JobType)

            } catch (err) {
                console.error('🔍 StaffJobPage: Unexpected error:', err)
                setError('Failed to load job')
            } finally {
                setLoading(false)
            }
        }

        if (slug) {
            checkAuthAndFetchJob()
        }
    }, [slug])

    console.log('🔍 StaffJobPage: Render state:', {
        loading,
        hasJob: !!job,
        error,
        slug
    })

    if (loading) {
        return (
            <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
                <div className="text-white text-lg">Loading...</div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
                <div className="text-white text-lg">Error: {error}</div>
            </div>
        )
    }

    if (!job) {
        return (
            <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
                <div className="text-white text-lg">Job not found</div>
            </div>
        )
    }

    console.log('🔍 StaffJobPage: Rendering StaffJobView with job:', job.id)
    return (
        <StaffJobView 
            job={job} 
            isStaff={userRole === 'staff' || userRole === 'admin'} 
        />
    )
} 