'use client'

import React from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import UnifiedNavbar from '../components/nav/UnifiedNavbar'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <UnifiedNavbar />
      
      <div className="pt-24 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-6xl font-bold mb-6 font-sans">
                             About Zukujet
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Last-mile logistics for mission-critical payloads across automotive, aerospace, aviation, marine, and manufacturing.
            </p>
          </motion.div>

          {/* Mission Section */}
          <motion.div 
            className="mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div 
              className="p-8 md:p-12 rounded-xl relative overflow-hidden"
              style={{
                background: `
                  linear-gradient(to bottom, #ffed00, #e10600, #002f6c),
                  url('/noise.png')
                `,
                backgroundBlendMode: 'hard-light',
                backgroundSize: '100% 100%, 200px 200px'
              }}
            >
              <div className="relative z-10">
                <h2 className="text-3xl font-bold mb-6 font-sans">Our Mission</h2>
                <p className="text-lg text-gray-100 mb-6 leading-relaxed">
                  We operate throughout Southern California, delivering ultra-responsive service powered by AI-driven dispatch and route optimization—with pro drivers and handlers behind the wheel.
                </p>
                <p className="text-lg text-gray-100 leading-relaxed">
                  Ensuring your critical operations never stop.
                </p>
              </div>
            </div>
          </motion.div>

          {/* What We Do */}
          <motion.div 
            className="mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <h2 className="text-3xl font-bold mb-8 text-center font-sans">What We Do</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-white/5 backdrop-blur-sm border border-white/20 p-6 rounded-lg">
                <h3 className="text-xl font-semibold mb-4 text-lime-400 font-sans">Mission-Critical Deliveries</h3>
                <p className="text-gray-300 leading-relaxed">
                                     Specialized logistics for automotive parts, aerospace components, marine equipment, and manufacturing supplies. When operations can&apos;t stop, we deliver.
                </p>
              </div>
              <div className="bg-white/5 backdrop-blur-sm border border-white/20 p-6 rounded-lg">
                <h3 className="text-xl font-semibold mb-4 text-lime-400 font-sans">AI-Powered Dispatch</h3>
                <p className="text-gray-300 leading-relaxed">
                                     Advanced routing algorithms and real-time optimization ensure the most efficient delivery paths across Southern California&apos;s complex logistics landscape.
                </p>
              </div>
              <div className="bg-white/5 backdrop-blur-sm border border-white/20 p-6 rounded-lg">
                <h3 className="text-xl font-semibold mb-4 text-lime-400 font-sans">Professional Handlers</h3>
                <p className="text-gray-300 leading-relaxed">
                  Experienced drivers and handlers trained in specialized cargo protocols. Your payloads are handled with the care they require.
                </p>
              </div>
              <div className="bg-white/5 backdrop-blur-sm border border-white/20 p-6 rounded-lg">
                <h3 className="text-xl font-semibold mb-4 text-lime-400 font-sans">Text-Based Requests</h3>
                <p className="text-gray-300 leading-relaxed">
                  Move payloads by text. Our AI handles the rest, from route optimization to real-time tracking and status updates.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Service Area */}
          <motion.div 
            className="mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <h2 className="text-3xl font-bold mb-8 text-center font-sans">Service Area</h2>
            <div 
              className="p-8 md:p-12 rounded-xl relative overflow-hidden"
              style={{
                background: `
                  linear-gradient(to bottom, #ffed00, #e10600, #002f6c),
                  url('/noise.png')
                `,
                backgroundBlendMode: 'hard-light',
                backgroundSize: '100% 100%, 200px 200px'
              }}
            >
              <div className="relative z-10 text-center">
                <div className="relative w-full h-96 md:h-[30rem] mb-6">
                  <div className="absolute inset-0">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="relative w-full h-full">
                        {/* Map image */}
                        <Image
                          src="/map.png"
                          alt="Service Area Map"
                          fill
                          className="object-contain rounded-xl"
                        />
                        
                        {/* Service area overlay */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="relative">
                            {/* Triangle service area overlay */}
                            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
                              <polygon 
                                points="15,25 85,15 75,70" 
                                fill="rgba(34,197,94,0.2)" 
                                stroke="rgba(34,197,94,0.6)" 
                                strokeWidth="1"
                                className="animate-pulse"
                              />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Company Info */}
          <motion.div 
            className="mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            <h2 className="text-3xl font-bold mb-8 text-center font-sans">Company Information</h2>
            <div className="bg-white/5 backdrop-blur-sm border border-white/20 p-8 rounded-lg">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xl font-semibold mb-4 text-lime-400 font-sans">Contact</h3>
                  <div className="space-y-2 text-gray-300">
                    <p><strong>Address:</strong> 201 E Center St, Anaheim, CA 92805</p>
                    <p><strong>Phone:</strong> (877) 684-5729</p>
                    <p><strong>Email:</strong> support@zukujet.com</p>
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-4 text-lime-400 font-sans">Business Hours</h3>
                  <div className="space-y-2 text-gray-300">
                    <p><strong>Monday - Friday:</strong> 6:00 AM - 10:00 PM</p>
                    <p><strong>Saturday:</strong> 8:00 AM - 8:00 PM</p>
                    <p><strong>Sunday:</strong> 9:00 AM - 6:00 PM</p>
                    <p><strong>Emergency:</strong> 24/7 for critical deliveries</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* The Name */}
          <motion.div 
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.0 }}
          >
            <div 
              className="p-8 md:p-12 rounded-xl relative overflow-hidden"
              style={{
                background: `
                  linear-gradient(to bottom, #ffed00, #e10600, #002f6c),
                  url('/noise.png')
                `,
                backgroundBlendMode: 'hard-light',
                backgroundSize: '100% 100%, 200px 200px'
              }}
            >
              <div className="relative z-10">
                <p className="text-xl text-gray-100 mb-4">
                  Ganbatte <span className="inline-block align-middle">(頑張って)</span>
                </p>
                <p className="text-lg text-gray-200">
                  Means &ldquo;do your best&rdquo; in Japanese. It represents our commitment to excellence in every delivery.
                </p>
              </div>

            </div>
          </motion.div>
        </div>
      </div>

      {/* FOOTER */}
      <section className="flex flex-col justify-center items-center mt-[12rem] px-6 py-8 text-center">
        <div className="w-full max-w-3xl mx-auto">
          {/* Logo Row */}

          {/* Social Links with Turbo Home Image */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-1 mb-2">
            <div className="flex justify-center items-center">
              <Image
                src="/turbo_home.webp"
                alt="Turbo Home"
                width={300}
                height={200}
                className="w-auto h-32 drop-shadow-2xl"
              />
            </div>
            <div className="space-y-4 font-sans">
              <h3 className="text-xl font-bold text-lime-400 drop-shadow-lg font-sans">Support</h3>
              <div className="space-y-2">
                <a href="mailto:support@zukujet.com" className="block text-lime-400 hover:text-white transition-colors font-sans">Contact Us</a>
                <a href="#" className="block text-lime-400 hover:text-white transition-colors font-sans">Help Center</a>
                <a href="#" className="block text-lime-400 hover:text-white transition-colors font-sans">FAQ</a>
                <a href="/shop/sticker" className="block text-lime-400 hover:text-white transition-colors font-sans">Buy a Bumper Sticker</a>
              </div>
            </div>
          
            
            <div className="space-y-4 font-sans">
              <h3 className="text-xl font-bold text-lime-400 drop-shadow-lg font-sans">Company</h3>
              <div className="space-y-2">
                <a href="/about" className="block text-lime-400 hover:text-white transition-colors font-sans">About</a>
                <a href="https://www.instagram.com/zukujet" className="block text-lime-400 hover:text-white transition-colors font-sans">Instagram</a>
                <a href="/privacy" className="block text-lime-400 hover:text-white transition-colors font-sans">Privacy Policy</a>
                <a href="/terms" className="block text-lime-400 hover:text-white transition-colors font-sans">Terms of Service</a>
                <a href="/driver" className="block text-lime-400 hover:text-white transition-colors font-sans">Join the Team</a>
              </div>
            </div>
          </div>
          
          {/* Copyright */}
          <div className="border-gray-700 pt-[10rem]">
            <p className="text-sm text-lime-400 font-sans">
                             &copy; {new Date().getFullYear()} Zukujet, All Rights Reserved
            </p>
          </div>
        </div>
      </section>
    </div>
  )
} 