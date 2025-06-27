'use client'

import { useState } from 'react'
import { useAuth } from '../../../hooks/useAuth'
import { supabase } from '../../../lib/auth'

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

  const { login, register } = useAuth()

  if (!isOpen) return null

  const handleResendVerification = async () => {
    setLoading(true)
    try {
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-neutral-900 rounded-lg p-6 sm:p-8 max-w-md w-full border border-neutral-700">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-white">
            {isLogin ? 'Sign In' : 'Create Account'}
          </h2>
          <button
            onClick={handleClose}
            className="text-neutral-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        {success && (
          <div className="mb-6 p-4 bg-emerald-900/20 border border-emerald-800 rounded-lg">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-emerald-400 font-semibold">Account Created!</h3>
            </div>
            <p className="text-emerald-300 text-sm">{success}</p>
            <div className="mt-3 flex gap-2">
              <button
                onClick={handleClose}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded text-sm transition-colors"
              >
                Got it
              </button>
              <button
                onClick={() => setIsLogin(true)}
                className="text-emerald-400 hover:text-emerald-300 text-sm"
              >
                Sign in now
              </button>
            </div>
          </div>
        )}

        {!success && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-800 border border-neutral-600 rounded-md text-white focus:border-emerald-500 focus:outline-none"
                  required
                  placeholder="Enter your full name"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-800 border border-neutral-600 rounded-md text-white focus:border-emerald-500 focus:outline-none"
                required
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-800 border border-neutral-600 rounded-md text-white focus:border-emerald-500 focus:outline-none"
                required
                minLength={6}
                placeholder="Enter your password"
              />
            </div>

            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-800 border border-neutral-600 rounded-md text-white focus:border-emerald-500 focus:outline-none"
                  required
                  minLength={6}
                  placeholder="Confirm your password"
                />
              </div>
            )}

            {error && (
              <div className="text-red-400 text-sm bg-red-900/20 px-3 py-2 rounded border border-red-800">
                {error}
                {showResend && (
                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={handleResendVerification}
                      disabled={loading}
                      className="text-emerald-400 hover:text-emerald-300 text-sm underline"
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
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-neutral-600 text-white font-semibold py-2 px-4 rounded-md transition-colors"
            >
              {loading ? 'Loading...' : (isLogin ? 'Sign In' : 'Create Account')}
            </button>
          </form>
        )}

        {!success && (
          <div className="mt-6 text-center">
            <button
              onClick={handleModeSwitch}
              className="text-emerald-400 hover:text-emerald-300 text-sm"
            >
              {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
          </div>
        )}

        {!isLogin && !success && (
          <div className="mt-4 text-center">
            <p className="text-xs text-neutral-400">
              By creating an account, you agree to our terms of service and privacy policy.
            </p>
          </div>
        )}
      </div>
    </div>
  )
} 