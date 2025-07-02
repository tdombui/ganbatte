import { UserWithProfile, Customer, Staff } from '../../supabase/types'
import { createClient } from './supabase/client'

export async function getCurrentUser(): Promise<UserWithProfile | null> {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return null
    }

    // Get profile data
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return null
    }

    // Get customer data if user is a customer
    let customer: Customer | undefined
    if (profile.role === 'customer') {
      try {
        const { data: customerData } = await supabase
          .from('customers')
          .select('*')
          .eq('id', user.id)
          .single()
        
        customer = customerData || undefined
      } catch {
        // Continue without customer data - don't fail the entire auth
      }
    }

    // Get staff data if user is staff
    let staff: Staff | undefined
    if (profile.role === 'staff' || profile.role === 'admin') {
      try {
        const { data: staffData } = await supabase
          .from('staff')
          .select('*')
          .eq('id', user.id)
          .single()
        
        staff = staffData || undefined
      } catch {
        // Continue without staff data - don't fail the entire auth
      }
    }
    
    return {
      id: user.id,
      email: profile.email,
      full_name: profile.full_name,
      phone: profile.phone,
      company: profile.company,
      role: profile.role,
      customer,
      staff,
    }
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}

export async function signUp(email: string, password: string, fullName: string) {
  const supabase = createClient()
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  })

  // If user already exists, handle the error gracefully
  if (error?.message?.includes('already registered')) {
    return { 
      data: null, 
      error: { 
        message: 'Account already exists. Please sign in instead.' 
      } 
    }
  }

  return { data, error }
}

export async function signIn(email: string, password: string) {
  const supabase = createClient()
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  return { data, error }
}

export async function signOut() {
  const supabase = createClient()
  const { error } = await supabase.auth.signOut()
  return { error }
}

export async function updateProfile(profileData: { full_name?: string; phone?: string; company?: string }) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { error: new Error('No authenticated user') }
    }

    const { error } = await supabase
      .from('profiles')
      .update(profileData)
      .eq('id', user.id)

    return { error }
  } catch (error) {
    return { error: error as Error }
  }
}

export async function updateCustomerProfile(customerData: { billing_address?: string; default_address?: string; notes?: string }) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      console.error('❌ updateCustomerProfile: No authenticated user')
      return { error: new Error('No authenticated user') }
    }

    console.log('🔍 updateCustomerProfile: Updating customer data for user:', user.id)
    console.log('🔍 updateCustomerProfile: Data to update:', customerData)

    const { data, error } = await supabase
      .from('customers')
      .update(customerData)
      .eq('id', user.id)
      .select()

    if (error) {
      console.error('❌ updateCustomerProfile: Supabase error:', error)
      return { error }
    }

    console.log('✅ updateCustomerProfile: Successfully updated customer data:', data)
    return { data, error: null }
  } catch (error) {
    console.error('❌ updateCustomerProfile: Unexpected error:', error)
    return { error: error as Error }
  }
}

export async function updateStaffProfile(staffData: { employee_id?: string; department?: string; permissions?: Record<string, unknown> }) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { error: new Error('No authenticated user') }
    }

    const { error } = await supabase
      .from('staff')
      .update(staffData)
      .eq('id', user.id)

    return { error }
  } catch (error) {
    return { error: error as Error }
  }
} 