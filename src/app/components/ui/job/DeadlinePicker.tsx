'use client'

import React from 'react'

type Props = {
    value: string
    onChange: (val: string) => void
}

export default function DeadlinePicker({ value, onChange }: Props) {
    return (
        <div>
            <label className="block text-sm font-medium text-white mb-1">Deadline</label>
            <input
                type="datetime-local"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full px-4 py-2 rounded bg-neutral-800 text-white"
            />
        </div>
    )
}
