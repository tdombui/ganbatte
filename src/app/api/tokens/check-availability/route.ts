import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

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
    const { jobId, customerId } = body

    if (!jobId || !customerId) {
      return NextResponse.json({ error: 'Job ID and customer ID are required' }, { status: 400 })
    }

    // Get job details to calculate distance
    const { data: job, error: jobError } = await supabaseAdmin
      .from('jobs')
      .select('distance_meters')
      .eq('id', jobId)
      .single()

    if (jobError || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    // Calculate tokens needed for this job
    const distanceMeters = job.distance_meters || 0
    const tokensNeeded = Math.ceil(distanceMeters / 160934.4 / 100) // 1 token = 100 miles

    // Check if customer has active subscription
    const { data: subscription, error: subError } = await supabaseAdmin
      .from('enterprise_subscriptions')
      .select('*')
      .eq('customer_id', customerId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (subError || !subscription) {
      return NextResponse.json({
        hasEnoughTokens: false,
        tokensNeeded,
        tokensAvailable: 0,
        tokensUsed: 0,
        message: 'No active subscription found'
      })
    }

    // Get tokens used this month
    const { data: tokensUsed } = await supabaseAdmin
      .from('tokens')
      .select('tokens_used')
      .eq('subscription_id', subscription.id)
      .gte('used_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())

    const totalTokensUsed = tokensUsed?.reduce((sum, token) => sum + token.tokens_used, 0) || 0
    const tokensAvailable = subscription.tokens_per_month - totalTokensUsed
    const hasEnoughTokens = tokensAvailable >= tokensNeeded

    return NextResponse.json({
      hasEnoughTokens,
      tokensNeeded,
      tokensAvailable,
      tokensUsed: totalTokensUsed,
      subscription,
      message: hasEnoughTokens 
        ? 'Sufficient tokens available' 
        : `Insufficient tokens. Need ${tokensNeeded}, have ${tokensAvailable}`
    })

  } catch (error) {
    console.error('Error checking token availability:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 