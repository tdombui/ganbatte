'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { UserWithProfile } from '../../supabase/types'
import { getCurrentUser, signOut, signIn, signUp } from '../lib/auth-utils'
import { createClient } from '../lib/supabase/client'

interface AuthContextType {
  user: UserWithProfile | null
  loading: boolean
  isAuthenticated: boolean
  isCustomer: boolean
  isStaff: boolean
  isAdmin: boolean
  logout: () => Promise<{ error: Error | null }>
  login: (email: string, password: string) => Promise<{ error: Error | null }>
  register: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAuthenticated: false,
  isCustomer: false,
  isStaff: false,
  isAdmin: false,
  logout: async () => ({ error: null }),
  login: async () => ({ error: null }),
  register: async () => ({ error: null }),
  refreshUser: async () => {},
})

export function useAuthContext() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserWithProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [initialized, setInitialized] = useState(false)

  // Function to safely update user state
  const updateUser = useCallback((newUser: UserWithProfile | null) => {
    setUser(newUser)
    setLoading(false)
  }, [])

  // Function to refresh user data
  const refreshUser = useCallback(async () => {
    try {
      setLoading(true)
      const currentUser = await getCurrentUser()
      updateUser(currentUser)
    } catch (error) {
      console.error('Error refreshing user:', error)
      updateUser(null)
    }
  }, [updateUser])

  // Function to clear auth state
  const clearAuthState = useCallback(() => {
    setUser(null)
    setLoading(false)
  }, [])

  const logout = async () => {
    try {
      // Clear state immediately
      clearAuthState()
      
      // Sign out from Supabase
      const { error } = await signOut()
      if (error) {
        console.error('Logout error:', error)
      }
      
      return { error: null }
    } catch (error) {
      console.error('Logout error:', error)
      // Always clear state even if there's an error
      clearAuthState()
      return { error: error as Error }
    }
  }

  const login = async (email: string, password: string): Promise<{ error: Error | null }> => {
    try {
      setLoading(true)
      const { error } = await signIn(email, password)
      if (error) throw error
      
      // Wait a bit for the session to be established
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Get the updated user
      await refreshUser()
      
      return { error: null }
    } catch (error) {
      console.error('Login error:', error)
      clearAuthState()
      return { error: error as Error }
    }
  }

  const register = async (email: string, password: string, fullName: string): Promise<{ error: Error | null }> => {
    try {
      const { error } = await signUp(email, password, fullName)
      if (error) throw error
      return { error: null }
    } catch (error) {
      console.error('Register error:', error)
      return { error: error as Error }
    }
  }

  // Initialize auth state
  useEffect(() => {
    let isMounted = true
    let retryCount = 0
    const maxRetries = 3

    const initializeAuth = async () => {
      if (!isMounted || initialized) return

      try {
        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.user && isMounted) {
          const currentUser = await getCurrentUser()
          if (isMounted) {
            updateUser(currentUser)
          }
        } else {
          if (isMounted) {
            clearAuthState()
          }
        }
        
        if (isMounted) {
          setInitialized(true)
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
        
        // Retry logic for initialization errors
        if (retryCount < maxRetries && isMounted) {
          retryCount++
          console.log(`Retrying auth initialization (${retryCount}/${maxRetries})`)
          setTimeout(initializeAuth, 1000 * retryCount)
        } else {
          if (isMounted) {
            clearAuthState()
            setInitialized(true)
          }
        }
      }
    }

    initializeAuth()

    // Listen for auth changes
    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted || !initialized) return
      
      console.log('Auth state change:', event, session?.user?.id)
      
      try {
        if (session?.user) {
          const currentUser = await getCurrentUser()
          if (isMounted) {
            updateUser(currentUser)
          }
        } else {
          if (isMounted) {
            clearAuthState()
          }
        }
      } catch (error) {
        console.error('Error handling auth state change:', error)
        
        // If there's an error getting user data, try to refresh the session
        if (session?.user) {
          try {
            const { data: { session: refreshedSession } } = await supabase.auth.refreshSession()
            if (refreshedSession) {
              const currentUser = await getCurrentUser()
              if (isMounted) {
                updateUser(currentUser)
              }
            } else {
              if (isMounted) {
                clearAuthState()
              }
            }
          } catch (refreshError) {
            console.error('Error refreshing session:', refreshError)
            if (isMounted) {
              clearAuthState()
            }
          }
        } else {
          if (isMounted) {
            clearAuthState()
          }
        }
      }
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [initialized, updateUser, clearAuthState])

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    isCustomer: user?.role === 'customer',
    isStaff: user?.role === 'staff' || user?.role === 'admin',
    isAdmin: user?.role === 'admin',
    logout,
    login,
    register,
    refreshUser,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
} 