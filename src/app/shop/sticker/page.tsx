'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { useAuthContext } from '../../providers'
import UnifiedNavbar from '../../components/nav/UnifiedNavbar'
import { createClient } from '../../../lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function StickerProductPage() {
  const { isAuthenticated } = useAuthContext()
  const router = useRouter()
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [quantity, setQuantity] = useState(1)

  const handlePurchase = async () => {
    setPaymentLoading(true)
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        alert('Please sign in to purchase the bumper sticker.')
        router.push('/auth?redirectTo=/shop/sticker')
        return
      }

      // Calculate total amount (sticker is $20 each)
      const amount = quantity * 20

      // Create payment link
      const res = await fetch('/api/payment-links/create', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          amount: amount,
                     description: `Zukujet Bumper Sticker${quantity > 1 ? ` (${quantity}x)` : ''}`,
          metadata: { 
            product: 'bumper_sticker',
            quantity: quantity.toString(),
            type: 'merchandise'
          }
        }),
      })

      if (res.ok) {
        const data = await res.json()
        // Redirect to Stripe payment link
        window.location.href = data.paymentLink.url
      } else {
        const errorData = await res.json()
        alert('Failed to create payment link: ' + (errorData.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error creating payment link:', error)
      alert('Error creating payment link. Please try again.')
    } finally {
      setPaymentLoading(false)
    }
  }

  const handleSignInAndPurchase = () => {
    router.push('/auth?redirectTo=/shop/sticker')
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <UnifiedNavbar />
      
      <div className="pt-[10rem] px-6 font-sans">
        <div className="max-w-4xl mx-auto">
          {/* Product Image - Centered */}
          <motion.div 
            className="flex justify-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="relative p-2 rounded-xl overflow-hidden max-w-2xl">
              <Image
                src="/gradient_box_logo_4.webp"
                                 alt="Zukujet Bumper Sticker"
                width={800}
                height={350}
                className="w-full h-auto object-contain drop-shadow-2xl"
                priority
                unoptimized
                quality={100}
              />
            </div>
          </motion.div>

          {/* Product Details - Half Width with Gradient Background */}
          <motion.div 
            className="max-w-md mx-auto p-8 rounded-xl"
            style={{
              background: `
                linear-gradient(to bottom, #ffed00, #e10600, #002f6c),
                url('/noise.png')
              `,
              backgroundBlendMode: 'hard-light',
              backgroundSize: '100% 100%, 200px 200px'
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
                         <h1 className="text-2xl font-bold text-blue-900 drop-shadow-2xl">Zukujet Bumper Sticker</h1>
            {/* Price and Quantity on same line */}
            <div className="grid grid-cols-2 gap-18 mb-4 p-6">
              <div className="flex items-center justify-center">
                <div className="text-4xl font-bold bg-black/30 px-2 py-1.5 backdrop-blur-xl border border-white/20 rounded-lg text-lime-400 drop-shadow-2xl">
                  $20.00
                </div>
              </div>
              <div className="flex flex-col items-center justify-center">
                <label className="block text-md font-medium text-white mb-2 drop-shadow-lg">
                  Quantity
                </label>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-6 h-6 rounded-lg bg-black/30 hover:bg-black/40 border border-white/30 flex items-center justify-center transition-colors text-sm font-bold"
                  >
                    -
                  </button>
                  <span className="text-lg font-bold min-w-[2rem] text-center text-white drop-shadow-lg">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-6 h-6 rounded-lg bg-black/30 hover:bg-black/40 border border-white/30 flex items-center justify-center transition-colors text-sm font-bold"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Features in 2 columns */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="space-y-2">
                <div className="flex items-center">
                  <span className="text-lime-400 mr-2">✓</span>
                  <span className="text-md text-gray-100">UV-resistant vinyl</span>
                </div>
                <div className="flex items-center">
                  <span className="text-lime-400 mr-2">✓</span>
                  <span className="text-md text-gray-100">Reflective</span>
                </div>
              </div>
              <div className="space-y-2">
              <div className="flex items-center">
                  <span className="text-lime-400 mr-2">✓</span>
                  <span className="text-md text-gray-100">11&quot; × 3.3&quot;</span>
                </div>
                <div className="flex items-center">
                  <span className="text-lime-400 mr-2">✓</span>
                  <span className="text-md text-gray-100">Free shipping</span>
                </div>

              </div>
            </div>

            {/* Purchase Button */}
            <div>
              {isAuthenticated ? (
                <button
                  onClick={handlePurchase}
                  disabled={paymentLoading}
                  className="w-full bg-lime-400 hover:bg-lime-300 disabled:bg-gray-600 text-black font-semibold px-8 py-4 rounded-lg text-lg transition drop-shadow-xl border-2 border-transparent hover:border-lime-300 hover:shadow-[0_0_20px_rgba(34,197,94,.7)] disabled:cursor-not-allowed"
                >
                  {paymentLoading ? 'Processing...' : 'Buy Now'}
                </button>
              ) : (
                <button
                  onClick={handleSignInAndPurchase}
                  className="w-full bg-lime-400 hover:bg-lime-300 text-black font-semibold px-8 py-4 rounded-lg text-lg transition drop-shadow-xl border-2 border-transparent hover:border-lime-300 hover:shadow-[0_0_20px_rgba(34,197,94,.7)]"
                >
                  Sign In to Purchase
                </button>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Horizontal Rule */}
      <div className="max-w-4xl mx-auto px-6 mt-[12rem]">
        <hr className="border-lime-400/50" />
      </div>

      {/* FOOTER */}
      <section className=" flex flex-col justify-center items-center mt-[10rem] px-6 py-8 text-center">
        <div className="w-full max-w-3xl mx-auto">

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
              </div>
            </div>
          
            
            <div className="space-y-4 font-sans">
              <h3 className="text-xl font-bold text-lime-400 drop-shadow-lg font-sans">Company</h3>
              <div className="space-y-2">
                <a href="/about" className="block text-lime-400 hover:text-white transition-colors font-sans">About</a>
                <a href="https://www.instagram.com/zukujet" className="block text-lime-400 hover:text-white transition-colors font-sans">Instagram</a>
                <a href="/privacy" className="block text-lime-400 hover:text-white transition-colors font-sans">Privacy Policy</a>
                <a href="/terms" className="block text-lime-400 hover:text-white transition-colors font-sans">Terms of Service</a>
              </div>
            </div>
          </div>
          
          {/* Copyright */}
          <div className=" border-gray-700 pt-[10rem]">
            <p className="text-sm text-lime-400 font-sans">
                             &copy; {new Date().getFullYear()} Zukujet, All Rights Reserved
            </p>
          </div>
        </div>
      </section>
    </main>
  )
} 