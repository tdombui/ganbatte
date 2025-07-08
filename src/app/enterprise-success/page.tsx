'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import UnifiedNavbar from '../components/nav/UnifiedNavbar'

export default function EnterpriseSuccessPage() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // You could verify the session here if needed
    setLoading(false)
  }, [])

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white">
        <UnifiedNavbar />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7fff00] mx-auto mb-4"></div>
            <p>Verifying your subscription...</p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <UnifiedNavbar />
      
      <div className="min-h-screen flex items-center justify-center px-6">
        <motion.div 
          className="max-w-2xl mx-auto text-center"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="mb-8">
            <CheckCircle className="w-24 h-24 text-[#7fff00] mx-auto mb-6" />
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Welcome to Enterprise!
            </h1>
            <p className="text-xl text-gray-300 mb-8">
              Your enterprise subscription has been activated successfully. 
              You now have access to your monthly tokens and all enterprise features.
            </p>
          </div>

          <div className="bg-gray-900/50 rounded-xl p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4">What&apos;s Next?</h2>
            <ul className="text-left space-y-3 text-gray-300">
              <li className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-[#7fff00] mt-0.5 flex-shrink-0" />
                <span>Your tokens are now available for deliveries</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-[#7fff00] mt-0.5 flex-shrink-0" />
                <span>Start requesting deliveries through our chat system</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-[#7fff00] mt-0.5 flex-shrink-0" />
                <span>Track your token usage in your dashboard</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-[#7fff00] mt-0.5 flex-shrink-0" />
                <span>Your subscription will automatically renew monthly</span>
              </li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/chat"
              className="inline-flex items-center justify-center bg-[#7fff00] text-black font-semibold px-8 py-4 rounded-lg text-lg transition-all duration-300 hover:bg-[#7fff00]/90 hover:shadow-lg hover:shadow-[#7fff00]/25"
            >
              Start Your First Delivery
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
            <Link
              href="/jobs"
              className="inline-flex items-center justify-center bg-gray-700 text-white font-semibold px-8 py-4 rounded-lg text-lg transition-all duration-300 hover:bg-gray-600"
            >
              View Your Jobs
            </Link>
          </div>
        </motion.div>
      </div>
    </main>
  )
} 