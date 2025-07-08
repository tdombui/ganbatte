// Stripe Environment Configuration
// This file ensures all Stripe operations use the same environment

export interface StripeConfig {
  mode: 'test' | 'live'
  secretKey: string
  publishableKey: string
  webhookSecret: string
  paymentLinksWebhookSecret: string
  baseUrl: string
}

// Determine which environment we're using
function getStripeEnvironment(): StripeConfig {
  const testKey = process.env.STRIPE_SECRET_TEST_KEY
  const liveKey = process.env.STRIPE_SECRET_KEY
  const testPublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_TEST_KEY
  const livePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  
  // Check if we have test keys configured
  if (testKey && testPublishableKey) {
    console.log('🔍 Using Stripe TEST environment')
    return {
      mode: 'test',
      secretKey: testKey,
      publishableKey: testPublishableKey,
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
      paymentLinksWebhookSecret: process.env.STRIPE_PAYMENT_LINKS_WEBHOOK_SECRET || '',
      baseUrl: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001'
    }
  }
  
  // Fall back to live keys
  if (liveKey && livePublishableKey) {
    console.log('🔍 Using Stripe LIVE environment')
    return {
      mode: 'live',
      secretKey: liveKey,
      publishableKey: livePublishableKey,
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
      paymentLinksWebhookSecret: process.env.STRIPE_PAYMENT_LINKS_WEBHOOK_SECRET || '',
      baseUrl: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001'
    }
  }
  
  throw new Error('No valid Stripe keys configured. Please set either test or live keys.')
}

export const stripeConfig = getStripeEnvironment()

// Helper functions
export function isTestMode(): boolean {
  return stripeConfig.mode === 'test'
}

export function isLiveMode(): boolean {
  return stripeConfig.mode === 'live'
}

export function getStripeKeyType(): string {
  return stripeConfig.secretKey.startsWith('sk_test_') ? 'TEST' : 'LIVE'
}

// Validation function
export function validateStripeConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (!stripeConfig.secretKey) {
    errors.push('Missing Stripe secret key')
  }
  
  if (!stripeConfig.publishableKey) {
    errors.push('Missing Stripe publishable key')
  }
  
  if (!stripeConfig.webhookSecret) {
    errors.push('Missing webhook secret')
  }
  
  if (!stripeConfig.paymentLinksWebhookSecret) {
    errors.push('Missing payment links webhook secret')
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

// Environment-specific URLs
export function getWebhookUrls() {
  const baseUrl = stripeConfig.baseUrl
  return {
    enterpriseWebhook: `${baseUrl}/api/webhooks/stripe`,
    paymentLinksWebhook: `${baseUrl}/api/webhooks/stripe-payment-links`
  }
}

// Debug information
export function getStripeDebugInfo() {
  return {
    mode: stripeConfig.mode,
    keyType: getStripeKeyType(),
    hasWebhookSecret: !!stripeConfig.webhookSecret,
    hasPaymentLinksWebhookSecret: !!stripeConfig.paymentLinksWebhookSecret,
    webhookUrls: getWebhookUrls(),
    baseUrl: stripeConfig.baseUrl
  }
} 