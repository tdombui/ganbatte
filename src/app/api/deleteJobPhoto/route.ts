import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/auth'

export async function DELETE(req: NextRequest) {
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

        const { searchParams } = new URL(req.url)
        const jobId = searchParams.get('jobId')
        const photoUrl = searchParams.get('photoUrl')

        if (!jobId || !photoUrl) {
            return NextResponse.json({ error: 'Missing jobId or photoUrl' }, { status: 400 })
        }

        // Get the current photo URLs for the job
        const { data: jobData, error: fetchError } = await supabaseAdmin
            .from('jobs')
            .select('photo_urls')
            .eq('id', jobId)
            .single()

        if (fetchError) {
            console.error('Error fetching job:', fetchError)
            return NextResponse.json({ error: 'Failed to fetch job', details: fetchError.message }, { status: 500 })
        }

        // Remove the specified photo URL
        const newUrls = (jobData?.photo_urls || []).filter((url: string) => url !== photoUrl)

        // Update the job with the new photo URLs
        const { error: updateError } = await supabaseAdmin
            .from('jobs')
            .update({ photo_urls: newUrls })
            .eq('id', jobId)

        if (updateError) {
            console.error('Error updating job:', updateError)
            return NextResponse.json({ error: 'Failed to update job', details: updateError.message }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error in deleteJobPhoto:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
} 