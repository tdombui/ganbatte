import { NextResponse } from 'next/server'

export async function POST(req: Request) {
    try {
        const body = await req.json()
        console.log('🔍 DEBUG: Job payload received:', JSON.stringify(body, null, 2))
        
        // Check if all required fields are present
        const requiredFields = ['parts', 'pickup', 'dropoff', 'deadline']
        const missingFields = requiredFields.filter(field => !body[field])
        
        console.log('🔍 DEBUG: Missing fields:', missingFields)
        console.log('🔍 DEBUG: Field types:', {
            parts: typeof body.parts,
            pickup: typeof body.pickup,
            dropoff: typeof body.dropoff,
            deadline: typeof body.deadline,
            partsIsArray: Array.isArray(body.parts),
            partsLength: body.parts?.length
        })
        
        return NextResponse.json({
            received: body,
            missingFields,
            fieldTypes: {
                parts: typeof body.parts,
                pickup: typeof body.pickup,
                dropoff: typeof body.dropoff,
                deadline: typeof body.deadline,
                partsIsArray: Array.isArray(body.parts),
                partsLength: body.parts?.length
            }
        })
    } catch (error) {
        console.error('🔥 DEBUG: Error parsing request body:', error)
        return NextResponse.json({ error: 'Failed to parse request body' }, { status: 400 })
    }
} 