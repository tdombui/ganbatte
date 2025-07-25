'use client'

import { useState } from 'react'
import AddressInput from './AddressInput'
import DeadlinePicker from './DeadlinePicker'
import { useRouter } from 'next/navigation'
import { createClient } from '../../../../lib/supabase/client'

// Simple toast component (inline, for demo)
function Toast({ message, onClose }: { message: string, onClose: () => void }) {
    if (!message) return null
    return (
        <div className="fixed top-4 right-4 bg-emerald-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center gap-2">
            <span>{message}</span>
            <button onClick={onClose} className="text-white hover:text-emerald-200">×</button>
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
    const [smsOptinMode, setSmsOptinMode] = useState(false)
    const [smsConsent, setSmsConsent] = useState(false)
    const [phoneNumber, setPhoneNumber] = useState('')
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
            // Get auth headers
            const supabase = createClient()
            const { data: { session } } = await supabase.auth.getSession()
            const headers: HeadersInit = {
                'Content-Type': 'application/json',
            }
            
            if (session?.access_token) {
                headers['Authorization'] = `Bearer ${session.access_token}`
            }

            const res = await fetch('/api/createMultiLegJob', {
                method: 'POST',
                headers,
                body: JSON.stringify(payload),
            })
            const data = await res.json()
            if (data?.success && data?.jobId) {
                // Check if user has a phone number saved
                const { data: { user } } = await supabase.auth.getUser()
                
                // Also check twilio_customers table for existing phone number
                let hasExistingPhone = user?.phone
                if (!hasExistingPhone) {
                    try {
                        const { data: profileData, error } = await supabase
                            .from('profiles')
                            .select('phone, sms_opt_in')
                            .eq('id', user?.id)
                            .single()

                        if (error) {
                            console.error('Error checking SMS status:', error)
                        }

                        hasExistingPhone = profileData?.phone || profileData?.sms_opt_in
                    } catch (error) {
                        console.error('Error checking SMS status:', error)
                    }
                }

                if (hasExistingPhone) {
                    // User has phone number, proceed to job page
                    setToast('Job created! Redirecting...')
                    setTimeout(() => router.push(`/job/${data.jobId}`), 1200)
                } else {
                    // No phone number, trigger SMS opt-in
                    setSmsOptinMode(true)
                    setToast('Job created! Please opt-in for SMS updates.')
                }
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

    async function handleSmsOptin() {
        if (!smsConsent || !phoneNumber.trim()) {
            setToast('Please provide a phone number and consent to SMS updates.')
            return
        }

        setLoading(true)
        try {
            const supabase = createClient()
            const { data: { session } } = await supabase.auth.getSession()
            const headers: HeadersInit = {
                'Content-Type': 'application/json',
            }
            
            if (session?.access_token) {
                headers['Authorization'] = `Bearer ${session.access_token}`
            }

            const res = await fetch('/api/twilio/createJob', {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    phone_number: phoneNumber.trim(),
                    sms_consent: smsConsent,
                    consent_date: new Date().toISOString()
                }),
            })

            const data = await res.json()
            if (data?.success) {
                                 setToast('SMS opt-in successful! You\'ll now receive delivery updates, ETA notifications, and job status messages from Zukujet. Redirecting...')
                setTimeout(() => {
                    setSmsOptinMode(false)
                    router.push('/jobs')
                }, 1500)
            } else {
                setToast('❌ SMS opt-in failed: ' + (data?.error || 'Unknown error'))
            }
        } catch {
            setToast('❌ Network error. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <Toast message={toast} onClose={() => setToast('')} />
            {/* Form Header with Toggle Button - Same position as Multi Leg button */}
            <div className="flex justify-between items-center mb-4 font-sans">
                <div className="flex items-center gap-3">
                    <span className="text-white text-lg font-bold ">Multi-Trip Job Builder</span>
                </div>

            </div>
            <div className="space-y-4 font-sans">
                {/* Parts Section */}
                <div className="bg-neutral-900/50 rounded-lg p-4 border border-neutral-600">
                    <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <span className="text-emerald-400">📦</span>
                        Parts / Payload
                    </h2>
                    <div className="flex gap-2 mb-3">
                        <input
                            type="text"
                            value={partInput}
                            onChange={e => setPartInput(e.target.value)}
                            onKeyDown={handlePartInputKeyDown}
                            placeholder="Add a part and press Enter"
                            className="px-3 py-2 rounded-lg bg-neutral-800 text-white w-full border border-neutral-600 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-base"
                            disabled={loading}
                        />
                        <button
                            onClick={handleAddPart}
                            className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2 rounded-lg disabled:opacity-50 transition-colors font-medium text-base"
                            disabled={!partInput.trim() || loading}
                            type="button"
                        >
                            Add
                        </button>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-2">
                        {parts.map((part, idx) => (
                            <span key={part} className="flex items-center bg-emerald-600 text-white px-3 py-1 rounded-full text-sm font-medium shadow-sm">
                                {part}
                                <button
                                    onClick={() => handleRemovePart(idx)}
                                    className="ml-2 text-white hover:text-red-300 font-bold transition-colors"
                                    type="button"
                                    aria-label={`Remove ${part}`}
                                >×</button>
                            </span>
                        ))}
                    </div>
                    {errors.parts && <div className="text-red-400 text-sm mt-2 bg-red-900/20 px-3 py-2 rounded border border-red-800">{errors.parts}</div>}
                </div>

                {/* Legs Section */}
                <div className="bg-neutral-900/50 rounded-lg p-4 border border-neutral-600">
                    <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <span className="text-emerald-400">🚚</span>
                        Delivery Trips
                    </h2>
                    <div className="space-y-4">
                        {legs.map((leg, idx) => (
                            <div key={leg.part} className="relative bg-neutral-800 p-4 rounded-lg shadow-lg space-y-4 text-white border border-neutral-600 hover:border-neutral-500 transition-colors">
                                <button
                                    onClick={() => handleRemoveLeg(idx)}
                                    className="absolute top-2 right-2 text-red-400 hover:text-red-600 text-xl font-bold transition-colors"
                                    type="button"
                                    aria-label={`Remove leg for ${leg.part}`}
                                    disabled={loading}
                                >×</button>
                                <h3 className="font-semibold text-emerald-300 mb-3 text-lg border-b border-neutral-600 pb-2 pr-8">{leg.part}</h3>
                                <div className="space-y-4">
                                    <AddressInput
                                        label="Pickup Location"
                                        value={leg.pickup}
                                        onChange={val => updateLeg(idx, 'pickup', val)}
                                    />
                                    {errors[`pickup${idx}`] && <div className="text-red-400 text-sm mt-2 bg-red-900/20 px-3 py-2 rounded border border-red-800">{errors[`pickup${idx}`]}</div>}
                                    
                                    <AddressInput
                                        label="Dropoff Location"
                                        value={leg.dropoff}
                                        onChange={val => updateLeg(idx, 'dropoff', val)}
                                    />
                                    {errors[`dropoff${idx}`] && <div className="text-red-400 text-sm mt-2 bg-red-900/20 px-3 py-2 rounded border border-red-800">{errors[`dropoff${idx}`]}</div>}
                                </div>
                            </div>
                        ))}
                        {legs.length === 0 && (
                            <div className="text-center px-3 py-2 text-neutral-400 border-2 border-dashed border-neutral-600 rounded-lg">
                                <p>Add parts above to create delivery trips</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Deadline Section */}
                <div className="bg-neutral-900/50 rounded-lg p-4 border border-neutral-600">
                    <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <span className="text-emerald-400">⏰</span>
                        Deadline
                    </h2>
                    <DeadlinePicker value={deadline} onChange={setDeadline} />
                    {errors.deadline && <div className="text-red-400 text-sm mt-2 bg-red-900/20 px-3 py-2 rounded border border-red-800">{errors.deadline}</div>}
                </div>



                {/* Submit Button */}
                <div className="pt-2">
                    <button
                        onClick={handleSubmit}
                        disabled={loading || smsOptinMode}
                        className="bg-emerald-600 hover:bg-emerald-700 px-6 py-3 rounded-lg text-white w-full font-semibold flex items-center justify-center gap-3 disabled:opacity-60 transition-colors text-base shadow-lg"
                        type="button"
                    >
                        {loading && <span className="loader border-white border-t-emerald-300 mr-2"></span>}
                        {loading ? 'Creating Job...' : '📦 Create Multi-Trip Job'}
                    </button>
                </div>

                {/* SMS Opt-in Section */}
                {smsOptinMode && (
                    <div className="bg-emerald-900/20 rounded-lg p-6 border border-emerald-500/30">
                        <div className="text-center mb-4">
                            <h3 className="text-xl font-bold text-emerald-300 mb-2">📱 Stay Updated via SMS</h3>
                            <p className="text-gray-300 text-sm">
                                Get real-time updates about your delivery status via text message.
                            </p>
                        </div>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Phone Number
                                </label>
                                <input
                                    type="tel"
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                    placeholder="(555) 123-4567"
                                    className="w-full px-3 py-2 rounded-lg bg-neutral-800 text-white border border-neutral-600 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                                    disabled={loading}
                                />
                            </div>
                            
                            <div className="flex items-start gap-3">
                                <input
                                    type="checkbox"
                                    id="sms-consent"
                                    checked={smsConsent}
                                    onChange={(e) => setSmsConsent(e.target.checked)}
                                    className="mt-1 h-4 w-4 text-emerald-600 bg-neutral-800 border-neutral-600 rounded focus:ring-emerald-500 focus:ring-2"
                                    disabled={loading}
                                />
                                <label htmlFor="sms-consent" className="text-sm text-gray-300">
                                                                         I agree to receive SMS messages from Zukujet for delivery updates and service notifications. Message & data rates may apply. Reply STOP to unsubscribe.
                                </label>
                            </div>
                            
                            <div className="flex gap-3">
                                <button
                                    onClick={handleSmsOptin}
                                    disabled={loading || !smsConsent || !phoneNumber.trim()}
                                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-lg text-white font-medium disabled:opacity-50 transition-colors"
                                    type="button"
                                >
                                    {loading ? 'Opting in...' : 'Opt In for SMS Updates'}
                                </button>
                                <button
                                    onClick={() => {
                                        setSmsOptinMode(false)
                                        router.push('/jobs')
                                    }}
                                    disabled={loading}
                                    className="px-4 py-2 rounded-lg text-gray-300 border border-gray-600 hover:bg-gray-800 transition-colors"
                                    type="button"
                                >
                                    Skip
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            {/* Loader spinner style */}
            <style>{`.loader { border: 3px solid #fff3; border-radius: 50%; border-top: 3px solid #34d399; width: 1.2em; height: 1.2em; animation: spin 0.7s linear infinite; } @keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
        </>
    )
}
