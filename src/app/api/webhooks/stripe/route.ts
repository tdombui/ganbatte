import { NextRequest, NextResponse } from 'next/server'
import { constructWebhookEvent } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabase/admin'
import Stripe from 'stripe'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      return NextResponse.json({ error: 'No signature' }, { status: 400 })
    }

    let event: Stripe.Event

    try {
      event = constructWebhookEvent(body, signature)
    } catch (error) {
      console.error('Webhook signature verification failed:', error)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    console.log('Received Stripe webhook event:', event.type)
    console.log('Event data:', JSON.stringify(event.data, null, 2))

    // Handle the event
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
      
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ 
      error: 'Webhook handler failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  console.log('Processing completed checkout session:', session.id)
  console.log('Session metadata:', session.metadata)
  
  // Check if this is an enterprise subscription or individual job payment
  const invoiceId = session.metadata?.invoiceId
  const jobId = session.metadata?.jobId || session.metadata?.job_id
  const userId = session.metadata?.userId
  const planName = session.metadata?.planName

  // Handle Enterprise Subscription
  if (userId && planName) {
    console.log('🔔 Processing Enterprise Subscription payment')
    
    // Update enterprise subscription status
    const { error: updateError } = await supabaseAdmin
      .from('enterprise_subscriptions')
      .update({
        status: 'active',
        stripe_subscription_id: session.subscription as string,
        stripe_customer_id: session.customer as string,
      })
      .eq('customer_id', userId)

    if (updateError) {
      console.error('Error updating enterprise subscription:', updateError)
    } else {
      console.log('✅ Successfully updated enterprise subscription for user:', userId)
    }
  }
  
  // Handle Invoice Payment
  else if (invoiceId) {
    console.log('🔔 Processing Invoice payment')
    
    // Update invoice status to paid
    const { error: updateError } = await supabaseAdmin
      .from('invoices')
      .update({
        status: 'paid',
        paid_at: new Date().toISOString(),
        stripe_payment_intent_id: session.payment_intent as string,
      })
      .eq('id', invoiceId)

    if (updateError) {
      console.error('Error updating invoice status:', updateError)
      return
    }

    // Update job status if jobId is available
    if (jobId) {
      const { error: jobUpdateError } = await supabaseAdmin
        .from('jobs')
        .update({ status: 'completed' })
        .eq('id', jobId)

      if (jobUpdateError) {
        console.error('Error updating job status:', jobUpdateError)
      }
    }

    console.log('✅ Successfully processed payment for invoice:', invoiceId)
  }
  
  // Handle Individual Job Payment (Payment Link)
  else if (jobId) {
    console.log('🔔 Processing Individual Job Payment')
    
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
        stripe_payment_intent_id: session.payment_intent as string,
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
  
  else {
    console.error('❌ Unknown payment type - no recognizable metadata found')
    console.log('Session metadata:', session.metadata)
  }
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log('Processing successful payment intent:', paymentIntent.id)
  console.log('Payment intent metadata:', paymentIntent.metadata)
  
  // Check if this is an enterprise subscription or individual job payment
  const invoiceId = paymentIntent.metadata?.invoiceId
  const jobId = paymentIntent.metadata?.jobId || paymentIntent.metadata?.job_id
  const userId = paymentIntent.metadata?.userId
  const planName = paymentIntent.metadata?.planName

  // Handle Enterprise Subscription
  if (userId && planName) {
    console.log('🔔 Processing Enterprise Subscription payment intent')
    
    // Update enterprise subscription status
    const { error: updateError } = await supabaseAdmin
      .from('enterprise_subscriptions')
      .update({
        status: 'active',
        stripe_subscription_id: paymentIntent.metadata?.subscription_id,
        stripe_customer_id: paymentIntent.metadata?.customer_id,
      })
      .eq('customer_id', userId)

    if (updateError) {
      console.error('Error updating enterprise subscription:', updateError)
    } else {
      console.log('✅ Successfully updated enterprise subscription for user:', userId)
    }
  }
  
  // Handle Invoice Payment
  else if (invoiceId) {
    console.log('🔔 Processing Invoice payment intent')
    
    // Update invoice status to paid
    const { error: updateError } = await supabaseAdmin
      .from('invoices')
      .update({
        status: 'paid',
        paid_at: new Date().toISOString(),
        stripe_payment_intent_id: paymentIntent.id,
      })
      .eq('id', invoiceId)

    if (updateError) {
      console.error('Error updating invoice status:', updateError)
      return
    }

    // Update job status if jobId is available
    if (jobId) {
      const { error: jobUpdateError } = await supabaseAdmin
        .from('jobs')
        .update({ status: 'completed' })
        .eq('id', jobId)

      if (jobUpdateError) {
        console.error('Error updating job status:', jobUpdateError)
      }
    }

    console.log('✅ Successfully processed payment for invoice:', invoiceId)
  }
  
  // Handle Individual Job Payment
  else if (jobId) {
    console.log('🔔 Processing Individual Job Payment intent')
    
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
  
  else {
    console.error('❌ Unknown payment intent - no recognizable metadata found')
    console.log('Payment intent metadata:', paymentIntent.metadata)
  }
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  console.log('Processing failed payment intent:', paymentIntent.id)
  
  const invoiceId = paymentIntent.metadata?.invoiceId
  const jobId = paymentIntent.metadata?.jobId || paymentIntent.metadata?.job_id

  if (invoiceId) {
    // Update invoice status to sent (revert from any temporary status)
    const { error: updateError } = await supabaseAdmin
      .from('invoices')
      .update({
        status: 'sent',
        stripe_payment_intent_id: paymentIntent.id,
      })
      .eq('id', invoiceId)

    if (updateError) {
      console.error('Error updating invoice status:', updateError)
      return
    }

    console.log('Successfully processed failed payment for invoice:', invoiceId)
  }
  
  else if (jobId) {
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
  
  else {
    console.error('Unknown failed payment intent - no recognizable metadata found')
  }
} 