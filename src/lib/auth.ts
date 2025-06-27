import { createClient } from '@supabase/supabase-js'
import { UserWithProfile, Profile, Customer, Staff } from '../../supabase/types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Check if environment variables are set
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing required Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

// Client for client-side operations (uses anon key) with enhanced session persistence
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Enable automatic session refresh
    autoRefreshToken: true,
    // Persist session across browser sessions
    persistSession: true,
    // Detect session in URL (for auth callbacks)
    detectSessionInUrl: true,
    // Use localStorage for session storage (more reliable than sessionStorage)
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    // Storage key for the session
    storageKey: 'ganbatte-auth-token',
    // Flow type for authentication
    flowType: 'pkce',
  },
  // Global headers for all requests
  global: {
    headers: {
      'X-Client-Info': 'ganbatte-web',
    },
  },
})

// Admin client for server-side operations (uses service role key)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey)

export async function getCurrentUser(): Promise<UserWithProfile | null> {
  try {
    console.log('🔍 getCurrentUser: Starting...')
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    console.log('🔍 getCurrentUser: Auth result:', { user: user?.id, error: authError?.message })
    
    if (authError || !user) {
      console.log('🔍 getCurrentUser: No user or auth error')
      return null
    }

    console.log('🔍 getCurrentUser: Getting profile for user:', user.id)

    // Get profile data
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    console.log('🔍 getCurrentUser: Profile result:', { profile: profile?.id, error: profileError?.message })

    if (profileError || !profile) {
      console.log('🔍 getCurrentUser: No profile found')
      return null
    }

    console.log('🔍 getCurrentUser: Profile found, checking role:', profile.role)

    // Get customer data if user is a customer
    let customer: Customer | undefined
    if (profile.role === 'customer') {
      console.log('🔍 getCurrentUser: Getting customer data')
      const { data: customerData } = await supabase
        .from('customers')
        .select('*')
        .eq('id', user.id)
        .single()
      customer = customerData || undefined
      console.log('🔍 getCurrentUser: Customer data result:', !!customer)
    }

    // Get staff data if user is staff
    let staff: Staff | undefined
    if (profile.role === 'staff' || profile.role === 'admin') {
      console.log('🔍 getCurrentUser: Getting staff data')
      const { data: staffData } = await supabase
        .from('staff')
        .select('*')
        .eq('id', user.id)
        .single()
      staff = staffData || undefined
      console.log('🔍 getCurrentUser: Staff data result:', !!staff)
    }

    console.log('🔍 getCurrentUser: Returning user with profile')
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
    console.error('❌ Error getting current user:', error)
    return null
  }
}

export async function signUp(email: string, password: string, fullName: string) {
  // Create new user with email confirmation disabled
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
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  return { data, error }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  return { error }
}

export async function updateProfile(updates: Partial<Profile>) {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('No authenticated user')
  }

  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id)
    .select()
    .single()

  return { data, error }
}

export async function updateCustomerProfile(updates: Partial<Customer>) {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('No authenticated user')
  }

  const { data, error } = await supabase
    .from('customers')
    .update(updates)
    .eq('id', user.id)
    .select()
    .single()

  return { data, error }
}

export async function getUserJobs() {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('No authenticated user')
  }

  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return { data, error }
}

export async function getAllJobs() {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('No authenticated user')
  }

  // Check if user is staff/admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'staff' && profile?.role !== 'admin') {
    throw new Error('Unauthorized')
  }

  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .order('created_at', { ascending: false })

  return { data, error }
} 