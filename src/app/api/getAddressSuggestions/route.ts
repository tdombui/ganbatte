// src/app/api/getAddressSuggestions/route.ts
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
    const { input } = await req.json()

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    const endpoint = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
        input
    )}&types=address&key=${apiKey}`

    const res = await fetch(endpoint)
    const data = await res.json()

    if (data.status !== 'OK') {
        console.warn('❗ Address suggestion error:', data.status)
        return NextResponse.json([], { status: 200 })
    }

    const suggestions = data.predictions.map((p: any) => p.description)
    return NextResponse.json(suggestions)
}
