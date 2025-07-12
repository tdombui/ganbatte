'use client'

import { motion } from 'framer-motion'
import UnifiedNavbar from '../../components/nav/UnifiedNavbar'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function EnterpriseTermsPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <UnifiedNavbar />
      
      <div className="max-w-4xl mx-auto px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="mb-8">
            <Link
              href="/enterprise"
              className="inline-flex items-center text-gray-400 hover:text-white transition-colors mb-6"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Enterprise Plans
            </Link>
            <h1 className="text-4xl font-bold mb-4">Enterprise Terms of Service</h1>
            <p className="text-gray-400">Last updated: January 2025</p>
          </div>

          <div className="bg-gray-900/50 rounded-xl p-8 backdrop-blur-sm">
            <div className="prose prose-invert max-w-none">
              <h2 className="text-2xl font-bold mb-6">Enterprise Terms of Service</h2>
              
              <p className="mb-6">
                <strong>Effective Date:</strong> January 2025
              </p>
              
              <p className="mb-6">
                                 These Enterprise Terms of Service (&ldquo;Agreement&rdquo;) govern the use of Zukujet&apos;s enterprise delivery services (&ldquo;Services&rdquo;) by business clients (&ldquo;Client&rdquo;) enrolled in our subscription plans (GT Starter, GT Pro, GT Ultra). This Agreement is entered into by and between Zukujet (&ldquo;Zukujet,&rdquo; &ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;) and the Client. By subscribing to a plan or using our Services, you agree to these terms.
              </p>

              <h3 className="text-xl font-semibold mb-4">1. Services Provided</h3>
              <p className="mb-6">
                Ganbatte offers subscription-based logistics services including last-mile parts delivery throughout Southern California, with optional extended coverage to Northern California and Nevada. Services are available only to Clients with an active subscription.
              </p>

              <h3 className="text-xl font-semibold mb-4">2. Token System</h3>
              <ul className="list-disc pl-6 mb-6 space-y-2">
                <li>Each plan allocates a set number of tokens per billing cycle.</li>
                <li><strong>1 token = up to 100 delivery miles.</strong></li>
                <li>Mileage is based on the most efficient route calculated by our systems (e.g., Google Maps Routes API).</li>
                <li>Unused tokens may roll over for 30 days up to a limit of 3 (Pro) or 4 (Ultra) tokens.</li>
                <li>Additional tokens may be purchased at $100/token.</li>
              </ul>

              <h3 className="text-xl font-semibold mb-4">3. Subscriptions & Billing</h3>
              <ul className="list-disc pl-6 mb-6 space-y-2">
                <li>Plans are billed monthly via Stripe.</li>
                <li>Subscription begins on the day of signup and auto-renews monthly.</li>
                <li>Cancellations must be made at least 7 days before the next billing cycle.</li>
                <li>No refunds will be issued for unused tokens.</li>
                <li>Late payments (after a 5-day grace period) may incur a 5% late fee.</li>
              </ul>

              <h3 className="text-xl font-semibold mb-4">4. Job Requests & Scheduling</h3>
              <ul className="list-disc pl-6 mb-6 space-y-2">
                <li>All job requests must be submitted through the Ganbatte platform.</li>
                <li>We require at least 2 hours' notice for standard jobs.</li>
                <li>Same-day or high-priority jobs may incur additional token usage or charges.</li>
                <li>Extended-area jobs (e.g., to San Francisco or Las Vegas) must be approved and may require multiple tokens.</li>
              </ul>

              <h3 className="text-xl font-semibold mb-4">5. Client Responsibilities</h3>
              <p className="mb-4">Clients are responsible for:</p>
              <ul className="list-disc pl-6 mb-6 space-y-2">
                <li>Ensuring accurate pickup and delivery addresses.</li>
                <li>Proper packaging of all payloads.</li>
                <li>Notifying Ganbatte of changes or cancellations at least 1 hour before scheduled pickup.</li>
              </ul>

              <h3 className="text-xl font-semibold mb-4">6. Service Area</h3>
              <p className="mb-6">
                Ganbatte operates primarily in Los Angeles, Orange County, Inland Empire, and San Diego. Extended service may be available by prior arrangement.
              </p>

              <h3 className="text-xl font-semibold mb-4">7. Liability & Limitations</h3>
              <ul className="list-disc pl-6 mb-6 space-y-2">
                <li>Ganbatte is not liable for delays due to traffic, weather, acts of God, or other force majeure events.</li>
                                 <li>Zukujet&apos;s maximum liability for loss or damage is limited to $100 per job unless otherwise agreed in writing.</li>
                <li>Ganbatte is not responsible for damage resulting from improper packaging.</li>
              </ul>

              <h3 className="text-xl font-semibold mb-4">8. Support & Communication</h3>
              <ul className="list-disc pl-6 mb-6 space-y-2">
                <li>Support is available via email and messaging during business hours (Mon–Fri 9am–6pm PT).</li>
                <li>Pro and Ultra clients may receive priority support and dedicated contact options.</li>
              </ul>

              <h3 className="text-xl font-semibold mb-4">9. Termination</h3>
              <ul className="list-disc pl-6 mb-6 space-y-2">
                                 <li>Zukujet may terminate this Agreement if the Client breaches these terms or engages in abusive, fraudulent, or illegal activity.</li>
                <li>Upon termination, any unused tokens are forfeited.</li>
              </ul>

              <h3 className="text-xl font-semibold mb-4">10. Amendments</h3>
              <ul className="list-disc pl-6 mb-6 space-y-2">
                                 <li>Zukujet may update this Agreement with 7 days&apos; notice.</li>
                <li>Continued use of the Services after notice constitutes acceptance of the new terms.</li>
              </ul>

              <h3 className="text-xl font-semibold mb-4">11. Governing Law</h3>
              <p className="mb-6">
                This Agreement is governed by the laws of the State of California. Any disputes arising shall be handled in the appropriate courts located in Los Angeles County, California.
              </p>

              <h3 className="text-xl font-semibold mb-4">12. Contact</h3>
              <p className="mb-6">
                For questions or concerns, please contact:<br />
                                 <strong>Zukujet</strong><br />
                <a href="mailto:support@zukujet.com" className="text-[#7fff00] hover:underline">
                  support@zukujet.com
                </a>
              </p>

              <div className="border-t border-gray-700 pt-6 mt-8">
                <p className="text-sm text-gray-400">
                  <strong>By using our services, you acknowledge that you have read, understood, and agreed to these Enterprise Terms of Service.</strong>
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </main>
  )
} 