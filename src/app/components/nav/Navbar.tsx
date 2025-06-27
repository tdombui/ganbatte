'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Menu, X, Settings, Users } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

export default function Navbar() {
    const [open, setOpen] = useState(false)
    const { user, loading } = useAuth()
    
    // Derive staff/admin status from user role
    const isStaff = user?.role === 'staff' || user?.role === 'admin'
    const isAdmin = user?.role === 'admin'

    const toggleMenu = () => setOpen(!open)

    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur border-b border-gray-800">
            <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                <Link href="/" className="text-white text-lg font-bold tracking-tight">
                🏁 Ganbatte
                </Link>

                {/* Desktop Links */}
                <nav className="hidden md:flex space-x-6 text-sm text-gray-300 items-center">
                    <Link href="/chat" className="bg-lime-500 hover:bg-lime-400 text-black font-semibold px-4 py-2 rounded">
                        Request Delivery
                    </Link>
                    
                    {/* Staff Links */}
                    {!loading && isStaff && (
                        <>
                            <Link href="/staff/jobs" className="hover:text-white flex items-center gap-1">
                                <Settings size={16} />
                                Jobs
                            </Link>
                        </>
                    )}
                    
                    {/* Admin Links */}
                    {!loading && isAdmin && (
                        <Link href="/admin/staff" className="hover:text-white flex items-center gap-1">
                            <Users size={16} />
                            Staff
                        </Link>
                    )}
                </nav>

                {/* Mobile Toggle */}
                <button onClick={toggleMenu} className="md:hidden text-white">
                    {open ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Mobile Menu */}
            {open && (
                <div className="md:hidden bg-black border-t border-gray-800 px-6 pb-6 space-y-4 text-gray-300">
                    <Link href="/chat" onClick={toggleMenu} className="block bg-lime-500 text-black text-center py-2 rounded font-semibold hover:bg-lime-400">
                        Request Delivery
                    </Link>
                    
                    {/* Staff Links */}
                    {!loading && isStaff && (
                        <Link href="/staff/jobs" onClick={toggleMenu} className="block hover:text-white">
                            Jobs
                        </Link>
                    )}
                    
                    {/* Admin Links */}
                    {!loading && isAdmin && (
                        <Link href="/admin/staff" onClick={toggleMenu} className="block hover:text-white">
                            Staff Management
                        </Link>
                    )}
                </div>
            )}
        </header>
    )
}
