'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../../lib/supabase/client'
import { useAuthContext } from '../../providers'

export default function AuthCallbackPage() {
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying')
  const [error, setError] = useState<string>('')
  const router = useRouter()
  const { isAuthenticated, loading } = useAuthContext()

  useEffect(() => {
    console.log('🔍 AuthCallback: Starting verification...')
    
    const verifySession = async () => {
      try {
        // Check if we have a session
        const supabase = createClient()
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        console.log('🔍 AuthCallback: Session check:', { 
          hasSession: !!session, 
          userId: session?.user?.id,
          error: sessionError?.message 
        })
        
        if (sessionError) {
          console.error('🔍 AuthCallback: Session error:', sessionError)
          setError('Failed to verify session: ' + sessionError.message)
          setStatus('error')
          return
        }

        if (!session) {
          console.log('🔍 AuthCallback: No session found')
          setError('No session found. Please try signing in again.')
          setStatus('error')
          return
        }

        console.log('🔍 AuthCallback: Session verified successfully')
        setStatus('success')
        
        // Wait a moment for the auth state to be updated, then redirect
        setTimeout(() => {
          router.push('/')
        }, 2000)
        
      } catch (error) {
        console.error('🔍 AuthCallback: Verification error:', error)
        setError('An unexpected error occurred during verification.')
        setStatus('error')
      }
    }

    verifySession()
  }, [router])

  // If already authenticated, redirect immediately
  useEffect(() => {
    if (!loading && isAuthenticated) {
      console.log('🔍 AuthCallback: Already authenticated, redirecting...')
      router.push('/')
    }
  }, [loading, isAuthenticated, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6 py-8">
        <div className="w-full max-w-md mx-auto text-center">
          <div className="mb-8">
            <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
          <h1 className="text-2xl font-bold mb-4">Verifying Email</h1>
          <p className="text-neutral-400">Please wait while we verify your email address...</p>
        </div>
      </div>
    )
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6 py-8">
        <div className="w-full max-w-md mx-auto text-center">
          <div className="mb-8">
            <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <h1 className="text-2xl font-bold mb-4 text-emerald-400">Email Verified!</h1>
          <p className="text-neutral-400 mb-6">Your email has been successfully verified. Redirecting you to the dashboard...</p>
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6 py-8">
        <div className="w-full max-w-md mx-auto text-center">
          <div className="mb-8">
            <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          </div>
          <h1 className="text-2xl font-bold mb-4 text-red-400">Verification Failed</h1>
          <p className="text-neutral-400 mb-6">{error}</p>
          <div className="space-y-3">
            <button
              onClick={() => router.push('/auth')}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-4 rounded-md transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => router.push('/')}
              className="w-full bg-neutral-700 hover:bg-neutral-600 text-white font-semibold py-2 px-4 rounded-md transition-colors"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6 py-8">
      <div className="w-full max-w-md mx-auto text-center">
        <div className="mb-8">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
        <h1 className="text-2xl font-bold mb-4">Verifying Email</h1>
        <p className="text-neutral-400">Please wait while we verify your email address...</p>
      </div>
    </div>
  )
} 