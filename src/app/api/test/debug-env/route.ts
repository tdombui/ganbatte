import { NextResponse } from 'next/server'

export async function GET() {
    const envVars = {
        // Supabase
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasSupabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        hasSupabaseServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        
        // OpenAI
        hasOpenAIKey: !!process.env.OPENAI_API_KEY,
        openAIKeyLength: process.env.OPENAI_API_KEY?.length || 0,
        
        // Google Maps
        hasGoogleMapsKey: !!process.env.GOOGLE_MAPS_API_KEY,
        googleMapsKeyLength: process.env.GOOGLE_MAPS_API_KEY?.length || 0,
        
        // Environment
        nodeEnv: process.env.NODE_ENV,
        vercelEnv: process.env.VERCEL_ENV,
        
        // URLs (without exposing full keys)
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'MISSING',
        openaiKey: process.env.OPENAI_API_KEY ? `sk-...${process.env.OPENAI_API_KEY.slice(-4)}` : 'MISSING',
        googleMapsKey: process.env.GOOGLE_MAPS_API_KEY ? `AIza...${process.env.GOOGLE_MAPS_API_KEY.slice(-4)}` : 'MISSING',
    }

    console.log('🔍 Environment check:', envVars)
    
    return NextResponse.json({
        success: true,
        environment: envVars,
        timestamp: new Date().toISOString()
    })
} 