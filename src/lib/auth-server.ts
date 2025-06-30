import { UserWithProfile, Customer, Staff } from '../../supabase/types'
import { createClient } from './supabase/server'

export async function getCurrentUserServer(): Promise<UserWithProfile | null> {
  try {
    const supabase = await createClient()
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
    console.error('Error getting current user (server):', error)
    return null
  }
}

export async function getSession() {
  try {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    return session
  } catch (error) {
    console.error('Error getting session (server):', error)
    return null
  }
} 