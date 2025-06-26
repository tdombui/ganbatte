// app/api/route/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { fetchRoute } from '@/lib/fetchRoute'

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url)
    const pickup = searchParams.get('pickup')
    const dropoff = searchParams.get('dropoff')

    if (!pickup || !dropoff) {
        return NextResponse.json({ error: 'Missing pickup or dropoff' }, { status: 400 })
    }

    try {
        const route = await fetchRoute(pickup, dropoff)
        return NextResponse.json(route)
    } catch (err) {
        console.error('❌ fetchRoute failed:', err)
        return NextResponse.json({ error: 'Route fetch failed' }, { status: 500 })
    }
}
