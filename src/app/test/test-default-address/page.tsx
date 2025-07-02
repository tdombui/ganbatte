'use client'

import { useState } from 'react'
import { useAuthContext } from '../../providers'
import SmartNavbar from '../../components/nav/SmartNavbar'

export default function TestDefaultAddressPage() {
  const { user, loading, isAuthenticated } = useAuthContext()
  const [testResult, setTestResult] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)

  const testDefaultAddress = async () => {
    setIsLoading(true)
    setTestResult('Testing...')

    try {
      const response = await fetch('/api/getCustomerDefaultAddress')
      const data = await response.json()
      
      if (response.ok) {
        setTestResult(`✅ Success! Default address: ${data.default_address || 'Not set'}`)
      } else {
        setTestResult(`❌ Error: ${data.error}`)
      }
    } catch (error) {
      setTestResult(`❌ Network error: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  const testParseJob = async () => {
    setIsLoading(true)
    setTestResult('Testing parseJob with default address...')

    try {
      const response = await fetch('/api/parseJob', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: 'I need wheels delivered to my shop by tomorrow',
          history: '',
          overrideField: null
        })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setTestResult(`✅ ParseJob success! Dropoff: ${data.job?.dropoff || 'Not found'}`)
      } else {
        setTestResult(`❌ ParseJob error: ${data.error}`)
      }
    } catch (error) {
      setTestResult(`❌ Network error: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lime-400 mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <p>Please log in to test the default address functionality.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <SmartNavbar />
      
      <div className="pt-24 pb-12 px-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Test Default Address Functionality</h1>
          
          <div className="bg-gray-900/50 backdrop-blur border border-gray-800 rounded-xl p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Current User Info</h2>
            <div className="space-y-2 text-sm">
              <p><strong>Name:</strong> {user?.full_name || 'Not set'}</p>
              <p><strong>Email:</strong> {user?.email}</p>
              <p><strong>Role:</strong> {user?.role}</p>
              <p><strong>Default Address:</strong> {user?.customer?.default_address || 'Not set'}</p>
              <p><strong>Billing Address:</strong> {user?.customer?.billing_address || 'Not set'}</p>
            </div>
          </div>

          <div className="bg-gray-900/50 backdrop-blur border border-gray-800 rounded-xl p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">API Tests</h2>
            
            <div className="space-y-4">
              <button
                onClick={testDefaultAddress}
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
              >
                Test Default Address API
              </button>
              
              <button
                onClick={testParseJob}
                disabled={isLoading}
                className="bg-green-600 hover:bg-green-500 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 ml-4"
              >
                Test ParseJob with &quot;my shop&quot;
              </button>
            </div>
            
            {testResult && (
              <div className="mt-4 p-4 bg-gray-800 rounded-lg">
                <pre className="text-sm whitespace-pre-wrap">{testResult}</pre>
              </div>
            )}
          </div>

          <div className="bg-gray-900/50 backdrop-blur border border-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4">Instructions</h2>
            <div className="space-y-2 text-sm">
              <p>1. First, set your default address in your profile settings</p>
              <p>2. Test the Default Address API to verify it can fetch your address</p>
              <p>3. Test the ParseJob API to see if it recognizes &quot;my shop&quot; references</p>
              <p>4. Try using the chat with phrases like &quot;deliver to my shop&quot; or &quot;pickup from the shop&quot;</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 