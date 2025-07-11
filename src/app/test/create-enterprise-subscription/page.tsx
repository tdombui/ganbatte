'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function CreateEnterpriseSubscriptionTest() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<Record<string, unknown> | null>(null)
  const [planName, setPlanName] = useState('GT Pro')

  const handleCreateSubscription = async () => {
    setLoading(true)
    setResult(null)

    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        setResult({ error: 'Not authenticated' })
        return
      }

      const response = await fetch('/api/test/create-test-enterprise-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ planName }),
      })

      const data = await response.json()
      setResult(data)

    } catch (error) {
      setResult({ error: 'Failed to create subscription', details: error })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Create Test Enterprise Subscription</h1>
        
        <div className="bg-gray-800 p-6 rounded-lg mb-6">
          <h2 className="text-xl font-semibold mb-4">Select Plan</h2>
          
          <div className="space-y-3 mb-6">
            <label className="flex items-center">
              <input
                type="radio"
                name="plan"
                value="GT Starter"
                checked={planName === 'GT Starter'}
                onChange={(e) => setPlanName(e.target.value)}
                className="mr-3"
              />
              <span>GT Starter - 6 tokens/month ($600)</span>
            </label>
            
            <label className="flex items-center">
              <input
                type="radio"
                name="plan"
                value="GT Pro"
                checked={planName === 'GT Pro'}
                onChange={(e) => setPlanName(e.target.value)}
                className="mr-3"
              />
              <span>GT Pro - 13 tokens/month ($1,200)</span>
            </label>
            
            <label className="flex items-center">
              <input
                type="radio"
                name="plan"
                value="GT Ultra"
                checked={planName === 'GT Ultra'}
                onChange={(e) => setPlanName(e.target.value)}
                className="mr-3"
              />
              <span>GT Ultra - 22 tokens/month ($2,000)</span>
            </label>
          </div>

          <button
            onClick={handleCreateSubscription}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-6 py-3 rounded-lg font-semibold"
          >
            {loading ? 'Creating...' : 'Create Test Subscription'}
          </button>
        </div>

        {result && (
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Result</h2>
            <pre className="bg-gray-900 p-4 rounded text-sm overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}

        <div className="mt-8 bg-blue-900 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">What This Does:</h3>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>Creates an enterprise subscription for your current user account</li>
            <li>Gives you the specified number of tokens per month</li>
            <li>Sets the subscription as 'active'</li>
            <li>Allows you to test the enterprise customer UI</li>
            <li>No real payment is processed</li>
          </ul>
        </div>
      </div>
    </div>
  )
} 