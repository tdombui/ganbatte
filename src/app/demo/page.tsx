'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import PrivacyPolicy from '../components/ui/PrivacyPolicy'
import TermsOfService from '../components/ui/TermsOfService'

export default function DemoPage() {
  const [smsOptinMode, setSmsOptinMode] = useState(false)
  const [smsConsent, setSmsConsent] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)

  const handleSmsOptin = () => {
    if (!smsConsent || !phoneNumber.trim()) {
      alert('Please provide a phone number and consent to SMS updates.')
      return
    }
    setShowSuccess(true)
    setSmsOptinMode(false)
    setSmsConsent(false)
    setPhoneNumber('')
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="bg-neutral-900 border-b border-neutral-800 p-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Image
              src="/gradient_box_logo_4.webp"
              alt="Ganbatte Logo"
              width={120}
              height={36}
              className="rounded-lg"
            />
            <span className="text-lg font-bold">SMS Compliance Demo</span>
          </div>
          <div className="text-sm text-gray-400">
            For Twilio Verification Review
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6">
        {/* Demo Introduction */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Ganbatte SMS Compliance Demo</h1>
          <p className="text-xl text-gray-300 mb-6">
            This page demonstrates our SMS opt-in implementation for Twilio toll-free verification.
          </p>
          <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-lg p-4 max-w-2xl mx-auto">
            <h2 className="text-lg font-semibold text-emerald-300 mb-2">Compliance Features Demonstrated:</h2>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>✅ Explicit consent checkbox (unchecked by default)</li>
              <li>✅ Clear opt-in process with phone number input</li>
              <li>✅ Message rate disclosure and STOP instructions</li>
              <li>✅ Privacy Policy and Terms of Service links</li>
              <li>✅ Unbundled consent (optional, not required for service)</li>
              <li>✅ Professional business website with clear contact information</li>
            </ul>
          </div>
        </div>

        {/* SMS Opt-in Demo */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-neutral-900/50 rounded-xl p-6 border border-neutral-700">
            <h2 className="text-2xl font-bold mb-4 text-center">SMS Opt-in Flow Demo</h2>
            
            {!smsOptinMode && !showSuccess && (
              <div className="text-center">
                <p className="text-gray-300 mb-6">
                  This simulates the SMS opt-in flow that appears after job creation for users without phone numbers.
                </p>
                <button
                  onClick={() => setSmsOptinMode(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 px-6 py-3 rounded-lg text-white font-semibold transition-colors"
                >
                  Start SMS Opt-in Demo
                </button>
              </div>
            )}

            {smsOptinMode && (
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-xl font-bold text-emerald-300 mb-2">📱 Stay Updated via SMS</h3>
                  <p className="text-gray-300 text-sm">
                    Get real-time updates about your delivery status via text message.
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="(555) 123-4567"
                    className="w-full px-3 py-2 rounded-lg bg-neutral-800 text-white border border-neutral-600 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
                
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="sms-consent"
                    checked={smsConsent}
                    onChange={(e) => setSmsConsent(e.target.checked)}
                    className="mt-1 h-4 w-4 text-emerald-600 bg-neutral-800 border-neutral-600 rounded focus:ring-emerald-500 focus:ring-2"
                  />
                  <label htmlFor="sms-consent" className="text-sm text-gray-300">
                    I consent to receive SMS notifications from <strong>GanbattePM</strong> for delivery updates, ETA requests, job status notifications, and service communications. Message frequency varies. Reply &ldquo;STOP&rdquo; to unsubscribe. Message &amp; data rates may apply.
                  </label>
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={handleSmsOptin}
                    disabled={!smsConsent || !phoneNumber.trim()}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-lg text-white font-medium disabled:opacity-50 transition-colors"
                  >
                    Opt In for SMS Updates
                  </button>
                  <button
                    onClick={() => {
                      setSmsOptinMode(false)
                      setSmsConsent(false)
                      setPhoneNumber('')
                    }}
                    className="px-4 py-2 rounded-lg text-gray-300 border border-gray-600 hover:bg-gray-800 transition-colors"
                  >
                    Skip
                  </button>
                </div>
              </div>
            )}

            {showSuccess && (
              <div className="text-center space-y-4">
                <div className="text-6xl">✅</div>
                <h3 className="text-xl font-bold text-emerald-300">SMS Updates Enabled!</h3>
                <div className="bg-neutral-800 rounded-lg p-4 text-left">
                                     <p className="text-gray-300 mb-3">
                     Text us anytime at <a href="tel:1-877-684-5729" className="text-emerald-400 hover:text-emerald-300 underline">1(877) 684-5729</a>:
                   </p>
                   <ul className="text-sm text-gray-300 space-y-1">
                     <li>• &ldquo;ETA&rdquo; for delivery updates</li>
                     <li>• &ldquo;NEW&rdquo; to book another job</li>
                     <li>• &ldquo;STATUS&rdquo; for current job status</li>
                   </ul>
                   <p className="text-sm text-gray-400 mt-3">
                     To stop receiving SMS updates, reply &ldquo;STOP&rdquo; to any message.
                   </p>
                </div>
                <button
                  onClick={() => setShowSuccess(false)}
                  className="bg-neutral-700 hover:bg-neutral-600 px-4 py-2 rounded-lg text-white transition-colors"
                >
                  Reset Demo
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Business Information */}
        <div className="mt-12 grid md:grid-cols-2 gap-8">
          <div className="bg-neutral-900/50 rounded-xl p-6 border border-neutral-700">
            <h3 className="text-xl font-bold mb-4">About Ganbatte</h3>
            <p className="text-gray-300 mb-4">
              Ganbatte is a high-performance last-mile logistics solution for mission-critical payloads across automotive, aerospace, aviation, marine, and manufacturing.
            </p>
            <p className="text-gray-300 mb-4">
              We operate throughout Southern California, delivering ultra-responsive service powered by AI-driven dispatch and route optimization—with pro drivers and handlers behind the wheel.
            </p>
            <p className="text-sm text-gray-400">
              <em>Ganbatte</em> (頑張って) means <em>do your best.</em>
            </p>
          </div>

          <div className="bg-neutral-900/50 rounded-xl p-6 border border-neutral-700">
            <h3 className="text-xl font-bold mb-4">Contact Information</h3>
            <div className="space-y-3 text-gray-300">
              <div>
                <strong>Phone:</strong> <a href="tel:1-877-684-5729" className="text-emerald-400 hover:text-emerald-300 underline">1(877) 684-5729</a>
              </div>
              <div>
                <strong>Email:</strong> <a href="mailto:support@ganbattepm.com" className="text-emerald-400 hover:text-emerald-300 underline">support@ganbattepm.com</a>
              </div>
              <div>
                <strong>Service Area:</strong> Southern California
              </div>
              <div>
                <strong>Services:</strong> Last-mile logistics, delivery, parts transportation
              </div>
            </div>
          </div>
        </div>

        {/* Compliance Documentation */}
        <div className="mt-8 bg-neutral-900/50 rounded-xl p-6 border border-neutral-700">
          <h3 className="text-xl font-bold mb-4 text-center">Compliance Documentation</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="text-center">
              <h4 className="font-semibold mb-2">Privacy Policy</h4>
              <p className="text-sm text-gray-300 mb-3">
                Comprehensive privacy policy covering SMS communications and data handling.
              </p>
              <PrivacyPolicy />
            </div>
            <div className="text-center">
              <h4 className="font-semibold mb-2">Terms of Service</h4>
              <p className="text-sm text-gray-300 mb-3">
                Service terms covering SMS usage and user responsibilities.
              </p>
              <TermsOfService />
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-12 border-t border-neutral-700 pt-6">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex justify-center items-center space-x-6 text-center">
            <span className="text-gray-500 text-sm">
              &copy; {new Date().getFullYear()} Ganbatte. All rights reserved.
            </span>
          </div>
        </div>
      </footer>
    </div>
  )
} 