import { useState, useEffect } from 'react'
import { UserWithProfile } from '../../supabase/types'
import { getCurrentUser, signIn, signUp, signOut } from '../lib/auth'

export function useAuth() {
  const [user, setUser] = useState<UserWithProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkUser()
  }, [])

  async function checkUser() {
    try {
      const currentUser = await getCurrentUser()
      setUser(currentUser)
    } catch (error) {
      console.error('Error checking user:', error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  async function login(email: string, password: string) {
    try {
      const { error } = await signIn(email, password)
      if (error) throw error
      await checkUser()
      return { error: null }
    } catch (error) {
      return { error: error as Error }
    }
  }

  async function register(email: string, password: string, fullName: string) {
    try {
      const { error } = await signUp(email, password, fullName)
      if (error) throw error
      await checkUser()
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