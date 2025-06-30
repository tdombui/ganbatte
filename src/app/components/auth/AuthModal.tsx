'use client'

import { useState } from 'react'
import { useAuthContext } from '../../providers'
import { createClient } from '../../../lib/supabase/client'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  mode?: 'login' | 'register'
}

export default function AuthModal({ isOpen, onClose, mode = 'login' }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(mode === 'login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [showResend, setShowResend] = useState(false)

  const { login, register } = useAuthContext()

  if (!isOpen) return null

  const handleResendVerification = async () => {
    setLoading(true)
    try {
      const { error } = await createClient().auth.resend({
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
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setShowResend(false)
    setLoading(true)

    try {
      if (isLogin) {
        const { error } = await login(email, password)
        if (error) {
          // Check if it's an email confirmation error
          if (error.message.includes('Email not confirmed') || error.message.includes('email_confirmed_at')) {
            setError('Please verify your email address before signing in.')
            setShowResend(true)
          } else {
            setError(error.message)
          }
        } else {
          onClose()
        }
      } else {
        // Validate password confirmation
        if (password !== confirmPassword) {
          setError('Passwords do not match')
          setLoading(false)
          return
        }

        // Validate password strength
        if (password.length < 6) {
          setError('Password must be at least 6 characters long')
          setLoading(false)
          return
        }

        const { error } = await register(email, password, fullName)
        if (error) {
          setError(error.message)
        } else {
          setSuccess('Account created successfully! Please check your email to verify your account.')
          // Don't close modal immediately - let user see the success message
        }
      }
    } catch (err) {
      console.error('Auth error:', err)
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleModeSwitch = () => {
    setIsLogin(!isLogin)
    setError('')
    setSuccess('')
    setShowResend(false)
    setEmail('')
    setPassword('')
    setConfirmPassword('')
    setFullName('')
  }

  const handleClose = () => {
    setError('')
    setSuccess('')
    setShowResend(false)
    setEmail('')
    setPassword('')
    setConfirmPassword('')
    setFullName('')
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 rounded-2xl p-8 max-w-md w-full border border-neutral-700/50 shadow-2xl">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">
            {isLogin ? 'Sign In' : 'Create Account'}
          </h2>
          <button
            onClick={handleClose}
            className="text-neutral-400 hover:text-white text-2xl transition-colors"
          >
            ×
          </button>
        </div>

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
                onClick={handleClose}
                className="bg-lime-400 hover:bg-lime-300 text-black px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Got it
              </button>
              <button
                onClick={() => setIsLogin(true)}
                className="text-lime-400 hover:text-lime-300 text-sm"
              >
                Sign in now
              </button>
            </div>
          </div>
        )}

        {!success && (
          <form onSubmit={handleSubmit} className="space-y-6">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-3 bg-neutral-800/50 border border-neutral-600/50 rounded-xl text-white focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-400/20 transition-all"
                  required
                  placeholder="Enter your full name"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-neutral-800/50 border border-neutral-600/50 rounded-xl text-white focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-400/20 transition-all"
                required
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-neutral-800/50 border border-neutral-600/50 rounded-xl text-white focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-400/20 transition-all"
                required
                minLength={6}
                placeholder="Enter your password"
              />
            </div>

            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-neutral-800/50 border border-neutral-600/50 rounded-xl text-white focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-400/20 transition-all"
                  required
                  minLength={6}
                  placeholder="Confirm your password"
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
                      disabled={loading}
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
              disabled={loading}
              className="w-full bg-lime-400 hover:bg-lime-300 disabled:bg-neutral-600 text-black font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-[1.02] disabled:transform-none"
            >
              {loading ? 'Loading...' : (isLogin ? 'Sign In' : 'Create Account')}
            </button>
          </form>
        )}

        {!success && (
          <div className="mt-8 text-center">
            <button
              onClick={handleModeSwitch}
              className="text-lime-400 hover:text-lime-300 text-sm transition-colors"
            >
              {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
          </div>
        )}

        {!isLogin && !success && (
          <div className="mt-6 text-center">
            <p className="text-xs text-neutral-400">
              By creating an account, you agree to our terms of service and privacy policy.
            </p>
          </div>
        )}
      </div>
    </div>
  )
} 