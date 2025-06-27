import { NextResponse } from 'next/server'
import { supabase } from '@/lib/auth'

// PUT - Update a staff member
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await request.json()
    const { full_name, role, employee_id, department, is_active } = body

    if (!full_name || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!['staff', 'admin'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    // Update profile
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ 
        full_name,
        role
      })
      .eq('id', params.id)

    if (profileError) {
      console.error('Error updating profile:', profileError)
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
    }

    // Update staff record
    const { error: staffError } = await supabase
      .from('staff')
      .upsert({
        id: params.id,
        employee_id,
        department,
        is_active
      })

    if (staffError) {
      console.error('Error updating staff record:', staffError)
      return NextResponse.json({ error: 'Failed to update staff record' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Staff member updated successfully'
    })

  } catch (error) {
    console.error('Error in staff PUT:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete a staff member
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Prevent admin from deleting themselves
    if (params.id === user.id) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 })
    }

    // Delete staff record first
    const { error: staffError } = await supabase
      .from('staff')
      .delete()
      .eq('id', params.id)

    if (staffError) {
      console.error('Error deleting staff record:', staffError)
      return NextResponse.json({ error: 'Failed to delete staff record' }, { status: 500 })
    }

    // Update profile to customer role (don't delete the user entirely)
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ role: 'customer' })
      .eq('id', params.id)

    if (profileError) {
      console.error('Error updating profile:', profileError)
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Staff member removed successfully'
    })

  } catch (error) {
    console.error('Error in staff DELETE:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 