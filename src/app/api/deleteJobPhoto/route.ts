import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(req: NextRequest) {
    try {
        // Get the user ID from the request headers
        const authHeader = req.headers.get('authorization')
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Verify the user token
        const token = authHeader.replace('Bearer ', '')
        const { data: { user }, error: authError } = await supabase.auth.getUser(token)
        
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { jobId, photoUrl } = await req.json()

        if (!jobId || !photoUrl) {
            return NextResponse.json({ error: 'Missing jobId or photoUrl' }, { status: 400 })
        }

        // Delete the file from Supabase Storage
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

        // Remove the URL from the jobs table
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
    } catch (error) {
        console.error('Error in deleteJobPhoto:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
} 