import { createClient } from './supabase/client'

/**
 * Get user's phone number (profiles table is source of truth)
 * Uses database function for consistent results
 */
export async function getUserPhone(userId: string): Promise<string | null> {
  try {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .rpc('get_user_phone', { user_id: userId })
    
    if (error) {
      console.error('Error getting user phone:', error)
      return null
    }
    
    return data
  } catch (error) {
    console.error('Error in getUserPhone:', error)
    return null
  }
}

/**
 * Check if user has SMS opt-in enabled (profiles table is source of truth)
 * Uses database function for consistent results
 */
export async function getUserSmsOptIn(userId: string): Promise<boolean> {
  try {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .rpc('get_user_sms_opt_in', { user_id: userId })
    
    if (error) {
      console.error('Error getting SMS opt-in status:', error)
      return false
    }
    
    return data || false
  } catch (error) {
    console.error('Error in getUserSmsOptIn:', error)
    return false
  }
}

/**
 * Update user's phone number and SMS preferences (bulletproof)
 * Uses atomic database function that handles all updates
 */
export async function updateUserPhone(
  userId: string, 
  phoneNumber: string | null, 
  smsOptIn: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .rpc('update_user_phone_and_sms', {
        user_id: userId,
        phone_number: phoneNumber,
        sms_opt_in: smsOptIn
      })
    
    if (error) {
      console.error('Error updating phone number:', error)
      return { success: false, error: error.message }
    }
    
    if (!data) {
      return { success: false, error: 'Database update failed' }
    }
    
    return { success: true }
  } catch (error) {
    console.error('Error in updateUserPhone:', error)
    return { success: false, error: 'Failed to update phone number' }
  }
}

/**
 * Check phone number synchronization status
 * Returns detailed sync information for debugging
 */
export async function getPhoneSyncStatus(userId: string) {
  try {
    const supabase = createClient()
    
    // Get user info
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { error: 'User not found' }
    }
    
    // Get profiles data (source of truth)
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('phone, sms_opt_in')
      .eq('id', userId)
      .single()
    
    // Get twilio data (for SMS compliance only)
    const { data: twilioData, error: twilioError } = await supabase
      .from('twilio_customers')
      .select('phone_number, sms_opt_in')
      .eq('email', user.email)
    
    const userMetadata = user.user_metadata
    
    return {
      userId,
      userEmail: user.email,
      timestamp: new Date().toISOString(),
      
      // Source of truth (profiles table)
      profiles: {
        phone: profileData?.phone || null,
        sms_opt_in: profileData?.sms_opt_in || null,
        error: profileError?.message || null
      },
      
      // SMS compliance table (twilio_customers)
      twilio_customers: {
        phone_number: twilioData?.[0]?.phone_number || null,
        sms_opt_in: twilioData?.[0]?.sms_opt_in || null,
        count: twilioData?.length || 0,
        error: twilioError?.message || null
      },
      
      // User metadata (synced from profiles)
      userMetadata: {
        phone_number: userMetadata?.phone_number || null,
        full_name: userMetadata?.full_name || null
      },
      
      // Synchronization status
      syncStatus: {
        // Check if profiles (source of truth) matches user metadata
        profilesMatchesMetadata: (profileData?.phone === userMetadata?.phone_number),
        // Check if SMS opt-in is consistent between profiles and twilio_customers
        smsOptInConsistent: (profileData?.sms_opt_in === twilioData?.[0]?.sms_opt_in),
        // Check if phone exists in profiles (source of truth)
        hasPhoneInProfiles: !!(profileData?.phone),
        // Check if SMS compliance record exists when needed
        hasSmsComplianceRecord: !!(profileData?.phone && profileData?.sms_opt_in && twilioData?.[0]?.phone_number)
      }
    }
  } catch (error) {
    console.error('Error in getPhoneSyncStatus:', error)
    return { error: 'Failed to get sync status' }
  }
} 