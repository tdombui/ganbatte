import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import StaffJobView from './StaffJobView'

interface JobPageProps {
    params: {
        slug: string
    }
}

export default async function StaffJobPage({ params }: JobPageProps) {
    const { slug } = params

    const { data: job, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', slug)
        .single()

    if (error || !job) {
        return notFound()
    }

    return <StaffJobView job={job} />
} 