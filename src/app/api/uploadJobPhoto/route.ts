import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/auth'

export async function POST(req: NextRequest) {
    try {
        // Get the user ID from the request headers
        const authHeader = req.headers.get('authorization')
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Verify the user token
        const token = authHeader.replace('Bearer ', '')
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
        
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const formData = await req.formData()
        const file = formData.get('file') as File
        const jobId = formData.get('jobId') as string

        if (!file || !jobId) {
            return NextResponse.json({ error: 'Missing file or jobId' }, { status: 400 })
        }

        // Upload the file using the service role client
        const filePath = `${jobId}/${new Date().toISOString()}-${file.name}`
        const { error: uploadError } = await supabaseAdmin.storage.from('job-photos').upload(filePath, file)

        if (uploadError) {
            console.error('Error uploading file:', uploadError)
            return NextResponse.json({ error: 'Failed to upload photo', details: uploadError.message }, { status: 500 })
        }

        // Get the public URL of the file
        const { data: { publicUrl } } = supabaseAdmin.storage.from('job-photos').getPublicUrl(filePath)

        if (!publicUrl) {
            return NextResponse.json({ error: 'Failed to get public URL' }, { status: 500 })
        }

        // Add the URL to the jobs table
        const { data: jobData, error: fetchError } = await supabaseAdmin
            .from('jobs')
            .select('photo_urls')
            .eq('id', jobId)
            .single()

        if (fetchError) {
            console.error('Error fetching job:', fetchError)
            return NextResponse.json({ error: 'Failed to fetch job', details: fetchError.message }, { status: 500 })
        }

        const newUrls = [...(jobData?.photo_urls || []), publicUrl]

        const { error: updateError } = await supabaseAdmin
            .from('jobs')
            .update({ photo_urls: newUrls })
            .eq('id', jobId)

        if (updateError) {
            console.error('Error updating job:', updateError)
            return NextResponse.json({ error: 'Failed to update job', details: updateError.message }, { status: 500 })
        }

        return NextResponse.json({ success: true, url: publicUrl })
    } catch (error) {
        console.error('Error in uploadJobPhoto:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
} 