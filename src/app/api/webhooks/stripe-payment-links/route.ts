import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { supabaseAdmin } from '@/lib/supabase/admin'

// Use test key if available, otherwise fall back to live key
const stripeSecretKey = process.env.STRIPE_SECRET_TEST_KEY || process.env.STRIPE_SECRET_KEY
if (!stripeSecretKey) {
  throw new Error('Neither STRIPE_SECRET_TEST_KEY nor STRIPE_SECRET_KEY is set')
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2025-05-28.basil',
  typescript: true,
})

const endpointSecret = process.env.STRIPE_PAYMENT_LINKS_WEBHOOK_SECRET

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
  
  const jobId = session.metadata?.job_id
  const paymentIntentId = session.payment_intent as string

  if (!jobId) {
    console.error('No job ID in session metadata')
    console.log('Session metadata:', session.metadata)
    return
  }

  console.log('Found job ID in metadata:', jobId)

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
    console.error('Error updating job payment status:', updateError)
    return
  }

  console.log('Successfully updated job payment status for job:', jobId)
  console.log('Updated job data:', updateData)
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log('Processing successful payment intent:', paymentIntent.id)
  
  // First try to find job by payment intent ID
  const { data: jobs, error: findError } = await supabaseAdmin
    .from('jobs')
    .select('id')
    .eq('stripe_payment_intent_id', paymentIntent.id)
    .limit(1)

  let jobId: string | null = null

  if (findError) {
    console.error('Error finding job by payment intent ID:', findError)
  } else if (jobs && jobs.length > 0) {
    jobId = jobs[0].id
    console.log('Found job by payment intent ID:', jobId)
  } else {
    // If not found by payment intent ID, try to find by payment link ID
    console.log('No job found by payment intent ID, checking metadata...')
    console.log('Payment intent metadata:', paymentIntent.metadata)
    
    // Look for job_id in metadata
    const metadataJobId = paymentIntent.metadata?.job_id
    if (metadataJobId) {
      jobId = metadataJobId
      console.log('Found job ID in payment intent metadata:', jobId)
    }
  }

  if (!jobId) {
    console.error('No job found for payment intent:', paymentIntent.id)
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
    console.error('Error updating job payment status:', updateError)
    return
  }

  console.log('Successfully updated job payment status for job:', jobId)
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