import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

// GET - List all staff members
export async function GET() {
  try {
    // Check if user is admin
    const { data: { user } } = await supabaseAdmin.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Get all staff members
    const { data: staff, error } = await supabaseAdmin
      .from('profiles')
      .select(`
        id,
        email,
        full_name,
        role,
        created_at,
        staff (
          employee_id,
          department,
          is_active,
          hire_date
        )
      `)
      .in('role', ['staff', 'admin'])
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching staff:', error)
      return NextResponse.json({ error: 'Failed to fetch staff' }, { status: 500 })
    }

    // Transform the data to match the expected format
    const transformedStaff = staff?.map(member => ({
      id: member.id,
      email: member.email,
      full_name: member.full_name,
      role: member.role,
      employee_id: member.staff?.[0]?.employee_id,
      department: member.staff?.[0]?.department,
      is_active: member.staff?.[0]?.is_active ?? true,
      hire_date: member.staff?.[0]?.hire_date,
      created_at: member.created_at
    })) || []

    return NextResponse.json({ staff: transformedStaff })

  } catch (error) {
    console.error('Error in staff GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create a new staff member
export async function POST(request: NextRequest) {
  try {
    // Check if user is admin
    const { data: { user } } = await supabaseAdmin.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await request.json()
    const { email, full_name, role, employee_id, department } = body

    if (!email || !full_name || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!['staff', 'admin'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    // Check if user already exists by checking profiles table
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single()

    if (existingProfile) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 })
    }

    // Create new user with temporary password
    const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8)
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { full_name }
    })

    if (createError || !newUser.user) {
      console.error('Error creating user:', createError)
      return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
    }

    // Update profile with staff role
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ role })
      .eq('id', newUser.user.id)

    if (profileError) {
      console.error('Error updating profile:', profileError)
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
    }

    // Create staff record
    const { error: staffError } = await supabaseAdmin
      .from('staff')
      .insert({
        id: newUser.user.id,
        employee_id,
        department,
        is_active: true
      })

    if (staffError) {
      console.error('Error creating staff record:', staffError)
      return NextResponse.json({ error: 'Failed to create staff record' }, { status: 500 })
    }

    // TODO: Send email to new staff member with temporary password
    console.log('New staff member created with temporary password:', tempPassword)

    return NextResponse.json({ 
      success: true, 
      message: 'Staff member created successfully',
      tempPassword // Remove this in production
    })

  } catch (error) {
    console.error('Error in staff POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 