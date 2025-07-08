'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuthContext } from '../../providers'
import SmartNavbar from '../../components/nav/SmartNavbar'
import { InvoiceWithJob } from '@/types/invoice'
import { CheckCircle, Clock, AlertCircle, CreditCard, Download, Mail } from 'lucide-react'

export default function InvoicePage() {
  const params = useParams()
  const { loading: authLoading, isAuthenticated } = useAuthContext()
  const [invoice, setInvoice] = useState<InvoiceWithJob | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (authLoading) return

    if (!isAuthenticated) {
      setError('Please sign in to view this invoice')
      setLoading(false)
      return
    }

    fetchInvoice()
  }, [params.id, authLoading, isAuthenticated])

  const fetchInvoice = async () => {
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        setError('No session token available')
        setLoading(false)
        return
      }

      const res = await fetch(`/api/invoices/${params.id}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!res.ok) {
        const errorData = await res.json()
        setError(errorData.error || 'Failed to load invoice')
        setLoading(false)
        return
      }

      const data = await res.json()
      setInvoice(data.invoice)
    } catch (err) {
      console.error('Error fetching invoice:', err)
      setError('Failed to load invoice')
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="text-green-500" size={20} />
      case 'sent':
        return <Mail className="text-blue-500" size={20} />
      case 'overdue':
        return <AlertCircle className="text-red-500" size={20} />
      default:
        return <Clock className="text-yellow-500" size={20} />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'text-green-500 bg-green-100'
      case 'sent':
        return 'text-blue-500 bg-blue-100'
      case 'overdue':
        return 'text-red-500 bg-red-100'
      default:
        return 'text-yellow-500 bg-yellow-100'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const handlePayNow = () => {
    if (invoice?.stripe_checkout_session_id) {
      // Redirect to Stripe Checkout
      window.location.href = `https://checkout.stripe.com/pay/${invoice.stripe_checkout_session_id}`
    }
  }

  const handlePrint = () => {
    window.print()
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

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-neutral-950">
        <SmartNavbar />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-white text-lg">{error || 'Invoice not found'}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-950">
      <SmartNavbar />
      
      <div className="max-w-4xl mx-auto py-12 px-4">
        {/* Invoice Header */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Invoice #{invoice.invoice_number}</h1>
              <p className="text-gray-600 mt-2">Ganbatte Delivery</p>
              <p className="text-gray-600">1305 S Marine St, Santa Ana, CA 92704</p>
            </div>
            
            <div className="text-right">
              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(invoice.status)}`}>
                {getStatusIcon(invoice.status)}
                {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
              </div>
              <p className="text-gray-600 mt-2">Created: {formatDate(invoice.created_at)}</p>
              {invoice.due_date && (
                <p className="text-gray-600">Due: {formatDate(invoice.due_date)}</p>
              )}
            </div>
          </div>

          {/* Customer Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Bill To:</h3>
              <p className="text-gray-700">{invoice.customer.full_name}</p>
              <p className="text-gray-700">{invoice.customer.email}</p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Job Details:</h3>
              <p className="text-gray-700">Job ID: {invoice.job.id}</p>
              <p className="text-gray-700">Status: {invoice.job.status}</p>
            </div>
          </div>

          {/* Job Details */}
          <div className="border-t border-gray-200 pt-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Service Details:</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Pickup Location:</p>
                  <p className="font-medium">{invoice.job.pickup || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Dropoff Location:</p>
                  <p className="font-medium">{invoice.job.dropoff || 'N/A'}</p>
                </div>
              </div>
              {invoice.job.parts && invoice.job.parts.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm text-gray-600">Parts:</p>
                  <p className="font-medium">{invoice.job.parts.join(', ')}</p>
                </div>
              )}
            </div>
          </div>

          {/* Amount */}
          <div className="border-t border-gray-200 pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600">Total Amount:</p>
                <p className="text-3xl font-bold text-gray-900">
                  {invoice.currency.toUpperCase()} {invoice.amount.toFixed(2)}
                </p>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <Download size={16} />
                  Print
                </button>
                
                {invoice.status === 'sent' && invoice.stripe_checkout_session_id && (
                  <button
                    onClick={handlePayNow}
                    className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                  >
                    <CreditCard size={16} />
                    Pay Now
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="border-t border-gray-200 pt-6 mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Notes:</h3>
              <p className="text-gray-700">{invoice.notes}</p>
            </div>
          )}
        </div>

        {/* Payment Status */}
        {invoice.status === 'paid' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-8">
            <div className="flex items-center gap-2">
              <CheckCircle className="text-green-500" size={20} />
              <p className="text-green-800 font-medium">Payment Completed</p>
            </div>
            <p className="text-green-700 mt-1">
              Paid on {invoice.paid_at ? formatDate(invoice.paid_at) : 'N/A'}
            </p>
          </div>
        )}

        {invoice.status === 'overdue' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
            <div className="flex items-center gap-2">
              <AlertCircle className="text-red-500" size={20} />
              <p className="text-red-800 font-medium">Payment Overdue</p>
            </div>
            <p className="text-red-700 mt-1">
              Please make payment as soon as possible
            </p>
          </div>
        )}
      </div>
    </div>
  )
} 