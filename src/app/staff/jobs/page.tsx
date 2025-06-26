'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'

type Leg = {
  pickup?: string
  dropoff?: string
  deadline?: string
}

type Job = {
  id: string
  status: string
  parts?: string[]
  pickup?: string
  dropoff?: string
  deadline?: string
  distance_meters?: number
  legs?: Leg[]
  duration_seconds?: number
}

function getDeadlineColor(deadline?: string) {
  if (!deadline) return 'border-neutral-700'
  const now = new Date()
  const due = new Date(deadline)
  const diffHours = (due.getTime() - now.getTime()) / (1000 * 60 * 60)
  if (diffHours <= 4) return 'border-red-500'
  if (diffHours <= 8) return 'border-[goldenrod]'
  if (diffHours <= 24) return 'border-green-500'
  return 'border-neutral-700'
}

function formatDeadline(deadline?: string) {
  if (!deadline) return '—'
  try {
    return format(new Date(deadline), "EEEE, MMM d, h:mm a")
  } catch {
    return deadline
  }
}

function getJobPickup(job: Job) {
  if (job.legs && job.legs.length > 0) return job.legs[0].pickup || ''
  return job.pickup || ''
}

function getJobDropoff(job: Job) {
  if (job.legs && job.legs.length > 0) return job.legs[job.legs.length - 1].dropoff || ''
  return job.dropoff || ''
}

function getJobEarliestDeadline(job: Job) {
  let deadlines: string[] = []
  if (job.deadline) deadlines.push(job.deadline)
  if (job.legs && job.legs.length > 0) {
    deadlines = deadlines.concat(job.legs.map(l => l.deadline).filter(Boolean) as string[])
  }
  if (deadlines.length === 0) return undefined
  return deadlines.reduce((earliest, curr) => {
    if (!earliest) return curr
    return new Date(curr) < new Date(earliest) ? curr : earliest
  }, undefined as string | undefined)
}

export default function StaffJobsList() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/getAllJobs')
      .then(res => res.json())
      .then(data => {
        setJobs((data.jobs || []).sort((a: Job, b: Job) => {
          const aDeadline = getJobEarliestDeadline(a)
          const bDeadline = getJobEarliestDeadline(b)
          const aTime = aDeadline ? new Date(aDeadline).getTime() : Infinity
          const bTime = bDeadline ? new Date(bDeadline).getTime() : Infinity
          return aTime - bTime
        }))
        setLoading(false)
      })
  }, [])

  if (loading) return <div>Loading...</div>

  return (
    <div className="max-w-2xl mx-auto py-12">
      <h1 className="text-2xl font-bold mb-6">All Jobs</h1>
      <ul className="space-y-4">
        {jobs.map(job => {
          const pickup = getJobPickup(job)
          const dropoff = getJobDropoff(job)
          const earliestDeadline = getJobEarliestDeadline(job)
          return (
            <li
              key={job.id}
              className={`p-4 bg-neutral-800 rounded-lg flex justify-between items-center border-2 ${getDeadlineColor(earliestDeadline)}`}
            >
              <div>
                <div className="font-bold text-lg mb-1">
                  {Array.isArray(job.parts) ? job.parts.join(', ') : job.parts || '—'}
                </div>
                <div className="mb-1">
                  <span className="font-semibold">From:</span> {pickup || <span className="text-gray-500">(no pickup)</span>}
                </div>
                <div className="mb-1">
                  <span className="font-semibold">To:</span> {dropoff || <span className="text-gray-500">(no dropoff)</span>}
                </div>
                <div className="font-semibold mb-1">Status: {job.status}</div>
                <div className="text-xs text-gray-400 mb-1">Deadline: {formatDeadline(earliestDeadline)}</div>
              </div>
              <Link href={`/staff/job/${job.id}`}>
                <button className="bg-blue-600 text-white px-4 py-2 rounded">View</button>
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
} 