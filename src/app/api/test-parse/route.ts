import { NextResponse } from 'next/server'

export async function POST(req: Request) {
    try {
        console.log('🔍 Test parse endpoint hit!')
        const body = await req.json()
        console.log('🔍 Request body:', body)
        
        return NextResponse.json({ 
            success: true, 
            message: 'Test endpoint working',
            receivedData: body 
        })
    } catch (error) {
        console.error('❌ Test parse error:', error)
        return NextResponse.json({ error: 'Test failed' }, { status: 500 })
    }
} 