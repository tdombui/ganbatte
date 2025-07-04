'use client'

import { useState, useEffect } from 'react'
import { useAuthContext } from '../providers'
import { useRouter } from 'next/navigation'
import { updateProfile, updateCustomerProfile } from '../../lib/auth-utils'
import SmartNavbar from '../components/nav/SmartNavbar'
import { User, Mail, Phone, Building, Shield, Save, ArrowLeft } from 'lucide-react'
import { createClient } from '../../lib/supabase/client'

export default function ProfilePage() {
  const { user, loading, isAuthenticated } = useAuthContext()
  const router = useRouter()
  
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    company: '',
  })
  const [smsOptIn, setSmsOptIn] = useState(false)
  const [smsLoading, setSmsLoading] = useState(false)
  const [customerData, setCustomerData] = useState({
    default_address: '',
    billing_address: '',
    notes: '',
  })
  const [isEditing, setIsEditing] = useState(false)
  const [saveLoading, setSaveLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [createdAt, setCreatedAt] = useState<string | null>(null)

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      console.log('🔍 ProfilePage: Redirecting to auth - not authenticated')
      router.push('/auth?redirectTo=/profile')
    }
  }, [loading, isAuthenticated, router])

  // Load user data when component mounts
  useEffect(() => {
    const loadUserData = async () => {
      if (user) {
        // Check for phone number in twilio_customers table
        let phoneNumber = user.phone || ''
        
        try {
          const supabase = createClient()
          
          // Get the actual Supabase user object to access metadata
          const { data: { user: supabaseUser }, error: userError } = await supabase.auth.getUser()
          
          if (userError) {
            console.error('Error getting Supabase user:', userError)
          } else if (supabaseUser?.user_metadata?.phone_number) {
            phoneNumber = supabaseUser.user_metadata.phone_number
          }

          // Check if user has SMS enabled by looking at profiles.sms_opt_in
          try {
            const { data: profileData, error } = await supabase
              .from('profiles')
              .select('sms_opt_in, created_at')
              .eq('id', user.id)
              .single()

            if (error) {
              console.error('Error checking SMS status:', error)
              // Fallback: assume SMS is enabled if they have a phone number
              if (phoneNumber || user.phone) {
                setSmsOptIn(true)
              }
            } else if (profileData?.sms_opt_in) {
              // SMS is enabled in profiles table
              setSmsOptIn(true)
            } else if (phoneNumber || user.phone) {
              // Fallback: if they have a phone number, assume SMS is enabled
              setSmsOptIn(true)
            }
            
            // Set the created_at date
            if (profileData?.created_at) {
              setCreatedAt(profileData.created_at)
            }
          } catch (error) {
            console.error('Error checking SMS status:', error)
            // Fallback: if they have a phone number, assume SMS is enabled
            if (phoneNumber || user.phone) {
              setSmsOptIn(true)
            }
          }
        } catch (error) {
          console.error('Error loading user data:', error)
          // Continue with user.phone if there's an error
        }

        setFormData({
          full_name: user.full_name || '',
          phone: phoneNumber,
          company: user.company || '',
        })
        if (user.customer) {
          setCustomerData({
            default_address: user.customer.default_address || '',
            billing_address: user.customer.billing_address || '',
            notes: user.customer.notes || '',
          })
        }
      }
    }

    loadUserData()
  }, [user])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleCustomerInputChange = (field: string, value: string) => {
    setCustomerData(prev => ({ ...prev, [field]: value }))
  }

  const handleSmsOptInToggle = async () => {
    if (!smsOptIn && !formData.phone.trim()) {
      setMessage({ type: 'error', text: 'Please enter a phone number before enabling SMS updates.' })
      return
    }

    setSmsLoading(true)
    try {
      const supabase = createClient()
      
      // Use bulletproof database function for atomic update
      const { data, error } = await supabase
        .rpc('update_user_phone_and_sms', {
          user_id: user?.id,
          phone_number: smsOptIn ? null : formData.phone.trim(),
          sms_opt_in: !smsOptIn
        })

      if (error) {
        console.error('Error updating SMS preferences:', error)
        throw new Error('Failed to update SMS preferences')
      }

      if (!data) {
        throw new Error('Database update failed')
      }

      // Clear phone number from form if disabling SMS
      if (smsOptIn) {
        setFormData(prev => ({ ...prev, phone: '' }))
      }

      setSmsOptIn(!smsOptIn)
      setMessage({ 
        type: 'success', 
        text: `SMS updates ${!smsOptIn ? 'enabled' : 'disabled'} successfully!` 
      })
    } catch (error) {
      console.error('Error toggling SMS opt-in:', error)
      setMessage({ type: 'error', text: 'Failed to update SMS preferences. Please try again.' })
    } finally {
      setSmsLoading(false)
    }
  }

  const handleSave = async () => {
    setSaveLoading(true)
    setMessage({ type: '', text: '' })

    try {
      console.log('🔍 Saving profile data:', formData)
      console.log('🔍 Saving customer data:', customerData)
      
      const supabase = createClient()
      
      // Update profile
      const { error: profileError } = await updateProfile(formData)
      
      if (profileError) {
        console.error('❌ Profile update error:', profileError)
        throw profileError
      }

      // If phone number was updated, use bulletproof database function
      if (formData.phone && formData.phone.trim()) {
        const { data: phoneUpdateData, error: phoneUpdateError } = await supabase
          .rpc('update_user_phone_and_sms', {
            user_id: user?.id,
            phone_number: formData.phone.trim(),
            sms_opt_in: smsOptIn
          })

        if (phoneUpdateError) {
          console.error('❌ Error updating phone number:', phoneUpdateError)
          // Don't fail the entire save operation for phone sync issues
        } else if (!phoneUpdateData) {
          console.error('❌ Phone number update failed')
        } else {
          console.log('✅ Updated phone number and SMS preferences atomically')
        }
      }

      // Update customer data if user is a customer
      if (user?.role === 'customer' && user.customer) {
        console.log('🔍 Updating customer profile with:', customerData)
        const { error: customerError } = await updateCustomerProfile(customerData)
        
        if (customerError) {
          console.error('❌ Customer update error:', customerError)
          throw customerError
        }
        
        console.log('✅ Customer profile updated successfully')
      }

      setMessage({ type: 'success', text: 'Profile updated successfully!' })
      setIsEditing(false)
    } catch (error) {
      console.error('Error updating profile:', error)
      setMessage({ type: 'error', text: 'Failed to update profile. Please try again.' })
    } finally {
      setSaveLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lime-400 mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  // Show loading while redirecting if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lime-400 mx-auto mb-4"></div>
          <p className="text-neutral-400">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <SmartNavbar />
      
      <div className="pt-24 pb-12 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-3xl font-bold">Profile Settings</h1>
          </div>

          {/* Message */}
          {message.text && (
            <div className={`mb-6 p-4 rounded-lg ${
              message.type === 'success' 
                ? 'bg-lime-900/20 border border-lime-800/50 text-lime-300' 
                : 'bg-red-900/20 border border-red-800/50 text-red-300'
            }`}>
              {message.text}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Profile Information */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-gray-900/50 backdrop-blur border border-gray-800 rounded-xl p-6">
                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                  <User size={20} />
                  Personal Information
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Full Name</label>
                    <input
                      type="text"
                      value={formData.full_name}
                      onChange={(e) => handleInputChange('full_name', e.target.value)}
                      disabled={!isEditing}
                      className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:border-lime-400"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                      <Mail size={16} />
                      Email
                    </label>
                    <input
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-lg text-gray-400 cursor-not-allowed"
                    />
                    <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                      <Phone size={16} />
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      disabled={!isEditing}
                      className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:border-lime-400"
                    />
                  </div>

                  {/* SMS Opt-in Toggle */}
                  <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                    <div>
                      <h3 className="font-medium text-white mb-1">SMS Updates</h3>
                      <p className="text-sm text-gray-400">
                        Receive delivery updates, ETA requests, and job notifications via text message
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-sm ${smsOptIn ? 'text-lime-400' : 'text-gray-400'}`}>
                        {smsOptIn ? 'Enabled' : 'Disabled'}
                      </span>
                      <button
                        onClick={handleSmsOptInToggle}
                        disabled={smsLoading || !formData.phone.trim()}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          smsOptIn ? 'bg-lime-500' : 'bg-gray-600'
                        } ${smsLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            smsOptIn ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                      <Building size={16} />
                      Company
                    </label>
                    <input
                      type="text"
                      value={formData.company}
                      onChange={(e) => handleInputChange('company', e.target.value)}
                      disabled={!isEditing}
                      className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:border-lime-400"
                    />
                  </div>
                </div>
              </div>

              {/* Customer-specific information */}
              {user?.role === 'customer' && (
                <div className="bg-gray-900/50 backdrop-blur border border-gray-800 rounded-xl p-6">
                  <h2 className="text-xl font-semibold mb-6">Customer Information</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Default Delivery Address</label>
                      <textarea
                        value={customerData.default_address}
                        onChange={(e) => handleCustomerInputChange('default_address', e.target.value)}
                        disabled={!isEditing}
                        rows={3}
                        className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:border-lime-400 resize-none"
                        placeholder="Enter your default delivery address (used when you say 'my shop', 'the shop', etc.)"
                      />
                      <p className="text-xs text-gray-500 mt-1">This address will be used automatically when you mention &quot;my shop&quot; or &quot;the shop&quot; in chat</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">Billing Address</label>
                      <textarea
                        value={customerData.billing_address || ''}
                        onChange={(e) => handleCustomerInputChange('billing_address', e.target.value)}
                        disabled={!isEditing}
                        rows={3}
                        className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:border-lime-400 resize-none"
                        placeholder="Enter your billing address for invoices"
                      />
                      <p className="text-xs text-gray-500 mt-1">Address for billing and payment purposes</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">Delivery Preferences</label>
                      <textarea
                        value={customerData.notes}
                        onChange={(e) => handleCustomerInputChange('notes', e.target.value)}
                        disabled={!isEditing}
                        rows={3}
                        className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:border-lime-400 resize-none"
                        placeholder="Any special delivery preferences or instructions"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Account Status */}
              <div className="bg-gray-900/50 backdrop-blur border border-gray-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Shield size={18} />
                  Account Status
                </h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Role:</span>
                    <span className="text-white font-medium capitalize">{user?.role}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Status:</span>
                    <span className="text-lime-400 font-medium">Active</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Member since:</span>
                    <span className="text-white">
                      {createdAt ? new Date(createdAt).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="bg-gray-900/50 backdrop-blur border border-gray-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4">Actions</h3>
                
                <div className="space-y-3">
                  {isEditing ? (
                    <>
                      <button
                        onClick={handleSave}
                        disabled={saveLoading}
                        className="w-full bg-lime-500 hover:bg-lime-400 text-black font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {saveLoading ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
                        ) : (
                          <Save size={16} />
                        )}
                        Save Changes
                      </button>
                      
                      <button
                        onClick={() => {
                          setIsEditing(false)
                          setMessage({ type: '', text: '' })
                          // Reset form data
                          if (user) {
                            setFormData({
                              full_name: user.full_name || '',
                              phone: user.phone || '',
                              company: user.company || '',
                            })
                            if (user.customer) {
                              setCustomerData({
                                default_address: user.customer.default_address || '',
                                billing_address: user.customer.billing_address || '',
                                notes: user.customer.notes || '',
                              })
                            }
                          }
                        }}
                        className="w-full bg-gray-600 hover:bg-gray-500 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                    >
                      Edit Profile
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 