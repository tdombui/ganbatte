'use client'

import React, { Suspense } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import UnifiedNavbar from '../../../components/nav/UnifiedNavbar'
import { useSearchParams } from 'next/navigation'

function StickerSuccessContent() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')

  return (
    <div className="pt-16 px-6">
      <div className="max-w-2xl mx-auto text-center">
        <motion.div 
          className="space-y-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Success Icon */}
          <motion.div 
            className="mx-auto w-24 h-24 bg-lime-400 rounded-full flex items-center justify-center"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <svg className="w-12 h-12 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </motion.div>

          {/* Success Message */}
          <motion.div 
            className="space-y-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold font-sans">
              Thank You!
            </h1>
            <p className="text-xl text-gray-300">
              Your GanbattePM bumper sticker order has been confirmed.
            </p>
          </motion.div>

          {/* Order Details */}
          <motion.div 
            className="bg-white/5 backdrop-blur-sm border border-white/20 p-6 rounded-xl space-y-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <h2 className="text-2xl font-semibold font-sans">Order Details</h2>
            <div className="text-left space-y-2 text-gray-300">
              <p><span className="font-medium">Product:</span> GanbattePM Bumper Sticker</p>
              <p><span className="font-medium">Status:</span> <span className="text-lime-400">Confirmed</span></p>
              {sessionId && (
                <p><span className="font-medium">Order ID:</span> {sessionId}</p>
              )}
              <p><span className="font-medium">Shipping:</span> 2-3 business days</p>
            </div>
          </motion.div>

          {/* Next Steps */}
          <motion.div 
            className="space-y-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            <h3 className="text-xl font-semibold font-sans">What&apos;s Next?</h3>
            <div className="text-gray-300 space-y-2">
              <p>• You&apos;ll receive a confirmation email shortly</p>
              <p>• Your sticker will ship within 2-3 business days</p>
              <p>• Track your order with the email we&apos;ll send you</p>
            </div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div 
            className="flex flex-col sm:flex-row gap-4 justify-center pt-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.0 }}
          >
            <Link
              href="/"
              className="inline-block bg-lime-400 hover:bg-lime-300 text-black font-semibold px-8 py-3 rounded-lg text-lg transition drop-shadow-xl border-2 border-transparent hover:border-lime-300 hover:shadow-[0_0_20px_rgba(34,197,94,.7)]"
            >
              Back to Home
            </Link>
            <Link
              href="/shop/sticker"
              className="inline-block bg-white/10 hover:bg-white/20 text-white font-semibold px-8 py-3 rounded-lg text-lg transition drop-shadow-xl border-2 border-white/20 hover:border-white/40"
            >
              Buy Another
            </Link>
          </motion.div>

          {/* Support Info */}
          <motion.div 
            className="pt-8 text-sm text-gray-400"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.2 }}
          >
            <p>
              Questions about your order? Contact us at{' '}
              <a href="mailto:support@ganbattepm.com" className="text-lime-400 hover:text-lime-300">
                support@ganbattepm.com
              </a>
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}

export default function StickerSuccessPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <UnifiedNavbar />
      <Suspense fallback={<div className="pt-16 px-6 text-center">Loading...</div>}>
        <StickerSuccessContent />
      </Suspense>
    </main>
  )
} 