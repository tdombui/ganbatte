// src/lib/getAddressSuggestions.ts
interface AddressSuggestion {
    id: string
    text: string
    mainText: string
    secondaryText: string
}

export async function getAddressSuggestions(input: string): Promise<string[]> {
    try {
        console.log('🔍 Requesting address suggestions for:', input)
        
        const res = await fetch('/api/getAddressSuggestions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ input }),
        })

        if (!res.ok) {
            console.error('❗ API request failed:', res.status, res.statusText)
            return []
        }

        const suggestions: AddressSuggestion[] = await res.json()
        console.log('✅ Received', suggestions.length, 'suggestions')
        
        return suggestions.map(suggestion => suggestion.text)
    } catch (error) {
        console.error('❌ Address suggestions error:', error)
        return []
    }
}
