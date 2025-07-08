'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuthContext } from '../../../providers'
import SmartNavbar from '../../../components/nav/SmartNavbar'
import { CheckCircle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { InvoiceWithJob } from '@/types/invoice'

export default function InvoiceSuccessPage() {
  const params = useParams()
  const router = useRouter()
  const { loading: authLoading, isAuthenticated } = useAuthContext()
  const [loading, setLoading] = useState(true)
  const [invoice, setInvoice] = useState<InvoiceWithJob | null>(null)

  useEffect(() => {
    if (authLoading) return

    if (!isAuthenticated) {
      router.push('/auth')
      return
    }

    fetchInvoice()
  }, [params.id, authLoading, isAuthenticated, router])

  const fetchInvoice = async () => {
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        router.push('/auth')
        return
      }

      const res = await fetch(`/api/invoices/${params.id}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (res.ok) {
        const data = await res.json()
        setInvoice(data.invoice)
      }
    } catch (err) {
      console.error('Error fetching invoice:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950">
        <SmartNavbar />
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-950">
      <SmartNavbar />
      
      <div className="max-w-2xl mx-auto py-12 px-4">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="flex justify-center mb-6">
            <CheckCircle className="text-green-500" size={64} />
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Payment Successful!
          </h1>
          
          <p className="text-gray-600 mb-8">
            Thank you for your payment. Your invoice has been marked as paid.
          </p>

          {invoice && (
            <div className="bg-gray-50 rounded-lg p-6 mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Invoice Details
              </h2>
              <div className="space-y-2 text-left">
                <p><span className="font-medium">Invoice Number:</span> {invoice.invoice_number}</p>
                <p><span className="font-medium">Amount:</span> {invoice.currency.toUpperCase()} {invoice.amount.toFixed(2)}</p>
                <p><span className="font-medium">Job ID:</span> {invoice.job.id}</p>
                <p><span className="font-medium">Status:</span> <span className="text-green-600 font-medium">Paid</span></p>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href={`/invoice/${params.id}`}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              View Invoice
            </Link>
            
            <Link
              href="/jobs"
              className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <ArrowLeft size={16} />
              Back to Jobs
            </Link>
          </div>

          <p className="text-sm text-gray-500 mt-8">
            A confirmation email has been sent to your email address.
          </p>
        </div>
      </div>
    </div>
  )
} 