'use client'

import Link from 'next/link'
import Image from 'next/image'
import { MessageCircle, ClockAlert, PackageCheck } from 'lucide-react'
import React from 'react'
import { useAuthContext } from './providers'
import UnifiedNavbar from './components/nav/UnifiedNavbar'
import { createClient } from '../lib/supabase/client'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'

export default function HomePage() {
  const { user, loading, isAuthenticated, isCustomer, isStaff, isAdmin } = useAuthContext()
  const router = useRouter()

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
    <main className="h-screen overflow-y-scroll scroll-smooth bg-black text-white">
      {/* Use the UnifiedNavbar component */}
      <UnifiedNavbar />

      {/* HERO */}
      <section className="min-h-screen flex flex-col items-center px-6 text-center space-y-0 relative pt-16 md:pt-24 pb-48">
        {/* Outer wrapper container */}
        <motion.div 
          className="w-full max-w-6xl mx-auto p-8 md:p-12 rounded-xl relative overflow-hidden mt-12 md:mt-20 mb-16 flex-1 flex flex-col justify-center"
          style={{
            background: `
              linear-gradient(to bottom, #ffed00, #e10600, #002f6c),
              url('/noise.png')
            `,
            backgroundBlendMode: 'overlay',
            backgroundSize: '100% 100%, 200px 200px'
          }}
        >
          <motion.h2 
            className="text-7xl md:text-8xl sm:text-5xl font-bold font-sans tracking-tight drop-shadow-2xl mb-8"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            The Payload Movers
          </motion.h2>
          
          <motion.p 
            className="text-xl md:text-xl mb-8 max-w-3xl mx-auto  "
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            Last-mile logistics for mission-critical payloads in automotive,
            aerospace, aviation, marine, and manufacturing.
            <br />
            <br />
            Move payloads by text. AI handles the rest.
          </motion.p>
          
          {/* Welcome message for authenticated users */}
          {!loading && isAuthenticated && (
            <motion.div 
              className="mb-6 p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <p className="text-white font-medium font-sans">
                Welcome back, {user?.full_name}! 
                {isCustomer && ' Ready to move a payload?'}
                {isStaff && ' Ready to manage jobs?'}
                {isAdmin && ' Ready to manage the system?'}
              </p>
            </motion.div>
          )}
          
          <motion.div 
            className="flex flex-col sm:flex-row gap-4 justify-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            {isAuthenticated ? (
              <>
                <button
                  onClick={() => verifySessionAndNavigate(isCustomer ? "/chat" : (isStaff || isAdmin ? "/staff/jobs" : "/jobs"))}
                  className="inline-block bg-lime-400 hover:bg-lime-400 text-black font-semibold px-6 py-3 rounded-lg text-lg transition drop-shadow-xl border-2 border-transparent hover:border-lime-300 hover:shadow-[0_0_20px_rgba(34,197,94,.7)] hover:shadow-lime-400/50 font-sans"
                >
                  {isCustomer ? 'Request Delivery →' : 'View Jobs →'}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => verifySessionAndNavigate("/chat")}
                  className="inline-block bg-lime-400 hover:bg-lime-400 text-black font-semibold px-6 py-3 rounded-lg text-lg transition drop-shadow-xl border-2 border-transparent hover:border-lime-300 hover:shadow-[0_0_20px_rgba(34,197,94,.7)] hover:shadow-lime-400/50"
                >
                  Request Delivery →
                </button>
                <Link
                  href="/auth"
                  className="inline-block bg-white/10 hover:bg-white/20 text-white font-semibold px-6 py-3 rounded-lg text-lg transition drop-shadow-xl border-2 border-white/20 hover:border-white/40"
                >
                  Sign In
                </Link>
              </>
            )}
          </motion.div>
        </motion.div>
      </section>

      {/* FEATURES */}
      <section id="features" className="font-sans min-h-screen flex flex-col justify-center px-6 py-8">
        <h2 className="text-5xl md:text-6xl font-bold text-white drop-shadow-2xl mb-8 text-center font-sans">Why GanbattePM?</h2>
        <div className="w-full max-w-6xl mx-auto p-8 md:p-2 rounded-xl relative overflow-hidden">
          <div 
            className="w-full h-full p-8 md:p-12 rounded-xl relative"
            style={{
              background: `
                linear-gradient(to bottom, #ffed00, #e10600, #002f6c),
                url('/noise.png')
              `,
              backgroundBlendMode: 'hard-light',
              backgroundSize: '100% 100%, 200px 200px'
            }}
          >
            <div className="max-w-6xl mx-auto relative z-10 font-sans">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 text-left">
                <Feature
                  title="Request Deliveries By Text"
                  icon={MessageCircle}
                  desc="Simply ask, and we deliver. Immediate responses, and seamless coordination." />
                <Feature
                  title="Track Orders in Real Time"
                  icon={ClockAlert}
                  desc="Track your orders with live routing to make sure deliveries are en route and on-time." />
                <Feature
                  title="Smarter Delivery"
                  icon={PackageCheck}
                  desc="Dispatch and routes streamlined by AI. Mission-critical deliveries with pro drivers behind the wheel." />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* IMPACT */}
      <section className="font-sans min-h-screen flex flex-col justify-center px-6 py-8">
        <h2 className="text-5xl md:text-6xl font-bold text-white drop-shadow-2xl mb-8 text-center font-sans">Our Spec Sheet</h2>
        <p className="text-gray-100 text-lg drop-shadow-lg max-w-3xl mx-auto mb-8 text-center font-sans">
          Trusted by leading automotive shops, marine, and manufacturing companies throughout Southern California. Every payload counts when operations can&apos;t stop.
        </p>
        <div className="w-full max-w-6xl mx-auto p-8 md:p-2 rounded-xl relative overflow-hidden">
          <div 
            className="w-full h-full p-8 md:p-12 rounded-xl relative"
            style={{
              background: `
                linear-gradient(to bottom, #ffed00, #e10600, #002f6c),
                url('/noise.png')
              `,
              backgroundBlendMode: 'hard-light',
              backgroundSize: '100% 100%, 200px 200px'
            }}
          >
            <div className="max-w-6xl mx-auto relative z-10 font-sans">
              <div className="grid grid-cols-2 gap-6 md:gap-8 text-center">
                {[
                  { number: "2,200+", label: "Kilograms Moved", description: "Mission-critical payloads delivered" },
                  { number: "250+", label: "Trips Completed", description: "Successful deliveries across SoCal" },
                  { number: "15+", label: "Happy Clients", description: "From automotive to manufacturing" },
                  { number: "25,000+", label: "Miles Driven", description: "Optimized routes across the region" }
                ].map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    whileHover={{ y: -5, scale: 1.02 }}
                  >
                    <StatCard
                      number={stat.number}
                      label={stat.label}
                      description={stat.description}
                    />
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PAYLOADS */}
      <section className="min-h-screen flex flex-col items-center justify-center px-6 py-8 font-sans">
        <motion.h2 
          className="text-5xl md:text-6xl font-bold text-white drop-shadow-2xl mb-4 text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          Move Payloads
        </motion.h2>
        <motion.p 
          className="text-gray-100 mb-8 drop-shadow-lg text-center max-w-2xl"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
        >
          From brake kits to bolt-on turbos and wheelsets, we move the parts that keep your projects in motion.
        </motion.p>
        <motion.div 
          className="w-full max-w-6xl mx-auto p-8 md:p-2 rounded-xl relative overflow-hidden bg-black/80 backdrop-blur-sm"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
        >
          <div className="max-w-6xl mx-auto text-center relative z-10 font-sans">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {[
                { src: "/payloads/brake.webp", gradientType: "top", mobileGradientType: "top" },
                { src: "/payloads/wheel.webp", gradientType: "top", mobileGradientType: "top" },
                { src: "/payloads/tire.webp", gradientType: "top", mobileGradientType: "middle" },
                { src: "/payloads/coilover.webp", gradientType: "bottom", mobileGradientType: "middle" },
                { src: "/payloads/turbo.webp", gradientType: "bottom", mobileGradientType: "bottom" },
                { src: "/payloads/bumper.webp", gradientType: "bottom", mobileGradientType: "bottom" }
              ].map((payload, index) => (
                <motion.div
                  key={payload.src}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.6 + index * 0.1 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -5, scale: 1.02 }}
                >
                  <PayloadCard
                    src={payload.src}
                    gradientType={payload.gradientType}
                    mobileGradientType={payload.mobileGradientType}
                  />
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      {/* ENTERPRISE */}
      <section id="enterprise" className="min-h-screen flex flex-col items-center justify-center px-6 py-8 font-sans">
        <motion.h2 
          className="text-5xl md:text-6xl font-bold text-white drop-shadow-2xl mb-4 text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          Enterprise Logistics
        </motion.h2>
        <motion.p 
          className="text-gray-100 mb-8 drop-shadow-lg text-center max-w-2xl"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
        >
          Scale your operations with dedicated last-mile logistics infrastructure and priority support.
        </motion.p>
        <motion.div 
          className="w-full max-w-6xl mx-auto p-8 md:p-2 rounded-xl relative overflow-hidden"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
        >
          <div 
            className="w-full h-full p-8 md:p-12 rounded-xl relative"
            style={{
              background: `
                linear-gradient(to bottom, #ffed00, #e10600, #002f6c),
                url('/noise.png')
              `,
              backgroundBlendMode: 'hard-light',
              backgroundSize: '100% 100%, 200px 200px'
            }}
          >
            <div className="max-w-6xl mx-auto text-center relative z-10 font-sans">
              <div className="grid md:grid-cols-2 gap-8">
                {[
                  {
                    title: "Dedicated Fleet",
                    description: "Reserved vehicles and drivers for your exclusive use, ensuring consistent availability and reliability."
                  },
                  {
                    title: "Priority Service",
                    description: "24/7 dedicated account management and priority routing for mission-critical deliveries."
                  },
                  {
                    title: "Custom Integration",
                    description: "API access and custom integrations with your existing logistics and inventory systems."
                  },
                  {
                    title: "Volume Discounts",
                    description: "Competitive pricing for high-volume operations with guaranteed capacity and service levels."
                  }
                ].map((feature, index) => (
                  <motion.div
                    key={feature.title}
                    className="bg-black/80 backdrop-blur-sm border border-white/20 p-6 rounded-lg text-left hover:bg-black/65 transition-all duration-300 hover:shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                    initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.6 + index * 0.1 }}
                  viewport={{ once: true }}
                    whileHover={{ y: -5, scale: 1.02 }}
                >
                    <h3 className="text-2xl font-semibold mb-4 text-white drop-shadow-lg font-sans">{feature.title}</h3>
                    <p className="text-gray-200 drop-shadow-lg font-sans">{feature.description}</p>
                  </motion.div>
              ))}
            </div>
              <div className="mt-8">
                <a href="/enterprise" className="inline-block bg-lime-400 hover:bg-lime-300 text-black font-semibold px-8 py-4 rounded-lg text-lg transition drop-shadow-xl border-2 border-transparent hover:border-lime-300 hover:shadow-[0_0_20px_rgba(34,197,94,0.5)]">
                  See Enterprise Plans  →
                </a>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="min-h-screen flex flex-col items-center justify-center px-6 py-8 font-sans ">
        <motion.h2 
          className="text-5xl md:text-6xl font-bold text-white drop-shadow-2xl mb-4 text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          Simple, Transparent Pricing
        </motion.h2>
        <motion.p 
          className="text-gray-100 mb-8 drop-shadow-lg text-center max-w-2xl"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
        >
          Built for mission-critical, speciality jobs. No hidden fees, no surprises.
        </motion.p>
        <motion.div 
          className="w-full max-w-6xl mx-auto p-8 md:p-2 rounded-xl relative overflow-hidden"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
        >
          <div 
            className="w-full h-full p-8 md:p-12 rounded-xl relative"
            style={{
              background: `
                linear-gradient(to bottom, #ffed00, #e10600, #002f6c),
                url('/noise.png')
              `,
              backgroundBlendMode: 'hard-light',
              backgroundSize: '100% 100%, 200px 200px'
            }}
          >
            <div className="max-w-6xl mx-auto text-center relative z-10 font-sans">
              <div className="grid md:grid-cols-3 gap-6">
                {[
                  { title: "Base Rate", price: "$30", description: "Flat fee per delivery" },
                  { title: "Per Mile", price: "$1.25", description: "Calculated by optimized route" },
                  { title: "Per Item", price: "$0.50 per extra lb", description: "First 50lbs are free" },
                  { title: "Priority Delivery", price: "$100", description: "Priority routing for urgent jobs" },
                  { title: "Nights & Weekends", price: "$25", description: "For Delivery after standard hours" },
                  { title: "Discounts", price: "Up to 25% off", description: "For jobs scheduled 24h+ in advance" }
                ].map((card, index) => (
                  <motion.div
                    key={card.title}
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.6 + index * 0.1 }}
                    viewport={{ once: true }}
                    whileHover={{ y: -5, scale: 1.02 }}
                  >
                    <PriceCard
                      title={card.title}
                      price={card.price}
                      description={card.description}
                    />
                  </motion.div>
                ))}
              </div>
              <p className="text-sm text-gray-200 mt-8 drop-shadow-lg font-sans">Need recurring logistics support? <a href="mailto:support@ganbattepm.com" className="underline">Contact us</a>.</p>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ENTERPRISE */}
      <section id="enterprise" className="min-h-screen flex flex-col items-center justify-center px-6 py-8 font-sans">
        <motion.h2 
          className="text-5xl md:text-6xl font-bold text-white drop-shadow-2xl mb-4 text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          Enterprise Logistics
        </motion.h2>
        <motion.p 
          className="text-gray-100 mb-8 drop-shadow-lg text-center max-w-2xl"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
        >
          Scale your operations with dedicated last-mile logistics infrastructure and priority support.
        </motion.p>
        <motion.div 
          className="w-full max-w-6xl mx-auto p-8 md:p-2 rounded-xl relative overflow-hidden"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
        >
          <div 
            className="w-full h-full p-8 md:p-12 rounded-xl relative"
            style={{
              background: `
                linear-gradient(to bottom, #ffed00, #e10600, #002f6c),
                url('/noise.png')
              `,
              backgroundBlendMode: 'hard-light',
              backgroundSize: '100% 100%, 200px 200px'
            }}
          >
            <div className="max-w-6xl mx-auto text-center relative z-10 font-sans">
              <div className="grid md:grid-cols-2 gap-8">
                {[
                  {
                    title: "Dedicated Fleet",
                    description: "Reserved vehicles and drivers for your exclusive use, ensuring consistent availability and reliability."
                  },
                  {
                    title: "Priority Service",
                    description: "24/7 dedicated account management and priority routing for mission-critical deliveries."
                  },
                  {
                    title: "Custom Integration",
                    description: "API access and custom integrations with your existing logistics and inventory systems."
                  },
                  {
                    title: "Volume Discounts",
                    description: "Competitive pricing for high-volume operations with guaranteed capacity and service levels."
                  }
                ].map((feature, index) => (
                  <motion.div
                    key={feature.title}
                    className="bg-black/80 backdrop-blur-sm border border-white/20 p-6 rounded-lg text-left hover:bg-black/65 transition-all duration-300 hover:shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.6 + index * 0.1 }}
                    viewport={{ once: true }}
                    whileHover={{ y: -5, scale: 1.02 }}
                  >
                    <h3 className="text-2xl font-semibold mb-4 text-white drop-shadow-lg font-sans">{feature.title}</h3>
                    <p className="text-gray-200 drop-shadow-lg font-sans">{feature.description}</p>
                  </motion.div>
                ))}
              </div>
              <div className="mt-8">
                <a href="/enterprise" className="inline-block bg-lime-400 hover:bg-lime-300 text-black font-semibold px-8 py-4 rounded-lg text-lg transition drop-shadow-xl border-2 border-transparent hover:border-lime-300 hover:shadow-[0_0_20px_rgba(34,197,94,0.5)]">
                  See Enterprise Plans  →
                </a>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* FOOTER */}
      <section className=" flex flex-col justify-center items-center px-6 py-8 text-center">
        <div className="w-full max-w-3xl mx-auto">
          {/* Logo Row */}
          <div className="flex justify-center items-center mb-8">
            <Image
              src="/gradient_box_logo_4.webp"
              alt="Ganbatte Box Logo"
              width={600}
              height={180}
              className="rounded-md w-full max-w-2xl h-auto object-cover drop-shadow-2xl "
              priority
              unoptimized
              quality={100}
            />
          </div>
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
                <a href="mailto:support@ganbattepm.com" className="block text-lime-400 hover:text-white transition-colors font-sans">Contact Us</a>
                <a href="#" className="block text-lime-400 hover:text-white transition-colors font-sans">Help Center</a>
                <a href="#" className="block text-lime-400 hover:text-white transition-colors font-sans">FAQ</a>
              </div>
            </div>
          
            
            <div className="space-y-4 font-sans">
              <h3 className="text-xl font-bold text-lime-400 drop-shadow-lg font-sans">Company</h3>
              <div className="space-y-2">
                <a href="#" className="block text-lime-400 hover:text-white transition-colors font-sans">About</a>
                <a href="https://www.instagram.com/ganbattepm" className="block text-lime-400 hover:text-white transition-colors font-sans">Instagram</a>
                <a href="/privacy" className="block text-lime-400 hover:text-white transition-colors font-sans">Privacy Policy</a>
                <a href="/terms" className="block text-lime-400 hover:text-white transition-colors font-sans">Terms of Service</a>
              </div>
            </div>
          </div>
          
          {/* Copyright */}
          <div className=" border-gray-700 pt-4">
            <p className="text-sm text-lime-400 font-sans">
              &copy; {new Date().getFullYear()} — Ganbatte, All Rights Reserved
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}

function Feature({ title, desc, icon: Icon, }: {
  title: string; desc: string; icon: React.ElementType
}) {
  return (
    <div className="bg-black/80 backdrop-blur-sm border border-white/20 p-6 rounded-lg hover:bg-black/65 transition-all duration-300 hover:shadow-[0_0_20px_rgba(255,255,255,0.1)]">
      <Icon className="w-8 h-8 text-white mb-4 drop-shadow-lg" />

      <h3 className="text-2xl font-sans font-bold mb-3 text-white drop-shadow-lg">{title}</h3>
      <p className="text-lg text-gray-100 drop-shadow-lg">{desc}</p>
    </div>
  )
}

function PriceCard({ title, price, description }: { title: string, price: string, description: string }) {
  return (
    <div className="bg-black/80 backdrop-blur-sm border border-white/20 p-6 rounded-lg text-left hover:bg-black/65 transition-all duration-300 hover:shadow-[0_0_20px_rgba(255,255,255,0.1)]">
      <h3 className="text-xl font-semibold mb-2 text-white drop-shadow-lg font-sans">{title}</h3>
      <p className="text-3xl font-bold text-white drop-shadow-2xl font-sans">{price}</p>
      <p className="text-sm text-gray-200 mt-2 drop-shadow-lg font-sans">{description}</p>
    </div>
  )
}

function PayloadCard({ src, gradientType, mobileGradientType }: { src: string, gradientType: string, mobileGradientType: string }) {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const getGradient = () => {
    const currentGradientType = isMobile ? mobileGradientType : gradientType;
    
    switch (currentGradientType) {
      case 'top':
        return 'linear-gradient(to bottom, #ffed00, #e10600)';
      case 'middle':
        return 'linear-gradient(to bottom, #e62d00, #e10600 30%, #e10600 70%, #ad0f18)';
      case 'bottom':
        return 'linear-gradient(to bottom, #e10600, #002f6c)';
      default:
        return 'linear-gradient(to bottom, #ffed00, #e10600)';
    }
  };

  return (
    <div 
      className="relative p-4 rounded-lg hover:scale-105 transition-all duration-300 hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] overflow-hidden aspect-square"
      style={{
        backgroundImage: `
          ${getGradient()},
          url('/noise.png')
        `,
        backgroundBlendMode: 'hard-light',
        backgroundSize: '100% 100%, 200px 200px'
      }}
    >
      <div className="relative z-10 h-full flex flex-col justify-center">
        <div className="flex justify-center items-center p-2">
          <Image
            src={src}
            alt="Payload"
            width={180}
            height={180}
            className="w-auto h-40 object-contain brightness-0 invert"
          />
        </div>
      </div>
    </div>
  )
}

function StatCard({ number, label, description }: { number: string, label: string, description: string }) {
  return (
    <div className="bg-black/80 backdrop-blur-sm border border-white/20 p-4 rounded-lg hover:bg-black/65 transition-all duration-300 hover:shadow-[0_0_20px_rgba(255,255,255,0.1)]">
      <div className="text-2xl md:text-3xl font-bold text-white drop-shadow-2xl mb-2 break-words font-sans">{number}</div>
      <div className="text-base font-semibold text-white drop-shadow-lg mb-2 font-sans">{label}</div>
      <div className="text-xs text-gray-200 drop-shadow-lg leading-tight font-sans">{description}</div>
    </div>
  )
}

