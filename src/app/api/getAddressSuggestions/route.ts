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
    try {
        const { input } = await req.json()
        
        if (!input || input.trim().length < 2) {
            return NextResponse.json([])
        }

        const apiKey = process.env.GOOGLE_MAPS_API_KEY
        if (!apiKey) {
            console.error('❌ Missing GOOGLE_MAPS_API_KEY environment variable')
            return NextResponse.json([], { status: 500 })
        }

        const endpoint = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
            input
        )}&types=address&key=${apiKey}`

        console.log('🔍 Fetching address suggestions for:', input)
        const res = await fetch(endpoint)
        
        if (!res.ok) {
            console.error('❌ Google Places API error:', res.status, res.statusText)
            return NextResponse.json([], { status: 200 })
        }

        const data = await res.json()
        console.log('📬 Google Places response status:', data.status)

        if (data.status !== 'OK') {
            console.warn('❗ Address suggestion error:', data.status, data.error_message)
            return NextResponse.json([], { status: 200 })
        }

        const suggestions = data.predictions?.map((prediction: GooglePlacesResult) => ({
            id: prediction.place_id,
            text: prediction.description,
            mainText: prediction.structured_formatting.main_text,
            secondaryText: prediction.structured_formatting.secondary_text,
        })) || []
        
        console.log('✅ Returning', suggestions.length, 'suggestions')
        return NextResponse.json(suggestions)
    } catch (error) {
        console.error('❌ Address suggestions error:', error)
        return NextResponse.json([], { status: 500 })
    }
}
