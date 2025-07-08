import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import Stripe from 'stripe'

// Use test key if available, otherwise fall back to live key
const stripeSecretKey = process.env.STRIPE_SECRET_TEST_KEY || process.env.STRIPE_SECRET_KEY
if (!stripeSecretKey) {
  throw new Error('Neither STRIPE_SECRET_TEST_KEY nor STRIPE_SECRET_KEY is set')
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2025-05-28.basil',
  typescript: true,
})

// Debug: Check which key we're using (safe to log first few characters)
console.log('🔍 Using Stripe key type:', stripeSecretKey.startsWith('sk_test_') ? 'TEST' : 'LIVE')
console.log('🔍 Key starts with:', stripeSecretKey.substring(0, 10) + '...')

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

    // Get user profile for email
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('email, role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Parse request body
    const body = await request.json()
    const { amount, description, jobId, metadata = {} } = body

    if (!amount || !description) {
      return NextResponse.json({ error: 'Amount and description are required' }, { status: 400 })
    }

    // Create a one-time price for this payment
    const price = await stripe.prices.create({
      currency: 'usd',
      product_data: {
        name: description,
      },
      unit_amount: Math.round(amount * 100), // Convert to cents
    })

    // Create Stripe payment link
    const paymentLink = await stripe.paymentLinks.create({
      line_items: [
        {
          price: price.id,
          quantity: 1,
        },
      ],
      after_completion: { 
        type: 'redirect', 
        redirect: { url: `https://ganbatte-liart.vercel.app/job/${jobId}?payment=success` } 
      },
      metadata: {
        ...metadata,
        job_id: jobId,
        created_by: user.id,
        created_at: new Date().toISOString(),
      },
    })

    // Update job with payment link information if jobId is provided
    if (jobId) {
      const { error: updateError } = await supabaseAdmin
        .from('jobs')
        .update({
          stripe_payment_link_id: paymentLink.id,
          payment_amount: amount,
          payment_status: 'pending'
        })
        .eq('id', jobId)

      if (updateError) {
        console.error('Error updating job with payment link:', updateError)
      }
    }

    return NextResponse.json({
      success: true,
      paymentLink: {
        url: paymentLink.url,
        id: paymentLink.id,
      },
    })

  } catch (error) {
    console.error('Error creating payment link:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 