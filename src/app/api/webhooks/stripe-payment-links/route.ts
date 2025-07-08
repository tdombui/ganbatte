import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { stripeConfig } from '@/lib/stripe-config'

const stripe = new Stripe(stripeConfig.secretKey, {
  apiVersion: '2025-05-28.basil',
  typescript: true,
})

const endpointSecret = stripeConfig.paymentLinksWebhookSecret

export async function POST(request: NextRequest) {
  console.log('🔔 Webhook received!')
  const body = await request.text()
  const headersList = await headers()
  const sig = headersList.get('stripe-signature')

  console.log('🔔 Webhook headers:', {
    'stripe-signature': sig ? 'present' : 'missing',
    'content-type': headersList.get('content-type'),
    'user-agent': headersList.get('user-agent')
  })

  if (!sig || !endpointSecret) {
    console.error('Missing stripe signature or endpoint secret')
    console.error('Signature:', sig ? 'present' : 'missing')
    console.error('Endpoint secret:', endpointSecret ? 'present' : 'missing')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  console.log('Received Stripe webhook event:', event.type)
  console.log('Event data:', JSON.stringify(event.data, null, 2))

  try {
    console.log('🔔 Processing webhook event type:', event.type)
    
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session)
        break
      
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent)
        break
      
      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent)
        break
      
      case 'invoice.payment_succeeded':
        console.log('Invoice payment succeeded event received')
        break
      
      case 'payment_link.created':
        console.log('Payment link created event received')
        break
      
      case 'payment_link.updated':
        console.log('Payment link updated event received')
        break
      
      default:
        console.log(`Unhandled event type: ${event.type}`)
        console.log('Event data:', JSON.stringify(event.data, null, 2))
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Error processing webhook:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  console.log('Processing completed checkout session:', session.id)
  console.log('Session metadata:', session.metadata)
  console.log('Session payment_link:', session.payment_link)
  console.log('Session payment_intent:', session.payment_intent)
  
  // Try multiple strategies to find the job ID
  let jobId = session.metadata?.job_id || session.metadata?.jobId
  
  // If not in session metadata, try to find it in the payment link metadata
  if (!jobId && session.payment_link) {
    try {
      const paymentLink = await stripe.paymentLinks.retrieve(session.payment_link as string)
      jobId = paymentLink.metadata?.job_id || paymentLink.metadata?.jobId
      console.log('Found job ID in payment link metadata:', jobId)
      console.log('Payment link metadata:', paymentLink.metadata)
    } catch (error) {
      console.error('Error retrieving payment link:', error)
    }
  }
  
  // If still not found, try to find job by payment link ID
  if (!jobId && session.payment_link) {
    const { data: jobs, error: findError } = await supabaseAdmin
      .from('jobs')
      .select('id, payment_status, stripe_payment_link_id')
      .eq('stripe_payment_link_id', session.payment_link)
      .limit(1)

    if (!findError && jobs && jobs.length > 0) {
      jobId = jobs[0].id
      console.log('Found job by payment link ID:', jobId)
      console.log('Job payment status:', jobs[0].payment_status)
    }
  }

  // If still not found, try to find job by payment intent ID
  if (!jobId && session.payment_intent) {
    const { data: jobs, error: findError } = await supabaseAdmin
      .from('jobs')
      .select('id, payment_status, stripe_payment_intent_id')
      .eq('stripe_payment_intent_id', session.payment_intent as string)
      .limit(1)

    if (!findError && jobs && jobs.length > 0) {
      jobId = jobs[0].id
      console.log('Found job by payment intent ID:', jobId)
      console.log('Job payment status:', jobs[0].payment_status)
    }
  }

  if (!jobId) {
    console.error('❌ No job ID found in any metadata or database lookup')
    console.log('Session metadata:', session.metadata)
    console.log('Session payment_link:', session.payment_link)
    console.log('Session payment_intent:', session.payment_intent)
    return
  }

  console.log('✅ Found job ID:', jobId)
  const paymentIntentId = session.payment_intent as string

  // Check current job status
  const { data: currentJob, error: jobError } = await supabaseAdmin
    .from('jobs')
    .select('payment_status, stripe_payment_intent_id, paid_at')
    .eq('id', jobId)
    .single()

  if (jobError) {
    console.error('Error fetching current job status:', jobError)
    return
  }

  console.log('Current job status:', currentJob)

  // Only update if not already paid
  if (currentJob.payment_status === 'paid') {
    console.log('Job already marked as paid, skipping update')
    return
  }

  // Update job payment status to paid
  const { data: updateData, error: updateError } = await supabaseAdmin
    .from('jobs')
    .update({
      payment_status: 'paid',
      stripe_payment_intent_id: paymentIntentId,
      paid_at: new Date().toISOString(),
      status: 'pending' // Change job status to pending (ready for staff to process)
    })
    .eq('id', jobId)
    .select()

  if (updateError) {
    console.error('❌ Error updating job payment status:', updateError)
    return
  }

  console.log('✅ Successfully updated job payment status for job:', jobId)
  console.log('Updated job data:', updateData)
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log('Processing successful payment intent:', paymentIntent.id)
  console.log('Payment intent metadata:', paymentIntent.metadata)
  
  // Try multiple strategies to find the job ID
  let jobId = paymentIntent.metadata?.job_id || paymentIntent.metadata?.jobId
  
  // First try to find job by payment intent ID
  if (!jobId) {
    const { data: jobs, error: findError } = await supabaseAdmin
      .from('jobs')
      .select('id, payment_status')
      .eq('stripe_payment_intent_id', paymentIntent.id)
      .limit(1)

    if (!findError && jobs && jobs.length > 0) {
      jobId = jobs[0].id
      console.log('Found job by payment intent ID:', jobId)
      console.log('Job payment status:', jobs[0].payment_status)
    }
  }

  if (!jobId) {
    console.error('❌ No job found for payment intent:', paymentIntent.id)
    console.log('Payment intent metadata:', paymentIntent.metadata)
    return
  }

  // Check current job status
  const { data: currentJob, error: jobError } = await supabaseAdmin
    .from('jobs')
    .select('payment_status, paid_at')
    .eq('id', jobId)
    .single()

  if (jobError) {
    console.error('Error fetching current job status:', jobError)
    return
  }

  console.log('Current job status:', currentJob)

  // Only update if not already paid
  if (currentJob.payment_status === 'paid') {
    console.log('Job already marked as paid, skipping update')
    return
  }

  // Update job payment status to paid
  const { data: updateData, error: updateError } = await supabaseAdmin
    .from('jobs')
    .update({
      payment_status: 'paid',
      stripe_payment_intent_id: paymentIntent.id,
      paid_at: new Date().toISOString(),
      status: 'pending' // Change job status to pending (ready for staff to process)
    })
    .eq('id', jobId)
    .select()

  if (updateError) {
    console.error('❌ Error updating job payment status:', updateError)
    return
  }

  console.log('✅ Successfully updated job payment status for job:', jobId)
  console.log('Updated job data:', updateData)
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  console.log('Processing failed payment intent:', paymentIntent.id)
  
  // Find job by payment intent ID
  const { data: jobs, error: findError } = await supabaseAdmin
    .from('jobs')
    .select('id')
    .eq('stripe_payment_intent_id', paymentIntent.id)
    .limit(1)

  if (findError || !jobs || jobs.length === 0) {
    console.error('No job found for payment intent:', paymentIntent.id)
    return
  }

  const jobId = jobs[0].id

  // Update job payment status to failed
  const { error: updateError } = await supabaseAdmin
    .from('jobs')
    .update({
      payment_status: 'failed'
    })
    .eq('id', jobId)

  if (updateError) {
    console.error('Error updating job payment status:', updateError)
    return
  }

  console.log('Successfully updated job payment status to failed for job:', jobId)
} 