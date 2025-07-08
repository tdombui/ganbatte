import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { UseTokensSchema } from '@/types/tokens'
import { z } from 'zod'

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

    // Check if user is staff/admin
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const isStaff = profile.role === 'staff' || profile.role === 'admin'
    if (!isStaff) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = UseTokensSchema.parse(body)

    // Get job details
    const { data: job, error: jobError } = await supabaseAdmin
      .from('jobs')
      .select('customer_id, distance_meters')
      .eq('id', validatedData.jobId)
      .single()

    if (jobError || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    // Get customer's active subscription
    const { data: subscription, error: subError } = await supabaseAdmin
      .from('enterprise_subscriptions')
      .select('*')
      .eq('customer_id', job.customer_id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (subError || !subscription) {
      return NextResponse.json({ error: 'No active subscription found for this customer' }, { status: 400 })
    }

    // Check if enough tokens are available
    const { data: tokensUsed } = await supabaseAdmin
      .from('tokens')
      .select('tokens_used')
      .eq('subscription_id', subscription.id)
      .gte('used_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())

    const totalTokensUsed = tokensUsed?.reduce((sum, token) => sum + token.tokens_used, 0) || 0
    const tokensAvailable = subscription.tokens_per_month - totalTokensUsed

    if (tokensAvailable < validatedData.tokensUsed) {
      return NextResponse.json({ 
        error: `Insufficient tokens. Available: ${tokensAvailable}, Required: ${validatedData.tokensUsed}` 
      }, { status: 400 })
    }

    // Create token usage record
    const { data: tokenUsage, error: tokenError } = await supabaseAdmin
      .from('tokens')
      .insert([{
        subscription_id: subscription.id,
        job_id: validatedData.jobId,
        tokens_used: validatedData.tokensUsed,
        miles_covered: validatedData.milesCovered,
        description: validatedData.description || `Job ${validatedData.jobId}`,
      }])
      .select()
      .single()

    if (tokenError) {
      console.error('Error creating token usage:', tokenError)
      return NextResponse.json({ error: 'Failed to record token usage' }, { status: 500 })
    }

    // Update job status to indicate it's using tokens
    const { error: jobUpdateError } = await supabaseAdmin
      .from('jobs')
      .update({ 
        status: 'token_paid',
        invoice_id: null // Clear any invoice association
      })
      .eq('id', validatedData.jobId)

    if (jobUpdateError) {
      console.error('Error updating job status:', jobUpdateError)
    }

    return NextResponse.json({
      success: true,
      tokenUsage,
      tokensRemaining: tokensAvailable - validatedData.tokensUsed,
      message: `Successfully used ${validatedData.tokensUsed} tokens for job`
    })

  } catch (error) {
    console.error('Error using tokens:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Invalid request data',
        details: error.errors 
      }, { status: 400 })
    }

    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 