import { useState, useEffect } from 'react'
import { UserWithProfile } from '../../supabase/types'
import { getCurrentUser, signIn, signUp, signOut, supabase } from '../lib/auth'

export function useAuth() {
  const [user, setUser] = useState<UserWithProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    console.log('🔍 useAuth: Starting auth check...')
    // Get initial session
    checkUser()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔍 useAuth: Auth state changed:', event, session?.user?.id)
      if (session?.user) {
        try {
          const currentUser = await getCurrentUser()
          console.log('🔍 useAuth: Got current user:', currentUser?.id)
          setUser(currentUser)
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

    return () => subscription.unsubscribe()
  }, [])

  async function checkUser() {
    try {
      console.log('🔍 useAuth: checkUser called')
      const currentUser = await getCurrentUser()
      console.log('🔍 useAuth: checkUser result:', currentUser?.id)
      setUser(currentUser)
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