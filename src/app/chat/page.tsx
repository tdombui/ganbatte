'use client'

import React, { useState, useEffect, useRef } from 'react'
import { ParsedJob } from '@/types/job'
import { SendHorizonal, LogOut, Settings } from 'lucide-react'
import { formatDeadline } from '@/lib/formatDeadline'
import MultiLegForm from '@/app/components/ui/job/MultiLegForm'
import { useAuthContext } from '../providers'
import AuthModal from '../components/auth/AuthModal'
import UnifiedNavbar from '../components/nav/UnifiedNavbar'
import { createClient } from '../../lib/supabase/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

// Function to convert markdown bold to HTML
function parseMarkdownBold(text: string): string {
    return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
}

// Helper function to get auth headers
async function getAuthHeaders() {
    try {
        // Get the session from the current auth state instead of creating a new client call
        const supabase = createClient()
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
            console.error('getAuthHeaders: Session error:', error)
            throw error
        }
        
        if (!session) {
            console.error('getAuthHeaders: No session found')
            throw new Error('No active session')
        }
        
        // Check if token is expired and refresh if needed
        const now = Math.floor(Date.now() / 1000)
        if (session.expires_at && session.expires_at < now) {
            console.log('getAuthHeaders: Token expired, refreshing...')
            const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession()
            
            if (refreshError || !refreshedSession) {
                console.error('getAuthHeaders: Failed to refresh session:', refreshError)
                throw new Error('Failed to refresh session')
            }
            
            return {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${refreshedSession.access_token}`
            }
        }
        
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
        }
    } catch (error) {
        console.error('getAuthHeaders: Error getting auth headers:', error)
        throw error
    }
}

export default function ChatPage() {
    const { user, loading: authLoading, isAuthenticated, logout } = useAuthContext()
    const [showAuthModal, setShowAuthModal] = useState(false)
    const [viewMode, setViewMode] = useState<'chat' | 'form'>('chat')
    const [messages, setMessages] = useState<string[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [awaitingConfirmation, setAwaitingConfirmation] = useState(false)
    const [showCalendar, setShowCalendar] = useState(false)
    const [selectedDateTime, setSelectedDateTime] = useState('')
    const [parsedJob, setParsedJob] = useState<ParsedJob | null>(null)
    const [savedJob, setSavedJob] = useState<{ id: string } | null>(null)
    const [lastQuestion, setLastQuestion] = useState<'pickup' | 'dropoff' | 'deadline' | null>(null)
    const [showSettingsDropdown, setShowSettingsDropdown] = useState(false)
    const chatEndRef = useRef<HTMLDivElement>(null)
    const settingsRef = useRef<HTMLDivElement>(null)
    const router = useRouter()

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    // Close settings dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
                setShowSettingsDropdown(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [])

    // Show auth modal if user is not authenticated
    useEffect(() => {
        console.log('🔍 Auth state check:', { authLoading, isAuthenticated, user: user?.id })
        if (!authLoading && !isAuthenticated) {
            console.log('🔍 Showing auth modal - user not authenticated')
            setShowAuthModal(true)
        } else if (!authLoading && isAuthenticated) {
            console.log('🔍 User authenticated, hiding auth modal')
            setShowAuthModal(false)
        }
    }, [authLoading, isAuthenticated])

    // Add welcome message when user first loads the page
    useEffect(() => {
        console.log('🔍 Welcome message check:', { isAuthenticated, userId: user?.id, messagesLength: messages.length })
        if (isAuthenticated && user && messages.length === 0) {
            const welcomeMessage = `ai:Hey ${user.full_name || user.email} 👋\n\nWhat do you need delivered today?`
            setMessages([welcomeMessage])
        }
    }, [isAuthenticated, user, messages.length])

    // Add session persistence check for mobile
    useEffect(() => {
        const checkSessionPersistence = async () => {
            try {
                const supabase = createClient()
                const { data: { session } } = await supabase.auth.getSession()
                console.log('Session persistence check:', { hasSession: !!session, userId: session?.user?.id })
                
                if (!session && isAuthenticated) {
                    console.log('Session lost but user state shows authenticated, refreshing...')
                    // Force a re-check of authentication state
                    window.location.reload()
                }
            } catch (error) {
                console.error('Session persistence check error:', error)
            }
        }

        // Check session persistence every 30 seconds on mobile
        const interval = setInterval(checkSessionPersistence, 30000)
        
        return () => clearInterval(interval)
    }, [isAuthenticated])

    const handleSignOut = async () => {
        await logout()
        setMessages([])
        setParsedJob(null)
        setSavedJob(null)
        setShowSettingsDropdown(false)
    }

    async function handleSend(message: string) {
        if (!isAuthenticated) {
            setShowAuthModal(true)
            return
        }

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
                    // Defensive check: ensure all required fields are present
                    if (!parsedJob.parts || !Array.isArray(parsedJob.parts) || parsedJob.parts.length === 0 || !parsedJob.pickup || !parsedJob.dropoff || !parsedJob.deadline) {
                        console.error('❌ Parsed job is missing required fields:', parsedJob)
                        setMessages((prev) => [...prev, `ai:Failed to save job. Some required information is missing. Please try again.`])
                        setAwaitingConfirmation(false)
                        return
                    }
                    const headers = await getAuthHeaders()
                    console.log('🔍 Submitting job with payload:', parsedJob)
                    const res = await fetch('/api/createJob', {
                        method: 'POST',
                        headers,
                        body: JSON.stringify(parsedJob),
                    })

                    if (res.status === 401) {
                        console.error('❌ Authentication error in createJob')
                        setMessages((prev) => [...prev, `ai:Your session has expired. Please refresh the page and try again.`])
                        setShowAuthModal(true)
                        return
                    }

                    if (res.ok) {
                        const { job } = await res.json()
                        console.log('🔍 Job created successfully:', job)
                        setSavedJob(job)
                        setMessages((prev) => [
                            ...prev,
                            `ai:Job booked. View your job here: /job/${job.id}`,
                        ])
                    } else {
                        const errorText = await res.text()
                        console.error('❌ Failed to save job:', res.status, errorText)
                        setMessages((prev) => [...prev, `ai:Failed to save job. Please try again.`])
                    }
                } catch (err) {
                    console.error('❌ saveJob error:', err)
                    if (err instanceof Error && err.message.includes('session')) {
                        setMessages((prev) => [...prev, `ai:Your session has expired. Please refresh the page and try again.`])
                        setShowAuthModal(true)
                    } else {
                        setMessages((prev) => [...prev, `ai:Failed to save job. Please try again.`])
                    }
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

        setIsLoading(true)

        try {
            const headers = await getAuthHeaders()
            const res = await fetch('/api/parseJob', {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    text: message,
                    history: recentMessages,
                    overrideField,
                }),
            })

            if (res.status === 401) {
                console.error('❌ Authentication error in parseJob')
                setMessages((prev) => [...prev, 'ai:Your session has expired. Please refresh the page and try again.'])
                setShowAuthModal(true)
                return
            }

            if (!res.ok) {
                const errorText = await res.text()
                console.error('❌ parseJob API error:', res.status, errorText)
                setMessages((prev) => [...prev, 'ai:Sorry, there was an error processing your request. Please try again.'])
                return
            }

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
                setIsLoading(false)
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
            if (err instanceof Error && err.message.includes('session')) {
                setMessages((prev) => [...prev, 'ai:Your session has expired. Please refresh the page and try again.'])
                setShowAuthModal(true)
            } else {
                setMessages((prev) => [...prev, 'ai:Sorry, there was an error processing your request. Please try again.'])
            }
        } finally {
            setIsLoading(false)
        }
    }

    const handleConfirmation = async (confirmed: boolean) => {
        if (!parsedJob) return

        if (confirmed) {
            setMessages((prev) => [...prev, `ai:Saving your job...`])
            try {
                const headers = await getAuthHeaders()
                const res = await fetch('/api/createJob', {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(parsedJob),
                })

                if (res.status === 401) {
                    console.error('❌ Authentication error in handleConfirmation')
                    setMessages((prev) => [...prev, `ai:Your session has expired. Please refresh the page and try again.`])
                    setShowAuthModal(true)
                    return
                }

                if (res.ok) {
                    const { job } = await res.json()
                    console.log('🔍 Job created successfully:', job)
                    setSavedJob(job)
                    setMessages((prev) => [
                        ...prev,
                        `ai:Job booked. View your job here: /job/${job.id}`,
                    ])
                } else {
                    const errorText = await res.text()
                    console.error('❌ Failed to save job:', res.status, errorText)
                    setMessages((prev) => [...prev, `ai:Failed to save job. Please try again.`])
                }
            } catch (err) {
                console.error('❌ saveJob error:', err)
                if (err instanceof Error && err.message.includes('session')) {
                    setMessages((prev) => [...prev, `ai:Your session has expired. Please refresh the page and try again.`])
                    setShowAuthModal(true)
                } else {
                    setMessages((prev) => [...prev, `ai:Failed to save job. Please try again.`])
                }
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
            const formattedDeadline = formatDeadline(selectedDateTime)
            handleSend(`Set deadline to ${formattedDeadline}`)
            setShowCalendar(false)
            setSelectedDateTime('')
        }
    }

    const CalendarPicker = () => (
        <div className="mr-auto max-w-[85%] sm:max-w-[80%] mb-4">
            <div className="bg-gray-600 text-white rounded-2xl rounded-bl-md px-3 sm:px-4 py-2">
                <div className="space-y-3">
                    <div className="text-center font-medium text-sm sm:text-base">Select Date & Time</div>
                    <input
                        type="datetime-local"
                        value={selectedDateTime}
                        onChange={(e) => setSelectedDateTime(e.target.value)}
                        className="w-full px-3 py-2 bg-neutral-800 rounded-lg text-white border border-neutral-600 focus:border-blue-500 focus:outline-none text-sm"
                        min={new Date().toISOString().slice(0, 16)}
                    />
                    <div className="flex gap-2 justify-center">
                        <button
                            onClick={handleCalendarSubmit}
                            disabled={!selectedDateTime}
                            className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-500 text-white px-3 sm:px-4 py-2 rounded-lg transition-colors text-sm"
                        >
                            Set Deadline
                        </button>
                        <button
                            onClick={() => {
                                setShowCalendar(false)
                                setSelectedDateTime('')
                            }}
                            className="bg-gray-500 hover:bg-gray-600 text-white px-3 sm:px-4 py-2 rounded-lg transition-colors text-sm"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
            <div className="w-3 h-3 mr-auto bg-gray-600 rounded-bl-full" style={{ marginTop: '-12px' }}></div>
        </div>
    )

    // Function to render job links properly
    function renderJobLink(content: string) {
        if (!content.includes('/job/')) {
            return (
                <div 
                    className="whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{
                        __html: parseMarkdownBold(content)
                    }}
                />
            )
        }

        // Split content by job links and render each part
        const parts = content.split(/(\/job\/[a-z0-9\-]+)/gi)
        return (
            <div className="whitespace-pre-wrap">
                {parts.map((part, index) => {
                    if (part.match(/^\/job\/[a-z0-9\-]+$/i)) {
                        const jobId = part.split('/job/')[1]
                        console.log('🔍 Rendering job link:', jobId)
                        return (
                            <Link
                                key={index}
                                href={`/job/${jobId}`}
                                className="underline text-blue-200 hover:text-blue-100 transition-colors inline-block"
                                onClick={(e) => {
                                    e.preventDefault()
                                    console.log('🔍 Job link clicked:', jobId)
                                    router.push(`/job/${jobId}`)
                                }}
                            >
                                {part}
                            </Link>
                        )
                    }
                    return (
                        <span
                            key={index}
                            dangerouslySetInnerHTML={{
                                __html: parseMarkdownBold(part)
                            }}
                        />
                    )
                })}
            </div>
        )
    }

    // Show loading state while checking authentication
    if (authLoading) {
        return (
            <>
                <UnifiedNavbar />
                <div className="max-w-4xl mx-auto py-8 pt-24">
                    <div className="flex items-center justify-center h-64">
                        <div className="text-white">Loading...</div>
                    </div>
                </div>
            </>
        )
    }

    return (
        <>
            <UnifiedNavbar />
            <div className="max-w-4xl mx-auto py-4 sm:py-8 px-4 sm:px-0 pt-24">
                {/* Header with Navigation */}
                <div className="mb-6 sm:mb-8 px-4 sm:px-0">
                    {/* Title and settings on same line */}
                    <div className="flex justify-between items-center mb-3 sm:mb-4">
                        <header className="text-lg sm:text-2xl lg:text-3xl font-bold font-sans">Ganbatte Payload Movers</header>
                        
                        {/* Settings Dropdown */}
                        {isAuthenticated && (
                            <div className="relative" ref={settingsRef}>
                                <button
                                    onClick={() => setShowSettingsDropdown(!showSettingsDropdown)}
                                    className="p-2 text-neutral-400 hover:text-white transition-colors"
                                >
                                    <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
                                </button>
                                
                                {showSettingsDropdown && (
                                    <div className="absolute right-0 mt-2 w-48 bg-neutral-800 rounded-lg shadow-lg border border-neutral-700 z-10">
                                        <button
                                            onClick={handleSignOut}
                                            className="w-full flex items-center gap-2 px-4 py-2 text-left text-red-400 hover:bg-neutral-700 transition-colors"
                                        >
                                            <LogOut className="w-4 h-4" />
                                            Sign Out
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    
                    {/* Tag and button on one line */}
                    <div className="flex justify-between items-center">
                        <span className="text-emerald-400 text-xs sm:text-sm bg-emerald-900/20 px-2 sm:px-3 py-1 rounded-full">AI-Powered Parts Delivery</span>
                        
                        <div className="flex items-center gap-2 sm:gap-4">
                            <button
                                onClick={() => setViewMode((prev) => (prev === 'chat' ? 'form' : 'chat'))}
                                className="bg-emerald-500 hover:bg-emerald-600 text-white px-2 sm:px-4 py-2 rounded-lg transition-colors text-xs sm:text-sm font-medium whitespace-nowrap"
                            >
                                {viewMode === 'chat' ? 'Multi-Trip' : '← Single Trip'}
                            </button>
                        </div>
                    </div>
                </div>

                {viewMode === 'chat' && (
                    <>
                        {/* Chat Interface */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                            {/* Main Chat Area */}
                            <div className="lg:col-span-2">
                                <div className="rounded-xl p-3 sm:p-6 h-80 sm:h-96 overflow-y-scroll mb-4 bg-neutral-950 text-white border border-neutral-800" style={{ scrollbarGutter: 'stable' }}>
                                    {messages.map((msg, idx) => {
                                        const isUser = msg.startsWith('user:')
                                        const content = msg.replace(/^(user|ai):/, '')
                                        
                                        console.log('🔍 Rendering message:', { idx, isUser, content, hasJobLink: content.includes('/job/') })
                                        
                                        return (
                                            <div
                                                key={idx}
                                                className={`mb-4 max-w-[85%] sm:max-w-[80%] ${isUser ? 'ml-auto' : 'mr-auto'}`}
                                            >
                                                <div className={`relative px-3 sm:px-4 py-2 rounded-2xl text-sm sm:text-base ${
                                                    isUser 
                                                        ? 'bg-blue-500 text-white rounded-br-md' 
                                                        : 'bg-gray-600 text-white rounded-bl-md'
                                                }`}>
                                                    {renderJobLink(content)}
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
                                        <div className="mr-auto max-w-[85%] sm:max-w-[80%] mb-4">
                                            <div className="bg-gray-600 text-white rounded-2xl rounded-bl-md px-3 sm:px-4 py-2">
                                                <div className="flex gap-2 sm:gap-3 justify-center">
                                                    <button
                                                        onClick={() => handleConfirmation(true)}
                                                        className="bg-green-500 hover:bg-green-600 text-white px-3 sm:px-4 py-2 rounded-full flex items-center gap-1 sm:gap-2 transition-colors text-sm"
                                                    >
                                                        <span className="text-lg">✅</span>
                                                        <span>Yes</span>
                                                    </button>
                                                    <button
                                                        onClick={() => handleConfirmation(false)}
                                                        className="bg-red-500 hover:bg-red-600 text-white px-3 sm:px-4 py-2 rounded-full flex items-center gap-1 sm:gap-2 transition-colors text-sm"
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
                                <div className="h-6 mb-1 flex items-center">
                                    {isLoading && (
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
                                    className="flex gap-2 mt-4 sm:mt-6"
                                >
                                    <input
                                        name="chat"
                                        className="flex-1 px-3 sm:px-4 py-3 rounded-full bg-neutral-950 border border-neutral-700 focus:border-emerald-500 focus:outline-none text-sm sm:text-base"
                                        placeholder={messages.length === 0 ? "What do you need delivered?" : "Type your message..."}
                                    />
                                    <button
                                        type="submit"
                                        className="bg-emerald-500 hover:bg-emerald-600 text-white p-3 rounded-full transition-colors"
                                    >
                                        <SendHorizonal className="w-5 h-5" />
                                    </button>
                                </form>
                            </div>

                            {/* Sidebar - Visible on all devices */}
                            <div className="space-y-4 sm:space-y-6 h-80 sm:h-96 overflow-y-auto" style={{ scrollbarGutter: 'stable' }}>
                                {/* Job Overview */}
                                {parsedJob && (
                                    <div className="bg-neutral-800/50 rounded-xl p-4 sm:p-6 border border-neutral-700">
                                        <div className="flex items-center justify-between mb-4">
                                            <h2 className="font-bold text-lg text-white">Job Overview</h2>
                                            {savedJob?.id && (
                                                <Link
                                                    href={`/job/${savedJob.id}`}
                                                    className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 sm:px-4 py-2 rounded-lg transition-colors text-xs sm:text-sm font-medium"
                                                >
                                                    View Job
                                                </Link>
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
                                <div className="bg-neutral-800/50 rounded-xl p-4 sm:p-6 border border-neutral-700">
                                    <h3 className="font-bold text-lg text-white mb-4">Quick Help</h3>
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
                                        <details className="group">
                                            <summary className="cursor-pointer text-neutral-300 hover:text-white font-medium">
                                                Pricing & Fees
                                            </summary>
                                            <div className="text-neutral-400 mt-2 pl-4 space-y-2">
                                                <p><strong>Base Rate:</strong> $30 flat fee per delivery</p>
                                                <p><strong>Per Mile:</strong> $1.25 (calculated by optimized route)</p>
                                                <p><strong>Per Item:</strong> $1 per extra lb (first 50lbs free)</p>
                                                <p><strong>Same Day:</strong> +$60 priority routing</p>
                                                <p><strong>After Hours/Weekend:</strong> +$60</p>
                                                <p><strong>Advance Booking:</strong> 25% discount (24h+)</p>
                                                <p><strong>Rush Fee:</strong> +$40 (deadline within 4hrs)</p>
                                            </div>
                                        </details>
                                        <details className="group">
                                            <summary className="cursor-pointer text-neutral-300 hover:text-white font-medium">
                                                Payload Specifications
                                            </summary>
                                            <div className="text-neutral-400 mt-2 pl-4 space-y-2">
                                                <p><strong>Max Weight:</strong> 50 lbs per delivery; $0.50 charge per lb over 50lbs.</p>
                                                <p><strong>Max Dimensions:</strong> 4ft × 4ft × 6ft</p>
                                                <p><strong>Vehicle Access:</strong> Sprinter Van, Hybrid Hatchback</p>
                                                <p><strong>Restrictions:</strong>Payloads are subject restrictions.</p>
                                                <p><strong>Packaging:</strong> Must be properly secured and labeled; if needed, we provide packaging materials and moving blankets.</p>
                                            </div>
                                        </details>
                                        <details className="group">
                                            <summary className="cursor-pointer text-neutral-300 hover:text-white font-medium">
                                                Service Level Agreements
                                            </summary>
                                            <div className="text-neutral-400 mt-2 pl-4 space-y-2">
                                                <p><strong>Standard Delivery:</strong> 2-4 hours</p>
                                                <p><strong>Same Day Priority:</strong> 1-2 hours (+$60)</p>
                                                <p><strong>Advance Booking:</strong> 25% discount (24h+)</p>
                                                <p><strong>Rush Fee:</strong> +$40 (deadline within 4hrs)</p>
                                                <p><strong>After Hours:</strong> +$60 (outside 8AM-6PM)</p>
                                                <p><strong>Weekend Delivery:</strong> +$60</p>
                                                <p><strong>Photo Proof:</strong> Included with every delivery</p>
                                            </div>
                                        </details>
                                        <details className="group">
                                            <summary className="cursor-pointer text-neutral-300 hover:text-white font-medium">
                                                Payment & Billing
                                            </summary>
                                            <div className="text-neutral-400 mt-2 pl-4 space-y-2">
                                                <p><strong>Payment Methods:</strong> Credit card, invoice billing</p>
                                                <p><strong>Billing:</strong> Charged upon job completion</p>
                                                <p><strong>Invoicing:</strong> Available for business accounts</p>
                                                <p><strong>Refunds:</strong> Full refund if delivery fails</p>
                                                <p><strong>Insurance:</strong> $1,000 coverage included</p>
                                                <p><strong>Taxes:</strong> Applicable sales tax added</p>
                                            </div>
                                        </details>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {viewMode === 'form' && (
                    <div className="bg-neutral-900/50 rounded-xl p-8 border border-neutral-700">
                        <MultiLegForm />
                    </div>
                )}
            </div>

            {/* Authentication Modal */}
            <AuthModal 
                isOpen={showAuthModal} 
                onClose={() => setShowAuthModal(false)}
                mode="login"
            />
        </>
    )
}
