'use client'

import { motion } from 'framer-motion'
import { CheckCircle, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import UnifiedNavbar from '../../components/nav/UnifiedNavbar'

function EnterpriseSuccessPageContent() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')

  return (
    <main className="min-h-screen bg-black text-white">
      <UnifiedNavbar />
      
      <section className="flex flex-col items-center justify-center px-6 py-16 min-h-screen">
        <motion.div 
          className="max-w-2xl mx-auto text-center"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* Success Icon */}
          <motion.div
            className="flex justify-center mb-8"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="w-24 h-24 bg-[#7fff00] rounded-full flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-black" />
            </div>
          </motion.div>

          {/* Success Message */}
          <motion.h1 
            className="text-4xl md:text-5xl font-bold mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            Welcome to Enterprise!
          </motion.h1>

          <motion.p 
            className="text-xl text-gray-300 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            Your subscription has been successfully activated. You now have access to your enterprise plan and tokens.
          </motion.p>

          {/* Session ID */}
          {sessionId && (
            <motion.div 
              className="bg-gray-900/50 rounded-lg p-4 mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
            >
              <p className="text-sm text-gray-400 mb-2">Session ID:</p>
              <p className="text-xs text-gray-500 font-mono break-all">{sessionId}</p>
            </motion.div>
          )}

          {/* Next Steps */}
          <motion.div 
            className="space-y-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <h2 className="text-2xl font-semibold mb-4">What's Next?</h2>
            
            <div className="space-y-3 text-left">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-[#7fff00] rounded-full flex items-center justify-center mt-1">
                  <span className="text-black text-sm font-bold">1</span>
                </div>
                <div>
                  <p className="font-semibold">Check Your Email</p>
                  <p className="text-gray-400 text-sm">We've sent you a welcome email with your account details and next steps.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-[#7fff00] rounded-full flex items-center justify-center mt-1">
                  <span className="text-black text-sm font-bold">2</span>
                </div>
                <div>
                  <p className="font-semibold">Start Using Your Tokens</p>
                  <p className="text-gray-400 text-sm">Text us your delivery needs and we'll automatically use your tokens.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-[#7fff00] rounded-full flex items-center justify-center mt-1">
                  <span className="text-black text-sm font-bold">3</span>
                </div>
                <div>
                  <p className="font-semibold">Access Your Dashboard</p>
                  <p className="text-gray-400 text-sm">View your token usage, delivery history, and account settings.</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div 
            className="flex flex-col sm:flex-row gap-4 mt-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
          >
            <Link
              href="/jobs"
              className="inline-flex items-center justify-center bg-[#7fff00] text-black font-semibold px-8 py-3 rounded-lg hover:bg-[#7fff00]/90 transition-all duration-300"
            >
              View Your Jobs
              <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
            
            <Link
              href="/enterprise"
              className="inline-flex items-center justify-center bg-gray-700 text-white font-semibold px-8 py-3 rounded-lg hover:bg-gray-600 transition-all duration-300"
            >
              Back to Enterprise
            </Link>
          </motion.div>
        </motion.div>
      </section>
    </main>
  )
}

export default function EnterpriseSuccessPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EnterpriseSuccessPageContent />
    </Suspense>
  )
}