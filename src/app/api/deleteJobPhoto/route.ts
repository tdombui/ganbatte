import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
    const supabase = createRouteHandlerClient({ cookies })

    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { jobId, photoUrl } = await req.json()

    if (!jobId || !photoUrl) {
        return NextResponse.json({ error: 'Missing jobId or photoUrl' }, { status: 400 })
    }

    // 1. Delete the file from Supabase Storage
    const fileName = photoUrl.split('/').pop()
    if (!fileName) {
        return NextResponse.json({ error: 'Invalid photoUrl' }, { status: 400 })
    }
    
    // The file path in storage includes the jobId as a folder
    const filePath = `${jobId}/${fileName}`
    const { error: deleteError } = await supabase.storage.from('job-photos').remove([filePath])

    if (deleteError) {
        console.error('Error deleting file from storage:', deleteError)
        return NextResponse.json({ error: 'Failed to delete photo from storage', details: deleteError.message }, { status: 500 })
    }

    // 2. Remove the URL from the jobs table
    const { data: jobData, error: fetchError } = await supabase
        .from('jobs')
        .select('photo_urls')
        .eq('id', jobId)
        .single()

    if (fetchError) {
        console.error('Error fetching job:', fetchError)
        return NextResponse.json({ error: 'Failed to fetch job' }, { status: 500 })
    }

    const newUrls = (jobData.photo_urls || []).filter((url: string) => url !== photoUrl)

    const { error: updateError } = await supabase
        .from('jobs')
        .update({ photo_urls: newUrls })
        .eq('id', jobId)

    if (updateError) {
        console.error('Error updating job with photo URL:', updateError)
        return NextResponse.json({ error: 'Failed to update job with photo URL', details: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
} 