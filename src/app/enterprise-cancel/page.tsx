'use client'

import { motion } from 'framer-motion'
import { XCircle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import UnifiedNavbar from '../components/nav/UnifiedNavbar'

export default function EnterpriseCancelPage() {
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
            <XCircle className="w-24 h-24 text-red-500 mx-auto mb-6" />
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Subscription Cancelled
            </h1>
            <p className="text-xl text-gray-300 mb-8">
              You cancelled the enterprise subscription process. 
              No charges were made to your account.
            </p>
          </div>

          <div className="bg-gray-900/50 rounded-xl p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4">Need Help?</h2>
            <p className="text-gray-300 mb-4">
              If you have any questions about our enterprise plans or need assistance, 
              please don&apos;t hesitate to reach out to our team.
            </p>
            <p className="text-gray-300">
              You can also review our enterprise plans again and try the subscription process when you&apos;re ready.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/enterprise"
              className="inline-flex items-center justify-center bg-[#7fff00] text-black font-semibold pt-8 px-8 py-4 rounded-lg text-lg transition-all duration-300 hover:bg-[#7fff00]/90 hover:shadow-lg hover:shadow-[#7fff00]/25"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Enterprise Plans
            </Link>
            <Link
              href="/chat"
              className="inline-flex items-center justify-center bg-gray-700 text-white font-semibold px-8 py-4 rounded-lg text-lg transition-all duration-300 hover:bg-gray-600"
            >
              Try Regular Delivery
            </Link>
          </div>
        </motion.div>
      </div>
    </main>
  )
} 