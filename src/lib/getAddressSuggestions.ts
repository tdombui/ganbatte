// src/lib/getAddressSuggestions.ts
interface AddressSuggestion {
    id: string
    text: string
    mainText: string
    secondaryText: string
}

export async function getAddressSuggestions(input: string): Promise<string[]> {
    const res = await fetch('/api/getAddressSuggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input }),
    })

    if (!res.ok) {
        console.warn('❗ API request failed')
        return []
    }

    const suggestions: AddressSuggestion[] = await res.json()
    return suggestions.map(suggestion => suggestion.text)
}
