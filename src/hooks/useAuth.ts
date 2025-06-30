// DEPRECATED: This hook is no longer used. Use useAuthContext from ../app/providers instead.
// This file is kept for reference but should not be imported.

/*
import { useState, useEffect } from 'react'
import { UserWithProfile } from '../../supabase/types'
import { getCurrentUser, signIn, signUp, signOut, supabase } from '../lib/auth'

export function useAuth() {
  const [user, setUser] = useState<UserWithProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    console.log('🔍 useAuth: Starting auth check...')
    
    // Get initial session with retry logic
    checkUserWithRetry()

    // Set a timeout to prevent infinite loading (industry-standard practice)
    const timeoutId = setTimeout(() => {
      console.log('🔍 useAuth: Auth check timeout reached, clearing loading state')
      setLoading(false)
      // Don't clear session on timeout - just stop loading
    }, 8000) // 8 second timeout (reasonable for auth checks)

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔍 useAuth: Auth state changed:', event, session?.user?.id)
      
      if (session?.user) {
        try {
          const currentUser = await getCurrentUser()
          console.log('🔍 useAuth: Got current user:', currentUser?.id)
          setUser(currentUser)
          setRetryCount(0) // Reset retry count on successful auth
        } catch (error) {
          console.error('🔍 useAuth: Error getting current user after auth change:', error)
          setUser(null)
        }
      } else {
        console.log('🔍 useAuth: No session, setting user to null')
        setUser(null)
      }
      setLoading(false)
    })

    // Set up session refresh interval for mobile devices
    const refreshInterval = setInterval(async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          console.log('🔍 useAuth: Refreshing session...')
          await supabase.auth.refreshSession()
        }
      } catch (error) {
        console.error('🔍 useAuth: Session refresh error:', error)
      }
    }, 10 * 60 * 1000) // Refresh every 10 minutes

    return () => {
      clearTimeout(timeoutId)
      subscription.unsubscribe()
      clearInterval(refreshInterval)
    }
  }, [])

  async function checkUserWithRetry() {
    try {
      console.log('🔍 useAuth: checkUserWithRetry called, attempt:', retryCount + 1)
      
      // First try to get the session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      console.log('🔍 useAuth: Session check:', { hasSession: !!session, error: sessionError?.message })
      
      if (sessionError) {
        console.error('🔍 useAuth: Session error:', sessionError)
        throw sessionError
      }

      if (!session) {
        console.log('🔍 useAuth: No session found')
        setUser(null)
        setLoading(false)
        return
      }

      // Check if session is expired (industry-standard check)
      if (session.expires_at) {
        const expiresAt = new Date(session.expires_at * 1000)
        const now = new Date()
        const isExpired = expiresAt <= now
        
        if (isExpired) {
          console.log('🔍 useAuth: Session expired, clearing session')
          await supabase.auth.signOut()
          setUser(null)
          setLoading(false)
          return
        }
      }

      const currentUser = await getCurrentUser()
      console.log('🔍 useAuth: checkUserWithRetry result:', currentUser?.id)
      
      if (currentUser) {
        setUser(currentUser)
        setRetryCount(0) // Reset retry count on success
      } else {
        // If we have a session but no user, try to refresh
        if (retryCount < 2) {
          console.log('🔍 useAuth: Retrying auth check...')
          setRetryCount(prev => prev + 1)
          setTimeout(checkUserWithRetry, 1000 * (retryCount + 1)) // Exponential backoff
          return
        } else {
          console.log('🔍 useAuth: Max retries reached, clearing session')
          await supabase.auth.signOut()
          setUser(null)
        }
      }
    } catch (error) {
      console.error('🔍 useAuth: Error checking user:', error)
      
      // Handle specific auth errors gracefully
      if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase()
        if (errorMessage.includes('invalid') || errorMessage.includes('expired') || errorMessage.includes('token')) {
          console.log('🔍 useAuth: Auth token error detected, clearing session')
          await supabase.auth.signOut()
          setUser(null)
          setLoading(false)
          return
        }
      }
      
      setUser(null)
    } finally {
      console.log('🔍 useAuth: Setting loading to false')
      setLoading(false)
    }
  }

  async function login(email: string, password: string) {
    try {
      const { error } = await signIn(email, password)
      if (error) throw error
      
      // Wait for the auth state to be updated
      return new Promise((resolve) => {
        const checkAuthState = async () => {
          try {
            const { data: { session } } = await supabase.auth.getSession()
            if (session?.user) {
              const currentUser = await getCurrentUser()
              if (currentUser) {
                console.log('🔍 useAuth: Login successful, user authenticated:', currentUser.id)
                resolve({ error: null })
                return
              }
            }
            
            // If not ready yet, try again in 100ms
            setTimeout(checkAuthState, 100)
          } catch (error) {
            console.error('🔍 useAuth: Error checking auth state after login:', error)
            resolve({ error: error as Error })
          }
        }
        
        // Start checking after a short delay
        setTimeout(checkAuthState, 200)
      })
    } catch (error) {
      return { error: error as Error }
    }
  }

  async function register(email: string, password: string, fullName: string) {
    try {
      const { error } = await signUp(email, password, fullName)
      if (error) throw error
      return { error: null }
    } catch (error) {
      return { error: error as Error }
    }
  }

  async function logout() {
    try {
      console.log('🔍 useAuth: Starting logout...')
      
      // Clear user state immediately
      setUser(null)
      
      // Sign out from Supabase
      const { error } = await signOut()
      if (error) {
        console.error('🔍 useAuth: SignOut error:', error)
        throw error
      }
      
      console.log('🔍 useAuth: Logout successful')
      return { error: null }
    } catch (error) {
      console.error('🔍 useAuth: Logout error:', error)
      // Even if there's an error, clear the user state
      setUser(null)
      return { error: error as Error }
    }
  }

  return {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    isCustomer: user?.role === 'customer',
    isStaff: user?.role === 'staff',
    isAdmin: user?.role === 'admin',
  }
}
*/

// Re-export useAuthContext to prevent multiple Supabase client instances
// This ensures all components use the same authentication context and Supabase client
export { useAuthContext as useAuth } from '../app/providers'

// This file is deprecated - use useAuthContext from ../app/providers instead
// This wrapper maintains backward compatibility while preventing multiple Supabase client instances

import { useAuthContext } from '../app/providers'

export function useAuth() {
  const context = useAuthContext()
  
  return {
    user: context.user,
    loading: context.loading,
    isAuthenticated: context.isAuthenticated,
    isCustomer: context.isCustomer,
    isStaff: context.isStaff,
    isAdmin: context.isAdmin,
    login: context.login,
    register: context.register,
    logout: context.logout,
  }
} 