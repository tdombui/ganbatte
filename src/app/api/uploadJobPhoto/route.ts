import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// This admin client can bypass RLS policies
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
    // 1. Create a user-scoped client to check authentication and upload to storage
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File
    const jobId = formData.get('jobId') as string

    if (!file || !jobId) {
        return NextResponse.json({ error: 'Missing file or jobId' }, { status: 400 })
    }

    // 2. Upload the file using the user's permissions.
    // This respects Storage RLS policies (e.g., authenticated users can upload).
    const filePath = `${jobId}/${new Date().toISOString()}-${file.name}`
    const { error: uploadError } = await supabase.storage.from('job-photos').upload(filePath, file)

    if (uploadError) {
        console.error('Error uploading file:', uploadError)
        return NextResponse.json({ error: 'Failed to upload photo', details: uploadError.message }, { status: 500 })
    }

    // 3. Get the public URL of the file.
    const { data: { publicUrl } } = supabase.storage.from('job-photos').getPublicUrl(filePath)

    if (!publicUrl) {
        return NextResponse.json({ error: 'Failed to get public URL' }, { status: 500 })
    }

    // 4. Use the admin client to add the URL to the jobs table, bypassing RLS.
    const { data: jobData, error: fetchError } = await supabaseAdmin
        .from('jobs')
        .select('photo_urls')
        .eq('id', jobId)
        .single()

    if (fetchError) {
        console.error('Error fetching job with admin client:', fetchError)
        return NextResponse.json({ error: 'Failed to fetch job', details: fetchError.message }, { status: 500 })
    }

    const newUrls = [...(jobData?.photo_urls || []), publicUrl]

    const { error: updateError } = await supabaseAdmin
        .from('jobs')
        .update({ photo_urls: newUrls })
        .eq('id', jobId)

    if (updateError) {
        console.error('Error updating job with admin client:', updateError)
        return NextResponse.json({ error: 'Failed to update job', details: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, url: publicUrl })
} 