import { NextResponse } from 'next/server'

export async function GET() {
    console.log('🔍 Health check endpoint hit!')
    
    return NextResponse.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        message: 'API is working'
    })
}

export async function POST(req: Request) {
    try {
        console.log('🔍 Health check POST endpoint hit!')
        const body = await req.json()
        
        return NextResponse.json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            receivedData: body,
            message: 'POST is working'
        })
    } catch (error) {
        console.error('❌ Health check error:', error)
        return NextResponse.json({ 
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    }
} 