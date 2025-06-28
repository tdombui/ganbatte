import { NextResponse } from 'next/server'
import { supabase } from '@/lib/auth'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
    try {
        // Get the authorization header
        const authHeader = req.headers.get('authorization')
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.error('Missing or invalid authorization header')
            return NextResponse.json({ error: 'Missing authorization header' }, { status: 401 })
        }

        // Extract the token
        const token = authHeader.replace('Bearer ', '')
        
        // Verify the user with the token
        const { data: { user }, error: authError } = await supabase.auth.getUser(token)
        
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

        // Create a new Supabase client with the user's token for RLS
        const supabaseWithAuth = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                global: {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            }
        )

        // Get the current photo URLs for the job
        const { data: jobData, error: fetchError } = await supabaseWithAuth
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
        const { error: updateError } = await supabaseWithAuth
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