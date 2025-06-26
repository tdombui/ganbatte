'use client'

import { useState } from 'react'
import AddressInput from '../job/AddressInput'
import DeadlinePicker from '../job/DeadlinePicker'
import { useRouter } from 'next/navigation'

// Simple toast component (inline, for demo)
function Toast({ message, onClose }: { message: string, onClose: () => void }) {
    if (!message) return null
    return (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 bg-emerald-600 text-white px-6 py-3 rounded shadow-lg z-50 flex items-center gap-4 animate-fade-in">
            <span>{message}</span>
            <button onClick={onClose} className="ml-2 text-white font-bold">×</button>
        </div>
    )
}

export default function MultiLegForm() {
    const [partInput, setPartInput] = useState('')
    const [parts, setParts] = useState<string[]>([])
    const [legs, setLegs] = useState<{ part: string, pickup: string, dropoff: string }[]>([])
    const [deadline, setDeadline] = useState('')
    const [loading, setLoading] = useState(false)
    const [errors, setErrors] = useState<{ [key: string]: string }>({})
    const [toast, setToast] = useState('')
    const router = useRouter()

    // Add part as tag
    function handleAddPart() {
        const trimmed = partInput.trim()
        if (trimmed && !parts.includes(trimmed)) {
            const newParts = [...parts, trimmed]
            setParts(newParts)
            setLegs(newParts.map(part => {
                const existing = legs.find(l => l.part === part)
                return existing || { part, pickup: '', dropoff: '' }
            }))
        }
        setPartInput('')
    }

    // Remove part/tag
    function handleRemovePart(idx: number) {
        const newParts = parts.filter((_, i) => i !== idx)
        setParts(newParts)
        setLegs(legs.filter(l => newParts.includes(l.part)))
    }

    // Update pickup/dropoff for a leg
    function updateLeg(index: number, key: 'pickup' | 'dropoff', value: string) {
        setLegs(prev => {
            const updated = [...prev]
            updated[index][key] = value
            return updated
        })
    }

    // Remove a leg (removes the part too)
    function handleRemoveLeg(idx: number) {
        handleRemovePart(idx)
    }

    // Validation
    function validate() {
        const errs: { [key: string]: string } = {}
        if (parts.length === 0) errs.parts = 'Add at least one part.'
        legs.forEach((leg, i) => {
            if (!leg.pickup) errs[`pickup${i}`] = 'Pickup required.'
            if (!leg.dropoff) errs[`dropoff${i}`] = 'Dropoff required.'
        })
        if (!deadline) errs.deadline = 'Deadline required.'
        setErrors(errs)
        return Object.keys(errs).length === 0
    }

    async function handleSubmit() {
        if (!validate()) return
        setLoading(true)
        setErrors({})
        const payload = { parts, deadline, legs }
        try {
            const res = await fetch('/api/createMultiLegJob', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })
            const data = await res.json()
            if (data?.success && data?.jobId) {
                setToast('Job created! Redirecting...')
                setTimeout(() => router.push(`/job/${data.jobId}`), 1200)
            } else {
                setToast('❌ Failed to submit job: ' + (data?.error || 'Unknown error'))
            }
        } catch {
            setToast('❌ Network error. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    function handlePartInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.key === 'Enter') {
            e.preventDefault()
            e.stopPropagation()
            handleAddPart()
        }
    }

    return (
        <div className="max-w-xl mx-auto space-y-8">
            <Toast message={toast} onClose={() => setToast('')} />
            {/* Parts Section */}
            <div>
                <h2 className="text-lg font-bold text-white mb-2">Parts / Payload</h2>
                <div className="flex gap-2 mb-2">
                    <input
                        type="text"
                        value={partInput}
                        onChange={e => setPartInput(e.target.value)}
                        onKeyDown={handlePartInputKeyDown}
                        placeholder="Add a part and press Enter"
                        className="px-4 py-2 rounded bg-neutral-900 text-white w-full"
                        disabled={loading}
                    />
                    <button
                        onClick={handleAddPart}
                        className="bg-emerald-500 text-white px-4 py-2 rounded disabled:opacity-50"
                        disabled={!partInput.trim() || loading}
                        type="button"
                    >
                        Add
                    </button>
                </div>
                <div className="flex flex-wrap gap-2 mb-1">
                    {parts.map((part, idx) => (
                        <span key={part} className="flex items-center bg-emerald-700 text-white px-3 py-1 rounded-full text-sm">
                            {part}
                            <button
                                onClick={() => handleRemovePart(idx)}
                                className="ml-2 text-white hover:text-red-300 font-bold"
                                type="button"
                                aria-label={`Remove ${part}`}
                            >×</button>
                        </span>
                    ))}
                </div>
                {errors.parts && <div className="text-red-400 text-sm mt-1">{errors.parts}</div>}
            </div>

            {/* Legs Section */}
            <div>
                <h2 className="text-lg font-bold text-white mb-2">Trips</h2>
                <div className="space-y-4">
                    {legs.map((leg, idx) => (
                        <div key={leg.part} className="relative bg-neutral-900 p-5 rounded-lg shadow space-y-2 text-white border border-neutral-700">
                            <button
                                onClick={() => handleRemoveLeg(idx)}
                                className="absolute top-2 right-2 text-red-400 hover:text-red-600 text-xl font-bold"
                                type="button"
                                aria-label={`Remove leg for ${leg.part}`}
                                disabled={loading}
                            >×</button>
                            <h3 className="font-semibold text-emerald-300 mb-2">{leg.part}</h3>
                            <AddressInput
                                label="Pickup Location"
                                value={leg.pickup}
                                onChange={val => updateLeg(idx, 'pickup', val)}
                            />
                            {errors[`pickup${idx}`] && <div className="text-red-400 text-sm">{errors[`pickup${idx}`]}</div>}
                            <AddressInput
                                label="Dropoff Location"
                                value={leg.dropoff}
                                onChange={val => updateLeg(idx, 'dropoff', val)}
                            />
                            {errors[`dropoff${idx}`] && <div className="text-red-400 text-sm">{errors[`dropoff${idx}`]}</div>}
                        </div>
                    ))}
                </div>
            </div>

            {/* Deadline Section */}
            <div>
                <h2 className="text-lg font-bold text-white mb-2">Deadline</h2>
                <div className="flex flex-col gap-2">
                    <DeadlinePicker value={deadline} onChange={setDeadline} />
                    {errors.deadline && <div className="text-red-400 text-sm">{errors.deadline}</div>}
                </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
                <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="bg-emerald-600 hover:bg-emerald-700 px-6 py-3 rounded text-white w-full font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
                    type="button"
                >
                    {loading && <span className="loader border-white border-t-emerald-300 mr-2"></span>}
                    {loading ? 'Sending...' : '📦 Submit Job'}
                </button>
            </div>
            {/* Loader spinner style */}
            <style>{`.loader { border: 3px solid #fff3; border-radius: 50%; border-top: 3px solid #34d399; width: 1.2em; height: 1.2em; animation: spin 0.7s linear infinite; } @keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
        </div>
    )
}
