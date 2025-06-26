// lib/getMissingFields.ts
import { DraftJob } from '@/types/job'

export function getMissingFields(job: DraftJob) {
    const missing: string[] = []
    job.legs.forEach((leg, i) => {
        if (!leg.pickup_validated) missing.push(`pickup for leg ${i + 1}`)
        if (!leg.dropoff_validated) missing.push(`dropoff for leg ${i + 1}`)
    })
    if (!job.deadline) missing.push('deadline')
    if (!job.parts?.length) missing.push('parts')
    return missing
}
