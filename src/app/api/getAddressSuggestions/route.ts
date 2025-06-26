// src/app/api/getAddressSuggestions/route.ts
import { NextResponse } from 'next/server'

interface GooglePlacesResult {
    place_id: string
    description: string
    structured_formatting: {
        main_text: string
        secondary_text: string
    }
}

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

    const suggestions = data.predictions?.map((prediction: GooglePlacesResult) => ({
        id: prediction.place_id,
        text: prediction.description,
        mainText: prediction.structured_formatting.main_text,
        secondaryText: prediction.structured_formatting.secondary_text,
    })) || []
    return NextResponse.json(suggestions)
}
