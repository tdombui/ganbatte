'use client'

import Link from 'next/link'
import dynamic from 'next/dynamic'
import { MessageCircle, ClockAlert, PackageCheck } from 'lucide-react'

const Pricing = dynamic(() => import('./components/ui/frontend/Pricing'), { ssr: false })
const About = dynamic(() => import('./components/ui/frontend/About'), { ssr: false })

export default function HomePage() {
  return (
    <main className="snap-y snap-mandatory h-screen overflow-y-scroll scroll-smooth bg-black text-white">
      {/* HERO */}
      <section className="snap-start h-screen flex flex-col justify-center items-center px-6 text-center space-y-6">
        <h1 className="text-6xl md:text-6xl sm:text-4xl font-bold font-sans tracking-tight">
          Ganbatte Parts Sprinter
        </h1>
        <p className="text-[1.1rem] md:text-[1.1rem] text-gray-300 max-w-4xl">
          Last-mile logistics for mission-critical parts across automotive,
          aerospace, aviation, marine, and manufacturing.
          <br />
          <br />
          Request mission-critical deliveries by text. Let AI handle the rest.
        </p>
        <Link
          href="/chat"
          className="inline-block bg-lime-500 hover:bg-lime-400 text-black font-semibold px-6 py-3 rounded-lg text-lg transition"
        >
          Request a Delivery →
        </Link>
      </section>

      {/* FEATURES */}
      <section className="snap-start h-screen flex items-center px-6">
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-8 text-left">
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
      </section>

      {/* ABOUT */}
      <section className="snap-start h-screen flex items-center justify-center px-6">
        <About />
      </section>

      {/* PRICING */}
      <section className="snap-start h-screen flex items-center justify-center px-6">
        <Pricing />
      </section>

      {/* FOOTER */}
      <section className="snap-start h-screen flex flex-col justify-center items-center px-6 text-center text-sm text-gray-500">
        &copy; {new Date().getFullYear()} Ganbatte Parts Sprinter 🏁
      </section>
    </main>
  )
}

function Feature({ title, desc, icon: Icon, }: {
  title: string; desc: string; icon: React.ElementType
}) {
  return (
    <div className="rounded-lg border border-gray-600 bg-gradient-to-br from-[#2a2d30] to-[#1c1e21] shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] p-6 hover:shadow-[0_0_10px_rgba(255,255,255,0.1)] transition">
      <Icon className="w-8 h-8 text-lime-400 mb-4" />

      <h3 className="text-2xl font-mono font-bold mb-3 text-slate-100">{title}</h3>
      <p className="text-lg text-slate-300">{desc}</p>
    </div>
  )
}

