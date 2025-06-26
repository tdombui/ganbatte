'use client'

import { useState, useEffect, useRef } from 'react'
import { getAddressSuggestions } from '@/lib/getAddressSuggestions'

type Props = {
    label: string
    value: string
    onChange: (val: string) => void
}

export default function AddressInput({ label, value, onChange }: Props) {
    const [inputValue, setInputValue] = useState(value)
    const [suggestions, setSuggestions] = useState<string[]>([])
    const ignoreNextFetch = useRef(false)

    // Sync with parent-provided value
    useEffect(() => {
        setInputValue(value)
    }, [value])

    // Fetch address suggestions as you type
    useEffect(() => {
        if (ignoreNextFetch.current) {
            ignoreNextFetch.current = false
            return
        }

        const delay = setTimeout(async () => {
            if (inputValue.trim().length > 2) {
                const results = await getAddressSuggestions(inputValue)
                setSuggestions(results)
            } else {
                setSuggestions([])
            }
        }, 300)

        return () => clearTimeout(delay)
    }, [inputValue])

    const handleSelect = (suggestion: string) => {
        ignoreNextFetch.current = true
        onChange(suggestion)
        setInputValue(suggestion)
        setSuggestions([])
    }

    return (
        <div className="relative">
            <label className="text-sm block mb-1 text-white">{label}</label>
            <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="w-full px-4 py-2 rounded bg-neutral-900 text-white"
                placeholder="Start typing address..."
            />
            {suggestions.length > 0 && (
                <ul className="absolute z-10 w-full bg-white text-black border mt-1 rounded shadow max-h-60 overflow-y-auto">
                    {suggestions.map((s, i) => (
                        <li
                            key={i}
                            className="px-4 py-2 hover:bg-emerald-100 cursor-pointer"
                            onClick={() => handleSelect(s)}
                        >
                            {s}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}
