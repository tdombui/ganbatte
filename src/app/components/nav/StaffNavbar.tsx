'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { Menu, X, Users, User, LogOut, ChevronDown } from 'lucide-react'
import { useAuthContext } from '../../providers'

export default function StaffNavbar() {
    const { user, logout, isAuthenticated, isAdmin, loading } = useAuthContext()
    const [open, setOpen] = useState(false)
    const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)

    console.log('🔍 StaffNavbar: Rendering with:', { 
        user: user?.id, 
        isAuthenticated, 
        isAdmin,
        loading,
        hasUser: !!user 
    })

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

    const handleLogout = async () => {
        try {
            console.log('🔍 StaffNavbar: Starting logout...')
            console.log('🔍 StaffNavbar: Current user:', user?.id)
            console.log('🔍 StaffNavbar: Is authenticated:', isAuthenticated)
            
            setProfileDropdownOpen(false)
            setOpen(false)
            
            const { error } = await logout()
            if (error) {
                console.error('🔍 StaffNavbar: Logout error:', error)
                alert('Failed to sign out. Please try again.')
                return
            }
            
            console.log('🔍 StaffNavbar: Logout successful, redirecting...')
            // Force page reload to clear any cached state
            window.location.href = '/'
        } catch (error) {
            console.error('🔍 StaffNavbar: Logout error:', error)
            alert('Failed to sign out. Please try again.')
        }
    }

    return (
        <nav className="fixed top-4 left-4 right-8 z-50">
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
                    {/* Removed Jobs link - no longer needed */}
                </ul>
                
                {/* Right side buttons */}
                <div className="flex items-center gap-2">
                    <Link
                        href="/staff/jobs"
                        className="relative inline-flex items-center justify-center whitespace-nowrap rounded-lg overflow-hidden transition-all duration-300 bg-lime-400 text-black hover:bg-lime-300 px-4 py-2.5 font-medium text-sm shadow-lg hidden lg:flex"
                    >
                        <span className="relative z-10 font-bold flex">View Jobs</span>
                    </Link>
                    
                    {!loading && (
                        <>
                            {isAuthenticated ? (
                                <div className="relative profile-dropdown-container hidden lg:block">
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
                                            {isAdmin && (
                                                <Link
                                                    href="/admin/staff"
                                                    className="block px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-800 flex items-center gap-2"
                                                    onClick={() => setProfileDropdownOpen(false)}
                                                >
                                                    <Users size={14} />
                                                    Staff Management
                                                </Link>
                                            )}
                                            <button
                                                onClick={(e) => {
                                                    e.preventDefault()
                                                    e.stopPropagation()
                                                    console.log('🔍 StaffNavbar: Desktop Sign Out button clicked')
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
                                    className="relative inline-flex items-center justify-center whitespace-nowrap rounded-lg overflow-hidden transition-all duration-300 bg-transparent text-white border border-white/20 hover:border-white/40 px-4 py-2.5 font-medium text-sm hidden lg:flex"
                                >
                                    <span className="relative z-10 flex">Sign in</span>
                                </Link>
                            )}
                        </>
                    )}
                    
                    {/* Mobile menu button */}
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
                        {/* Removed Jobs link - no longer needed */}
                        
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
                                            {isAdmin && (
                                                <Link
                                                    href="/admin/staff"
                                                    onClick={() => setOpen(false)}
                                                    className="block px-3 py-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-md transition-colors flex items-center gap-2"
                                                >
                                                    <Users size={16} />
                                                    Staff Management
                                                </Link>
                                            )}
                                            <button
                                                onClick={(e) => {
                                                    e.preventDefault()
                                                    e.stopPropagation()
                                                    console.log('🔍 StaffNavbar: Mobile Sign Out button clicked')
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
                                </>
                            )}
                            {/* Removed green View Jobs button - no longer needed */}
                        </div>
                    </div>
                </div>
            )}
        </nav>
    )
} 