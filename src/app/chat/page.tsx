'use client'

import React, { useState, useEffect, useRef } from 'react'
import { ParsedJob } from '@/types/job'
import { SendHorizonal } from 'lucide-react'
import { formatDeadline } from '@/lib/formatDeadline'
import MultiLegForm from '@/app/components/ui/job/MultiLegForm'

// Function to convert markdown bold to HTML
const parseMarkdownBold = (text: string) => {
    return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
}

export default function ChatPage() {
    const [viewMode, setViewMode] = useState<'chat' | 'form'>('chat')
    const [messages, setMessages] = useState<string[]>([])
    const [parsedJob, setParsedJob] = useState<ParsedJob | null>(null)
    const [loading, setLoading] = useState(false)
    const [awaitingConfirmation, setAwaitingConfirmation] = useState(false)
    const [lastQuestion, setLastQuestion] = useState<'pickup' | 'dropoff' | 'deadline' | null>(null)
    const [savedJob, setSavedJob] = useState<{ id: string } | null>(null)
    const [showCalendar, setShowCalendar] = useState(false)
    const [selectedDateTime, setSelectedDateTime] = useState('')
    const chatEndRef = useRef<HTMLDivElement | null>(null)

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    async function handleSend(message: string) {
        const recentMessages = messages.slice(-6).join('\n')

        let overrideField: 'pickup' | 'dropoff' | 'deadline' | null = null
        if (lastQuestion === 'pickup') overrideField = 'pickup'
        else if (lastQuestion === 'dropoff') overrideField = 'dropoff'
        else if (lastQuestion === 'deadline') overrideField = 'deadline'

        setMessages((prev) => [...prev, `user:${message}`])

        if (awaitingConfirmation && parsedJob) {
            const response = message.toLowerCase()
            if (['yes', 'y', 'yup', 'ye', 'yee'].includes(response)) {
                setMessages((prev) => [...prev, `ai:Saving your job...`])
                try {
                    const res = await fetch('/api/createJob', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(parsedJob),
                    })

                    if (res.ok) {
                        const { job } = await res.json()
                        setSavedJob(job)
                        setMessages((prev) => [
                            ...prev,
                            `ai:Job booked. View your job here: /job/${job.id}`,
                        ])
                    } else {
                        setMessages((prev) => [...prev, `ai:Failed to save job.`])
                    }
                } catch (err) {
                    console.error('❌ saveJob error:', err)
                    setMessages((prev) => [...prev, `ai:Failed to save job.`])
                }
                setAwaitingConfirmation(false)
                return
            } else if (['no', 'n', 'nah'].includes(response)) {
                setMessages((prev) => [
                    ...prev,
                    `ai:Okay, let's try again. Please retype your request.`,
                ])
                setParsedJob(null)
                setAwaitingConfirmation(false)
                return
            }
        }

        setLoading(true)

        try {
            const res = await fetch('/api/parseJob', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: message,
                    history: recentMessages,
                    overrideField,
                }),
            })

            const data = await res.json()

            if (data.needsClarification && data.message) {
                setMessages((prev) => [...prev, `ai:${data.message}`])

                if (data.message.includes('pickup')) setLastQuestion('pickup')
                else if (data.message.includes('dropoff')) setLastQuestion('dropoff')
                else if (data.message.toLowerCase().includes('when')) {
                    setLastQuestion('deadline')
                    setShowCalendar(true)
                }

                setParsedJob(null)
                setAwaitingConfirmation(false)
                return
            }

            if (data.job) {
                setParsedJob(data.job)
                setLastQuestion(null)

                // Format the response with better structure
                const partsList = data.job.parts.length > 0 
                    ? data.job.parts.map((part: string) => `• ${part}`).join('\n')
                    : '• [no parts found]'
                
                const pickupAddress = data.job.pickup || '[pickup missing]'
                const dropoffAddress = data.job.dropoff || '[dropoff missing]'
                const deadlineText = data.job.deadline ? formatDeadline(data.job.deadline) : null

                const summary = `Got it! You need:\n\n${partsList}\n\n📌 Picked up from: ${pickupAddress}\n📌 Delivered to: ${dropoffAddress}${deadlineText ? `\n\nDue: ${deadlineText}` : ''}`

                setMessages((prev) => [
                    ...prev,
                    `ai:${summary}`,
                    'ai:Does this look right?',
                ])

                setAwaitingConfirmation(true)
            }
        } catch (err) {
            console.error('❌ parseJob error:', err)
            setMessages((prev) => [...prev, 'ai:Internal server error.'])
        } finally {
            setLoading(false)
        }
    }

    const handleConfirmation = async (confirmed: boolean) => {
        if (!parsedJob) return

        if (confirmed) {
            setMessages((prev) => [...prev, `ai:Saving your job...`])
            try {
                const res = await fetch('/api/createJob', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(parsedJob),
                })

                if (res.ok) {
                    const { job } = await res.json()
                    setSavedJob(job)
                    setMessages((prev) => [
                        ...prev,
                        `ai:Job booked. View your job here: /job/${job.id}`,
                    ])
                } else {
                    setMessages((prev) => [...prev, `ai:Failed to save job.`])
                }
            } catch (err) {
                console.error('❌ saveJob error:', err)
                setMessages((prev) => [...prev, `ai:Failed to save job.`])
            }
        } else {
            setMessages((prev) => [
                ...prev,
                `ai:Okay, let's try again. Please retype your request.`,
            ])
            setParsedJob(null)
        }
        setAwaitingConfirmation(false)
    }

    const handleCalendarSubmit = () => {
        if (selectedDateTime) {
            const date = new Date(selectedDateTime)
            const formattedDate = date.toLocaleString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            })
            
            setMessages((prev) => [...prev, `user:${formattedDate}`])
            setShowCalendar(false)
            setSelectedDateTime('')
            
            // Process the date input
            setTimeout(() => {
                handleSend(formattedDate)
            }, 100)
        }
    }

    const CalendarPicker = () => (
        <div className="mr-auto max-w-[80%] mb-4">
            <div className="bg-gray-600 text-white rounded-2xl rounded-bl-md px-4 py-2">
                <div className="space-y-3">
                    <div className="text-center font-medium">Select Date & Time</div>
                    <input
                        type="datetime-local"
                        value={selectedDateTime}
                        onChange={(e) => setSelectedDateTime(e.target.value)}
                        className="w-full px-3 py-2 bg-neutral-800 rounded-lg text-white border border-neutral-600 focus:border-blue-500 focus:outline-none"
                        min={new Date().toISOString().slice(0, 16)}
                    />
                    <div className="flex gap-2 justify-center">
                        <button
                            onClick={handleCalendarSubmit}
                            disabled={!selectedDateTime}
                            className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-500 text-white px-4 py-2 rounded-lg transition-colors"
                        >
                            Set Deadline
                        </button>
                        <button
                            onClick={() => {
                                setShowCalendar(false)
                                setSelectedDateTime('')
                            }}
                            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
            <div className="w-3 h-3 mr-auto bg-gray-600 rounded-bl-full" style={{ marginTop: '-12px' }}></div>
        </div>
    )

    return (
        <div className="max-w-xl mx-auto py-8">
            <header className="text-2xl font-medium font-sans mb-3">Ganbatte Part Sprinter</header>

            <div className="flex justify-end mb-4">
                <button
                    onClick={() => setViewMode((prev) => (prev === 'chat' ? 'form' : 'chat'))}
                    className="text-sm text-emerald-400 hover:underline"
                >
                    {viewMode === 'chat' ? 'Create multi-trip job →' : '← Back to single trip job'}
                </button>
            </div>

            {viewMode === 'chat' && (
                <>
                    <div className="rounded-xl p-6 h-96 overflow-y-scroll mb-6 bg-neutral-950 text-white">
                        {messages.map((msg, idx) => {
                            const isUser = msg.startsWith('user:')
                            const content = msg.replace(/^(user|ai):/, '')
                            
                            return (
                                <div
                                    key={idx}
                                    className={`mb-4 max-w-[80%] ${isUser ? 'ml-auto' : 'mr-auto'}`}
                                >
                                    <div className={`relative px-4 py-2 rounded-2xl ${
                                        isUser 
                                            ? 'bg-blue-500 text-white rounded-br-md' 
                                            : 'bg-gray-600 text-white rounded-bl-md'
                                    }`}>
                                        {content.includes('/job/') ? (
                                            <span
                                                dangerouslySetInnerHTML={{
                                                    __html: content.replace(
                                                        /(\/job\/[a-z0-9\-]+)/gi,
                                                        `<a href="$1" class="underline text-blue-200">$1</a>`
                                                    ),
                                                }}
                                            />
                                        ) : (
                                            <div 
                                                className="whitespace-pre-wrap"
                                                dangerouslySetInnerHTML={{
                                                    __html: parseMarkdownBold(content)
                                                }}
                                            />
                                        )}
                                    </div>
                                    
                                    {/* Message tail */}
                                    <div className={`w-3 h-3 ${
                                        isUser 
                                            ? 'ml-auto bg-blue-500 rounded-br-full' 
                                            : 'mr-auto bg-gray-600 rounded-bl-full'
                                    }`} style={{ marginTop: '-12px' }}></div>
                                </div>
                            )
                        })}
                        
                        {/* Confirmation buttons */}
                        {awaitingConfirmation && (
                            <div className="mr-auto max-w-[80%] mb-4">
                                <div className="bg-gray-600 text-white rounded-2xl rounded-bl-md px-4 py-2">
                                    <div className="flex gap-3 justify-center">
                                        <button
                                            onClick={() => handleConfirmation(true)}
                                            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-full flex items-center gap-2 transition-colors"
                                        >
                                            <span className="text-lg">✅</span>
                                            <span>Yes</span>
                                        </button>
                                        <button
                                            onClick={() => handleConfirmation(false)}
                                            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-full flex items-center gap-2 transition-colors"
                                        >
                                            <span className="text-lg">❌</span>
                                            <span>No</span>
                                        </button>
                                    </div>
                                </div>
                                <div className="w-3 h-3 mr-auto bg-gray-600 rounded-bl-full" style={{ marginTop: '-12px' }}></div>
                            </div>
                        )}

                        {/* Calendar picker */}
                        {showCalendar && <CalendarPicker />}
                        
                        <div ref={chatEndRef} />
                    </div>

                    <form
                        onSubmit={(e) => {
                            e.preventDefault()
                            const input = e.currentTarget.elements.namedItem('chat') as HTMLInputElement
                            if (!input.value.trim()) return
                            handleSend(input.value)
                            input.value = ''
                        }}
                        className="flex gap-2"
                    >
                        <input
                            name="chat"
                            className="flex-1 px-4 py-3 rounded-full bg-neutral-950"
                            placeholder="What do you need?"
                        />
                        <button
                            type="submit"
                            className="bg-emerald-500 text-white px-2 py-2 rounded-full"
                        >
                            <SendHorizonal className="m-1" />
                        </button>
                    </form>

                    {loading && <p className="text-sm text-gray-500 mt-2">Parsing job...</p>}

                    {parsedJob && (
                        <div className="mt-6 border-t border-neutral-800 pt-4">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="font-bold text-lg">Job Overview</h2>
                                {savedJob?.id && (
                                    <a
                                        href={`/job/${savedJob.id}`}
                                        className="text-sm text-emerald-400 hover:underline"
                                    >
                                        View Job Overview →
                                    </a>
                                )}
                            </div>

                            <div className="space-y-3 text-sm bg-white/5 rounded-xl p-4">
                                <div className="flex flex-col bg-neutral-950 rounded-xl p-4">
                                    <span className="text-neutral-400 font-bold">Payload</span>
                                    <span className="font-medium text-white">
                                        {parsedJob.parts.length
                                            ? parsedJob.parts.join(', ')
                                            : 'None specified'}
                                    </span>
                                </div>
                                <div className="flex flex-col bg-neutral-950 rounded-xl p-4">
                                    <span className="text-neutral-400 font-bold">Pickup Location</span>
                                    <span className="font-medium text-white">
                                        {parsedJob.pickup || '[not provided]'}
                                    </span>
                                </div>
                                <div className="flex flex-col bg-neutral-950 rounded-xl p-4">
                                    <span className="text-neutral-400 font-bold">Dropoff Location</span>
                                    <span className="font-medium text-white">
                                        {parsedJob.dropoff || '[not provided]'}
                                    </span>
                                </div>
                                <div className="flex flex-col bg-neutral-950 rounded-xl p-4">
                                    <span className="text-neutral-400 font-bold">Dropoff Time</span>
                                    <span className="font-medium text-white">
                                        {parsedJob.deadlineDisplay ? `by ${parsedJob.deadlineDisplay}` : 'None specified'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}

            {viewMode === 'form' && <MultiLegForm />}
        </div>
    )
}
