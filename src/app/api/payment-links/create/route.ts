import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { stripeConfig } from '@/lib/stripe-config'
import Stripe from 'stripe'

const stripe = new Stripe(stripeConfig.secretKey, {
  apiVersion: '2025-05-28.basil',
  typescript: true,
})

// Debug: Check which key we're using (safe to log first few characters)
console.log('🔍 Using Stripe key type:', stripeConfig.secretKey.startsWith('sk_test_') ? 'TEST' : 'LIVE')
console.log('🔍 Key starts with:', stripeConfig.secretKey.substring(0, 10) + '...')

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

    // Determine success URL based on product type
    let successUrl = `${stripeConfig.baseUrl}/payment-success`
    
    if (jobId) {
      // Job payment - redirect to job page
      successUrl = `${stripeConfig.baseUrl}/job/${jobId}?payment=success`
    } else if (metadata.product === 'bumper_sticker') {
      // Sticker product - redirect to sticker success page
      successUrl = `${stripeConfig.baseUrl}/shop/sticker/success`
    }

    // Create a one-time price for this payment
    const price = await stripe.prices.create({
      currency: 'usd',
      product_data: {
        name: description,
      },
      unit_amount: Math.round(amount * 100), // Convert to cents
    })

    // Prepare metadata for payment link
    const paymentLinkMetadata = {
      ...metadata,
      job_id: jobId,
      created_by: user.id,
      created_at: new Date().toISOString(),
    }

    console.log('🔍 Creating payment link with metadata:', paymentLinkMetadata)

    console.log('🔍 Success URL:', successUrl)

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
        redirect: { url: successUrl } 
      },
      metadata: paymentLinkMetadata,
    })

    console.log('✅ Created payment link:', paymentLink.id)
    console.log('✅ Payment link metadata:', paymentLink.metadata)
    console.log('✅ Payment link URL:', paymentLink.url)

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
      } else {
        console.log('✅ Updated job with payment link ID:', paymentLink.id)
      }
    }

    return NextResponse.json({
      success: true,
      paymentLink: {
        url: paymentLink.url,
        id: paymentLink.id,
        metadata: paymentLink.metadata
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