import { NextResponse } from 'next/server'

export async function POST(req: Request) {
    try {
        console.log('🔍 ParseJob-simple: Starting request...')
        const { text, history, overrideField } = await req.json()

        console.log('🔍 ParseJob-simple request:', { text, overrideField, historyLength: history?.length || 0 })

        // Simple mock response without calling external APIs
        const mockJob = {
            parts: ['wheels'],
            pickup: 'San Francisco, CA',
            dropoff: 'Los Angeles, CA',
            deadline: '2025-06-28T17:00:00.000Z',
            deadlineDisplay: 'Tomorrow, 5:00 PM PDT'
        }

        console.log('🔍 ParseJob-simple: Returning mock job')
        return NextResponse.json({ job: mockJob })

    } catch (err) {
        console.error('🔥 /api/test/parseJob-simple error:', err)
        return NextResponse.json({ error: 'Failed to parse job' }, { status: 500 })
    }
} 