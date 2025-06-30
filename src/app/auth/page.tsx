'use client'

import Image from 'next/image'
import { useState, useEffect, Suspense } from 'react'
import { useAuthContext } from '../providers'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '../../lib/supabase/client'

function AuthForm() {
  const { isAuthenticated, loading: authLoading, login, register } = useAuthContext()
  const [isSignIn, setIsSignIn] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [formLoading, setFormLoading] = useState(false)
  const [showResend, setShowResend] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  // Get redirect URL from query parameters
  const redirectTo = searchParams.get('redirectTo') || '/'

  // Redirect if already authenticated
  useEffect(() => {
    console.log('🔍 Auth: Redirect effect triggered:', { authLoading, isAuthenticated, redirectTo })
    if (!authLoading && isAuthenticated) {
      console.log('🔍 Auth: Already authenticated, redirecting to:', redirectTo)
      // Use replace instead of push to prevent back button issues
      router.replace(redirectTo)
    }
  }, [authLoading, isAuthenticated, router, redirectTo])

  const handleResendVerification = async () => {
    setFormLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      })
      
      if (error) {
        setError('Failed to resend verification email: ' + error.message)
      } else {
        setSuccess('Verification email sent! Please check your inbox.')
        setShowResend(false)
      }
    } catch (err) {
      console.error('Resend error:', err)
      setError('Failed to resend verification email')
    } finally {
      setFormLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setShowResend(false)
    setFormLoading(true)

    try {
      if (isSignIn) {
        const result: { error: Error | null } = await login(email, password)
        if (result.error) {
          // Check if it's an email confirmation error
          const errorMessage = result.error.message
          if (errorMessage.includes('Email not confirmed') || errorMessage.includes('email_confirmed_at')) {
            setError('Please verify your email address before signing in.')
            setShowResend(true)
          } else {
            setError(errorMessage)
          }
        } else {
          // Wait for authentication state to be updated
          console.log('🔍 Auth: Login successful, waiting for auth state update...')
          // Add a small delay to ensure auth state is fully updated
          setTimeout(() => {
            console.log('🔍 Auth: Redirecting to:', redirectTo)
            router.replace(redirectTo)
          }, 500)
        }
      } else {
        // Validate password confirmation
        if (password !== confirmPassword) {
          setError('Passwords do not match')
          setFormLoading(false)
          return
        }

        // Validate password strength
        if (password.length < 6) {
          setError('Password must be at least 6 characters long')
          setFormLoading(false)
          return
        }

        const { error } = await register(email, password, fullName)
        if (error) {
          setError(error.message)
        } else {
          setSuccess('Account created successfully! Please check your email to verify your account.')
          // Don't redirect immediately - let user see the success message
        }
      }
    } catch (err) {
      console.error('Auth error:', err)
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setFormLoading(false)
    }
  }

  const handleModeSwitch = () => {
    setIsSignIn(!isSignIn)
    setError('')
    setSuccess('')
    setShowResend(false)
    setEmail('')
    setPassword('')
    setConfirmPassword('')
    setFullName('')
  }

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6 py-8">
      {/* Auth Form */}
      <div className="w-full max-w-md mx-auto">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Image
            src="/ganbatte.png"
            alt="Ganbatte Logo"
            width={120}
            height={48}
            className="drop-shadow-2xl"
            priority
          />
        </div>

        <div 
          className="p-8 rounded-xl relative overflow-hidden"
          style={{
            background: `
              linear-gradient(to bottom, #ffed00, #e10600, #002f6c),
              url('/noise.png')
            `,
            backgroundBlendMode: 'overlay',
            backgroundSize: '100% 100%, 200px 200px'
          }}
        >
          {/* No1.webp positioned at bottom-right corner */}
          <div className="absolute md:bottom-[-12] md:right-[-12] bottom-[-8] right-[-8] z-20 pointer-events-none">
            <Image
              src="/no1.webp"
              alt="No1"
              width={120}
              height={120}
              className="drop-shadow-2xl"
            />
          </div>

          <div className="relative z-10">
            <h2 className="text-3xl font-bold text-center mb-8 drop-shadow-2xl">
              {isSignIn ? 'Sign In' : 'Create Account'}
            </h2>
            
            {success && (
              <div className="mb-6 p-4 bg-lime-900/20 border border-lime-800/50 rounded-xl">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-5 h-5 bg-lime-400 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-lime-400 font-semibold">Account Created!</h3>
                </div>
                <p className="text-lime-300 text-sm">{success}</p>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => setIsSignIn(true)}
                    className="bg-lime-400 hover:bg-lime-300 text-black px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    Sign in now
                  </button>
                </div>
              </div>
            )}
            
            {!success && (
              <form onSubmit={handleSubmit} className="space-y-6">
                {!isSignIn && (
                  <div>
                    <label htmlFor="fullName" className="block text-sm font-medium mb-2 drop-shadow-lg">
                      Full Name
                    </label>
                    <input
                      type="text"
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-4 py-3 bg-black/80 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-lime-400 transition-colors"
                      placeholder="Enter your full name"
                      required
                    />
                  </div>
                )}
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-2 drop-shadow-lg">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-black/80 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-lime-400 transition-colors"
                    placeholder="Enter your email"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="password" className="block text-sm font-medium mb-2 drop-shadow-lg">
                    Password
                  </label>
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-black/80 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-lime-400 transition-colors"
                    placeholder="Enter your password"
                    required
                    minLength={6}
                  />
                </div>

                {!isSignIn && (
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2 drop-shadow-lg">
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      id="confirmPassword"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-3 bg-black/80 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-lime-400 transition-colors"
                      placeholder="Confirm your password"
                      required
                      minLength={6}
                    />
                  </div>
                )}

                {error && (
                  <div className="text-red-400 text-sm bg-red-900/20 px-4 py-3 rounded-xl border border-red-800/50">
                    {error}
                    {showResend && (
                      <div className="mt-3">
                        <button
                          type="button"
                          onClick={handleResendVerification}
                          disabled={formLoading}
                          className="text-lime-400 hover:text-lime-300 text-sm underline"
                        >
                          Resend verification email
                        </button>
                      </div>
                    )}
                  </div>
                )}
                
                <button
                  type="submit"
                  disabled={formLoading}
                  className="w-full bg-lime-400 hover:bg-lime-300 disabled:bg-neutral-600 text-black font-semibold px-6 py-3 rounded-lg text-lg transition drop-shadow-xl border-2 border-transparent hover:border-lime-300 hover:shadow-[0_0_20px_rgba(34,197,94,0.5)] disabled:transform-none"
                >
                  {formLoading ? 'Loading...' : (isSignIn ? 'Sign In' : 'Create Account')}
                </button>
              </form>
            )}
            
            {!success && (
              <div className="mt-6 text-center">
                <button
                  onClick={handleModeSwitch}
                  className="text-gray-300 hover:text-white transition-colors underline"
                >
                  {isSignIn ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
                </button>
              </div>
            )}
            
            {isSignIn && !success && (
              <div className="mt-4 text-center">
                <a href="#" className="text-gray-300 hover:text-white transition-colors underline text-sm">
                  Forgot your password?
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6 py-8">
        <div className="w-full max-w-md mx-auto">
          <div className="flex justify-center mb-8">
            <Image
              src="/ganbatte.png"
              alt="Ganbatte Logo"
              width={120}
              height={48}
              className="drop-shadow-2xl"
              priority
            />
          </div>
          <div className="p-8 rounded-xl relative overflow-hidden bg-gradient-to-b from-yellow-400 via-red-600 to-blue-800">
            <div className="flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
          </div>
        </div>
      </div>
    }>
      <AuthForm />
    </Suspense>
  )
} 