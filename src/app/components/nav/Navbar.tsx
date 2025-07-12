'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { Menu, X, Settings, Users, User, LogOut, ChevronDown } from 'lucide-react'
import { useAuthContext } from '../../providers'
import { createClient } from '../../../lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function Navbar() {
    const { user, loading, logout, isAuthenticated } = useAuthContext()
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [isProfileOpen, setIsProfileOpen] = useState(false)
    const router = useRouter()
    
    // Derive staff/admin status from user role
    const isStaffUser = user?.role === 'staff' || user?.role === 'admin'
    const isAdminUser = user?.role === 'admin'

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen)
    const toggleProfileDropdown = () => setIsProfileOpen(!isProfileOpen)

    const handleLogout = async () => {
        await logout()
        setIsProfileOpen(false)
        setIsMenuOpen(false)
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

    return (
        <nav className="fixed top-4 left-4 right-8 z-50">
            <div className="relative flex h-14 w-full items-center justify-between rounded-lg border border-white/5 px-2 py-2 transition-all duration-300 bg-black/85 backdrop-blur-sm shadow-[0px_5px_18px_rgba(0,0,0,0.3)] lg:grid lg:grid-cols-[1fr_auto_1fr] lg:rounded-2xl lg:py-1 lg:pr-2">
                {/* Logo */}
                <Link href="/" className="relative flex w-fit items-center gap-2 overflow-hidden lg:px-3">
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
                <ul className="col-start-2 gap-5 px-2 font-medium text-gray-300 hidden lg:flex items-center">
                    {/* Staff Links */}
                    {!loading && isStaffUser && (
                        <li>
                            <Link href="/staff/jobs" className="transition-colors duration-300 p-2 hover:text-white hover:bg-white/10 rounded-md flex items-center gap-1">
                                <Settings size={16} />
                                Jobs
                            </Link>
                        </li>
                    )}
                </ul>
                
                {/* Right side buttons - Hidden on mobile */}
                <div className="col-start-3 hidden w-full justify-end gap-2 lg:flex">
                    {!loading && (
                        <>
                            {isAuthenticated ? (
                                <div className="relative">
                                    <button
                                        onClick={toggleProfileDropdown}
                                        className="relative inline-flex items-center justify-center whitespace-nowrap rounded-lg overflow-hidden transition-all duration-300 bg-transparent text-white border border-white/20 hover:border-white/40 px-4 py-2.5 font-medium text-sm"
                                    >
                                        <div className="flex items-center space-x-2">
                                            <div className="w-6 h-6 bg-lime-500 rounded-full flex items-center justify-center">
                                                <User size={14} className="text-black" />
                                            </div>
                                            <span className="text-sm font-medium">{user?.full_name}</span>
                                            <ChevronDown size={12} className={`transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
                                        </div>
                                    </button>
                                    
                                    {isProfileOpen && (
                                        <div className="absolute right-0 mt-2 w-48 bg-black/95 backdrop-blur border border-gray-800 rounded-lg shadow-lg py-2">
                                            <div className="px-4 py-2 border-b border-gray-800">
                                                <p className="text-sm text-gray-400">{user?.email}</p>
                                                <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
                                            </div>
                                            <Link
                                                href="/profile"
                                                className="block px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-800"
                                                onClick={() => setIsProfileOpen(false)}
                                            >
                                                Profile Settings
                                            </Link>
                                            {isAdminUser && (
                                                <Link
                                                    href="/admin/staff"
                                                    className="block px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-800 flex items-center gap-2"
                                                    onClick={() => setIsProfileOpen(false)}
                                                >
                                                    <Users size={14} />
                                                    Staff Management
                                                </Link>
                                            )}
                                            <button
                                                onClick={handleLogout}
                                                className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-800 flex items-center gap-2"
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
                    
                    <button
                        onClick={() => verifySessionAndNavigate("/chat")}
                        className="relative inline-flex items-center justify-center whitespace-nowrap rounded-lg overflow-hidden transition-all duration-300 bg-lime-400 text-black hover:bg-lime-300 px-4 py-2.5 font-medium text-sm shadow-lg"
                    >
                        <span className="relative z-10 font-bold flex">Request Delivery</span>
                    </button>
                </div>
                
                {/* Mobile menu button */}
                <div className="contents">
                    <button 
                        className="relative size-6 lg:hidden" 
                        aria-expanded={isMenuOpen}
                        aria-controls="mobile-menu" 
                        aria-label="Menu"
                        onClick={toggleMenu}
                    >
                        {isMenuOpen ? <X size={24} className="text-white" /> : <Menu size={24} className="text-white" />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMenuOpen && (
                <div className="lg:hidden mt-2 rounded-lg border border-white/10 bg-black/95 backdrop-blur-sm shadow-[0px_5px_18px_rgba(0,0,0,0.3)] overflow-hidden">
                    <div className="p-4 space-y-4">
                        {/* Staff Links */}
                        {!loading && isStaffUser && (
                            <Link href="/staff/jobs" onClick={() => setIsMenuOpen(false)} className="block px-3 py-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-md transition-colors">
                                Jobs
                            </Link>
                        )}
                        
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
                                                onClick={() => setIsMenuOpen(false)}
                                                className="block px-3 py-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-md transition-colors"
                                            >
                                                Profile Settings
                                            </Link>
                                            {isAdminUser && (
                                                <Link
                                                    href="/admin/staff"
                                                    onClick={() => setIsMenuOpen(false)}
                                                    className="block px-3 py-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-md transition-colors flex items-center gap-2"
                                                >
                                                    <Users size={16} />
                                                    Staff Management
                                                </Link>
                                            )}
                                            <button
                                                onClick={handleLogout}
                                                className="w-full text-left px-3 py-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-md transition-colors flex items-center gap-2"
                                            >
                                                <LogOut size={16} />
                                                Sign Out
                                            </button>
                                        </div>
                                    ) : (
                                        <Link
                                            href="/auth"
                                            onClick={() => setIsMenuOpen(false)}
                                            className="block px-3 py-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-md transition-colors"
                                        >
                                            Sign in
                                        </Link>
                                    )}
                                </>
                            )}
                            <button
                                onClick={() => {
                                    setIsMenuOpen(false)
                                    verifySessionAndNavigate("/chat")
                                }}
                                className="block px-3 py-2 bg-lime-400 text-black text-center rounded-md font-semibold hover:bg-lime-300 transition-colors w-full text-left"
                            >
                                Request Delivery
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Click outside to close profile dropdown */}
            {isProfileOpen && (
                <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setIsProfileOpen(false)}
                />
            )}
        </nav>
    )
}
