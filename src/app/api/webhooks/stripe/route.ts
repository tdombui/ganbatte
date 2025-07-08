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
  
  const invoiceId = session.metadata?.invoiceId
  const jobId = session.metadata?.jobId

  if (!invoiceId) {
    console.error('No invoice ID in session metadata')
    return
  }

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

  console.log('Successfully processed payment for invoice:', invoiceId)
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log('Processing successful payment intent:', paymentIntent.id)
  
  const invoiceId = paymentIntent.metadata?.invoiceId
  const jobId = paymentIntent.metadata?.jobId

  if (!invoiceId) {
    console.error('No invoice ID in payment intent metadata')
    return
  }

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

  console.log('Successfully processed payment for invoice:', invoiceId)
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  console.log('Processing failed payment intent:', paymentIntent.id)
  
  const invoiceId = paymentIntent.metadata?.invoiceId

  if (!invoiceId) {
    console.error('No invoice ID in payment intent metadata')
    return
  }

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