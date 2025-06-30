import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST() {
  try {
    console.log('🔧 Attempting to add driver location columns...')

    // Try to add the columns using raw SQL
    const { error: alterError } = await supabaseAdmin.rpc('exec_sql', {
      sql: `
        ALTER TABLE jobs ADD COLUMN IF NOT EXISTS driver_lat DECIMAL(10, 8);
        ALTER TABLE jobs ADD COLUMN IF NOT EXISTS driver_lng DECIMAL(11, 8);
      `
    })

    if (alterError) {
      console.error('❌ Error adding columns via RPC:', alterError)
      
      // Fallback: try direct SQL execution
      try {
        const { error: directError } = await supabaseAdmin
          .from('jobs')
          .select('id')
          .limit(1)
          .then(() => {
            // If this works, try to add columns manually
            return supabaseAdmin.rpc('exec_sql', {
              sql: 'ALTER TABLE jobs ADD COLUMN IF NOT EXISTS driver_lat DECIMAL(10, 8);'
            })
          })

        if (directError) {
          console.error('❌ Direct SQL also failed:', directError)
          return NextResponse.json({
            error: 'Cannot add driver location columns automatically',
            message: 'Please run the SQL script manually in your Supabase dashboard',
            sql: `
              ALTER TABLE jobs ADD COLUMN IF NOT EXISTS driver_lat DECIMAL(10, 8);
              ALTER TABLE jobs ADD COLUMN IF NOT EXISTS driver_lng DECIMAL(11, 8);
            `
          }, { status: 501 })
        }
      } catch (fallbackError) {
        console.error('❌ Fallback also failed:', fallbackError)
        return NextResponse.json({
          error: 'Cannot add driver location columns automatically',
          message: 'Please run the SQL script manually in your Supabase dashboard',
          sql: `
            ALTER TABLE jobs ADD COLUMN IF NOT EXISTS driver_lat DECIMAL(10, 8);
            ALTER TABLE jobs ADD COLUMN IF NOT EXISTS driver_lng DECIMAL(11, 8);
          `
        }, { status: 501 })
      }
    }

    console.log('✅ Driver location columns added successfully')
    
    // Verify the columns exist
    const { error: testError } = await supabaseAdmin
      .from('jobs')
      .select('driver_lat, driver_lng')
      .limit(1)

    if (testError) {
      console.error('❌ Verification failed:', testError)
      return NextResponse.json({
        error: 'Columns added but verification failed',
        details: testError
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Driver location columns added successfully',
      columns: ['driver_lat', 'driver_lng']
    })

  } catch (error) {
    console.error('❌ Unexpected error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 