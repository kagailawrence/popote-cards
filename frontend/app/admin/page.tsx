'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Lock, LogOut, CheckCircle2, Clock, Printer, Truck, DollarSign,
  AlertCircle, RefreshCw, Layers, ShieldAlert, Bike, Package, Tag,
  MapPin, Plus, Trash2, Palette, FolderPlus, Upload, Eye, EyeOff, Save, Image as ImageIcon, Check, Download, FileText, X, ExternalLink, Sliders, Star, Users
} from 'lucide-react'
import AnalyticsDashboard from '../../components/admin/AnalyticsDashboard'
import RegionalHubTab from '../../components/admin/RegionalHubTab'
import DisputesTab from '../../components/admin/DisputesTab'
import LocationsTab from '../../components/admin/LocationsTab'
import DesignsTab from '../../components/admin/DesignsTab'
import OrdersTab from '../../components/admin/OrdersTab'
import ReviewsTab from '../../components/admin/ReviewsTab'
import UsersTab from '../../components/admin/UsersTab'
import PricingTab from '../../components/admin/PricingTab'
import ManualOrderModal from '../../components/admin/ManualOrderModal'
import { getCookie, setCookie, eraseCookie } from '../../lib/cookies'

export default function AdminPage() {
  const router = useRouter()
  const [token, setToken] = useState<string | null>(null)
  const [email, setEmail] = useState('admin@popotecards.co.ke')
  const [password, setPassword] = useState('Admin123!')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [isManualModalOpen, setIsManualModalOpen] = useState(false)

  // Navigation tab
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'hubs' | 'disputes' | 'reviews' | 'designs' | 'locations' | 'riders' | 'pricing' | 'users'>('overview')

  // Automatically check cookies on mount to redirect to dashboard if token cookie is valid
  useEffect(() => {
    const savedToken =
      getCookie('popote_admin_token') ||
      getCookie('fair_admin_token') ||
      (typeof window !== 'undefined'
        ? localStorage.getItem('popote_admin_token') || localStorage.getItem('fair_admin_token')
        : null)
    if (savedToken) {
      setToken(savedToken)
      fetchAllAdminData(savedToken)
      fetchAnalytics(savedToken)
    }
  }, [])

  // Dashboard Data
  const [stats, setStats] = useState<any>(null)
  const [orders, setOrders] = useState<any[]>([])
  const [designs, setDesigns] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [counties, setCounties] = useState<any[]>([])
  const [subCounties, setSubCounties] = useState<any[]>([])
  const [riders, setRiders] = useState<any[]>([])
  const [disputes, setDisputes] = useState<any[]>([])

  // Analytics Dashboard State
  const [analytics, setAnalytics] = useState<any>(null)
  const [revenueChart, setRevenueChart] = useState<any[]>([])
  const [analyticsLoading, setAnalyticsLoading] = useState(false)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    sales: true, marketing: true, inventory: true
  })
  const [priceMatrix, setPriceMatrix] = useState<any[]>([])

  // Print Package Modal State
  const [selectedOrderForPrint, setSelectedOrderForPrint] = useState<any>(null)
  const [loadingOrderDetails, setLoadingOrderDetails] = useState(false)

  // Pricing edit state map: { [ruleId]: amount }
  const [editedPrices, setEditedPrices] = useState<{ [key: string]: number }>({})

  // Category Form State
  const [newCategoryType, setNewCategoryType] = useState<'occasion' | 'style' | 'religion'>('occasion')
  const [newCategoryName, setNewCategoryName] = useState('')

  // Design Form State
  const [newDesignName, setNewDesignName] = useState('')
  const [newDesignDesc, setNewDesignDesc] = useState('')
  const [newDesignAllowsPhoto, setNewDesignAllowsPhoto] = useState(true)
  const [selectedCategoryId, setSelectedCategoryId] = useState('')

  // Selected Design for Image Uploads & Image Thumbnails
  const [uploadDesignId, setUploadDesignId] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)

  // Location Form State
  const [newCountyName, setNewCountyName] = useState('')
  const [newSubCountyName, setNewSubCountyName] = useState('')
  const [selectedCountyForSub, setSelectedCountyForSub] = useState('')
  const [newSubCountyZone, setNewSubCountyZone] = useState<'cbd' | 'outskirts'>('cbd')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Login failed')

      const accessToken = data.data.accessToken
      setToken(accessToken)
      setCookie('popote_admin_token', accessToken, 7)
      if (typeof window !== 'undefined') {
        localStorage.setItem('popote_admin_token', accessToken)
      }
      fetchAllAdminData(accessToken)
      fetchAnalytics(accessToken)
    } catch (err: any) {
      setError(err.message || 'Authentication error')
    } finally {
      setLoading(false)
    }
  }

  const fetchAllAdminData = async (jwtToken: string) => {
    try {
      const [statsRes, ordersRes, designsRes, categoriesRes, countiesRes, subCountiesRes, ridersRes, disputesRes, pricingRes] = await Promise.all([
        fetch('/api/v1/admin/stats', { headers: { Authorization: `Bearer ${jwtToken}` } }),
        fetch('/api/v1/admin/orders', { headers: { Authorization: `Bearer ${jwtToken}` } }),
        fetch('/api/v1/catalog/designs'),
        fetch('/api/v1/catalog/categories'),
        fetch('/api/v1/locations/counties'),
        fetch('/api/v1/locations/sub-counties'),
        fetch('/api/v1/riders', { headers: { Authorization: `Bearer ${jwtToken}` } }),
        fetch('/api/v1/disputes', { headers: { Authorization: `Bearer ${jwtToken}` } }),
        fetch('/api/v1/pricing/matrix'),
      ])

      if (statsRes.status === 401 || ordersRes.status === 401) {
        setToken(null)
        eraseCookie('popote_admin_token')
        eraseCookie('fair_admin_token')
        if (typeof window !== 'undefined') {
          localStorage.removeItem('popote_admin_token')
          localStorage.removeItem('fair_admin_token')
        }
        toast.error('Admin session expired. Please log in again.')
        return
      }

      const statsData = await statsRes.json()
      const ordersData = await ordersRes.json()
      const designsData = await designsRes.json()
      const categoriesData = await categoriesRes.json()
      const countiesData = await countiesRes.json()
      const subCountiesData = await subCountiesRes.json()
      const ridersData = await ridersRes.json()
      const disputesData = await disputesRes.json()
      const pricingData = await pricingRes.json()

      if (statsData.data) setStats(statsData.data)
      if (ordersData.data) setOrders(ordersData.data)
      if (designsData.data) {
        setDesigns(designsData.data)
        if (designsData.data.length > 0 && !uploadDesignId) {
          setUploadDesignId(designsData.data[0].id)
        }
      }
      if (categoriesData.data) {
        setCategories(categoriesData.data)
        if (categoriesData.data.length > 0 && !selectedCategoryId) {
          setSelectedCategoryId(categoriesData.data[0].id)
        }
      }
      if (countiesData.data) {
        setCounties(countiesData.data)
        if (countiesData.data.length > 0 && !selectedCountyForSub) {
          setSelectedCountyForSub(countiesData.data[0].id)
        }
      }
      if (subCountiesData.data) setSubCounties(subCountiesData.data)
      if (ridersData.data) setRiders(ridersData.data)
      if (disputesData.data) setDisputes(disputesData.data)
      if (pricingData.data) {
        setPriceMatrix(pricingData.data)
        const initPrices: { [key: string]: number } = {}
        pricingData.data.forEach((p: any) => {
          initPrices[p.id] = Number(p.amount_kes)
        })
        setEditedPrices(initPrices)
      }
    } catch (err) {
      console.error('Failed to fetch admin data', err)
    }
  }

  const fetchAnalytics = async (jwtToken: string) => {
    setAnalyticsLoading(true)
    try {
      const [analyticsRes, chartRes] = await Promise.all([
        fetch('/api/v1/admin/analytics', { headers: { Authorization: `Bearer ${jwtToken}` } }),
        fetch('/api/v1/admin/analytics/revenue-chart', { headers: { Authorization: `Bearer ${jwtToken}` } }),
      ])
      const analyticsData = await analyticsRes.json()
      const chartData = await chartRes.json()
      if (analyticsData.data) setAnalytics(analyticsData.data)
      if (chartData.data) setRevenueChart(chartData.data)
    } catch (err) {
      console.error('Failed to fetch analytics', err)
    } finally {
      setAnalyticsLoading(false)
    }
  }


  const handleOpenPrintModal = async (orderId: string) => {
    if (!token) return
    setLoadingOrderDetails(true)
    try {
      const res = await fetch(`/api/v1/admin/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (data.data) {
        setSelectedOrderForPrint(data.data)
      }
    } catch (err) {
      console.error('Failed to fetch order print details', err)
    } finally {
      setLoadingOrderDetails(false)
    }
  }

  const handleBulkExportZip = async () => {
    if (!token) return
    try {
      const res = await fetch('/api/v1/admin/export/export', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || 'Export failed')
        return
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Print_Ready_Cards_Export_${Date.now()}.zip`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      toast.success('Print-ready cards export package downloaded!')
    } catch (err: any) {
      console.error('Export zip failed', err)
      toast.error(err.message || 'Export zip failed')
    }
  }

  const handleDownloadCardPrintPackage = (item: any, orderNumber: string) => {
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Commercial Print Specs - ${orderNumber} - ${item.recipient_full_names}</title>
  <style>
    body { font-family: system-ui, sans-serif; padding: 40px; color: #1e293b; max-width: 800px; margin: 0 auto; }
    .header { border-bottom: 3px solid #ec4899; padding-bottom: 20px; margin-bottom: 30px; }
    .title { font-size: 24px; font-weight: 900; color: #0f172a; }
    .badge { background: #fce7f3; color: #be185d; font-weight: bold; padding: 4px 12px; border-radius: 9999px; font-size: 12px; }
    .section { background: #f8fafc; border: 1px solid #e2e8f0; padding: 20px; border-radius: 16px; margin-bottom: 20px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .label { font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; }
    .value { font-size: 14px; font-weight: 800; color: #0f172a; margin-top: 4px; }
    .message-box { font-family: serif; font-size: 16px; font-style: italic; background: #fff; padding: 20px; border-radius: 12px; border: 1px solid #cbd5e1; margin-top: 10px; }
    @media print {
      body { padding: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div className="header">
    <span className="badge">POPOTE CARDS KENYA • COMMERCIAL PRINT SPECIFICATION</span>
    <h1 className="title">Order ${orderNumber} — ${item.size} Print Package</h1>
    <p>Target Candidate: <strong>${item.recipient_full_names}</strong> | Index/ADM: <strong>${item.admission_number}</strong></p>
  </div>

  <div className="section">
    <h3>1. Exact Millimetric Print Dimensions</h3>
    <div className="grid">
      <div>
        <div className="label">Card Print Size</div>
        <div className="value">${item.size} Deluxe Fold</div>
      </div>
      <div>
        <div className="label">Finished Trim Dimensions</div>
        <div className="value">${item.dimensions?.trimMm || '210 x 297 mm'}</div>
      </div>
      <div>
        <div className="label">Bleed Dimensions (2mm Bleed)</div>
        <div className="value">${item.dimensions?.bleedMm || '214 x 301 mm'}</div>
      </div>
      <div>
        <div className="label">Paper Stock Weight</div>
        <div className="value">${item.dimensions?.boardWeight || '350 GSM Heavy Board'}</div>
      </div>
    </div>
  </div>

  <div className="section">
    <h3>2. Recipient Student & Delivery Destination</h3>
    <div className="grid">
      <div>
        <div className="label">Candidate Full Names</div>
        <div className="value">${item.recipient_full_names}</div>
      </div>
      <div>
        <div className="label">Admission / Index No</div>
        <div className="value">${item.admission_number}</div>
      </div>
      <div>
        <div className="label">School Institution</div>
        <div className="value">${item.school_name} ${item.class_form ? `(${item.class_form})` : ''}</div>
      </div>
      <div>
        <div className="label">County & Sub-County Zone</div>
        <div className="value">${item.sub_county_name || 'Zone'}, ${item.county_name || 'County'}</div>
      </div>
    </div>
  </div>

  <div className="section">
    <h3>3. Page 3 Congratulatory Calligraphy Message</h3>
    <div className="label">Typography Style: ${item.message_font || 'serif'} | Ink Hex: ${item.message_colour || '#ec4899'}</div>
    <div className="message-box" style="color: ${item.message_colour || '#ec4899'}; font-family: ${item.message_font || 'serif'};">
      "${item.message_body}"
    </div>
  </div>

  ${item.photo_url ? `
  <div className="section">
    <h3>4. Candidate Photo Insert Asset</h3>
    <p>Photo Asset URL: <a href="${item.photo_url}" target="_blank">${item.photo_url}</a></p>
  </div>
  ` : ''}

  <div className="no-print" style="margin-top: 30px; text-align: center;">
    <button onclick="window.print()" style="padding: 12px 24px; background: #ec4899; color: #fff; border: none; font-weight: bold; border-radius: 12px; cursor: pointer;">
      Print / Save PDF Specs
    </button>
  </div>
</body>
</html>
    `

    const blob = new Blob([htmlContent], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Card_Print_Package_${orderNumber}_${item.recipient_full_names.replace(/\s+/g, '_')}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleDownloadItemPdf = async (item: any) => {
    if (!token) return
    try {
      const res = await fetch(`/api/v1/admin/export/items/${item.id}/download-pdf`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || 'Failed to download PDF')
        return
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${selectedOrderForPrint?.order_number || 'Order'}_${(item.recipient_full_names || 'Card').replace(/\s+/g, '_')}_${item.size || 'A4'}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success('4-Page Print PDF downloaded!')
    } catch (err: any) {
      console.error('Download PDF error', err)
      toast.error(err.message || 'Error downloading PDF')
    }
  }

  const showSuccess = (msg: string) => {
    toast.success(msg)
  }

  const handleUpdatePrice = async (priceId: string) => {
    if (!token) return
    const newPrice = editedPrices[priceId]
    if (newPrice === undefined || isNaN(newPrice) || newPrice < 0) return

    try {
      const res = await fetch(`/api/v1/pricing/matrix/${priceId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ amountKes: newPrice }),
      })
      if (res.ok) {
        toast.success('Card price rule updated successfully!')
        fetchAllAdminData(token)
      } else {
        const errData = await res.json().catch(() => ({}))
        toast.error(errData.error || 'Failed to update price rule')
      }
    } catch (err: any) {
      console.error('Update price failed', err)
      toast.error(err.message || 'Update price failed')
    }
  }

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token || !newCategoryName.trim()) return
    try {
      const res = await fetch('/api/v1/catalog/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ type: newCategoryType, name: newCategoryName.trim() }),
      })
      if (res.ok) {
        setNewCategoryName('')
        showSuccess('Category created successfully!')
        fetchAllAdminData(token)
      }
    } catch (err) {
      console.error('Create category failed', err)
    }
  }

  const handleDeleteCategory = async (id: string) => {
    if (!token) return
    try {
      const res = await fetch(`/api/v1/catalog/categories/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) fetchAllAdminData(token)
    } catch (err) {
      console.error('Delete category failed', err)
    }
  }

  const handleCreateDesign = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token || !newDesignName.trim()) return
    try {
      const res = await fetch('/api/v1/catalog/designs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newDesignName.trim(),
          description: newDesignDesc.trim(),
          allowsCustomPhoto: newDesignAllowsPhoto,
          categoryIds: selectedCategoryId ? [selectedCategoryId] : [],
        }),
      })
      if (res.ok) {
        const created = await res.json()
        setNewDesignName('')
        setNewDesignDesc('')
        if (created.data?.id) setUploadDesignId(created.data.id)
        showSuccess('Card template created! You can now upload 4-page artwork and manage prices.')
        fetchAllAdminData(token)
      }
    } catch (err) {
      console.error('Create design failed', err)
    }
  }

  const handleDeleteDesign = async (id: string) => {
    if (!token) return
    try {
      const res = await fetch(`/api/v1/catalog/designs/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) fetchAllAdminData(token)
    } catch (err) {
      console.error('Delete design failed', err)
    }
  }

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    if (!token) return
    try {
      const res = await fetch(`/api/v1/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) {
        showSuccess('Order status updated!')
        fetchAllAdminData(token)
      }
    } catch (err) {
      console.error('Update status failed', err)
    }
  }

  if (!token) {
    return (
      <div className="max-w-md mx-auto px-4 py-20">
        <form onSubmit={handleLogin} className="p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-6 shadow-xl dark:shadow-2xl">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-pink-100 dark:bg-pink-950 border border-pink-300 dark:border-pink-500/30 text-pink-600 dark:text-pink-500 flex items-center justify-center mx-auto shadow-inner">
              <Lock className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Admin Portal</h1>
            <p className="text-xs text-slate-600 dark:text-zinc-400">Sign in to manage designs, categories, card prices, orders, riders, and disputes.</p>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-400 mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl bg-slate-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-slate-900 dark:text-white text-sm p-3 focus:border-pink-500 focus:outline-none shadow-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-400 mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl bg-slate-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-slate-900 dark:text-white text-sm p-3 pr-11 focus:border-pink-500 focus:outline-none shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:text-zinc-500 dark:hover:text-zinc-300 transition-colors p-0.5 rounded-lg focus:outline-none"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-bold text-sm shadow-md transition-colors"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Admin Management Portal</h1>
          <p className="text-xs text-slate-600 dark:text-zinc-400 mt-1">Logged in as admin@popotecards.co.ke (Super Admin)</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsManualModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-extrabold text-xs shadow-md shadow-pink-600/30 flex items-center gap-1.5 transition-transform hover:scale-105"
          >
            <Plus className="w-4 h-4" /> Capture Phone Order
          </button>
          <button
            onClick={() => { fetchAllAdminData(token); fetchAnalytics(token); }}
            className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition-colors shadow-sm"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setToken(null)
              eraseCookie('popote_admin_token')
              eraseCookie('fair_admin_token')
              if (typeof window !== 'undefined') {
                localStorage.removeItem('popote_admin_token')
                localStorage.removeItem('fair_admin_token')
              }
              toast.success('Logged out from Admin Portal')
              router.push('/login')
            }}
            className="px-4 py-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-zinc-800 flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </div>

      <ManualOrderModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        onOrderCreated={() => {
          if (token) {
            fetchAllAdminData(token)
            fetchAnalytics(token)
          }
        }}
        token={token || ''}
      />

      {/* Admin Tab Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-4">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            activeTab === 'overview'
              ? 'bg-pink-600 text-white shadow-md shadow-pink-600/30'
              : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white shadow-sm'
          }`}
        >
          <Layers className="w-4 h-4" /> Analytics & Overview
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            activeTab === 'orders'
              ? 'bg-pink-600 text-white shadow-md shadow-pink-600/30'
              : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white shadow-sm'
          }`}
        >
          <Package className="w-4 h-4" /> Order Management ({orders.length})
        </button>

        <button
          onClick={() => setActiveTab('hubs')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            activeTab === 'hubs'
              ? 'bg-pink-600 text-white shadow-md shadow-pink-600/30'
              : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white shadow-sm'
          }`}
        >
          <Printer className="w-4 h-4 text-purple-500" /> Regional Print Hubs
        </button>

        <button
          onClick={() => setActiveTab('disputes')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            activeTab === 'disputes'
              ? 'bg-pink-600 text-white shadow-md shadow-pink-600/30'
              : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white shadow-sm'
          }`}
        >
          <ShieldAlert className="w-4 h-4 text-amber-500" /> Disputes & Refunds
        </button>

        <button
          onClick={() => setActiveTab('reviews')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            activeTab === 'reviews'
              ? 'bg-pink-600 text-white shadow-md shadow-pink-600/30'
              : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white shadow-sm'
          }`}
        >
          <Star className="w-4 h-4 text-amber-400 fill-amber-400" /> Customer Reviews
        </button>

        <button
          onClick={() => setActiveTab('designs')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            activeTab === 'designs'
              ? 'bg-pink-600 text-white shadow-md shadow-pink-600/30'
              : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white shadow-sm'
          }`}
        >
          <Palette className="w-4 h-4" /> Designs & Studio ({designs.length})
        </button>

        <button
          onClick={() => setActiveTab('locations')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            activeTab === 'locations'
              ? 'bg-pink-600 text-white shadow-md shadow-pink-600/30'
              : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white shadow-sm'
          }`}
        >
          <MapPin className="w-4 h-4" /> Counties & Sub-Counties ({counties.length})
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            activeTab === 'users'
              ? 'bg-pink-600 text-white shadow-md shadow-pink-600/30'
              : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white shadow-sm'
          }`}
        >
          <Users className="w-4 h-4 text-purple-400" /> User Management
        </button>

        <button
          onClick={() => setActiveTab('pricing')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            activeTab === 'pricing'
              ? 'bg-pink-600 text-white shadow-md shadow-pink-600/30'
              : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white shadow-sm'
          }`}
        >
          <DollarSign className="w-4 h-4 text-emerald-500" /> Pricing & Delivery
        </button>
      </div>

      {/* Tab 1: Analytics & Overview */}
      {activeTab === 'overview' && (
        <AnalyticsDashboard analytics={analytics} revenueChart={revenueChart} loading={analyticsLoading} />
      )}

      {/* Tab: Regional Print Hubs */}
      {activeTab === 'hubs' && token && (
        <RegionalHubTab token={token} />
      )}

      {/* Tab: Disputes & Refunds */}
      {activeTab === 'disputes' && token && (
        <DisputesTab token={token} />
      )}

      {/* Tab: Customer Reviews & Testimonials */}
      {activeTab === 'reviews' && token && (
        <ReviewsTab token={token} />
      )}

      {/* Tab 2: Orders & Print Package Manager */}
      {activeTab === 'orders' && token && (
        <OrdersTab token={token} onOpenManualOrder={() => setIsManualModalOpen(true)} />
      )}

      {/* Tab 3: Card Designs & Customization Studio */}
      {activeTab === 'designs' && token && (
        <DesignsTab token={token} />
      )}

      {/* Tab: Counties & Sub-Counties Management */}
      {activeTab === 'locations' && token && (
        <LocationsTab token={token} />
      )}

      {/* Tab: Pricing & Delivery Fee Rules */}
      {activeTab === 'pricing' && token && (
        <PricingTab token={token} />
      )}

      {/* Tab: User Management (Staff, Customers, Riders) */}
      {activeTab === 'users' && token && (
        <UsersTab token={token} />
      )}

      {/* Print Package Inspection Modal */}
      {selectedOrderForPrint && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 max-w-3xl w-full space-y-6 shadow-2xl animate-scale-in my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b border-zinc-200 dark:border-zinc-800 pb-4">
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-pink-100 dark:bg-pink-950 text-pink-700 dark:text-pink-300 text-[10px] font-extrabold uppercase tracking-widest border border-pink-300 dark:border-pink-800">
                  COMMERCIAL PRINT INSPECTOR
                </span>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                  Order #{selectedOrderForPrint.order_number}
                </h2>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                  Customer Phone: <strong>{selectedOrderForPrint.phone}</strong> | Delivery Status: <strong>{selectedOrderForPrint.status}</strong>
                </p>
              </div>
              <button
                onClick={() => setSelectedOrderForPrint(null)}
                className="p-2 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingOrderDetails ? (
              <div className="p-8 text-center text-slate-500 animate-pulse">Loading order print specifications...</div>
            ) : (
              <div className="space-y-6">
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-700 dark:text-zinc-300">
                  Order Items & High-Resolution Vector Print PDFs ({selectedOrderForPrint.items?.length || 0})
                </h3>

                <div className="space-y-4">
                  {selectedOrderForPrint.items?.map((item: any) => (
                    <div
                      key={item.id}
                      className="p-5 rounded-2xl bg-slate-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-4 shadow-sm"
                    >
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 pb-3 border-b border-zinc-200 dark:border-zinc-800/80">
                        <div>
                          <span className="text-xs font-bold text-pink-600 dark:text-pink-400 uppercase tracking-wider">
                            {item.size} Print Card Package
                          </span>
                          <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                            Candidate: {item.recipient_full_names}
                          </h4>
                          <span className="text-xs text-slate-500 dark:text-zinc-400">
                            Index / ADM: <strong>{item.admission_number}</strong> | School: <strong>{item.school_name}</strong> {item.class_form ? `(${item.class_form})` : ''}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleDownloadItemPdf(item)}
                            className="px-3.5 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-transform hover:scale-105"
                          >
                            <Download className="w-4 h-4" /> Download 4-Page Print PDF
                          </button>

                          <button
                            onClick={() => handleDownloadCardPrintPackage(item, selectedOrderForPrint.order_number)}
                            className="px-3.5 py-2 rounded-xl bg-slate-200 dark:bg-zinc-800 hover:bg-slate-300 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
                          >
                            <FileText className="w-4 h-4 text-pink-500" /> HTML Specs
                          </button>
                        </div>
                      </div>

                      {/* Custom Message preview & Photo */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        <div className="space-y-1">
                          <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-zinc-500">Personal Calligraphy Message (Page 3)</span>
                          <p className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 italic text-slate-800 dark:text-zinc-200 font-serif">
                            "{item.custom_message || 'Standard Congratulatory Wish'}"
                          </p>
                        </div>

                        {item.custom_photo_path && (
                          <div className="space-y-1">
                            <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-zinc-500">Uploaded Candidate Photo</span>
                            <div className="flex items-center gap-3 p-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                              <img
                                src={`/storage/${item.custom_photo_path.replace(/^\/+/, '')}`}
                                alt="Candidate photo"
                                className="w-12 h-12 object-cover rounded-lg border border-pink-500"
                              />
                              <div>
                                <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 block">Glossy Insert Frame</span>
                                <a
                                  href={`/storage/${item.custom_photo_path.replace(/^\/+/, '')}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[10px] text-pink-500 hover:underline font-semibold"
                                >
                                  Open Original Photo &rarr;
                                </a>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
