import { NextRequest, NextResponse } from 'next/server'
import { stripeConfig, validateStripeConfig, getStripeDebugInfo, getWebhookUrls } from '@/lib/stripe-config'

export async function GET() {
  try {
    const validation = validateStripeConfig()
    const debugInfo = getStripeDebugInfo()
    const webhookUrls = getWebhookUrls()
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      environment: {
        mode: stripeConfig.mode,
        keyType: debugInfo.keyType,
        baseUrl: stripeConfig.baseUrl,
        hasWebhookSecret: !!stripeConfig.webhookSecret,
        hasPaymentLinksWebhookSecret: !!stripeConfig.paymentLinksWebhookSecret,
        webhookUrls
      },
      validation,
      instructions: [
        '1. Check your Stripe Dashboard → Webhooks',
        `2. Ensure webhook URLs match: ${webhookUrls.enterpriseWebhook} and ${webhookUrls.paymentLinksWebhook}`,
        '3. Verify webhook secrets match your environment variables',
        '4. Test webhook delivery in Stripe dashboard',
        '5. Check that your Stripe keys match the environment you want to use'
      ],
      troubleshooting: {
        testMode: stripeConfig.mode === 'test' ? {
          message: 'Using TEST mode - payments will not be real',
          dashboardUrl: 'https://dashboard.stripe.com/test/webhooks',
          keysShouldStartWith: 'sk_test_'
        } : {
          message: 'Using LIVE mode - payments will be real',
          dashboardUrl: 'https://dashboard.stripe.com/webhooks',
          keysShouldStartWith: 'sk_live_'
        }
      }
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body
    
    if (action === 'test_webhook') {
      // Test webhook signature verification
      const testSignature = 'test_signature'
      const testBody = 'test_body'
      
      try {
        // This will fail, but we can see the error
        const stripe = new (await import('stripe')).default(stripeConfig.secretKey, {
          apiVersion: '2025-05-28.basil',
          typescript: true,
        })
        
        stripe.webhooks.constructEvent(testBody, testSignature, stripeConfig.webhookSecret)
        
        return NextResponse.json({
          success: false,
          message: 'Unexpected: webhook verification should have failed with test data'
        })
      } catch (error) {
        return NextResponse.json({
          success: true,
          message: 'Webhook verification is working (correctly rejected test data)',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }
    
    return NextResponse.json({
      success: false,
      error: 'Unknown action'
    }, { status: 400 })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 