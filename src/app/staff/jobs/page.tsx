'use client'

import { useEffect, useState } from 'react'
import { createClient } from '../../../lib/supabase/client'
import { useAuthContext } from '../../providers'
import SmartNavbar from '../../components/nav/SmartNavbar'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Job {
  id: string
  title?: string
  description?: string
  status?: string | null
  created_at: string
  pickup?: string
  dropoff?: string
  deadline?: string
  user_id: string
  payment_status?: string
  parts?: string[]
  legs?: Array<{
    part: string
    pickup: string
    dropoff: string
  }>
  user?: {
    email: string
    full_name: string
  }
}

export default function StaffJobsPage() {
  const { user, loading, isStaff, isAdmin } = useAuthContext()
  const [jobs, setJobs] = useState<Job[]>([])
  const [jobsLoading, setJobsLoading] = useState(true)
  const router = useRouter()

  // Redirect if not authenticated or not staff
  useEffect(() => {
    if (!loading && (!user || (!isStaff && !isAdmin))) {
      console.log('🔍 StaffJobsPage: Redirecting to auth - not authenticated or not staff')
      router.push('/auth?redirectTo=/staff/jobs')
    }
  }, [user, loading, isStaff, isAdmin, router])

  useEffect(() => {
    if (user && (isStaff || isAdmin)) {
      fetchJobs()
    }
  }, [user, isStaff, isAdmin])

  const fetchJobs = async () => {
    try {
      setJobsLoading(true)
      
      const { data, error } = await createClient()
        .from('jobs')
        .select(`
          *,
          user:profiles(email, full_name)
        `)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching jobs:', error)
        return
      }

      setJobs(data || [])
    } catch (error) {
      console.error('Error fetching jobs:', error)
    } finally {
      setJobsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status: string | null | undefined) => {
    if (!status) return 'bg-gray-500'
    
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-500'
      case 'in_progress':
        return 'bg-blue-500'
      case 'active':
      case 'currently driving':
        return 'bg-green-500'
      case 'completed':
        return 'bg-green-500'
      case 'cancelled':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950">
        <SmartNavbar />
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    )
  }

  // Show loading while redirecting if not authenticated
  if (!user || (!isStaff && !isAdmin)) {
    return (
      <div className="min-h-screen bg-neutral-950">
        <SmartNavbar />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-neutral-400">Redirecting to login...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-950">
      <SmartNavbar />
      
      <div className="container mx-auto px-4 py-8 pt-24">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-white">All Jobs</h1>
          </div>

          {jobsLoading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">No jobs found</h2>
              <p className="text-neutral-400">No delivery jobs have been created yet.</p>
            </div>
          ) : (
            <div className="grid gap-6">
              {jobs.map((job) => (
                <div key={job.id} className="bg-neutral-900 border border-neutral-700 rounded-lg p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      {/* Payload as title */}
                      {job.parts && job.parts.length > 0 && (
                        <div className="mb-2">
                          <div className="flex flex-wrap gap-2">
                            {job.parts.map((part, index) => (
                              <span key={index} className="px-3 py-2 bg-neutral-800 rounded text-sm text-neutral-300">
                                {part}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Job ID and other info */}
                      <div className="text-sm text-neutral-400 mb-3">
                        Job #{job.id.slice(0, 8)}
                      </div>
                      
                      {job.description && (
                        <p className="text-neutral-400 mb-3">
                          {job.description}
                        </p>
                      )}
                    </div>
                    
                    {/* Status and Payment Status in same container */}
                    <div className="flex gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${getStatusColor(job.status)}`}>
                        {job.status ? job.status.replace('_', ' ').toUpperCase() : 'UNKNOWN'}
                      </span>
                      {job.payment_status && (
                        <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${
                          job.payment_status === 'paid' 
                            ? 'bg-green-600' 
                            : job.payment_status === 'pending'
                            ? 'bg-yellow-600'
                            : 'bg-red-600'
                        }`}>
                          Payment: {job.payment_status.toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Multi-leg job display */}
                  {job.legs && job.legs.length > 0 ? (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-neutral-300 mb-2">Route</h4>
                      <div className="space-y-2">
                        {job.legs.map((leg, index) => (
                          <div key={index} className="p-3 bg-neutral-800 rounded-lg">
                            <div className="text-xs text-neutral-400 mb-1">Trip {index + 1}</div>
                            {leg.part && (
                              <div className="mb-3">
                                <h4 className="text-sm font-medium text-neutral-300 mb-1">Payload</h4>
                                <div className="flex flex-wrap gap-2">
                                  <span className="px-2 py-1 bg-neutral-700 rounded text-xs text-neutral-300">
                                    {leg.part}
                                  </span>
                                </div>
                              </div>
                            )}
                            <div className="grid md:grid-cols-2 gap-4">
                              <div>
                                <h4 className="text-sm font-medium text-neutral-300 mb-1">Pickup Address</h4>
                                <p className="text-sm text-neutral-400">{leg.pickup}</p>
                              </div>
                              <div>
                                <h4 className="text-sm font-medium text-neutral-300 mb-1">Dropoff Address</h4>
                                <p className="text-sm text-neutral-400">{leg.dropoff}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    /* Single leg job display with rounded background */
                    <div className="mb-4">
                      <div className="p-3 bg-neutral-800 rounded-lg">
                        {/* Payload in rounded background for single leg */}
                        {job.parts && job.parts.length > 0 && (
                          <div className="mb-3">
                            <h4 className="text-sm font-medium text-neutral-300 mb-1">Payload</h4>
                            <div className="flex flex-wrap gap-2">
                              {job.parts.map((part, index) => (
                                <span key={index} className="px-2 py-1 bg-neutral-700 rounded text-xs text-neutral-300">
                                  {part}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Addresses */}
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="text-sm font-medium text-neutral-300 mb-1">Pickup Address</h4>
                            <p className="text-sm text-neutral-400">{job.pickup || 'Not specified'}</p>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-neutral-300 mb-1">Delivery Address</h4>
                            <p className="text-sm text-neutral-400">{job.dropoff || 'Not specified'}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center text-sm text-neutral-400">
                    <span>Created: {formatDate(job.created_at)}</span>
                    {job.deadline && (
                      <span>Deadline: {formatDate(job.deadline)}</span>
                    )}
                  </div>
                  
                  {job.user && (
                    <div className="mt-3 p-3 bg-neutral-800 rounded-lg">
                      <h4 className="text-sm font-medium text-neutral-300 mb-1">Customer</h4>
                      <p className="text-sm text-neutral-400">
                        {job.user.full_name} ({job.user.email})
                      </p>
                    </div>
                  )}
                  
                  <div className="mt-4">
                    <Link
                      href={`/staff/job/${job.id}`}
                      className="text-emerald-400 hover:text-emerald-300 font-medium text-sm transition-colors"
                    >
                      View Details →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 