'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect, useRef } from 'react'
import { Menu, X, User, LogOut, ChevronDown, RefreshCw } from 'lucide-react'
import { useAuthContext } from '../../providers'
import { createClient } from '../../../lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function UnifiedNavbar() {
    const { user, logout, isAuthenticated, loading, isCustomer, isAdmin, refreshUser } = useAuthContext()
    const [open, setOpen] = useState(false)
    const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const dropdownRef = useRef<HTMLDivElement>(null)
    const router = useRouter()

    const toggleMenu = () => setOpen(!open)
    const toggleProfileDropdown = () => setProfileDropdownOpen(!profileDropdownOpen)

    // Handle clicking outside to close dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Element
            if (profileDropdownOpen && !target.closest('.profile-dropdown-container')) {
                setProfileDropdownOpen(false)
            }
        }

        if (profileDropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside)
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [profileDropdownOpen])

    // Auto-refresh auth state if stuck in loading for too long
    useEffect(() => {
        if (loading) {
            const timeout = setTimeout(() => {
                console.log('Auth state stuck in loading, attempting refresh...')
                refreshUser().catch(err => {
                    console.error('Failed to refresh auth state:', err)
                    setError('Authentication error. Please refresh the page.')
                })
            }, 10000) // 10 seconds

            return () => clearTimeout(timeout)
        } else {
            setError(null)
        }
    }, [loading, refreshUser])

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setProfileDropdownOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // Close mobile menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Element
            if (!target.closest('.mobile-menu-container')) {
                setOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleLogout = async () => {
        try {
            setProfileDropdownOpen(false)
            setOpen(false)
            setError(null)
            
            const { error } = await logout()
            if (error) {
                console.error('UnifiedNavbar: Logout error:', error)
                setError('Failed to sign out. Please try again.')
                return
            }
            
            // Force page reload to clear any cached state
            router.push('/')
        } catch (error) {
            console.error('UnifiedNavbar: Logout error:', error)
            setError('Failed to sign out. Please try again.')
        }
    }

    const handleRefreshAuth = async () => {
        try {
            const supabase = createClient()
            const { data: { session }, error } = await supabase.auth.refreshSession()
            
            if (error) {
                console.error('Auth refresh error:', error)
                router.push('/auth')
            } else if (session) {
                console.log('Auth refreshed successfully')
                window.location.reload()
            }
        } catch (error) {
            console.error('Auth refresh error:', error)
            router.push('/auth')
        }
    }

    // Function to verify session before navigation
    const verifySessionAndNavigate = async (targetPath: string) => {
        try {
            // If not authenticated, redirect to auth
            if (!isAuthenticated) {
                router.push(`/auth?redirectTo=${encodeURIComponent(targetPath)}`)
                return
            }

            // Verify session is valid on server-side
            const supabase = createClient()
            const { data: { session }, error } = await supabase.auth.getSession()
            
            if (error || !session) {
                console.log('🔍 Session verification failed, redirecting to auth')
                router.push(`/auth?redirectTo=${encodeURIComponent(targetPath)}`)
                return
            }

            // Session is valid, navigate to target
            console.log('🔍 Session verified, navigating to:', targetPath)
            router.push(targetPath)
        } catch (error) {
            console.error('Session verification error:', error)
            // Fallback to auth page
            router.push(`/auth?redirectTo=${encodeURIComponent(targetPath)}`)
        }
    }

    // Show error state
    if (error) {
        return (
            <nav className="fixed top-4 left-4 right-4 z-50">
                <div className="relative flex h-14 w-full items-center justify-between rounded-lg border border-red-500/20 px-2 py-2 transition-all duration-300 bg-red-900/20 backdrop-blur-sm shadow-[0px_5px_18px_rgba(0,0,0,0.3)]">
                    <div className="flex items-center gap-2">
                        <span className="text-red-400 text-sm">{error}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleRefreshAuth}
                            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
                        >
                            <RefreshCw size={14} />
                            Retry
                        </button>
                        <button
                            onClick={() => window.location.reload()}
                            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors"
                        >
                            Reload
                        </button>
                    </div>
                </div>
            </nav>
        )
    }

    // Show loading state to prevent hydration mismatch
    if (loading) {
        return (
            <nav className="fixed top-4 left-4 right-4 z-50">
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

    return (
        <nav className="fixed top-4 left-4 right-4 z-50">
            <div className="relative flex h-14 w-full items-center justify-between rounded-lg border border-white/5 px-2 py-2 transition-all duration-300 bg-black/85 backdrop-blur-sm shadow-[0px_5px_18px_rgba(0,0,0,0.3)]">
                {/* Logo */}
                <Link href="/" className="relative flex w-fit items-center gap-2 overflow-hidden">
                    <Image
                        src="/ganbatte.png"
                        alt="Ganbatte Logo"
                        width={36}
                        height={24}
                        className="drop-shadow-2xl"
                        style={{ height: 'auto' }}
                        priority
                    />
                    <h1 className="text-[2rem] font-bold font-sans tracking-tight lg:text-[2rem]">
                        Zukujet
                    </h1>
                </Link>
                
                {/* Navigation Links - Hidden on mobile */}
                <ul className="gap-5 px-2 font-medium text-gray-300 hidden lg:flex items-center">
                    {/* Only show nav links for customers and non-authenticated users */}
                    {(!isAuthenticated || isCustomer) && (
                        <>
                                                    <li>
                                <a href="#enterprise" className="transition-colors duration-300 p-2 hover:text-white hover:bg-white/10 rounded-md">
                                    Enterprise
                                </a>
                            </li>
                            <li>
                                <a href="#pricing" className="transition-colors duration-300 p-2 hover:text-white hover:bg-white/10 rounded-md">
                                    Pricing
                                </a>
                            </li>
                            <li>
                                <a href="#services" className="transition-colors duration-300 p-2 hover:text-white hover:bg-white/10 rounded-md">
                                    Services
                                </a>
                            </li>

                        </>
                    )}
                </ul>
                
                {/* Right side buttons */}
                <div className="flex items-center gap-2">
                    {/* Desktop buttons - hidden on mobile */}
                    <div className="hidden lg:flex items-center gap-2">
                        {/* Role-based action buttons */}
                        {isAuthenticated && isCustomer && (
                            <button
                                onClick={() => verifySessionAndNavigate("/chat")}
                                className="relative inline-flex items-center justify-center whitespace-nowrap rounded-lg overflow-hidden transition-all duration-300 bg-lime-400 text-black hover:bg-lime-300 px-4 py-2.5 font-medium text-sm shadow-lg"
                            >
                                <span className="relative z-10 font-bold flex">Request Delivery</span>
                            </button>
                        )}
                        
                        {/* Only show green button for admin, not staff */}
                        {isAuthenticated && isAdmin && (
                            <Link
                                href="/admin/staff"
                                className="relative inline-flex items-center justify-center whitespace-nowrap rounded-lg overflow-hidden transition-all duration-300 bg-lime-400 text-black hover:bg-lime-300 px-4 py-2.5 font-medium text-sm shadow-lg"
                            >
                                <span className="relative z-10 font-bold flex">Staff Management</span>
                            </Link>
                        )}
                        
                        {isAuthenticated && (
                            <Link
                                href={isCustomer ? "/jobs" : "/staff/jobs"}
                                className="relative inline-flex items-center justify-center whitespace-nowrap rounded-lg overflow-hidden transition-all duration-300 bg-transparent text-white border border-white/20 hover:border-white/40 px-4 py-2.5 font-medium text-sm"
                            >
                                <span className="relative z-10 flex">View All Jobs</span>
                            </Link>
                        )}
                        
                        {!loading && (
                            <>
                                {isAuthenticated ? (
                                    <div className="relative profile-dropdown-container">
                                        <button
                                            onClick={toggleProfileDropdown}
                                            className="relative inline-flex items-center justify-center whitespace-nowrap rounded-lg overflow-hidden transition-all duration-300 bg-transparent text-white border border-white/20 hover:border-white/40 px-4 py-2.5 font-medium text-sm"
                                        >
                                            <div className="flex items-center space-x-2">
                                                <div className="w-6 h-6 bg-lime-500 rounded-full flex items-center justify-center">
                                                    <User size={14} className="text-black" />
                                                </div>
                                                <span className="text-sm font-medium">{user?.full_name}</span>
                                                <ChevronDown size={12} className={`transition-transform ${profileDropdownOpen ? 'rotate-180' : ''}`} />
                                            </div>
                                        </button>
                                        
                                        {profileDropdownOpen && (
                                            <div className="absolute right-0 mt-2 w-48 bg-black/95 backdrop-blur border border-gray-800 rounded-lg shadow-lg py-2 z-50">
                                                <div className="px-4 py-2 border-b border-gray-800">
                                                    <p className="text-sm text-gray-400">{user?.email}</p>
                                                    <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
                                                </div>
                                                <Link
                                                    href="/profile"
                                                    className="block px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-800"
                                                    onClick={() => setProfileDropdownOpen(false)}
                                                >
                                                    Profile Settings
                                                </Link>
                                                <button
                                                    onClick={(e) => {
                                                        e.preventDefault()
                                                        e.stopPropagation()
                                                        handleLogout()
                                                    }}
                                                    className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-800 flex items-center gap-2 cursor-pointer select-none"
                                                >
                                                    <LogOut size={14} />
                                                    Sign Out
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <Link
                                        href="/auth"
                                        className="relative inline-flex items-center justify-center whitespace-nowrap rounded-lg overflow-hidden transition-all duration-300 bg-transparent text-white border border-white/20 hover:border-white/40 px-4 py-2.5 font-medium text-sm"
                                    >
                                        <span className="relative z-10 flex">Sign in</span>
                                    </Link>
                                )}
                            </>
                        )}
                    </div>
                    
                    {/* Mobile menu button - always visible on mobile */}
                    <button 
                        className="relative size-6 lg:hidden" 
                        aria-expanded={open}
                        aria-controls="mobile-menu" 
                        aria-label="Menu"
                        onClick={toggleMenu}
                    >
                        {open ? <X size={24} className="text-white" /> : <Menu size={24} className="text-white" />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {open && (
                <div className="lg:hidden mt-2 rounded-lg border border-white/10 bg-black/95 backdrop-blur-sm shadow-[0px_5px_18px_rgba(0,0,0,0.3)] overflow-hidden">
                    <div className="p-4 space-y-4">
                        {/* Navigation Links */}
                        <div className="space-y-2">
                            {/* Only show nav links for customers and non-authenticated users */}
                            {(!isAuthenticated || isCustomer) && (
                                <>
                                    <a 
                                        href="#pricing" 
                                        className="block px-3 py-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-md transition-colors"
                                        onClick={() => setOpen(false)}
                                    >
                                        Pricing
                                    </a>
                                    <a 
                                        href="#services" 
                                        className="block px-3 py-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-md transition-colors"
                                        onClick={() => setOpen(false)}
                                    >
                                        Services
                                    </a>
                                    <a 
                                        href="#enterprise" 
                                        className="block px-3 py-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-md transition-colors"
                                        onClick={() => setOpen(false)}
                                    >
                                        Enterprise
                                    </a>
                                </>
                            )}
                        </div>
                        
                        {/* Divider */}
                        <div className="border-t border-white/10"></div>
                        
                        {/* Action Buttons */}
                        <div className="space-y-2">
                            {!loading && (
                                <>
                                    {isAuthenticated ? (
                                        <div className="space-y-2">
                                            <div className="px-3 py-2">
                                                <p className="text-white font-medium">{user?.full_name}</p>
                                                <p className="text-sm text-gray-400">{user?.email}</p>
                                                <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
                                            </div>
                                            <Link
                                                href="/profile"
                                                onClick={() => setOpen(false)}
                                                className="block px-3 py-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-md transition-colors"
                                            >
                                                Profile Settings
                                            </Link>
                                            <button
                                                onClick={(e) => {
                                                    e.preventDefault()
                                                    e.stopPropagation()
                                                    handleLogout()
                                                }}
                                                className="w-full text-left px-3 py-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-md transition-colors flex items-center gap-2"
                                            >
                                                <LogOut size={16} />
                                                Sign Out
                                            </button>
                                        </div>
                                    ) : (
                                        <Link
                                            href="/auth"
                                            onClick={() => setOpen(false)}
                                            className="block px-3 py-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-md transition-colors"
                                        >
                                            Sign in
                                        </Link>
                                    )}
                                    
                                    {/* Role-based action buttons for mobile */}
                                    {isAuthenticated && isCustomer && (
                                        <button
                                            onClick={() => {
                                                setOpen(false)
                                                verifySessionAndNavigate("/chat")
                                            }}
                                            className="block px-3 py-2 bg-lime-400 text-black text-center rounded-md font-semibold hover:bg-lime-300 transition-colors w-full text-left"
                                        >
                                            Request Delivery
                                        </button>
                                    )}
                                    
                                    {isAuthenticated && isAdmin && (
                                        <Link
                                            href="/admin/staff"
                                            onClick={() => setOpen(false)}
                                            className="block px-3 py-2 bg-lime-400 text-black text-center rounded-md font-semibold hover:bg-lime-300 transition-colors"
                                        >
                                            Staff Management
                                        </Link>
                                    )}
                                    
                                    {isAuthenticated && (
                                        <Link
                                            href={isCustomer ? "/jobs" : "/staff/jobs"}
                                            onClick={() => setOpen(false)}
                                            className="block px-3 py-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-md transition-colors text-center"
                                        >
                                            View All Jobs
                                        </Link>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </nav>
    )
} 