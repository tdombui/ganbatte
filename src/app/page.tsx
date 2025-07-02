'use client'

import Link from 'next/link'
import Image from 'next/image'
import { MessageCircle, ClockAlert, PackageCheck } from 'lucide-react'
import React from 'react'
import { useAuthContext } from './providers'
import UnifiedNavbar from './components/nav/UnifiedNavbar'
import { createClient } from '../lib/supabase/client'
import { useRouter } from 'next/navigation'

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
        <div 
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
          <h2 className="text-7xl md:text-8xl sm:text-5xl font-bold font-sans tracking-tight drop-shadow-2xl mb-8">The Payload Movers</h2>
          <p className="text-[1.1rem] md:text-1 font-sans font-medium text-gray-50 max-w-4xl mt-8 mb-8 drop-shadow-lg">
            Last-mile logistics for mission-critical payloads in automotive,
            aerospace, aviation, marine, and manufacturing.
            <br />
            <br />
            Move payloads by text. AI handles the rest.
          </p>
          
          {/* Welcome message for authenticated users */}
          {!loading && isAuthenticated && (
            <div className="mb-6 p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
              <p className="text-white font-medium">
                Welcome back, {user?.full_name}! 
                {isCustomer && ' Ready to move a payload?'}
                {isStaff && ' Ready to manage jobs?'}
                {isAdmin && ' Ready to manage the system?'}
              </p>
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            {isAuthenticated ? (
              <>
                <button
                  onClick={() => verifySessionAndNavigate(isCustomer ? "/chat" : (isStaff || isAdmin ? "/staff/jobs" : "/jobs"))}
                  className="inline-block bg-lime-400 hover:bg-lime-400 text-black font-semibold px-6 py-3 rounded-lg text-lg transition drop-shadow-xl border-2 border-transparent hover:border-lime-300 hover:shadow-[0_0_20px_rgba(34,197,94,.7)] hover:shadow-lime-400/50"
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
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="font-sans min-h-screen flex flex-col justify-center px-6 py-8">
        <h2 className="text-5xl md:text-6xl font-bold text-white drop-shadow-2xl mb-8 text-center">Why GanbattePM?</h2>
        <div className="w-full max-w-6xl mx-auto p-8 md:p-2 rounded-xl relative overflow-hidden">
          <div 
            className="w-full h-full p-8 md:p-12 rounded-xl relative"
            style={{
              background: `
                linear-gradient(to bottom, #ffed00, #e10600, #002f6c),
                url('/noise.png')
              `,
              backgroundBlendMode: 'overlay',
              backgroundSize: '100% 100%, 200px 200px'
            }}
          >
            <div className="max-w-6xl mx-auto relative z-10 font-sans">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 text-left">
                <Feature
                  title="teliveries in Chat"
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

      {/* ABOUT */}
      <section className="min-h-screen flex flex-col items-center justify-center px-6 py-8 font-sans relative">
        <h2 className="text-5xl md:text-6xl font-bold text-white drop-shadow-2xl mb-8 text-center">What is GanbattePM?</h2>
        <div className="w-full max-w-6xl mx-auto p-8 md:p-2 rounded-xl relative overflow-hidden">
          <div 
            className="w-full h-full p-8 md:p-12 rounded-xl relative"
            style={{
              background: `
                linear-gradient(to bottom, #ffed00, #e10600, #002f6c),
                url('/noise.png')
              `,
              backgroundBlendMode: 'overlay',
              backgroundSize: '100% 100%, 200px 200px'
            }}
          >
            <div className="max-w-6xl mx-auto text-center space-y-6 relative z-10 font-sans">
              <p className="text-gray-100 text-lg drop-shadow-lg">
                GanbattePM is a high-performance last-mile logistics solution for mission-critical payloads across automotive, aerospace, aviation, marine, and manufacturing.
              </p>
              <p className="text-gray-100 text-lg drop-shadow-lg">
                We operate throughout Southern California, delivering ultra-responsive service powered by AI-driven dispatch and route optimization—with pro drivers and handlers behind the wheel.
              </p>
              <p className="text-gray-100 text-lg drop-shadow-lg">
              Ensuring your critical operations never stop.
              </p>
              <p className="text-md text-gray-200 drop-shadow-lg"> <i>Ganbatte</i> (頑張って) means <i>do your best.</i> </p>
            </div>
          </div>
        </div>
        {/* No1 image positioned at bottom right of the section */}
        <div className="absolute md:bottom-[-12] md:right-[-12] bottom-[-8] right-[-8] z-20">
          <Image
            src="/no1.webp"
            alt="No1"
            width={144}
            height={144}
            className="w-auto h-49 drop-shadow-2xl"
          />
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="min-h-screen flex flex-col items-center justify-center px-6 py-8 font-sans ">
        <h2 className="text-5xl md:text-6xl font-bold text-white drop-shadow-2xl mb-4 text-center">Simple, Transparent Pricing</h2>
        <p className="text-gray-100 mb-8 drop-shadow-lg text-center max-w-2xl">Built for mission-critical, speciality jobs. No hidden fees, no surprises.</p>
        <div className="w-full max-w-6xl mx-auto p-8 md:p-2 rounded-xl relative overflow-hidden">
          <div 
            className="w-full h-full p-8 md:p-12 rounded-xl relative"
            style={{
              background: `
                linear-gradient(to bottom, #ffed00, #e10600, #002f6c),
                url('/noise.png')
              `,
              backgroundBlendMode: 'overlay',
              backgroundSize: '100% 100%, 200px 200px'
            }}
          >
            <div className="max-w-6xl mx-auto text-center relative z-10 font-sans">
              <div className="grid md:grid-cols-3 gap-6">
                <PriceCard
                  title="Base Rate"
                  price="$30"
                  description="Flat fee per delivery"
                />
                <PriceCard
                  title="Per Mile"
                  price="$1.25"
                  description="Calculated by optimized route"
                />
                <PriceCard
                  title="Per Item"
                  price="$0.50 per extra lb"
                  description="First 50lbs are free"
                />

                <PriceCard
                  title="Priority Delivery"
                  price="$100"
                  description="Priority routing for urgent jobs"
                />
                <PriceCard
                  title="Nights & Weekends"
                  price="$25"
                  description="For Delivery after standard hours"
                />
                <PriceCard
                  title="Discounts"
                  price="Up to 25% off"
                  description="For jobs scheduled 24h+ in advance"
                />
              </div>
              <p className="text-sm text-gray-200 mt-8 drop-shadow-lg">Need equipment staging or recurring logistics support? <a href="mailto:team@ganbatte.run" className="underline">Contact us</a>.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ENTERPRISE */}
      <section id="enterprise" className="min-h-screen flex flex-col items-center justify-center px-6 py-8 font-sans">
        <h2 className="text-5xl md:text-6xl font-bold text-white drop-shadow-2xl mb-4 text-center">Enterprise Logistics</h2>
        <p className="text-gray-100 mb-8 drop-shadow-lg text-center max-w-2xl">Scale your operations with dedicated logistics infrastructure and priority support.</p>
        <div className="w-full max-w-6xl mx-auto p-8 md:p-2 rounded-xl relative overflow-hidden">
          <div 
            className="w-full h-full p-8 md:p-12 rounded-xl relative"
            style={{
              background: `
                linear-gradient(to bottom, #ffed00, #e10600, #002f6c),
                url('/noise.png')
              `,
              backgroundBlendMode: 'overlay',
              backgroundSize: '100% 100%, 200px 200px'
            }}
          >
            <div className="max-w-6xl mx-auto text-center relative z-10 font-sans">
              <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-black/80 backdrop-blur-sm border border-white/20 p-6 rounded-lg text-left hover:bg-black/65 transition-all duration-300 hover:shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                  <h3 className="text-2xl font-semibold mb-4 text-white drop-shadow-lg">Dedicated Fleet</h3>
                  <p className="text-gray-200 drop-shadow-lg">Reserved vehicles and drivers for your exclusive use, ensuring consistent availability and reliability.</p>
                </div>
                <div className="bg-black/80 backdrop-blur-sm border border-white/20 p-6 rounded-lg text-left hover:bg-black/65 transition-all duration-300 hover:shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                  <h3 className="text-2xl font-semibold mb-4 text-white drop-shadow-lg">Priority Service</h3>
                  <p className="text-gray-200 drop-shadow-lg">24/7 dedicated account management and priority routing for mission-critical deliveries.</p>
                </div>
                <div className="bg-black/80 backdrop-blur-sm border border-white/20 p-6 rounded-lg text-left hover:bg-black/65 transition-all duration-300 hover:shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                  <h3 className="text-2xl font-semibold mb-4 text-white drop-shadow-lg">Access to Product Sourcing</h3>
                  <p className="text-gray-200 drop-shadow-lg">Take advantage of a robust network of suppliers and manufacturers.</p>
                </div>
                <div className="bg-black/80 backdrop-blur-sm border border-white/20 p-6 rounded-lg text-left hover:bg-black/65 transition-all duration-300 hover:shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                  <h3 className="text-2xl font-semibold mb-4 text-white drop-shadow-lg">Volume Discounts</h3>
                  <p className="text-gray-200 drop-shadow-lg">Competitive pricing for high-volume operations with guaranteed service levels.</p>
                </div>
              </div>
              <div className="mt-8">
                <a href="mailto:team@ganbatte.run" className="inline-block bg-lime-400 hover:bg-lime-300 text-black font-semibold px-8 py-4 rounded-lg text-lg transition drop-shadow-xl border-2 border-transparent hover:border-lime-300 hover:shadow-[0_0_20px_rgba(34,197,94,0.5)]">
                  Get in Touch  →
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MAKE PAYLOAD MOVES */}
      <section className="min-h-screen flex flex-col items-center justify-center px-6 py-8 font-sans">
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

      {/* FOOTER */}
      <section className=" flex flex-col justify-center items-center px-6 py-8 text-center">
        <div className="w-full max-w-6xl mx-auto">
          {/* Social Links with Turbo Home Image */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
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
              <h3 className="text-xl font-bold text-white drop-shadow-lg">Support</h3>
              <div className="space-y-2">
                <a href="mailto:team@ganbatte.run" className="block text-gray-300 hover:text-white transition-colors">Contact Us</a>
                <a href="#" className="block text-gray-300 hover:text-white transition-colors">Help Center</a>
                <a href="#" className="block text-gray-300 hover:text-white transition-colors">FAQ</a>
              </div>
            </div>
          
            
            <div className="space-y-4 font-sans">
              <h3 className="text-xl font-bold text-white drop-shadow-lg">Company</h3>
              <div className="space-y-2">
                <a href="#" className="block text-gray-300 hover:text-white transition-colors">About</a>
                <a href="#" className="block text-gray-300 hover:text-white transition-colors">Instagram</a>
                <a href="#" className="block text-gray-300 hover:text-white transition-colors">Privacy Policy</a>
              </div>
            </div>
          </div>
          
          {/* Copyright */}
          <div className=" border-gray-700 pt-8">
            <p className="text-sm text-gray-500 font-sans">
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
      <h3 className="text-xl font-semibold mb-2 text-white drop-shadow-lg">{title}</h3>
      <p className="text-3xl font-bold text-white drop-shadow-2xl">{price}</p>
      <p className="text-sm text-gray-200 mt-2 drop-shadow-lg">{description}</p>
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
        backgroundBlendMode: 'overlay',
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

