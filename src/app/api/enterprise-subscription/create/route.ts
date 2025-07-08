import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set')
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-05-28.basil',
  typescript: true,
})

// Map plan names to Stripe product IDs
const PLAN_PRODUCT_IDS = {
  'GT Starter': 'prod_SdgPYLO1UwjHWu',
  'GT Pro': 'prod_SdgIrH16uTIV52',
  'GT Ultra': 'prod_SdgRT2mNjxVncW'
}

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

    // Parse request body
    const body = await request.json()
    const { planName } = body

    if (!planName || !PLAN_PRODUCT_IDS[planName as keyof typeof PLAN_PRODUCT_IDS]) {
      return NextResponse.json({ error: 'Invalid plan name' }, { status: 400 })
    }

    // Create Stripe checkout session for subscription
    const session = await stripe.checkout.sessions.create({
      customer_email: user.email,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${planName} Plan`,
              description: `Monthly subscription for ${planName} plan`,
            },
            unit_amount: getUnitAmount(planName),
            recurring: {
              interval: 'month',
            },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `https://ganbatte-liart.vercel.app/enterprise/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `https://ganbatte-liart.vercel.app/enterprise?canceled=true&plan=${planName}`,
      metadata: {
        userId: user.id,
        planName: planName,
      },
    })

    return NextResponse.json({
      success: true,
      session: {
        url: session.url,
        id: session.id,
      },
    })

  } catch (error) {
    console.error('Error creating enterprise subscription:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

function getUnitAmount(planName: string): number {
  switch (planName) {
    case 'GT Starter':
      return 60000 // $600 in cents
    case 'GT Pro':
      return 120000 // $1,200 in cents
    case 'GT Ultra':
      return 200000 // $2,000 in cents
    default:
      throw new Error('Invalid plan name')
  }
} 