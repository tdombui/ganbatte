// src/app/job/[slug]/page.tsx

import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import JobClientView from '../JobClientView'

interface JobPageProps {
    params: Promise<{
        slug: string
    }>
}

export default async function JobPageServer({ params }: JobPageProps) {
    const { slug } = await params

    const { data: job, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', slug)
        .single()

    if (error || !job) return notFound()

    return <JobClientView job={job} />
}
