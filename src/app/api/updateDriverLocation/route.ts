import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const { jobId, latitude, longitude } = await req.json()
  if (!jobId || !latitude || !longitude) {
    return NextResponse.json({ error: 'Missing jobId or coordinates' }, { status: 400 })
  }
  const { error } = await supabase.from('driver_locations').upsert([
    {
      job_id: jobId,
      latitude,
      longitude,
      updated_at: new Date().toISOString(),
    },
  ], { onConflict: 'job_id' })
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ success: true })
} 