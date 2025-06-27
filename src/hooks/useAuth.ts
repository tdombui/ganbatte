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
      
      // Force a session check after login
      setTimeout(() => {
        checkUserWithRetry()
      }, 500)
      
      return { error: null }
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
      const { error } = await signOut()
      if (error) throw error
      setUser(null)
      return { error: null }
    } catch (error) {
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