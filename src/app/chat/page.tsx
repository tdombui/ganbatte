'use client'

import React, { useState, useEffect, useRef } from 'react'
import { ParsedJob } from '@/types/job'
import { SendHorizonal } from 'lucide-react'
import { formatDeadline } from '@/lib/formatDeadline'
import MultiLegForm from '@/app/components/ui/job/MultiLegForm'

export default function ChatPage() {
    const [viewMode, setViewMode] = useState<'chat' | 'form'>('chat')
    const [messages, setMessages] = useState<string[]>([])
    const [parsedJob, setParsedJob] = useState<ParsedJob | null>(null)
    const [loading, setLoading] = useState(false)
    const [awaitingConfirmation, setAwaitingConfirmation] = useState(false)
    const [lastQuestion, setLastQuestion] = useState<'pickup' | 'dropoff' | 'deadline' | null>(null)
    const [savedJob, setSavedJob] = useState<{ id: string } | null>(null)
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

        setMessages((prev) => [...prev, `😀 ${message}`])

        if (awaitingConfirmation && parsedJob) {
            const response = message.toLowerCase()
            if (['yes', 'y', 'yup', 'ye', 'yee'].includes(response)) {
                setMessages((prev) => [...prev, `🤖 Saving your job...`])
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
                            `🤖 Job booked. View your job here: /job/${job.id}`,
                        ])
                    } else {
                        setMessages((prev) => [...prev, `❌ Failed to save job.`])
                    }
                } catch (err) {
                    console.error('❌ saveJob error:', err)
                    setMessages((prev) => [...prev, `❌ Failed to save job.`])
                }
                setAwaitingConfirmation(false)
                return
            } else if (['no', 'n', 'nah'].includes(response)) {
                setMessages((prev) => [
                    ...prev,
                    `🤖 Okay, let’s try again. Please retype your request.`,
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
                setMessages((prev) => [...prev, `🤖 ${data.message}`])

                if (data.message.includes('pickup')) setLastQuestion('pickup')
                else if (data.message.includes('dropoff')) setLastQuestion('dropoff')
                else if (data.message.toLowerCase().includes('when')) setLastQuestion('deadline')

                setParsedJob(null)
                setAwaitingConfirmation(false)
                return
            }

            if (data.job) {
                setParsedJob(data.job)
                setLastQuestion(null)

                const summary = `Got it! You need: ${data.job.parts.join(', ') || '[no parts found]'} picked up from "${data.job.pickup || '[pickup missing]'}" and delivered to "${data.job.dropoff || '[dropoff missing]'}"${data.job.deadline ? ' by ' + formatDeadline(data.job.deadline) : ''}.`

                setMessages((prev) => [
                    ...prev,
                    `🤖 ${summary}`,
                    '🤖 Does this look right? (Yes/No)',
                ])

                setAwaitingConfirmation(true)
            }
        } catch (err) {
            console.error('❌ parseJob error:', err)
            setMessages((prev) => [...prev, '❌ Internal server error.'])
        } finally {
            setLoading(false)
        }
    }

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
                        {messages.map((msg, idx) => (
                            <div
                                key={idx}
                                className={`mb-4 max-w-[80%] whitespace-pre-wrap px-4 py-2 rounded-xl ${msg.startsWith('😀')
                                    ? 'ml-auto bg-emerald-600 text-white text-left'
                                    : 'mr-auto bg-neutral-800 text-white text-left'
                                    }`}
                            >
                                {msg.includes('/job/') ? (
                                    <span
                                        dangerouslySetInnerHTML={{
                                            __html: msg.replace(
                                                /(\/job\/[a-z0-9\-]+)/gi,
                                                `<a href="$1" class="underline text-emerald-400">$1</a>`
                                            ),
                                        }}
                                    />
                                ) : (
                                    msg
                                )}
                            </div>
                        ))}
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
                                        by {parsedJob.deadlineDisplay || 'None specified'}
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
