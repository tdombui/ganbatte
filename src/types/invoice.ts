import { z } from 'zod'

// Zod schemas for validation
export const CreateInvoiceSchema = z.object({
  jobId: z.string().uuid(),
  amount: z.number().positive(),
  currency: z.string().length(3).default('USD'),
  dueDate: z.string().datetime().optional(),
  notes: z.string().optional(),
})

export const InvoiceStatusSchema = z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled'])

// TypeScript interfaces
export interface Invoice {
  id: string
  job_id: string
  customer_id: string
  invoice_number: string
  amount: number
  currency: string
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
  stripe_payment_intent_id?: string
  stripe_checkout_session_id?: string
  due_date?: string
  paid_at?: string
  sent_at?: string
  email_sent_to?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface InvoiceWithJob extends Invoice {
  job: {
    id: string
    pickup: string
    dropoff: string
    parts: string[]
    status: string
    created_at: string
  }
  customer: {
    id: string
    email: string
    full_name: string
  }
}

export interface CreateInvoiceRequest {
  jobId: string
  amount: number
  currency?: string
  dueDate?: string
  notes?: string
}

export interface CreateInvoiceResponse {
  success: boolean
  invoice: Invoice
  checkoutUrl?: string
  error?: string
}

export interface SendInvoiceRequest {
  invoiceId: string
  email: string
  message?: string
}

export interface SendInvoiceResponse {
  success: boolean
  message?: string
  error?: string
}

// Database types for Supabase
export type Database = {
  public: {
    Tables: {
      invoices: {
        Row: Invoice
        Insert: Omit<Invoice, 'id' | 'created_at' | 'updated_at' | 'invoice_number'>
        Update: Partial<Omit<Invoice, 'id' | 'created_at' | 'updated_at'>>
      }
    }
  }
} 