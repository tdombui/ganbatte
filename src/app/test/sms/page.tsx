'use client'

import { useState } from 'react'
import { SMSResponse } from '@/lib/aws-sns'

export default function SMSTestPage() {
  const [phoneNumber, setPhoneNumber] = useState('')
  const [message, setMessage] = useState('')
  const [testType, setTestType] = useState('default')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; result: SMSResponse; timestamp: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/test/sms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber,
          message,
          testType,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send SMS')
      }

      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const testTypes = [
    { value: 'default', label: 'Default Test Message' },
    { value: 'delivery_update', label: 'Delivery Update' },
    { value: 'job_confirmation', label: 'Job Confirmation' },
    { value: 'custom', label: 'Custom Message' },
  ]

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">AWS SNS SMS Test</h1>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h2 className="text-lg font-semibold text-blue-800 mb-2">Setup Required</h2>
        <p className="text-blue-700 mb-2">
          Before testing, make sure you have these environment variables set:
        </p>
        <ul className="text-sm text-blue-600 space-y-1">
          <li>• AWS_ACCESS_KEY_ID</li>
          <li>• AWS_SECRET_ACCESS_KEY</li>
          <li>• AWS_REGION (optional, defaults to us-east-1)</li>
        </ul>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number *
          </label>
          <input
            type="tel"
            id="phoneNumber"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="+1234567890 or 1234567890"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label htmlFor="testType" className="block text-sm font-medium text-gray-700 mb-1">
            Test Type
          </label>
          <select
            id="testType"
            value={testType}
            onChange={(e) => setTestType(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {testTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {testType === 'custom' && (
          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
              Custom Message *
            </label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter your custom message..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Sending...' : 'Send Test SMS'}
        </button>
      </form>

      {error && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="text-lg font-semibold text-red-800 mb-2">Error</h3>
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {result && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h3 className="text-lg font-semibold text-green-800 mb-2">Success!</h3>
          <pre className="text-sm text-green-700 whitespace-pre-wrap">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}

      <div className="mt-8 p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Test Examples</h3>
        <div className="space-y-2 text-sm text-gray-600">
          <p><strong>Delivery Update:</strong> Sends a delivery status update with job ID and estimated time</p>
          <p><strong>Job Confirmation:</strong> Sends a job creation confirmation with pickup/dropoff addresses</p>
          <p><strong>Custom Message:</strong> Send any custom message you want to test</p>
        </div>
      </div>
    </div>
  )
} 