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
        <div className="max-w-4xl mx-auto py-8">
            {/* Header with Navigation */}
            <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-4">
                    <header className="text-3xl font-bold font-sans">Ganbatte Part Sprinter</header>
                    <span className="text-emerald-400 text-sm bg-emerald-900/20 px-3 mt-1 py-1 rounded-full">AI-Powered Parts Delivery</span>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setViewMode((prev) => (prev === 'chat' ? 'form' : 'chat'))}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
                    >
                        {viewMode === 'chat' ? 'Create Multi-Trip Job' : '← Single Trip'}
                    </button>
                </div>
            </div>

            {viewMode === 'chat' && (
                <>
                    {/* Chat Interface */}
                    <div className="grid lg:grid-cols-3 gap-6">
                        {/* Main Chat Area */}
                        <div className="lg:col-span-2">
                            <div className="rounded-xl p-6 h-96 overflow-y-scroll mb-6 bg-neutral-950 text-white border border-neutral-800">
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

                            {/* Thinking indicator - always reserves space */}
                            <div className="h-8 mb-2 flex items-center">
                                {loading && (
                                    <div className="flex items-center gap-2 text-emerald-400 text-sm">
                                        <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
                                        <span>Thinking...</span>
                                    </div>
                                )}
                            </div>

                            <form
                                onSubmit={(e) => {
                                    e.preventDefault()
                                    const input = e.currentTarget.elements.namedItem('chat') as HTMLInputElement
                                    if (!input.value.trim()) return
                                    
                                    // Hide calendar if user is typing manually
                                    if (showCalendar) {
                                        setShowCalendar(false)
                                        setSelectedDateTime('')
                                    }
                                    
                                    handleSend(input.value)
                                    input.value = ''
                                }}
                                className="flex gap-2"
                            >
                                <input
                                    name="chat"
                                    className="flex-1 px-4 py-3 rounded-full bg-neutral-950 border border-neutral-700 focus:border-emerald-500 focus:outline-none"
                                    placeholder={messages.length === 0 ? "What do you need delivered?" : "Type your message..."}
                                    onFocus={() => {
                                        // Hide calendar when user focuses on input
                                        if (showCalendar) {
                                            setShowCalendar(false)
                                            setSelectedDateTime('')
                                        }
                                    }}
                                />
                                <button
                                    type="submit"
                                    className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-3 rounded-full transition-colors"
                                >
                                    <SendHorizonal className="m-1" />
                                </button>
                            </form>
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            {/* Job Overview */}
                            {parsedJob && (
                                <div className="bg-neutral-800/50 rounded-xl p-6 border border-neutral-700">
                                    <div className="flex items-center justify-between mb-4">
                                        <h2 className="font-bold text-lg text-white">Job Overview</h2>
                                        {savedJob?.id && (
                                            <a
                                                href={`/job/${savedJob.id}`}
                                                className="text-sm text-emerald-400 hover:underline"
                                            >
                                                View →
                                            </a>
                                        )}
                                    </div>

                                    <div className="space-y-3 text-sm">
                                        <div className="bg-neutral-900/50 rounded-lg p-3">
                                            <span className="text-neutral-400 font-bold text-xs uppercase tracking-wide">Payload</span>
                                            <div className="font-medium text-white mt-1">
                                                {parsedJob.parts.length
                                                    ? parsedJob.parts.join(', ')
                                                    : 'None specified'}
                                            </div>
                                        </div>
                                        <div className="bg-neutral-900/50 rounded-lg p-3">
                                            <span className="text-neutral-400 font-bold text-xs uppercase tracking-wide">Pickup</span>
                                            <div className="font-medium text-white mt-1">
                                                {parsedJob.pickup || '[not provided]'}
                                            </div>
                                        </div>
                                        <div className="bg-neutral-900/50 rounded-lg p-3">
                                            <span className="text-neutral-400 font-bold text-xs uppercase tracking-wide">Dropoff</span>
                                            <div className="font-medium text-white mt-1">
                                                {parsedJob.dropoff || '[not provided]'}
                                            </div>
                                        </div>
                                        <div className="bg-neutral-900/50 rounded-lg p-3">
                                            <span className="text-neutral-400 font-bold text-xs uppercase tracking-wide">Deadline</span>
                                            <div className="font-medium text-white mt-1">
                                                {parsedJob.deadlineDisplay ? `by ${parsedJob.deadlineDisplay}` : 'None specified'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Quick FAQ */}
                            <div className="bg-neutral-800/50 rounded-xl p-6 border border-neutral-700">
                                <h3 className="font-bold text-lg text-white mb-4">❓ Quick Help</h3>
                                <div className="space-y-3 text-sm">
                                    <details className="group">
                                        <summary className="cursor-pointer text-neutral-300 hover:text-white font-medium">
                                            How does this work?
                                        </summary>
                                        <p className="text-neutral-400 mt-2 pl-4">
                                            Just tell me what you need delivered, where to pick it up, and where to drop it off. I&apos;ll create a job and connect you with a driver.
                                        </p>
                                    </details>
                                    <details className="group">
                                        <summary className="cursor-pointer text-neutral-300 hover:text-white font-medium">
                                            How fast is delivery?
                                        </summary>
                                        <p className="text-neutral-400 mt-2 pl-4">
                                            Most deliveries are completed within 2-4 hours. Urgent deliveries can be arranged for faster service.
                                        </p>
                                    </details>
                                    <details className="group">
                                        <summary className="cursor-pointer text-neutral-300 hover:text-white font-medium">
                                            Can I track my delivery?
                                        </summary>
                                        <p className="text-neutral-400 mt-2 pl-4">
                                            Yes! Once your job is active, you can track the driver&apos;s location in real-time and receive photo proof of delivery.
                                        </p>
                                    </details>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {viewMode === 'form' && <MultiLegForm />}
        </div>
    )
}
