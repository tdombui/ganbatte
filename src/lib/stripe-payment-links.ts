import Stripe from 'stripe'
import { stripeConfig } from './stripe-config'

export const stripe = new Stripe(stripeConfig.secretKey, {
  apiVersion: '2025-05-28.basil',
  typescript: true,
})

export interface CreatePaymentLinkParams {
  amount: number
  currency?: string
  description: string
  customerEmail?: string
  metadata?: Record<string, string>
  successUrl?: string
  cancelUrl?: string
}

export const createPaymentLink = async ({
  amount,
  currency = 'usd',
  description,
  customerEmail,
  metadata = {},
  successUrl,
}: CreatePaymentLinkParams) => {
  try {
    const paymentLink = await stripe.paymentLinks.create({
      line_items: [
        {
          price_data: {
            currency: currency,
            product_data: {
              name: description,
              description: description,
            },
            unit_amount: Math.round(amount * 100), // Convert to cents
          },
          quantity: 1,
        } as any,
      ],
      after_completion: { type: 'redirect', redirect: { url: successUrl || 'https://ganbatte.com/success' } },
      metadata,
      ...(customerEmail && { customer_creation: 'always' }),
    })

    return paymentLink
  } catch (error) {
    console.error('Error creating payment link:', error)
    throw error
  }
}

// For recurring payments (subscriptions)
export interface CreateSubscriptionParams {
  customerEmail: string
  priceId: string // Stripe Price ID
  metadata?: Record<string, string>
  successUrl?: string
  cancelUrl?: string
}

export const createSubscriptionLink = async ({
  customerEmail,
  priceId,
  metadata = {},
  successUrl,
  cancelUrl,
}: CreateSubscriptionParams) => {
  try {
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer_email: customerEmail,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl || 'https://ganbatte.com/success',
      cancel_url: cancelUrl || 'https://ganbatte.com/cancel',
      metadata,
    })

    return checkoutSession
  } catch (error) {
    console.error('Error creating subscription:', error)
    throw error
  }
} 