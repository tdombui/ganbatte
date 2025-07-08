import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
    try {
        console.log('🔍 Production debug endpoint called')
        
        // Test 1: Check if Supabase connection works
        const { data: testData, error: testError } = await supabaseAdmin
            .from('jobs')
            .select('count')
            .limit(1)
        
        console.log('🔍 Supabase connection test:', { testData, testError })
        
        // Test 2: Check environment variables
        const envCheck = {
            hasSupabaseUrl: !!process.env.SUPABASE_URL,
            hasSupabaseServiceRole: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
            hasSupabaseAnon: !!process.env.SUPABASE_ANON_KEY,
            nodeEnv: process.env.NODE_ENV,
            vercelEnv: process.env.VERCEL_ENV
        }
        
        console.log('🔍 Environment check:', envCheck)
        
        // Test 3: Check auth header if provided
        const authHeader = request.headers.get('authorization')
        const authTest: {
            hasAuthHeader: boolean
            token: string | null
            user: { id: string; email: string | undefined } | null
            authError: unknown
        } = { hasAuthHeader: !!authHeader, token: null, user: null, authError: null }
        
        if (authHeader) {
            const token = authHeader.replace('Bearer ', '')
            authTest.token = token.substring(0, 20) + '...'
            
            const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
            authTest.user = user ? { id: user.id, email: user.email } : null
            authTest.authError = authError
        }
        
        console.log('🔍 Auth test:', authTest)
        
        return NextResponse.json({
            success: true,
            timestamp: new Date().toISOString(),
            supabaseTest: { data: testData, error: testError },
            environment: envCheck,
            auth: authTest
        })
        
    } catch (error) {
        console.error('❌ Production debug error:', error)
        return NextResponse.json({ 
            error: 'Debug endpoint failed',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    }
} 