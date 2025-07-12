'use client'

import { Check, Star, Coins } from 'lucide-react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import UnifiedNavbar from '../components/nav/UnifiedNavbar'
import { useAuthContext } from '../providers'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, Suspense } from 'react'
import { createClient } from '../../lib/supabase/client'
import Link from 'next/link'
import React from 'react'

function EnterprisePageContent() {
  const { isAuthenticated } = useAuthContext()
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const searchParams = useSearchParams()

  // Track abandoned cart for business intelligence
  React.useEffect(() => {
    const canceled = searchParams.get('canceled')
    const plan = searchParams.get('plan')
    
    if (canceled === 'true' && plan) {
      // Track abandoned cart for business intelligence
      console.log(`Abandoned cart tracked: ${plan} plan`)
      
      // You can send this to your analytics service
      // Example: analytics.track('subscription_abandoned', { plan, userId })
      
      // Optional: Show a subtle message to user
      // You could add a toast notification here
    }
  }, [searchParams])

  const handleSubscribe = async (planName: string) => {
    if (!isAuthenticated) {
      router.push(`/auth?redirectTo=/enterprise`)
      return
    }

    setLoading(planName)

    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      const response = await fetch('/api/enterprise-subscription/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || ''}`,
        },
        body: JSON.stringify({ planName }),
      })

      const data = await response.json()

      if (data.success && data.session?.url) {
        window.location.href = data.session.url
      } else {
        console.error('Failed to create subscription:', data.error)
        alert('Failed to create subscription. Please try again.')
      }
    } catch (error) {
      console.error('Error creating subscription:', error)
      alert('An error occurred. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  const plans = [
    {
      name: 'GT Starter',
      price: '$600',
      tokens: '6',
      miles: '600',
      features: [
        '6 tokens per month (600 miles)',
        'Priority support',
        'Real-time tracking',
        'Analytics',
        'SMS notifications and service',
        'Dedicated account manager',
        'Dedicated driver',
        'Custom delivery routes'

      ],
      popular: false
    },
    {
      name: 'GT Pro',
      price: '$1,200',
      tokens: '13',
      miles: '1,300',
      features: [
        '13 tokens per month (1,300 miles)',
        'Priority support',
        'Real-time tracking',
        'Analytics',
        'SMS notifications and service',
        'Dedicated account manager',
        'Dedicated driver',
        'Custom delivery routes',
        'Rollover unused tokens',
        'Long-distance jobs (SF, Vegas)'
      ],
      popular: true
    },
    {
      name: 'GT Ultra',
      price: '$2,000',
      tokens: '22',
      miles: '2,200',
      features: [
        '22 tokens per month (2,200 miles)',
        'Priority support',
        'Real-time tracking',
        'Analytics',
        'SMS notifications and service',
        'Dedicated account manager',
        'Dedicated driver',
        'Custom delivery routes',
        'Rollover unused tokens',
        'Long-distance jobs (SF, Vegas)'
      ],
      popular: false
    }
  ]

  return (
    <main className="min-h-screen bg-black text-white">
      <UnifiedNavbar />
      
      {/* Hero Section with Gradient Container */}
      <section className="flex flex-col items-center px-6 text-center space-y-0 relative pt-16 md:pt-24 pb-16">
        <motion.div 
          className="w-full max-w-6xl mx-auto p-8 md:p-12 rounded-xl relative overflow-hidden mt-12 md:mt-20 mb-8"
          style={{
            background: `
              linear-gradient(to bottom, #ffed00, #e10600, #002f6c),
              url('/noise.png')
            `,
            backgroundBlendMode: 'overlay',
            backgroundSize: '100% 100%, 200px 200px'
          }}
        >
          <motion.h1 
            className="text-5xl md:text-6xl font-bold mb-6 font-sans"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Enterprise Logistics
          </motion.h1>
          
          <motion.p 
            className="text-xl md:text-xl font-sans mb-4 max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
No full-time driver? No problem. Our Enterprise Logistics plans are built for busy shops, parts suppliers, and service providers who need flexible, high-touch delivery without the overhead.
          </motion.p>
        </motion.div>
      </section>

      {/* Pricing Cards */}
      <section className="px-6 py-16" id="pricing">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.name}
                className={`relative rounded-2xl p-8 ${
                  plan.popular 
                    ? 'bg-[#002f6c] border-2 border-[#7fff00] shadow-2xl shadow-[#7fff00]/20' 
                    : 'bg-gray-900/50 border border-gray-700'
                } backdrop-blur-sm`}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-[#7fff00] text-black px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2">
                      <Star className="w-4 h-4" />
                      Recommended
                    </div>
                  </div>
                )}

                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <div className="mb-4">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-gray-400">/month</span>
                  </div>
                  <div className="text-sm text-gray-300 mb-2">
                    <div className="flex items-center justify-center gap-2">
                      <Coins className="w-4 h-4 text-yellow-400" />
                      <span>{plan.tokens} tokens • {plan.miles} miles</span>
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {plan.name === 'GT Starter' && '$1.00 per mile'}
                      {plan.name === 'GT Pro' && '~ $0.92 per mile'}
                      {plan.name === 'GT Ultra' && '~ $0.91 per mile'}
                    </div>
                  </div>
                </div>

                <ul className="space-y-4 mb-8 flex-grow">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-[#7fff00] mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="flex flex-col items-center mt-auto">
                  <button
                    onClick={() => handleSubscribe(plan.name)}
                    disabled={loading === plan.name}
                    className={`w-full text-center py-3 px-6 rounded-lg font-semibold transition-all duration-300 ${
                      plan.popular
                        ? 'bg-[#7fff00] text-black hover:bg-[#7fff00]/90 hover:shadow-lg hover:shadow-[#7fff00]/25'
                        : 'bg-gray-700 text-white hover:bg-gray-600'
                    } ${loading === plan.name ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {loading === plan.name ? 'Processing...' : 'Get Started'}
                  </button>
                  <p className="text-xs text-gray-400 mt-2 text-center">
                    By clicking Get Started, you agree to our{' '}
                    <Link href="/enterprise/terms" className="text-[#7fff00] hover:underline">
                      Enterprise Terms of Service
                    </Link>
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Token System Explanation */}
      <section className="px-6 py-16">
        <motion.div 
          className="w-full max-w-6xl mx-auto p-8 md:p-12 rounded-xl relative overflow-hidden"
          style={{
            background: `
              linear-gradient(to bottom, #ffed00, #e10600, #002f6c),
              url('/noise.png')
            `,
            backgroundBlendMode: 'overlay',
            backgroundSize: '100% 100%, 200px 200px'
          }}
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="text-center">
          <motion.p 
              className="text-2xl md:text-3xl font-bold mb-8 font-sans"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              Pay monthly. Spend tokens. Get it delivered.
            </motion.p>
            <motion.p 
              className="text-xl md:text-xl mb-8 font-sans"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              With our token-based system, you get predictable monthly pricing and total control over your logistics—no per-job guesswork, no hidden fees.
            </motion.p>
            

            
            <motion.p 
              className="text-xl md:text-xl font-sans"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              Whether you&apos;re scheduling regular runs or responding to urgent requests, our dedicated fleet has you covered across Southern California—and as far as San Francisco and Las Vegas when needed.
            </motion.p>
          </div>
        </motion.div>
      </section>

      {/* How It Works */}
      <section className="px-6 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h2 
            className="text-4xl font-bold mb-8"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            How Token System Works
          </motion.h2>
          
          <motion.p 
            className="text-lg text-gray-300 mb-12 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            Each token covers 100 miles of delivery. Tokens are automatically deducted based on the actual distance of your deliveries.
          </motion.p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div 
              className="text-center"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <div className="w-16 h-16 bg-[#7fff00] rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-black">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Subscribe Monthly</h3>
              <p className="text-gray-400">Choose your plan and get tokens monthly</p>
            </motion.div>
            
            <motion.div 
              className="text-center"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="w-16 h-16 bg-[#7fff00] rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-black">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Request Deliveries</h3>
              <p className="text-gray-400">Text us your delivery needs</p>
            </motion.div>
            
            <motion.div 
              className="text-center"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <div className="w-16 h-16 bg-[#7fff00] rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-black">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Tokens Automatically Used</h3>
              <p className="text-gray-400">Tokens are deducted based on delivery distance</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-16">
        <motion.div 
          className="max-w-4xl mx-auto text-center"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl font-bold mb-4">Ready to Scale Your Deliveries?</h2>
          <p className="text-xl text-gray-400 mb-8">
            Join leading companies using our enterprise solution
          </p>
          <button
            onClick={() => handleSubscribe('GT Pro')}
            disabled={loading === 'GT Pro'}
            className={`inline-block bg-[#7fff00] text-black font-semibold px-8 py-4 rounded-lg text-lg transition-all duration-300 hover:bg-[#7fff00]/90 hover:shadow-lg hover:shadow-[#7fff00]/25 ${loading === 'GT Pro' ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {loading === 'GT Pro' ? 'Processing...' : 'Start Your Enterprise Plan'}
          </button>
        </motion.div>
      </section>

      {/* Footer */}
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
                <a href="mailto:support@zukujet.com" className="block text-lime-400 hover:text-white transition-colors font-sans">Contact Us</a>
                <a href="#" className="block text-lime-400 hover:text-white transition-colors font-sans">Help Center</a>
                <a href="#" className="block text-lime-400 hover:text-white transition-colors font-sans">FAQ</a>
              </div>
            </div>
          
            
            <div className="space-y-4 font-sans">
              <h3 className="text-xl font-bold text-lime-400 drop-shadow-lg font-sans">Company</h3>
              <div className="space-y-2">
                <a href="#" className="block text-lime-400 hover:text-white transition-colors font-sans">About</a>
                <a href="https://www.instagram.com/zukujet" className="block text-lime-400 hover:text-white transition-colors font-sans">Instagram</a>
                <a href="/privacy" className="block text-lime-400 hover:text-white transition-colors font-sans">Privacy Policy</a>
                <a href="/enterprise/terms" className="block text-lime-400 hover:text-white transition-colors font-sans">Enterprise Terms</a>
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

export default function EnterprisePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EnterprisePageContent />
    </Suspense>
  )
}