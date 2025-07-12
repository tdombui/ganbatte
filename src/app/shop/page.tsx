'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import UnifiedNavbar from '../components/nav/UnifiedNavbar'

export default function ShopPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <UnifiedNavbar />
      
      <div className="pt-16 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Shop Header */}
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-6xl font-bold mb-4 font-sans">
                             Zukujet Shop
            </h1>
            <p className="text-xl text-gray-300 mb-8">
              Official merchandise from the payload movers
            </p>
          </motion.div>

          {/* Products Grid */}
          <motion.div 
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {/* Bumper Sticker Product Card */}
            <motion.div 
              className="bg-white/5 backdrop-blur-sm border border-white/20 rounded-xl overflow-hidden hover:bg-white/10 transition-all duration-300 hover:shadow-[0_0_20px_rgba(255,255,255,0.1)]"
              whileHover={{ y: -5, scale: 1.02 }}
            >
              <div className="relative p-6"
                style={{
                  background: `
                    linear-gradient(to bottom, #ffed00, #e10600, #002f6c),
                    url('/noise.png')
                  `,
                  backgroundBlendMode: 'hard-light',
                  backgroundSize: '100% 100%, 200px 200px'
                }}
              >
                <Image
                  src="/gradient_box_logo_4.webp"
                                     alt="Zukujet Bumper Sticker"
                  width={300}
                  height={150}
                  className="w-full h-auto object-contain drop-shadow-2xl"
                  priority
                  unoptimized
                  quality={100}
                />
              </div>
              
              <div className="p-6 space-y-4">
                <h3 className="text-xl font-semibold font-sans">
                                     Zukujet Bumper Sticker
                </h3>
                <p className="text-gray-300 text-sm">
                                     High-quality vinyl bumper sticker featuring the iconic Zukujet logo
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-lime-400">
                    $10.00
                  </span>
                  <Link
                    href="/shop/sticker"
                    className="bg-lime-400 hover:bg-lime-300 text-black font-semibold px-4 py-2 rounded-lg text-sm transition drop-shadow-xl border-2 border-transparent hover:border-lime-300 hover:shadow-[0_0_20px_rgba(34,197,94,.7)]"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            </motion.div>

            {/* Coming Soon Card */}
            <motion.div 
              className="bg-white/5 backdrop-blur-sm border border-white/20 rounded-xl overflow-hidden opacity-60"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 0.6, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <div className="p-6 h-full flex flex-col justify-center items-center text-center">
                <div className="w-24 h-24 bg-gray-600 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold font-sans mb-2">
                  More Coming Soon
                </h3>
                <p className="text-gray-400 text-sm">
                  We&apos;re working on more merchandise. Stay tuned!
                </p>
              </div>
            </motion.div>
          </motion.div>

          {/* Shop Info */}
          <motion.div 
            className="mt-16 text-center space-y-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <h2 className="text-2xl font-semibold font-sans">About Our Merchandise</h2>
            <p className="text-gray-300 max-w-2xl mx-auto">
                             All our products are made with premium materials and feature the iconic Zukujet branding. 
              Show your support for the payload movers with official merchandise.
            </p>
          </motion.div>
        </div>
      </div>
    </main>
  )
} 