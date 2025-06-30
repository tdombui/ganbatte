'use client'

import { useEffect, useState } from 'react'
import { createClient } from '../../../lib/supabase/client'

export default function TestClientPage() {
  const [status, setStatus] = useState('Loading...')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function testSupabase() {
      try {
        setStatus('Testing Supabase connection...')
        
        // Test basic connection
        const { error } = await createClient()
          .from('profiles')
          .select('count')
          .limit(1)
        
        if (error) {
          setError(`Supabase error: ${error.message}`)
          setStatus('Failed')
        } else {
          setStatus('Supabase connection successful!')
        }
      } catch (err) {
        setError(`Unexpected error: ${err instanceof Error ? err.message : 'Unknown error'}`)
        setStatus('Failed')
      }
    }

    testSupabase()
  }, [])

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Client-Side Supabase Test</h1>
      <div className="space-y-4">
        <div>
          <strong>Status:</strong> {status}
        </div>
        {error && (
          <div className="text-red-500">
            <strong>Error:</strong> {error}
          </div>
        )}
        <div>
          <strong>Environment Variables:</strong>
          <ul className="mt-2 space-y-1">
            <li>NEXT_PUBLIC_SUPABASE_URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Not set'}</li>
            <li>NEXT_PUBLIC_SUPABASE_ANON_KEY: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Not set'}</li>
          </ul>
        </div>
      </div>
    </div>
  )
} 