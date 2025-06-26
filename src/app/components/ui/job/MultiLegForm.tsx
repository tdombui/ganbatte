'use client'

import { useState } from 'react'
import AddressInput from '../job/AddressInput' // a custom input w/ validation dropdown
import DeadlinePicker from '../job/DeadlinePicker' // simple calendar + time picker
import { useRouter } from 'next/navigation'

export default function MultiLegForm() {
    const [partsInput, setPartsInput] = useState('')
    const [parts, setParts] = useState<string[]>([])
    const [legs, setLegs] = useState<{ part: string, pickup: string, dropoff: string }[]>([])
    const [deadline, setDeadline] = useState('')
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    function handleAddParts() {
        const splitParts = partsInput.split(',').map(p => p.trim()).filter(p => p)
        setParts(splitParts)
        setLegs(splitParts.map(part => ({ part, pickup: '', dropoff: '' })))
    }

    function updateLeg(index: number, key: 'pickup' | 'dropoff', value: string) {
        setLegs(prev => {
            const updated = [...prev]
            updated[index][key] = value
            return updated
        })
    }

    async function handleSubmit() {
        const payload = { parts, deadline, legs }

        const res = await fetch('/api/createMultiLegJob', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        })

        const data = await res.json()

        console.log('📬 API response:', data)

        if (data?.success && data?.jobId) {
            router.push(`/job/${data.jobId}`)
        } else {
            alert('❌ Failed to submit job: ' + (data?.error || 'Unknown error'))
        }
    }



    return (
        <div className="space-y-4">
            <label className="block font-semibold text-white">Payload (comma-separated)</label>
            <div className="flex gap-2">
                <input
                    value={partsInput}
                    onChange={e => setPartsInput(e.target.value)}
                    placeholder="e.g. brake pads, turbo kit, coilovers"
                    className="px-4 py-2 rounded bg-neutral-900 text-white w-full"
                />
                <button
                    onClick={handleAddParts}
                    className="bg-emerald-500 text-white px-4 py-2 rounded"
                >
                    Add Parts
                </button>
            </div>

            {legs.map((leg, idx) => (
                <div key={idx} className="bg-neutral-900 p-4 rounded-lg space-y-2 text-white">
                    <h3 className="font-bold">{leg.part}</h3>
                    <AddressInput
                        label="Pickup Location"
                        value={leg.pickup}
                        onChange={val => updateLeg(idx, 'pickup', val)}
                    />
                    <AddressInput
                        label="Dropoff Location"
                        value={leg.dropoff}
                        onChange={val => updateLeg(idx, 'dropoff', val)}
                    />
                </div>
            ))}

            <div className="pt-4 text-white">
                <DeadlinePicker value={deadline} onChange={setDeadline} />
            </div>

            <div className="pt-6">
                <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="bg-emerald-600 hover:bg-emerald-700 px-6 py-3 rounded text-white w-full font-semibold"
                >
                    {loading ? 'Sending...' : '📦 Submit Job'}
                </button>
            </div>
        </div>
    )
}
