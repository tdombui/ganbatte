// src/lib/getAddressSuggestions.ts
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

    return await res.json()
}
