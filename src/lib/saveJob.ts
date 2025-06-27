import { supabase } from '@/lib/auth'
import { ParsedJob } from '@/types/job'

export async function saveJobToSupabase(job: ParsedJob) {
    const { data, error } = await supabase
        .from('jobs')
        .insert({
            parts: job.parts,
            pickup: job.pickup,
            dropoff: job.dropoff,
            deadline: job.deadline,
            deadline_display: job.deadlineDisplay,
        })
        .select()
        .single()

    if (error) {
        console.error('❌ Failed to save job:', error)
        throw error
    }

    return data
}
