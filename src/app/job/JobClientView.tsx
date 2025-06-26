'use client'
import Navbar from '../components/nav/Navbar'
import SingleLegJobView from '@/app/job/views/SingleLegJobView'
import MultiLegJobView from '@/app/job/views/MultiLegJobView'
import { ParsedJob } from '@/types/job'

interface MultiLegJob {
    id: string
    parts: string[]
    deadline: string
    status: string
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

export default function JobClientView({ job }: { job: JobType }) {
    if (isMultiLegJob(job)) {
        return (
            <>
                <Navbar />
                <div className="mt-16 max-w-xl mx-auto py-12">
                    <MultiLegJobView job={job} />
                </div>
            </>
        );
    } else {
        return (
            <>
                <Navbar />
                <div className="mt-16 max-w-xl mx-auto py-12">
                    <SingleLegJobView job={job} />
                </div>
            </>
        );
    }
}
