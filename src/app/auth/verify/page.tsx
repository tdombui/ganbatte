'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/auth'

export default function VerifyPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('')

  const handleResendVerification = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) {
      setMessage('Please enter your email address')
      setMessageType('error')
      return
    }

    setLoading(true)
    setMessage('')
    
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim(),
      })
      
      if (error) {
        setMessage('Failed to send verification email: ' + error.message)
        setMessageType('error')
      } else {
        setMessage('Verification email sent! Please check your inbox and spam folder.')
        setMessageType('success')
      }
    } catch (error) {
      console.error('Resend error:', error)
      setMessage('An unexpected error occurred')
      setMessageType('error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center px-4">
      <div className="bg-neutral-900 rounded-lg p-6 sm:p-8 max-w-md w-full border border-neutral-700">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Verify Your Email</h1>
          <p className="text-neutral-400">
            Enter your email address to receive a verification link
          </p>
        </div>

        <form onSubmit={handleResendVerification} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-neutral-800 border border-neutral-600 rounded-md text-white focus:border-emerald-500 focus:outline-none"
              placeholder="Enter your email address"
              required
            />
          </div>

          {message && (
            <div className={`text-sm px-3 py-2 rounded border ${
              messageType === 'success' 
                ? 'text-emerald-400 bg-emerald-900/20 border-emerald-800' 
                : 'text-red-400 bg-red-900/20 border-red-800'
            }`}>
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-neutral-600 text-white font-semibold py-2 px-4 rounded-md transition-colors"
          >
            {loading ? 'Sending...' : 'Send Verification Email'}
          </button>
        </form>

        <div className="mt-6 text-center space-y-3">
          <button
            onClick={() => router.push('/chat')}
            className="text-emerald-400 hover:text-emerald-300 text-sm"
          >
            ← Back to Chat
          </button>
          
          <div className="text-xs text-neutral-500 space-y-1">
            <p>• Check your spam/junk folder if you don&apos;t see the email</p>
            <p>• The verification link expires in 24 hours</p>
            <p>• You can request a new verification email anytime</p>
          </div>
        </div>
      </div>
    </div>
  )
} 