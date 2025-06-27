import { useEffect, useState } from 'react'
import { useAuth } from './useAuth'

export function useStaffAuth() {
  const { user, loading: authLoading } = useAuth()
  const [isStaff, setIsStaff] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return

    if (!user) {
      setIsStaff(false)
      setIsAdmin(false)
      setLoading(false)
      return
    }

    // Check if user has staff role
    const checkStaffRole = async () => {
      try {
        const response = await fetch('/api/staff/check-permissions')
        if (response.ok) {
          const data = await response.json()
          setIsStaff(data.isStaff)
          setIsAdmin(data.isAdmin)
        } else {
          setIsStaff(false)
          setIsAdmin(false)
        }
      } catch (error) {
        console.error('Error checking staff permissions:', error)
        setIsStaff(false)
        setIsAdmin(false)
      } finally {
        setLoading(false)
      }
    }

    checkStaffRole()
  }, [user, authLoading])

  return {
    user,
    isStaff,
    isAdmin,
    loading: authLoading || loading,
    hasPermission: () => {
      if (!user || !isStaff) return false
      // For now, admins have all permissions
      if (isAdmin) return true
      // TODO: Check specific permissions from staff.permissions JSONB
      return true
    }
  }
} 