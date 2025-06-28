'use client'

import Link from 'next/link'
import Image from 'next/image'
import { MessageCircle, ClockAlert, PackageCheck } from 'lucide-react'

export default function HomePage() {
  return (
    <main className="snap-y snap-mandatory h-screen overflow-y-scroll scroll-smooth bg-black text-white">
      {/* HERO */}
      <section className="snap-start min-h-screen flex flex-col items-center px-6 text-center space-y-0 relative pt-16 pb-48">
        {/* Ganbatte title and logo in top left like nav */}
        <div className="absolute top-8 left-8 z-20 flex items-center gap-3">
          <Image
            src="/ganbatte.png"
            alt="Ganbatte Logo"
            width={60}
            height={24}
            className="drop-shadow-2xl"
            priority
          />
          <h1 className="text-3xl md:text-4xl font-bold font-sans tracking-tight">
            Ganbatte
          </h1>
        </div>
        
        {/* Outer wrapper container */}
        <div 
          className="w-full max-w-6xl mx-auto p-8 md:p-12 rounded-xl relative overflow-hidden mt-20 mb-16 flex-1 flex flex-col justify-center"
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
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <Link
              href="/chat"
              className="inline-block bg-lime-500 hover:bg-lime-400 text-black font-semibold px-6 py-3 rounded-lg text-lg transition drop-shadow-xl border-2 border-transparent hover:border-lime-300 hover:shadow-[0_0_20px_rgba(34,197,94,0.5)] hover:shadow-lime-400/50"
            >
              Request a Delivery →
            </Link>
            <button
              disabled
              className="inline-block bg-blue-950/50 text-gray-400 font-semibold px-6 py-3 rounded-lg text-lg transition drop-shadow-xl border-2 border-gray-600/30 cursor-not-allowed opacity-60"
            >
              Get Started
            </button>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="snap-start font-sans h-screen flex flex-col justify-center px-6 py-8">
        <div className="w-full max-w-6xl mx-auto p-8 md:p-12 rounded-xl relative overflow-hidden">
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
            <div className="max-w-5xl mx-auto relative z-10 font-sans">
              <h2 className="text-5xl md:text-5xl font-bold text-center mb-12 text-white drop-shadow-lg">
                Why Ganbatte?
              </h2>
              <div className="grid md:grid-cols-3 gap-8 text-left">
                <Feature
                  title="Request Deliveries in Chat"
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
      <section className="snap-start min-h-screen flex flex-col items-center justify-center px-6 py-8">
        <h2 className="text-5xl md:text-6xl font-bold text-white drop-shadow-2xl mb-8 text-center">What is Ganbatte?</h2>
        <div className="w-full max-w-6xl mx-auto p-8 md:p-12 rounded-xl relative overflow-hidden">
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
            <div className="max-w-3xl mx-auto text-center space-y-6 relative z-10 font-sans">
              <p className="text-gray-100 text-lg drop-shadow-lg">
                Ganbatte is a high-performance last-mile logistics solution for mission-critical payloads across automotive, aerospace, aviation, marine, and manufacturing.
              </p>
              <p className="text-gray-100 text-lg drop-shadow-lg">
                We operate throughout Southern California, delivering ultra-responsive service powered by AI-driven dispatch and route optimization—with pro drivers behind the wheel.
              </p>
              <p className="text-gray-100 text-lg drop-shadow-lg">
                Keep your parts moving and projects on track.
              </p>
              <p className="text-md text-gray-200 drop-shadow-lg"> <i>Ganbatte</i> (頑張って) means <i>do your best.</i> </p>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="snap-start min-h-screen flex flex-col items-center justify-center px-6 py-8">
        <h2 className="text-5xl md:text-6xl font-bold text-white drop-shadow-2xl mb-4 text-center">Simple, Transparent Pricing</h2>
        <p className="text-gray-100 mb-8 drop-shadow-lg text-center max-w-2xl">Built for mission-critical, speciality jobs. No hidden fees, no surprises.</p>
        <div className="w-full max-w-6xl mx-auto p-8 md:p-12 rounded-xl relative overflow-hidden">
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
            <div className="max-w-4xl mx-auto text-center relative z-10 font-sans">
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
                  price="$1 per extra lb"
                  description="First 50lbs are free"
                />

                <PriceCard
                  title="Same Day Delivery"
                  price="$60"
                  description="Priority routing for urgent jobs"
                />
                <PriceCard
                  title="After Hours / Weekend"
                  price="$60"
                  description="Deliveries after standard hours"
                />
                <PriceCard
                  title="Discounts"
                  price="–25%"
                  description="For jobs scheduled 24h+ in advance"
                />
              </div>
              <p className="text-sm text-gray-200 mt-6 drop-shadow-lg">Need bulk or recurring delivery support? <a href="mailto:team@ganbatte.run" className="underline">Contact us</a>.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <section className="snap-start min-h-screen flex flex-col justify-center items-center px-6 py-8 text-center text-sm text-gray-500">
        &copy; {new Date().getFullYear()} Ganbatte Payload Movers 🏁
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

