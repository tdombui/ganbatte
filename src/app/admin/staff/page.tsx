'use client'

import { useEffect, useState } from 'react'
import { useAuthContext } from '../../providers'
import { createClient } from '../../../lib/supabase/client'
import SmartNavbar from '../../components/nav/SmartNavbar'
import { UserPlus, Edit, Trash2, Shield, User } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface StaffMember {
  id: string
  email: string
  full_name: string
  role: string
  created_at: string
  phone?: string
  company?: string
  employee_id?: string
  department?: string
  is_active?: boolean
}

export default function AdminStaffPage() {
  const { loading, isAdmin, user } = useAuthContext()
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [loadingStaff, setLoadingStaff] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null)
  const router = useRouter()

  // Redirect if not authenticated or not admin
  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      console.log('🔍 AdminStaffPage: Redirecting to auth - not authenticated or not admin')
      router.push('/auth?redirectTo=/admin/staff')
    }
  }, [user, loading, isAdmin, router])

  useEffect(() => {
    if (!loading && isAdmin) {
      fetchStaff()
    }
  }, [loading, isAdmin])

  const fetchStaff = async () => {
    try {
      setLoadingStaff(true)

      const { data, error } = await createClient()
        .from('staff')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching staff:', error)
        return
      }

      setStaff(data || [])
    } catch (err) {
      console.error('Error fetching staff:', err)
    } finally {
      setLoadingStaff(false)
    }
  }

  const handleAddStaff = async (formData: FormData) => {
    try {
      const response = await fetch('/api/admin/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.get('email'),
          full_name: formData.get('full_name'),
          role: formData.get('role'),
          employee_id: formData.get('employee_id'),
          department: formData.get('department'),
        })
      })

      if (response.ok) {
        setShowAddForm(false)
        fetchStaff()
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error adding staff:', error)
      alert('Error adding staff member')
    }
  }

  const handleUpdateStaff = async (formData: FormData) => {
    if (!editingStaff) return

    try {
      const response = await fetch(`/api/admin/staff/${editingStaff.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: formData.get('full_name'),
          role: formData.get('role'),
          employee_id: formData.get('employee_id'),
          department: formData.get('department'),
          is_active: formData.get('is_active') === 'true',
        })
      })

      if (response.ok) {
        setEditingStaff(null)
        fetchStaff()
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error updating staff:', error)
      alert('Error updating staff member')
    }
  }

  const handleDeleteStaff = async (staffId: string) => {
    if (!confirm('Are you sure you want to delete this staff member?')) return

    try {
      const response = await fetch(`/api/admin/staff/${staffId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchStaff()
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error deleting staff:', error)
      alert('Error deleting staff member')
    }
  }

  if (loading || loadingStaff) {
    return (
      <>
        <SmartNavbar />
        <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
          <div className="text-white text-lg">Loading...</div>
        </div>
      </>
    )
  }

  // Show loading while redirecting if not authenticated
  if (!user || !isAdmin) {
    return (
      <>
        <SmartNavbar />
        <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-neutral-400">Redirecting to login...</p>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <SmartNavbar />
      <div className="min-h-screen bg-neutral-950 text-white pt-16">
        <div className="max-w-6xl mx-auto p-6">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">Staff Management</h1>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <UserPlus size={20} />
              Add Staff Member
            </button>
          </div>

          {/* Staff List */}
          <div className="bg-neutral-900 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Current Staff</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-neutral-700">
                    <th className="text-left p-3">Name</th>
                    <th className="text-left p-3">Email</th>
                    <th className="text-left p-3">Role</th>
                    <th className="text-left p-3">Employee ID</th>
                    <th className="text-left p-3">Department</th>
                    <th className="text-left p-3">Status</th>
                    <th className="text-left p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {staff.map((member) => (
                    <tr key={member.id} className="border-b border-neutral-800">
                      <td className="p-3">{member.full_name}</td>
                      <td className="p-3">{member.email}</td>
                      <td className="p-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${
                          member.role === 'admin' 
                            ? 'bg-purple-600 text-white' 
                            : 'bg-blue-600 text-white'
                        }`}>
                          {member.role === 'admin' ? <Shield size={12} /> : <User size={12} />}
                          {member.role}
                        </span>
                      </td>
                      <td className="p-3">{member.employee_id || '—'}</td>
                      <td className="p-3">{member.department || '—'}</td>
                      <td className="p-3">
                        <span className={`inline-flex px-2 py-1 rounded text-xs ${
                          member.is_active 
                            ? 'bg-green-600 text-white' 
                            : 'bg-red-600 text-white'
                        }`}>
                          {member.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditingStaff(member)}
                            className="p-1 hover:bg-neutral-700 rounded"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteStaff(member.id)}
                            className="p-1 hover:bg-red-600 rounded"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Add Staff Form */}
          {showAddForm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
              <div className="bg-neutral-900 rounded-lg p-6 w-full max-w-md">
                <h3 className="text-xl font-semibold mb-4">Add Staff Member</h3>
                <form action={handleAddStaff} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Email</label>
                    <input
                      type="email"
                      name="email"
                      required
                      className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Full Name</label>
                    <input
                      type="text"
                      name="full_name"
                      required
                      className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Role</label>
                    <select
                      name="role"
                      required
                      className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-white"
                    >
                      <option value="staff">Staff</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Employee ID</label>
                    <input
                      type="text"
                      name="employee_id"
                      className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Department</label>
                    <input
                      type="text"
                      name="department"
                      className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-white"
                    />
                  </div>
                  <div className="flex gap-2 pt-4">
                    <button
                      type="submit"
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded"
                    >
                      Add Staff
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="flex-1 bg-neutral-700 hover:bg-neutral-600 text-white px-4 py-2 rounded"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Edit Staff Form */}
          {editingStaff && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
              <div className="bg-neutral-900 rounded-lg p-6 w-full max-w-md">
                <h3 className="text-xl font-semibold mb-4">Edit Staff Member</h3>
                <form action={handleUpdateStaff} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Full Name</label>
                    <input
                      type="text"
                      name="full_name"
                      defaultValue={editingStaff.full_name}
                      required
                      className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Role</label>
                    <select
                      name="role"
                      defaultValue={editingStaff.role}
                      required
                      className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-white"
                    >
                      <option value="staff">Staff</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Employee ID</label>
                    <input
                      type="text"
                      name="employee_id"
                      defaultValue={editingStaff.employee_id || ''}
                      className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Department</label>
                    <input
                      type="text"
                      name="department"
                      defaultValue={editingStaff.department || ''}
                      className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Status</label>
                    <select
                      name="is_active"
                      defaultValue={editingStaff.is_active?.toString() || 'true'}
                      className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-white"
                    >
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </select>
                  </div>
                  <div className="flex gap-2 pt-4">
                    <button
                      type="submit"
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded"
                    >
                      Update Staff
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingStaff(null)}
                      className="flex-1 bg-neutral-700 hover:bg-neutral-600 text-white px-4 py-2 rounded"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
} 