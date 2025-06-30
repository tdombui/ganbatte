import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST(req: Request) {
    try {
        // Get the authorization header
        const authHeader = req.headers.get('authorization')
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Missing authorization header' }, { status: 401 })
        }

        // Extract the token
        const token = authHeader.replace('Bearer ', '')
        
        // Verify the user with the token
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
        
        if (authError || !user) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
        }

        console.log('🔍 Checking profile for user:', user.id)

        // Check if profile exists
        const { data: profile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()

        if (profileError && profileError.code === 'PGRST116') {
            // Profile doesn't exist, create one
            console.log('🔍 Creating profile for user:', user.id)
            
            const { data: newProfile, error: createError } = await supabaseAdmin
                .from('profiles')
                .insert([{
                    id: user.id,
                    email: user.email || '',
                    full_name: user.user_metadata?.full_name || '',
                    role: 'customer'
                }])
                .select('*')
                .single()

            if (createError) {
                return NextResponse.json({ 
                    error: 'Failed to create profile', 
                    details: createError.message 
                }, { status: 500 })
            }

            return NextResponse.json({ 
                success: true, 
                message: 'Profile created',
                profile: newProfile 
            })
        } else if (profileError) {
            return NextResponse.json({ 
                error: 'Profile lookup failed', 
                details: profileError.message 
            }, { status: 500 })
        } else {
            return NextResponse.json({ 
                success: true, 
                message: 'Profile exists',
                profile 
            })
        }

    } catch (error) {
        console.error('Unexpected error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
} 