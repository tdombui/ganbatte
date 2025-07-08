import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { jobId, paymentStatus = 'paid' } = body

    if (!jobId) {
      return NextResponse.json({ error: 'Job ID is required' }, { status: 400 })
    }

    console.log(`🔄 Manually updating payment status for job ${jobId} to ${paymentStatus}`)

    const { data, error } = await supabaseAdmin
      .from('jobs')
      .update({
        payment_status: paymentStatus,
        paid_at: paymentStatus === 'paid' ? new Date().toISOString() : null
      })
      .eq('id', jobId)
      .select()

    if (error) {
      console.error('Error updating payment status:', error)
      return NextResponse.json({ error: 'Failed to update payment status' }, { status: 500 })
    }

    console.log('✅ Payment status updated successfully:', data)
    return NextResponse.json({ success: true, data })

  } catch (error) {
    console.error('Error in manual payment status update:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 