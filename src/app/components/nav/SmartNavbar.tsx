'use client'

import { useAuthContext } from '../../providers'
import CustomerNavbar from './CustomerNavbar'
import StaffNavbar from './StaffNavbar'

export default function SmartNavbar() {
    const { isStaff, isAdmin, user, loading } = useAuthContext()

    console.log('🔍 SmartNavbar: Rendering with:', { 
        user: user?.id, 
        isStaff, 
        isAdmin, 
        loading,
        hasUser: !!user 
    })

    // Show loading state to prevent hydration mismatch
    if (loading) {
        return (
            <nav className="fixed top-4 left-4 right-8 z-50">
                <div className="relative flex h-14 w-full items-center justify-between rounded-lg border border-white/5 px-2 py-2 transition-all duration-300 bg-black/85 backdrop-blur-sm shadow-[0px_5px_18px_rgba(0,0,0,0.3)]">
                    {/* Logo placeholder */}
                    <div className="relative flex w-fit items-center gap-2 overflow-hidden">
                        <div className="w-9 h-6 bg-neutral-700 rounded animate-pulse"></div>
                        <div className="w-24 h-8 bg-neutral-700 rounded animate-pulse"></div>
                    </div>
                    
                    {/* Right side placeholder */}
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-neutral-700 rounded animate-pulse"></div>
                    </div>
                </div>
            </nav>
        )
    }

    // Show staff navbar for staff and admin users (even while loading if we have user data)
    if (user && (isStaff || isAdmin)) {
        console.log('🔍 SmartNavbar: Rendering StaffNavbar')
        return <StaffNavbar />
    }

    // Show customer navbar for everyone else (customers, unauthenticated users, and while loading)
    console.log('🔍 SmartNavbar: Rendering CustomerNavbar')
    return <CustomerNavbar />
} 