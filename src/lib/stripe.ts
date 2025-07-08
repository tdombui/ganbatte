import Stripe from 'stripe'
import { stripeConfig } from './stripe-config'

// Use the unified configuration
export const stripe = new Stripe(stripeConfig.secretKey, {
  apiVersion: '2025-05-28.basil',
  typescript: true,
})

export const createCheckoutSession = async ({
  amount,
  currency = 'usd',
  customerEmail,
  invoiceId,
  jobId,
  successUrl,
  cancelUrl,
}: {
  amount: number
  currency?: string
  customerEmail: string
  invoiceId: string
  jobId: string
  successUrl: string
  cancelUrl: string
}) => {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: currency,
            product_data: {
              name: `Job Invoice #${invoiceId}`,
              description: `Payment for job ${jobId}`,
            },
            unit_amount: Math.round(amount * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: customerEmail,
      metadata: {
        invoiceId,
        jobId,
      },
      payment_intent_data: {
        metadata: {
          invoiceId,
          jobId,
        },
      },
    })

    return session
  } catch (error) {
    console.error('Error creating checkout session:', error)
    throw error
  }
}

export const constructWebhookEvent = (body: string, signature: string) => {
  const webhookSecret = stripeConfig.webhookSecret
  
  if (!webhookSecret) {
    throw new Error('Webhook secret is not configured')
  }

  try {
    return stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (error) {
    console.error('Webhook signature verification failed:', error)
    throw error
  }
} 