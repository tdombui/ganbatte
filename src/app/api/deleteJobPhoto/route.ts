import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'

export async function POST(req: Request) {
    try {
        // Get the authorization header
        const authHeader = req.headers.get('authorization')
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.error('Missing or invalid authorization header')
            return NextResponse.json({ error: 'Missing authorization header' }, { status: 401 })
        }

        // Verify the user with the token
        const supabase = createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        
        if (authError || !user) {
            console.error('Authentication error:', authError)
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
        }

        // Check if user is staff/admin
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if (profileError || !profile) {
            console.error('Profile error:', profileError)
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
        }

        const isStaff = profile.role === 'staff' || profile.role === 'admin'
        if (!isStaff) {
            return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
        }

        const { jobId, photoUrl } = await req.json()

        if (!jobId || !photoUrl) {
            return NextResponse.json({ error: 'Missing jobId or photoUrl' }, { status: 400 })
        }

        console.log('Deleting photo from job:', jobId, 'photo:', photoUrl)

        // Get the current photo URLs for the job
        const { data: jobData, error: fetchError } = await supabase
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
        const { error: updateError } = await supabase
            .from('jobs')
            .update({ photo_urls: newUrls })
            .eq('id', jobId)

        if (updateError) {
            console.error('Error updating job:', updateError)
            return NextResponse.json({ error: 'Failed to update job', details: updateError.message }, { status: 500 })
        }

        console.log('Photo deleted successfully')
        return NextResponse.json({ success: true })

    } catch (error) {
        console.error('Unexpected error in deleteJobPhoto:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
} 