'use client'

import { useState, useEffect } from 'react'

export default function StripeConfigPage() {
  const [config, setConfig] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/test/stripe-environment')
      .then(res => res.json())
      .then(data => {
        setConfig(data)
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  if (loading) return <div className="p-8">Loading configuration...</div>
  if (error) return <div className="p-8 text-red-600">Error: {error}</div>

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Stripe Environment Configuration</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Current Environment</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <strong>Mode:</strong> {config?.environment?.mode}
          </div>
          <div>
            <strong>Key Type:</strong> {config?.environment?.keyType}
          </div>
          <div>
            <strong>Base URL:</strong> {config?.environment?.baseUrl}
          </div>
          <div>
            <strong>Has Webhook Secret:</strong> {config?.environment?.hasWebhookSecret ? '✅ Yes' : '❌ No'}
          </div>
          <div>
            <strong>Has Payment Links Webhook Secret:</strong> {config?.environment?.hasPaymentLinksWebhookSecret ? '✅ Yes' : '❌ No'}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Webhook URLs</h2>
        <div className="space-y-2">
          <div>
            <strong>Enterprise Webhook:</strong>
            <div className="bg-gray-100 p-2 rounded font-mono text-sm break-all">
              {config?.environment?.webhookUrls?.enterpriseWebhook}
            </div>
          </div>
          <div>
            <strong>Payment Links Webhook:</strong>
            <div className="bg-gray-100 p-2 rounded font-mono text-sm break-all">
              {config?.environment?.webhookUrls?.paymentLinksWebhook}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Validation</h2>
        <div className={`p-4 rounded ${config?.validation?.valid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          <strong>Status:</strong> {config?.validation?.valid ? '✅ Valid' : '❌ Invalid'}
        </div>
        {config?.validation?.errors?.length > 0 && (
          <div className="mt-4">
            <strong>Errors:</strong>
            <ul className="list-disc list-inside mt-2">
              {config.validation.errors.map((error: string, index: number) => (
                <li key={index} className="text-red-600">{error}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="bg-blue-50 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Next Steps</h2>
        <div className="space-y-2">
          {config?.instructions?.map((instruction: string, index: number) => (
            <div key={index} className="flex items-start">
              <span className="text-blue-600 font-bold mr-2">{index + 1}.</span>
              <span>{instruction}</span>
            </div>
          ))}
        </div>
      </div>

      {config?.environment?.mode === 'live' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mt-6">
          <h2 className="text-xl font-semibold mb-4 text-yellow-800">⚠️ Live Mode Warning</h2>
          <p className="text-yellow-700">
            You are currently using <strong>LIVE mode</strong>, which means payments will be real and charge real money. 
            For development, consider switching to TEST mode.
          </p>
        </div>
      )}
    </div>
  )
} 