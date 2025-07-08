import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { createCheckoutSession } from '@/lib/stripe'
import { sendInvoiceEmail } from '@/lib/email'
import { CreateInvoiceSchema } from '@/types/invoice'
import { z } from 'zod'

export async function POST(request: NextRequest) {
  try {
    // Get auth token
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is staff/admin
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const isStaff = profile.role === 'staff' || profile.role === 'admin'
    if (!isStaff) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = CreateInvoiceSchema.parse(body)

    // Get job details
    const { data: job, error: jobError } = await supabaseAdmin
      .from('jobs')
      .select(`
        *,
        customer:customers(
          id,
          profiles!inner(email, full_name)
        )
      `)
      .eq('id', validatedData.jobId)
      .single()

    if (jobError || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    // Check if invoice already exists for this job
    const { data: existingInvoice } = await supabaseAdmin
      .from('invoices')
      .select('id')
      .eq('job_id', validatedData.jobId)
      .single()

    if (existingInvoice) {
      return NextResponse.json({ 
        error: 'Invoice already exists for this job',
        invoiceId: existingInvoice.id 
      }, { status: 400 })
    }

    // Create invoice in database
    const invoiceData = {
      job_id: validatedData.jobId,
      customer_id: job.customer_id,
      amount: validatedData.amount,
      currency: validatedData.currency,
      due_date: validatedData.dueDate,
      notes: validatedData.notes,
      status: 'draft' as const,
    }

    const { data: invoice, error: invoiceError } = await supabaseAdmin
      .from('invoices')
      .insert([invoiceData])
      .select()
      .single()

    if (invoiceError) {
      console.error('Error creating invoice:', invoiceError)
      return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 })
    }

    // Create Stripe checkout session
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const successUrl = `${baseUrl}/invoice/${invoice.id}/success`
    const cancelUrl = `${baseUrl}/job/${validatedData.jobId}`

    const session = await createCheckoutSession({
      amount: validatedData.amount,
      currency: validatedData.currency.toLowerCase(),
      customerEmail: job.customer.profiles.email,
      invoiceId: invoice.id,
      jobId: validatedData.jobId,
      successUrl,
      cancelUrl,
    })

    // Update invoice with Stripe session ID
    const { error: updateError } = await supabaseAdmin
      .from('invoices')
      .update({ 
        stripe_checkout_session_id: session.id,
        status: 'sent',
        sent_at: new Date().toISOString(),
        email_sent_to: job.customer.profiles.email
      })
      .eq('id', invoice.id)

    if (updateError) {
      console.error('Error updating invoice with session ID:', updateError)
    }

    // Send email to customer
    try {
      await sendInvoiceEmail({
        to: job.customer.profiles.email,
        invoiceNumber: invoice.invoice_number,
        amount: validatedData.amount,
        currency: validatedData.currency,
        jobId: validatedData.jobId,
        pickup: job.pickup || 'N/A',
        dropoff: job.dropoff || 'N/A',
        checkoutUrl: session.url!,
        dueDate: validatedData.dueDate,
        notes: validatedData.notes,
      })
    } catch (emailError) {
      console.error('Error sending invoice email:', emailError)
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      invoice,
      checkoutUrl: session.url,
    })

  } catch (error) {
    console.error('Error creating invoice:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Invalid request data',
        details: error.errors 
      }, { status: 400 })
    }

    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 