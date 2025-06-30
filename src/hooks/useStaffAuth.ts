import { useAuthContext } from '../app/providers'

export function useStaffAuth() {
  const { user, loading: authLoading } = useAuthContext()
  
  return {
    user,
    loading: authLoading,
    isAuthenticated: !!user,
    isStaff: user?.role === 'staff' || user?.role === 'admin',
    isAdmin: user?.role === 'admin',
  }
} 