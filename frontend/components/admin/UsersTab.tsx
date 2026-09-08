'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import {
  Users, UserPlus, Shield, ShieldCheck, Key, Lock, Unlock,
  Trash2, Edit2, Search, Phone, Mail, ShoppingBag, Eye, EyeOff, X,
  CheckCircle2, AlertCircle, RefreshCw, Sparkles, Bike, Calendar, ArrowRight, Plus, Package
} from 'lucide-react'

interface AdminUser {
  id: string
  email: string
  role: string
  failed_login_attempts: number
  locked_until: string | null
  created_at: string
  updated_at: string
}

interface Customer {
  id: string
  phone: string
  email: string | null
  created_at: string
  total_orders: number
  total_spent_kes: number
  last_order_date: string | null
}

interface Rider {
  id: string
  name: string
  phone: string
  is_active: boolean
  total_deliveries?: number
  vehicle_type?: string
  vehicle_reg?: string
  is_verified?: boolean
  created_at?: string
}

interface UsersTabProps {
  token: string
}

export default function UsersTab({ token }: UsersTabProps) {
  const [subTab, setSubTab] = useState<'admins' | 'customers' | 'riders'>('admins')
  
  // Data states
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [riders, setRiders] = useState<Rider[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // Search
  const [adminSearch, setAdminSearch] = useState('')
  const [customerSearch, setCustomerSearch] = useState('')
  const [riderSearch, setRiderSearch] = useState('')

  // Modals state
  const [showAddAdminModal, setShowAddAdminModal] = useState(false)
  const [showResetPasswordModal, setShowResetPasswordModal] = useState<AdminUser | null>(null)
  const [showResetPassword, setShowResetPassword] = useState(false)
  const [showAddRiderModal, setShowAddRiderModal] = useState(false)
  const [editingRider, setEditingRider] = useState<Rider | null>(null)
  const [selectedCustomerForOrders, setSelectedCustomerForOrders] = useState<Customer | null>(null)
  const [customerOrders, setCustomerOrders] = useState<any[]>([])
  const [loadingCustomerOrders, setLoadingCustomerOrders] = useState(false)
  const [downloadingOrderId, setDownloadingOrderId] = useState<string | null>(null)

  const handleDownloadOrderZip = async (orderId: string, orderNumber: string) => {
    setDownloadingOrderId(orderId)
    try {
      const res = await fetch(`/api/v1/admin/export/orders/${orderId}/zip`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      })
      if (!res.ok) {
        throw new Error('Failed to generate order resource package')
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Order_${orderNumber}_Design_and_Resources_Package.zip`
      a.click()
      URL.revokeObjectURL(url)
      toast.success(`Resource package for #${orderNumber} downloaded!`)
    } catch (err: any) {
      toast.error(err.message || 'Error downloading compressed package')
    } finally {
      setDownloadingOrderId(null)
    }
  }

  // Forms
  const [newAdminEmail, setNewAdminEmail] = useState('')
  const [newAdminPassword, setNewAdminPassword] = useState('')
  const [newAdminRole, setNewAdminRole] = useState<'admin' | 'super_admin' | 'rider_manager' | 'support'>('admin')
  const [resetNewPassword, setResetNewPassword] = useState('')
  const [newRiderName, setNewRiderName] = useState('')
  const [newRiderPhone, setNewRiderPhone] = useState('')
  const [newRiderActive, setNewRiderActive] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const showSuccess = (msg: string) => {
    toast.success(msg)
  }

  const fetchAllData = async () => {
    setLoading(true)
    setError('')
    try {
      const [adminsRes, customersRes, ridersRes] = await Promise.all([
        fetch('/api/v1/admin/users', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/v1/admin/customers', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/v1/admin/riders', { headers: { Authorization: `Bearer ${token}` } }),
      ])

      const adminsData = await adminsRes.json()
      const customersData = await customersRes.json()
      const ridersData = await ridersRes.json()

      if (adminsData.data) setAdminUsers(adminsData.data)
      if (customersData.data) setCustomers(customersData.data)
      if (ridersData.data) setRiders(ridersData.data)
    } catch (err: any) {
      console.error('Failed to fetch user management data', err)
      toast.error(err.message || 'Error loading users and fleet data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAllData()
  }, [token])

  // --- Admin User Actions ---
  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newAdminEmail.trim() || !newAdminPassword) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/v1/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: newAdminEmail.trim(),
          password: newAdminPassword,
          role: newAdminRole,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create user')

      toast.success(`Staff user ${newAdminEmail} created successfully!`)
      setShowAddAdminModal(false)
      setNewAdminEmail('')
      setNewAdminPassword('')
      setNewAdminRole('admin')
      fetchAllData()
    } catch (err: any) {
      toast.error(err.message || 'Error creating admin user')
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      const res = await fetch(`/api/v1/admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: newRole }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update role')

      toast.success('User role updated!')
      setAdminUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u))
    } catch (err: any) {
      toast.error(err.message || 'Error updating user role')
    }
  }

  const handleUnlockUser = async (userId: string) => {
    try {
      const res = await fetch(`/api/v1/admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ unlock: true }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to unlock account')

      toast.success('User account unlocked!')
      setAdminUsers(prev => prev.map(u => u.id === userId ? { ...u, failed_login_attempts: 0, locked_until: null } : u))
    } catch (err: any) {
      toast.error(err.message || 'Error unlocking account')
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!showResetPasswordModal || !resetNewPassword) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/v1/admin/users/${showResetPasswordModal.id}/password`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ newPassword: resetNewPassword }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to reset password')

      toast.success(`Password updated for ${showResetPasswordModal.email}!`)
      setShowResetPasswordModal(null)
      setResetNewPassword('')
      fetchAllData()
    } catch (err: any) {
      toast.error(err.message || 'Error resetting password')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteAdmin = async (user: AdminUser) => {
    if (!confirm(`Are you sure you want to permanently revoke and delete staff account '${user.email}'?`)) return
    try {
      const res = await fetch(`/api/v1/admin/users/${user.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to delete user')

      toast.success(`Staff user ${user.email} removed.`)
      setAdminUsers(prev => prev.filter(u => u.id !== user.id))
    } catch (err: any) {
      toast.error(err.message || 'Error deleting admin user')
    }
  }

  // --- Customer History Modal ---
  const handleOpenCustomerOrders = async (customer: Customer) => {
    setSelectedCustomerForOrders(customer)
    setLoadingCustomerOrders(true)
    try {
      const res = await fetch(`/api/v1/admin/customers/${customer.id}/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (res.ok && data.data) {
        setCustomerOrders(data.data)
      }
    } catch (err: any) {
      console.error('Failed to fetch customer order history', err)
      toast.error(err.message || 'Failed to load customer order history')
    } finally {
      setLoadingCustomerOrders(false)
    }
  }

  // --- Rider Actions ---
  const handleCreateOrUpdateRider = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newRiderName.trim() || !newRiderPhone.trim()) return
    setSubmitting(true)
    try {
      if (editingRider) {
        const res = await fetch(`/api/v1/admin/riders/${editingRider.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: newRiderName.trim(),
            phone: newRiderPhone.trim(),
            is_active: newRiderActive,
          }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to update rider')
        toast.success(`Rider ${newRiderName} updated!`)
      } else {
        const res = await fetch('/api/v1/admin/riders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: newRiderName.trim(),
            phone: newRiderPhone.trim(),
            is_active: newRiderActive,
          }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to add rider')
        toast.success(`Rider ${newRiderName} added!`)
      }

      setShowAddRiderModal(false)
      setEditingRider(null)
      setNewRiderName('')
      setNewRiderPhone('')
      setNewRiderActive(true)
      fetchAllData()
    } catch (err: any) {
      toast.error(err.message || 'Error saving rider')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteRider = async (rider: Rider) => {
    if (!confirm(`Delete rider '${rider.name}'?`)) return
    try {
      const res = await fetch(`/api/v1/admin/riders/${rider.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to delete rider')

      toast.success(`Rider ${rider.name} deleted.`)
      setRiders(prev => prev.filter(r => r.id !== rider.id))
    } catch (err: any) {
      toast.error(err.message || 'Error deleting rider')
    }
  }

  // Filtered lists
  const filteredAdmins = adminUsers.filter(u =>
    u.email.toLowerCase().includes(adminSearch.toLowerCase()) ||
    u.role.toLowerCase().includes(adminSearch.toLowerCase())
  )

  const filteredCustomers = customers.filter(c =>
    c.phone.includes(customerSearch) ||
    (c.email && c.email.toLowerCase().includes(customerSearch.toLowerCase()))
  )

  const filteredRiders = riders.filter(r =>
    r.name.toLowerCase().includes(riderSearch.toLowerCase()) ||
    r.phone.includes(riderSearch)
  )

  return (
    <div className="space-y-6">
      {/* Top KPI Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
            Staff & Administrators
          </span>
          <div className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Shield className="w-6 h-6 text-pink-600" />
            {adminUsers.length} Staff
          </div>
          <span className="text-[10px] text-purple-600 dark:text-purple-400 font-bold block">
            {adminUsers.filter(u => u.role === 'super_admin').length} Super Admin(s) Active
          </span>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
            Customer Directory
          </span>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-500" />
            {customers.length} Customers
          </div>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block">
            {customers.reduce((sum, c) => sum + Number(c.total_orders || 0), 0)} Total Orders Placed
          </span>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
            Delivery Riders
          </span>
          <div className="text-2xl font-black text-blue-600 dark:text-blue-400 flex items-center gap-2">
            <Bike className="w-6 h-6 text-blue-500" />
            {riders.length} Couriers
          </div>
          <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold block">
            {riders.filter(r => r.is_active).length} Active On-Duty Riders
          </span>
        </div>
      </div>

      {/* Sub-Tabs Selector */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-4 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSubTab('admins')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all ${
              subTab === 'admins'
                ? 'bg-pink-600 text-white shadow-md shadow-pink-500/20'
                : 'bg-slate-50 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ShieldCheck className="w-4 h-4" /> Staff & Admins ({adminUsers.length})
          </button>

          <button
            onClick={() => setSubTab('customers')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all ${
              subTab === 'customers'
                ? 'bg-pink-600 text-white shadow-md shadow-pink-500/20'
                : 'bg-slate-50 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" /> Customer Directory ({customers.length})
          </button>

          <button
            onClick={() => setSubTab('riders')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all ${
              subTab === 'riders'
                ? 'bg-pink-600 text-white shadow-md shadow-pink-500/20'
                : 'bg-slate-50 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Bike className="w-4 h-4" /> Delivery Riders ({riders.length})
          </button>
        </div>

        <div>
          {subTab === 'admins' && (
            <button
              onClick={() => setShowAddAdminModal(true)}
              className="px-4 py-2.5 rounded-2xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-md shadow-pink-500/20 transition-transform hover:scale-105"
            >
              <UserPlus className="w-4 h-4" /> + Add Staff User
            </button>
          )}

          {subTab === 'riders' && (
            <button
              onClick={() => {
                setEditingRider(null)
                setNewRiderName('')
                setNewRiderPhone('')
                setNewRiderActive(true)
                setShowAddRiderModal(true)
              }}
              className="px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-md shadow-blue-500/20 transition-transform hover:scale-105"
            >
              <Plus className="w-4 h-4" /> + Add Delivery Rider
            </button>
          )}
        </div>
      </div>

      {/* ─── SUB-TAB 1: STAFF & ADMINS ────────────────────────────────────────── */}
      {subTab === 'admins' && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={adminSearch}
              onChange={(e) => setAdminSearch(e.target.value)}
              placeholder="Search staff by email or role..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-pink-500 shadow-sm"
            />
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm">
            {loading ? (
              <div className="p-8 text-center text-xs text-slate-400 animate-pulse">Loading staff records...</div>
            ) : filteredAdmins.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">No staff members found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700 dark:text-zinc-300">
                  <thead className="bg-slate-50 dark:bg-zinc-950 text-slate-500 dark:text-zinc-400 uppercase tracking-wider font-semibold border-b border-zinc-200 dark:border-zinc-800 text-[10px]">
                    <tr>
                      <th className="p-4">User Email</th>
                      <th className="p-4">Assigned Role</th>
                      <th className="p-4">Account Security</th>
                      <th className="p-4">Created Date</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/80">
                    {filteredAdmins.map((u) => {
                      const isLocked = u.locked_until && new Date(u.locked_until) > new Date()

                      return (
                        <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-pink-100 dark:bg-pink-950/60 text-pink-600 dark:text-pink-400 flex items-center justify-center font-bold text-[11px]">
                                {u.email.charAt(0).toUpperCase()}
                              </div>
                              <span className="font-extrabold text-slate-900 dark:text-white">{u.email}</span>
                            </div>
                          </td>

                          <td className="p-4">
                            <select
                              value={u.role}
                              onChange={(e) => handleUpdateRole(u.id, e.target.value)}
                              className="px-2.5 py-1 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
                            >
                              <option value="super_admin">super_admin</option>
                              <option value="admin">admin</option>
                              <option value="rider_manager">rider_manager</option>
                              <option value="support">support</option>
                            </select>
                          </td>

                          <td className="p-4">
                            {isLocked ? (
                              <div className="flex items-center gap-1.5 text-red-500 font-bold">
                                <Lock className="w-3.5 h-3.5" />
                                <span>Locked ({u.failed_login_attempts} failed attempts)</span>
                                <button
                                  onClick={() => handleUnlockUser(u.id)}
                                  className="ml-2 px-2 py-0.5 rounded bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 text-[10px] font-black"
                                >
                                  Unlock
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Active / Unlocked</span>
                              </div>
                            )}
                          </td>

                          <td className="p-4 text-slate-500 dark:text-zinc-400 font-mono text-[11px]">
                            {new Date(u.created_at).toLocaleDateString([], { dateStyle: 'medium' })}
                          </td>

                          <td className="p-4 text-right space-x-1">
                            <button
                              onClick={() => {
                                setShowResetPasswordModal(u)
                                setResetNewPassword('')
                              }}
                              className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 text-slate-700 dark:text-zinc-200 font-bold text-[11px] inline-flex items-center gap-1"
                              title="Reset Password"
                            >
                              <Key className="w-3.5 h-3.5 text-pink-500" /> Reset Password
                            </button>
                            <button
                              onClick={() => handleDeleteAdmin(u)}
                              className="p-1.5 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-zinc-800"
                              title="Revoke & Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── SUB-TAB 2: CUSTOMER DIRECTORY ────────────────────────────────────── */}
      {subTab === 'customers' && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
              placeholder="Search customers by phone number or email..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-pink-500 shadow-sm"
            />
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm">
            {loading ? (
              <div className="p-8 text-center text-xs text-slate-400 animate-pulse">Loading customer records...</div>
            ) : filteredCustomers.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">No customer accounts found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700 dark:text-zinc-300">
                  <thead className="bg-slate-50 dark:bg-zinc-950 text-slate-500 dark:text-zinc-400 uppercase tracking-wider font-semibold border-b border-zinc-200 dark:border-zinc-800 text-[10px]">
                    <tr>
                      <th className="p-4">Customer Phone</th>
                      <th className="p-4">Email</th>
                      <th className="p-4">Total Orders</th>
                      <th className="p-4">Total Spent (KES)</th>
                      <th className="p-4">Registered Date</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/80">
                    {filteredCustomers.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                        <td className="p-4 font-mono font-bold text-slate-900 dark:text-white">
                          <span className="flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-pink-500" /> {c.phone}
                          </span>
                        </td>

                        <td className="p-4 text-slate-600 dark:text-zinc-400">
                          {c.email || '—'}
                        </td>

                        <td className="p-4">
                          <span className="px-2.5 py-0.5 rounded-full bg-pink-100 dark:bg-pink-950 text-pink-700 dark:text-pink-300 font-black text-[10px]">
                            {c.total_orders} Orders
                          </span>
                        </td>

                        <td className="p-4 font-black text-pink-600 dark:text-pink-400">
                          KES {Number(c.total_spent_kes).toLocaleString()}
                        </td>

                        <td className="p-4 text-slate-500 dark:text-zinc-400 font-mono text-[11px]">
                          {new Date(c.created_at).toLocaleDateString([], { dateStyle: 'medium' })}
                        </td>

                        <td className="p-4 text-right">
                          <button
                            onClick={() => handleOpenCustomerOrders(c)}
                            className="px-3 py-1.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-bold text-[11px] inline-flex items-center gap-1 shadow-sm transition-transform hover:scale-105"
                          >
                            <ShoppingBag className="w-3.5 h-3.5" /> View Order History
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── SUB-TAB 3: DELIVERY RIDERS ───────────────────────────────────────── */}
      {subTab === 'riders' && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={riderSearch}
              onChange={(e) => setRiderSearch(e.target.value)}
              placeholder="Search couriers by name or phone..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 shadow-sm"
            />
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm">
            {loading ? (
              <div className="p-8 text-center text-xs text-slate-400 animate-pulse">Loading courier records...</div>
            ) : filteredRiders.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">No delivery riders found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700 dark:text-zinc-300">
                  <thead className="bg-slate-50 dark:bg-zinc-950 text-slate-500 dark:text-zinc-400 uppercase tracking-wider font-semibold border-b border-zinc-200 dark:border-zinc-800 text-[10px]">
                    <tr>
                      <th className="p-4">Rider Name</th>
                      <th className="p-4">Phone Number</th>
                      <th className="p-4">Delivery Status</th>
                      <th className="p-4">Total Deliveries</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/80">
                    {filteredRiders.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                        <td className="p-4 font-bold text-slate-900 dark:text-white">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-[11px]">
                              <Bike className="w-4 h-4" />
                            </div>
                            <span>{r.name}</span>
                          </div>
                        </td>

                        <td className="p-4 font-mono font-semibold text-slate-800 dark:text-zinc-200">
                          {r.phone}
                        </td>

                        <td className="p-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                            r.is_active
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-slate-200 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400'
                          }`}>
                            {r.is_active ? 'Active Courier' : 'Inactive'}
                          </span>
                        </td>

                        <td className="p-4 font-bold text-slate-900 dark:text-white">
                          {r.total_deliveries || 0} Drop-offs
                        </td>

                        <td className="p-4 text-right space-x-1">
                          <button
                            onClick={() => {
                              setEditingRider(r)
                              setNewRiderName(r.name)
                              setNewRiderPhone(r.phone)
                              setNewRiderActive(r.is_active)
                              setShowAddRiderModal(true)
                            }}
                            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800"
                            title="Edit Rider"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteRider(r)}
                            className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-zinc-800"
                            title="Delete Rider"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- ADD STAFF MODAL --- */}
      {showAddAdminModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-pink-500" /> Create Staff / Admin User
              </h3>
              <button onClick={() => setShowAddAdminModal(false)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateAdmin} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-slate-600 dark:text-zinc-400">Staff Email *</label>
                <input
                  type="email"
                  required
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  placeholder="e.g. manager@popotecards.co.ke"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-slate-900 dark:text-white font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-600 dark:text-zinc-400">Password (Min 8 Chars) *</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={newAdminPassword}
                  onChange={(e) => setNewAdminPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-slate-900 dark:text-white font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-600 dark:text-zinc-400">Role & Permissions *</label>
                <select
                  value={newAdminRole}
                  onChange={(e) => setNewAdminRole(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-slate-900 dark:text-white font-bold"
                >
                  <option value="admin">Admin (Manage Orders, Catalog, Reviews)</option>
                  <option value="super_admin">Super Admin (Full System & User Control)</option>
                  <option value="rider_manager">Rider Manager (Dispatches & Couriers)</option>
                  <option value="support">Support Agent (Disputes & View Only)</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddAdminModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-zinc-800 font-bold text-slate-700 dark:text-zinc-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-extrabold shadow-md shadow-pink-500/20"
                >
                  {submitting ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- RESET PASSWORD MODAL --- */}
      {showResetPasswordModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Key className="w-5 h-5 text-pink-500" /> Reset Password
              </h3>
              <button onClick={() => setShowResetPasswordModal(null)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Reset login credentials for <strong>{showResetPasswordModal.email}</strong>.
            </p>

            <form onSubmit={handleResetPassword} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-slate-600 dark:text-zinc-400">New Password (Min 8 Chars) *</label>
                <div className="relative">
                  <input
                    type={showResetPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={resetNewPassword}
                    onChange={(e) => setResetNewPassword(e.target.value)}
                    placeholder="Enter new strong password"
                    className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-slate-900 dark:text-white font-bold"
                  />
                  <button
                    type="button"
                    onClick={() => setShowResetPassword(!showResetPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:text-zinc-500 dark:hover:text-zinc-300 transition-colors p-0.5 rounded-lg focus:outline-none"
                    aria-label={showResetPassword ? 'Hide password' : 'Show password'}
                  >
                    {showResetPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowResetPasswordModal(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-zinc-800 font-bold text-slate-700 dark:text-zinc-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-extrabold shadow-md shadow-pink-500/20"
                >
                  {submitting ? 'Updating...' : 'Save New Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- ADD / EDIT RIDER MODAL --- */}
      {showAddRiderModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Bike className="w-5 h-5 text-blue-500" /> {editingRider ? 'Edit Delivery Rider' : 'Add New Delivery Rider'}
              </h3>
              <button onClick={() => setShowAddRiderModal(false)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateOrUpdateRider} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-slate-600 dark:text-zinc-400">Rider Full Name *</label>
                <input
                  type="text"
                  required
                  value={newRiderName}
                  onChange={(e) => setNewRiderName(e.target.value)}
                  placeholder="e.g. Samuel Kiprop"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-slate-900 dark:text-white font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-600 dark:text-zinc-400">Phone Number *</label>
                <input
                  type="text"
                  required
                  value={newRiderPhone}
                  onChange={(e) => setNewRiderPhone(e.target.value)}
                  placeholder="07XXXXXXXX"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-slate-900 dark:text-white font-bold"
                />
              </div>

              <div className="pt-1">
                <label className="flex items-center gap-2 font-semibold text-slate-800 dark:text-zinc-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newRiderActive}
                    onChange={(e) => setNewRiderActive(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-0"
                  />
                  Active & Available for School Drop-offs
                </label>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddRiderModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-zinc-800 font-bold text-slate-700 dark:text-zinc-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold shadow-md shadow-blue-500/20"
                >
                  {submitting ? 'Saving...' : editingRider ? 'Save Changes' : 'Create Rider'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- CUSTOMER ORDERS DRAWER / MODAL --- */}
      {selectedCustomerForOrders && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-2xl rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto animate-in scale-in">
            <div className="flex justify-between items-start border-b border-zinc-200 dark:border-zinc-800 pb-4">
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-extrabold uppercase">
                  CUSTOMER ORDER RECORD
                </span>
                <h3 className="text-xl font-black text-slate-900 dark:text-white mt-1">
                  {selectedCustomerForOrders.phone}
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  {selectedCustomerForOrders.email || 'No email on file'} • Total Lifetime Value: <strong>KES {Number(selectedCustomerForOrders.total_spent_kes).toLocaleString()}</strong>
                </p>
              </div>
              <button
                onClick={() => setSelectedCustomerForOrders(null)}
                className="p-2 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-500 hover:text-slate-900 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingCustomerOrders ? (
              <div className="p-8 text-center text-xs text-slate-400 animate-pulse">Loading order history...</div>
            ) : customerOrders.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">No orders found for this customer.</div>
            ) : (
              <div className="space-y-3">
                {customerOrders.map((ord: any) => (
                  <div
                    key={ord.id}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex justify-between items-center text-xs"
                  >
                    <div>
                      <div className="font-extrabold text-slate-900 dark:text-white text-sm">
                        #{ord.order_number}
                      </div>
                      <span className="text-[11px] text-slate-500 dark:text-zinc-400 block mt-0.5">
                        {ord.recipients || `${ord.item_count} Card(s)`} • {new Date(ord.created_at).toLocaleDateString([], { dateStyle: 'medium' })}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right space-y-1">
                        <div className="font-black text-pink-600 dark:text-pink-400 text-sm">
                          KES {Number(ord.total_amount_kes).toLocaleString()}
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                          ord.status === 'delivered' || ord.status === 'paid'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                        }`}>
                          {ord.status}
                        </span>
                      </div>

                      <button
                        onClick={() => handleDownloadOrderZip(ord.id, ord.order_number)}
                        disabled={downloadingOrderId === ord.id}
                        className="p-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white transition-transform hover:scale-105 disabled:opacity-50"
                        title="Download order design & resources ZIP"
                      >
                        {downloadingOrderId === ord.id ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Package className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
