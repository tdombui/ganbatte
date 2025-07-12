'use client'

import Link from 'next/link'
import Image from 'next/image'
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
            backgroundBlendMode: 'hard-light',
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


      {/* IMPACT */}
      <section className="font-sans min-h-screen flex flex-col justify-center px-6 py-8">
        <h2 className="text-5xl md:text-6xl font-bold text-white drop-shadow-2xl mb-8 text-center">Our Spec Sheet</h2>
        <p className="text-gray-100 drop-shadow-lg max-w-3xl mx-auto mb-8 text-center">
          Trusted by leading automotive, marine, and manufacturing companies throughout Southern California. Every payload counts when operations can&apos;t stop.
        </p>
        <div className="w-full max-w-6xl mx-auto p-2 md:p-8 rounded-xl relative overflow-hidden">
          <div 
            className="w-full h-full p-4 md:p-12 rounded-xl relative"
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
                <StatCard
                  number="2,200+"
                  label="Kilograms Moved"
                  description="Mission-critical payloads delivered"
                />
                <StatCard
                  number="250+"
                  label="Trips Completed"
                  description="Successful deliveries across SoCal"
                />
                <StatCard
                  number="15+"
                  label="Happy Clients"
                  description="From automotive to manufacturing"
                />
                <StatCard
                  number="25,000+"
                  label="Miles Driven"
                  description="Optimized routes across the region"
                />
              </div>
            </div>
          </div>
        </div>
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
          className="w-full max-w-6xl mx-auto p-2 md:p-8 rounded-xl relative overflow-hidden"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
        >
          <div 
            className="w-full h-full p-4 md:p-12 rounded-xl relative"
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
                    title: "Dedicated Team",
                    description: "Dedicated account managers and drivers for your exclusive use, ensuring consistent availability and reliability."
                  },
                  {
                    title: "Priority Service",
                    description: "24/7 dedicated account management and priority routing for mission-critical deliveries."
                  },
                  {
                    title: "Token-based Payments",
                    description: "Take advantage of our token-based payment system to manage your operations more efficiently."
                  },
                  {
                    title: "Custom Solutions",
                    description: "Competitive pricing for high-volume operations with guaranteed capacity and service levels."
                  }
                ].map((feature, index) => (
                  <motion.div
                    key={feature.title}
                    className="bg-black/80 backdrop-blur-sm border border-white/20 p-6 rounded-lg text-left hover:bg-black/65 transition-all duration-300 hover:shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                    initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.3 + index * 0.1 }}
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
          className="w-full max-w-6xl mx-auto p-2 md:p-8 rounded-xl relative overflow-hidden"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
        >
          <div 
            className="w-full h-full p-4 md:p-12 rounded-xl relative"
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
                  { title: "Per Item", price: "$0.50 per extra lb", description: "First 50 lbs are free" },
                  { title: "Priority Delivery", price: "$100", description: "Priority routing for urgent jobs" },
                  { title: "Nights & Weekends", price: "$25", description: "For Delivery after standard hours" },
                  { title: "Discounts", price: "Up to 25% off", description: "For jobs scheduled in advance" }
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
              <p className="text-sm text-gray-200 mt-8 drop-shadow-lg font-sans">Need logistics support? <a href="mailto:support@zukujet.com" className="underline">Contact us</a>.</p>
            </div>
          </div>
        </motion.div>
      </section>



      {/* PAYLOADS */}
      <section id="services" className="min-h-screen flex flex-col items-center justify-center px-6 py-8 font-sans">
        <h2 className="text-5xl md:text-6xl font-bold text-white drop-shadow-2xl mb-4 text-center">Move Payloads</h2>
        <p className="text-gray-100 mb-8 drop-shadow-lg text-center max-w-2xl">From brake kits to bolt-on turbos and wheelsets, we move the parts that keep your projects in motion.</p>
        <div className="w-full max-w-6xl mx-auto p-8 md:p-2 rounded-xl relative overflow-hidden bg-black/80 backdrop-blur-sm">
          <div className="max-w-6xl mx-auto text-center relative z-10 font-sans">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              <PayloadCard
                src="/payloads/brake.webp"
                gradientType="top"
                mobileGradientType="top"
              />
              <PayloadCard
                src="/payloads/wheel.webp"
                gradientType="top"
                mobileGradientType="top"
              />
              <PayloadCard
                src="/payloads/tire.webp"
                gradientType="top"
                mobileGradientType="middle"
              />
              <PayloadCard
                src="/payloads/coilover.webp"
                gradientType="bottom"
                mobileGradientType="middle"
              />
              <PayloadCard
                src="/payloads/turbo.webp"
                gradientType="bottom"
                mobileGradientType="bottom"
              />
              <PayloadCard
                src="/payloads/bumper.webp"
                gradientType="bottom"
                mobileGradientType="bottom"
              />
            </div>
          </div>
        </div>
      </section>


      {/* WHAT IS ZUKUJET */}
      <section className="font-sans flex flex-col justify-center px-6 py-8 min-h-screen">
        <h2 className="text-5xl md:text-6xl font-bold text-white drop-shadow-2xl mb-8 text-center font-sans">What is Zukujet?</h2>
        <div className="w-full max-w-6xl mx-auto p-2 md:p-8 rounded-xl relative overflow-hidden">
          <div
            className="w-full h-full p-4 md:p-12 rounded-xl relative text-center"
            style={{
              background: `linear-gradient(to bottom, #ffed00, #e10600, #002f6c), url('/noise.png')`,
              backgroundBlendMode: 'hard-light',
              backgroundSize: '100% 100%, 200px 200px',
            }}
          >
            <p className="text-lg md:text-xl text-gray-100 mb-4 font-sans drop-shadow-lg">
                             Zukujet is a high-performance last-mile logistics solution for mission-critical payloads across automotive, aerospace, aviation, marine, and manufacturing.
            </p>
            <p className="text-lg md:text-xl text-gray-100 mb-4 font-sans drop-shadow-lg">
              We operate throughout Southern California, delivering ultra-responsive service powered by AI-driven dispatch and route optimization—with pro drivers and handlers behind the wheel.
            </p>
            <p className="text-lg md:text-xl text-gray-100 mb-4 font-sans drop-shadow-lg">
              Ensuring your critical operations never stop.
            </p>
            <p className="text-lg md:text-xl text-gray-200 font-sans drop-shadow-lg mt-6">
              Ganbatte <span className="inline-block align-middle">(頑張って)</span> means do your best.
            </p>
          </div>
        </div>
        <div className="flex justify-end mt-4 lg:mt-[-8rem] pr-4 md:pr-8">
          <Image 
            src="/no1.webp" 
            alt="No.1 Hand" 
            width={144}
            height={144}
            className="w-38 h-38 md:w-36 md:h-36 drop-shadow-2xl" 
            priority
            unoptimized
          />
        </div>
      </section>

      {/* FOOTER */}
      <section className=" flex flex-col justify-center items-center mt-12 px-6 py-8 text-center">
        <div className="w-full max-w-3xl mx-auto">
          {/* Logo Row */}
          <div className="flex justify-center items-center mb-12">
            <Image
              src="/gradient_box_logo_4.webp"
              alt="Ganbatte Box Logo"
              width={600}
              height={180}
              className="rounded-sm w-full max-w-2xl h-auto object-cover drop-shadow-2xl "
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

function PriceCard({ title, price, description }: { title: string, price: string, description: string }) {
  return (
    <div className="bg-black/80 backdrop-blur-sm border border-white/20 p-6 rounded-lg text-left hover:bg-black/65 transition-all duration-300 hover:shadow-[0_0_20px_rgba(255,255,255,0.1)]">
      <h3 className="text-xl font-semibold mb-2 text-white drop-shadow-lg font-sans">{title}</h3>
      <p className="text-2xl font-bold text-white drop-shadow-2xl font-sans">{price}</p>
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

