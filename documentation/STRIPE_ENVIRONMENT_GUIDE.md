# Stripe Environment Configuration Guide

## The Problem
Stripe has multiple environments that can be confusing:
- **Test Mode** (`sk_test_...`) - For development/testing
- **Live Mode** (`sk_live_...`) - For real payments
- **Sandbox** - Sometimes used for testing

## Current Setup Analysis

### Environment Variables You Need
Based on your current setup, you should have these environment variables:

#### For TEST Mode (Recommended for Development)
```env
# Test Keys
STRIPE_SECRET_TEST_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_TEST_KEY=pk_test_...

# Test Webhook Secrets
STRIPE_WEBHOOK_SECRET=whsec_test_...
STRIPE_PAYMENT_LINKS_WEBHOOK_SECRET=whsec_test_...

# Base URL
NEXT_PUBLIC_BASE_URL=http://localhost:3001
```

#### For LIVE Mode (Production)
```env
# Live Keys
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...

# Live Webhook Secrets
STRIPE_WEBHOOK_SECRET=whsec_live_...
STRIPE_PAYMENT_LINKS_WEBHOOK_SECRET=whsec_live_...

# Base URL
NEXT_PUBLIC_BASE_URL=https://ganbatte-liart.vercel.app
```

## How to Fix the Confusion

### Step 1: Check Your Current Environment
Visit: `http://localhost:3001/api/test/stripe-environment`

This will tell you:
- Which environment you're currently using (test vs live)
- What webhook URLs you need to configure
- Whether your environment variables are set correctly

### Step 2: Configure Stripe Dashboard

#### For TEST Mode:
1. Go to: https://dashboard.stripe.com/test/webhooks
2. Create/update webhooks with these URLs:
   - `http://localhost:3001/api/webhooks/stripe` (Enterprise payments)
   - `http://localhost:3001/api/webhooks/stripe-payment-links` (Individual job payments)
3. Copy the webhook secrets to your environment variables

#### For LIVE Mode:
1. Go to: https://dashboard.stripe.com/webhooks
2. Create/update webhooks with these URLs:
   - `https://ganbatte-liart.vercel.app/api/webhooks/stripe` (Enterprise payments)
   - `https://ganbatte-liart.vercel.app/api/webhooks/stripe-payment-links` (Individual job payments)
3. Copy the webhook secrets to your environment variables

### Step 3: Test Your Configuration

#### Test Webhook Delivery:
1. In Stripe Dashboard → Webhooks
2. Click on your webhook endpoint
3. Click "Send test webhook"
4. Choose `checkout.session.completed` event
5. Check if your endpoint receives it

#### Test Payment Flow:
1. Create a test payment
2. Check if webhook is received
3. Verify `payment_status` updates from 'pending' to 'paid'

## Environment Detection Logic

The new system automatically detects which environment to use:

1. **If you have test keys** (`STRIPE_SECRET_TEST_KEY`) → Uses TEST mode
2. **If you only have live keys** (`STRIPE_SECRET_KEY`) → Uses LIVE mode
3. **If you have both** → Prefers TEST mode for safety

## Common Issues and Solutions

### Issue: "Invalid signature" errors
**Solution:** 
- Check that webhook secret in Stripe dashboard matches your environment variable
- Ensure you're using the correct Stripe environment (test vs live)

### Issue: Payments not updating payment_status
**Solution:**
- Verify webhook URL is correct in Stripe dashboard
- Check that webhook is being delivered (look in Stripe dashboard logs)
- Ensure your endpoint is accessible from the internet

### Issue: Wrong environment being used
**Solution:**
- Set the environment variables for the environment you want to use
- Remove conflicting environment variables
- Restart your development server

## Quick Environment Switch

### To Use TEST Mode:
```env
STRIPE_SECRET_TEST_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_TEST_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_test_...
STRIPE_PAYMENT_LINKS_WEBHOOK_SECRET=whsec_test_...
```

### To Use LIVE Mode:
```env
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_live_...
STRIPE_PAYMENT_LINKS_WEBHOOK_SECRET=whsec_live_...
```

## Testing Your Setup

1. **Check Environment**: `http://localhost:3001/api/test/stripe-environment`
2. **Test Webhook**: `http://localhost:3001/api/test/debug-webhook`
3. **Test Payment Flow**: Create a test job and payment

## Key Benefits of This Approach

1. **Automatic Detection**: No more manual switching between environments
2. **Clear Configuration**: All Stripe settings in one place
3. **Better Error Messages**: Clear indication of what's wrong
4. **Consistent Behavior**: All components use the same environment
5. **Easy Debugging**: Built-in tools to check configuration

## Next Steps

1. Check your current environment: `http://localhost:3001/api/test/stripe-environment`
2. Configure your Stripe dashboard webhooks based on the output
3. Test a payment to ensure everything works
4. Deploy with the correct environment variables for production 