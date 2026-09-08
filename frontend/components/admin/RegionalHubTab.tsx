'use client'

import { useState, useEffect, useMemo } from 'react'
import { toast } from 'sonner'
import {
  Printer, MapPin, CheckCircle2, Clock, Truck, Plus, Edit2, Trash2,
  Phone, Mail, MessageSquare, Download, RefreshCw, AlertCircle, Package,
  Search, ExternalLink, X, Globe, DollarSign, Layers, ArrowRight, Check
} from 'lucide-react'

interface PrintHub {
  id: string
  name: string
  contact_person: string | null
  phone: string | null
  whatsapp_number: string | null
  email: string | null
  address: string | null
  status: 'active' | 'standby' | 'maintenance'
  cost_per_card_kes: number
  created_at: string
  updated_at: string
  mapped_counties_count: number
  mapped_counties_names: string | null
  total_cards: number
  pending_cards: number
  printing_cards: number
  dispatched_cards: number
  delivered_cards: number
  total_cogs_kes: number
}

interface County {
  id: string
  name: string
}

const KENYA_REGIONS_MAP: Record<string, string[]> = {
  'Coast': ['Mombasa', 'Kwale', 'Kilifi', 'Tana River', 'Lamu', 'Taita-Taveta'],
  'North Eastern': ['Garissa', 'Wajir', 'Mandera'],
  'Eastern': ['Marsabit', 'Isiolo', 'Meru', 'Tharaka-Nithi', 'Embu', 'Kitui', 'Machakos', 'Makueni'],
  'Central': ['Nyandarua', 'Nyeri', 'Kirinyaga', "Murang'a", 'Kiambu'],
  'Rift Valley': ['Turkana', 'West Pokot', 'Samburu', 'Trans-Nzoia', 'Uasin Gishu', 'Elgeyo-Marakwet', 'Nandi', 'Baringo', 'Laikipia', 'Nakuru', 'Narok', 'Kajiado', 'Kericho', 'Bomet'],
  'Western': ['Kakamega', 'Vihiga', 'Bungoma', 'Busia'],
  'Nyanza': ['Siaya', 'Kisumu', 'Homa Bay', 'Migori', 'Kisii', 'Nyamira'],
  'Nairobi': ['Nairobi']
}

interface HubOrderItem {
  item_id: string
  order_id: string
  size: string
  recipient_full_names: string
  admission_number: string
  school_name: string
  class_form: string | null
  custom_photo_storage_path: string | null
  message_body: string | null
  message_font: string | null
  message_colour: string | null
  religion: string | null
  unit_price_kes: number
  cogs_kes: number
  print_status: string
  rendered_pdf_storage_path: string | null
  order_number: string
  order_status: string
  order_created_at: string
  customer_phone: string
  county_name: string
  sub_county_name: string | null
  design_name: string
  hub_name: string
  hub_phone: string | null
  hub_whatsapp: string | null
  hub_contact: string | null
}

interface RegionalHubTabProps {
  token: string
}

export default function RegionalHubTab({ token }: RegionalHubTabProps) {
  const [hubs, setHubs] = useState<PrintHub[]>([])
  const [counties, setCounties] = useState<County[]>([])
  const [allHubOrders, setAllHubOrders] = useState<HubOrderItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Filters
  const [selectedHubFilter, setSelectedHubFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Modals & UI Expanded State
  const [showAddHubModal, setShowAddHubModal] = useState(false)
  const [editingHub, setEditingHub] = useState<PrintHub | null>(null)
  const [mappingHub, setMappingHub] = useState<PrintHub | null>(null)
  const [selectedCountyIds, setSelectedCountyIds] = useState<string[]>([])
  const [savingMapping, setSavingMapping] = useState(false)
  const [modalCountySearch, setModalCountySearch] = useState('')
  const [modalRegionFilter, setModalRegionFilter] = useState<string>('all')
  const [expandedCountyHubId, setExpandedCountyHubId] = useState<string | null>(null)

  // Hub Form
  const [hubName, setHubName] = useState('')
  const [hubContact, setHubContact] = useState('')
  const [hubPhone, setHubPhone] = useState('')
  const [hubWhatsapp, setHubWhatsapp] = useState('')
  const [hubEmail, setHubEmail] = useState('')
  const [hubAddress, setHubAddress] = useState('')
  const [hubStatus, setHubStatus] = useState<'active' | 'standby' | 'maintenance'>('active')
  const [hubCost, setHubCost] = useState<number>(150)
  const [submittingHub, setSubmittingHub] = useState(false)

  // Download ZIP state
  const [downloadingHubId, setDownloadingHubId] = useState<string | null>(null)
  const [downloadingItemId, setDownloadingItemId] = useState<string | null>(null)
  const [reroutingOrderId, setReroutingOrderId] = useState<string | null>(null)

  const showSuccess = (msg: string) => {
    toast.success(msg)
  }

  const fetchHubData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [hubsRes, countiesRes] = await Promise.all([
        fetch('/api/v1/admin/hubs', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch('/api/v1/locations/counties')
      ])

      const hubsData = await hubsRes.json()
      const countiesData = await countiesRes.json()

      if (hubsData.data) setHubs(hubsData.data)
      if (countiesData.data) setCounties(countiesData.data)

      // Fetch all hub orders
      if (hubsData.data && hubsData.data.length > 0) {
        const orderPromises = hubsData.data.map((h: PrintHub) =>
          fetch(`/api/v1/admin/hubs/${h.id}/orders`, {
            headers: { Authorization: `Bearer ${token}` }
          }).then(r => r.json())
        )
        const orderResults = await Promise.all(orderPromises)
        const combinedOrders: HubOrderItem[] = []
        orderResults.forEach(res => {
          if (res.data && Array.isArray(res.data)) {
            combinedOrders.push(...res.data)
          }
        })
        setAllHubOrders(combinedOrders)
      }
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || 'Failed to load regional print hubs data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHubData()
  }, [token])

  // Open Edit Hub Modal
  const handleOpenEditHub = (hub: PrintHub) => {
    setEditingHub(hub)
    setHubName(hub.name)
    setHubContact(hub.contact_person || '')
    setHubPhone(hub.phone || '')
    setHubWhatsapp(hub.whatsapp_number || '')
    setHubEmail(hub.email || '')
    setHubAddress(hub.address || '')
    setHubStatus(hub.status || 'active')
    setHubCost(Number(hub.cost_per_card_kes) || 150)
    setShowAddHubModal(true)
  }

  // Open Add Hub Modal
  const handleOpenAddHub = () => {
    setEditingHub(null)
    setHubName('')
    setHubContact('')
    setHubPhone('')
    setHubWhatsapp('')
    setHubEmail('')
    setHubAddress('')
    setHubStatus('active')
    setHubCost(150)
    setShowAddHubModal(true)
  }

  // Save Hub Form
  const handleSaveHub = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmittingHub(true)
    try {
      const url = editingHub
        ? `/api/v1/admin/hubs/${editingHub.id}`
        : '/api/v1/admin/hubs'
      const method = editingHub ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: hubName,
          contact_person: hubContact,
          phone: hubPhone,
          whatsapp_number: hubWhatsapp,
          email: hubEmail,
          address: hubAddress,
          status: hubStatus,
          cost_per_card_kes: hubCost
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save hub')

      toast.success(editingHub ? 'Regional Hub updated successfully' : 'New Regional Hub created successfully')
      setShowAddHubModal(false)
      fetchHubData()
    } catch (err: any) {
      toast.error(err.message || 'Error saving hub')
    } finally {
      setSubmittingHub(false)
    }
  }

  // Delete Hub
  const handleDeleteHub = async (hub: PrintHub) => {
    if (!confirm(`Are you sure you want to remove '${hub.name}'? Active orders will be re-routed to the primary hub.`)) return
    try {
      const res = await fetch(`/api/v1/admin/hubs/${hub.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Failed to delete hub')
      toast.success(`Hub '${hub.name}' removed`)
      fetchHubData()
    } catch (err: any) {
      toast.error(err.message || 'Error deleting hub')
    }
  }

  // Open County Coverage Mapping Modal
  const handleOpenCoverageMapping = async (hub: PrintHub) => {
    setMappingHub(hub)
    setSelectedCountyIds([])
    setModalCountySearch('')
    setModalRegionFilter('all')
    try {
      const res = await fetch(`/api/v1/admin/hubs/${hub.id}/counties`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.data) {
        setSelectedCountyIds(data.data.map((c: County) => c.id))
      }
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || 'Failed to load hub counties')
    }
  }

  // Save County Mapping
  const handleSaveCoverageMapping = async () => {
    if (!mappingHub) return
    setSavingMapping(true)
    try {
      const res = await fetch(`/api/v1/admin/hubs/${mappingHub.id}/counties`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ county_ids: selectedCountyIds })
      })
      if (!res.ok) throw new Error('Failed to update coverage mapping')
      toast.success(`County coverage mapped for ${mappingHub.name} (${selectedCountyIds.length} counties)`)
      setMappingHub(null)
      fetchHubData()
    } catch (err: any) {
      toast.error(err.message || 'Error saving county coverage')
    } finally {
      setSavingMapping(false)
    }
  }

  // County selection helpers for 47 counties
  const modalFilteredCounties = useMemo(() => {
    return counties.filter(c => {
      if (modalRegionFilter !== 'all') {
        const regionCounties = KENYA_REGIONS_MAP[modalRegionFilter] || []
        if (!regionCounties.some(name => name.toLowerCase() === c.name.toLowerCase())) return false
      }
      if (modalCountySearch.trim()) {
        const q = modalCountySearch.toLowerCase()
        if (!c.name.toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [counties, modalRegionFilter, modalCountySearch])

  const handleSelectRegionCounties = (regionName: string) => {
    const targetCountyNames = regionName === 'all'
      ? counties.map(c => c.name)
      : KENYA_REGIONS_MAP[regionName] || []

    const targetCountyIds = counties
      .filter(c => targetCountyNames.some(name => name.toLowerCase() === c.name.toLowerCase()))
      .map(c => c.id)

    setSelectedCountyIds(prev => Array.from(new Set([...prev, ...targetCountyIds])))
  }

  const handleDeselectRegionCounties = (regionName: string) => {
    const targetCountyNames = regionName === 'all'
      ? counties.map(c => c.name)
      : KENYA_REGIONS_MAP[regionName] || []

    const targetCountyIdSet = new Set(
      counties
        .filter(c => targetCountyNames.some(name => name.toLowerCase() === c.name.toLowerCase()))
        .map(c => c.id)
    )

    setSelectedCountyIds(prev => prev.filter(id => !targetCountyIdSet.has(id)))
  }

  // Download Hub Batch ZIP
  const handleDownloadHubBatchZip = async (hub: PrintHub) => {
    setDownloadingHubId(hub.id)
    try {
      const res = await fetch(`/api/v1/admin/export/hubs/${hub.id}/zip`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) {
        let errMessage = 'Failed to generate hub print batch'
        try {
          const errData = await res.json()
          if (errData.error) errMessage = errData.error
        } catch {}
        throw new Error(errMessage)
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${hub.name.replace(/\s+/g, '_')}_Print_Batch_${new Date().toISOString().split('T')[0]}.zip`
      a.click()
      URL.revokeObjectURL(url)
      toast.success(`Batch ZIP for ${hub.name} downloaded successfully!`)
    } catch (err: any) {
      toast.error(err.message || 'Error downloading batch ZIP')
    } finally {
      setDownloadingHubId(null)
    }
  }

  // Download Single Card Item ZIP
  const handleDownloadItemZip = async (item: HubOrderItem) => {
    setDownloadingItemId(item.item_id)
    try {
      const res = await fetch(`/api/v1/admin/export/items/${item.item_id}/zip`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Failed to download card resources')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Card_${item.order_number}_${item.recipient_full_names.replace(/\s+/g, '_')}.zip`
      a.click()
      URL.revokeObjectURL(url)
      toast.success(`Card ZIP for #${item.order_number} downloaded`)
    } catch (err: any) {
      toast.error(err.message || 'Error downloading card ZIP')
    } finally {
      setDownloadingItemId(null)
    }
  }

  // Update Order Status
  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    try {
      const res = await fetch(`/api/v1/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      })
      if (res.ok) {
        toast.success(`Order status updated to '${status}'`)
        fetchHubData()
      } else {
        const errData = await res.json().catch(() => ({}))
        toast.error(errData.error || 'Failed to update order status')
      }
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || 'Failed to update order status')
    }
  }

  // Re-route Order to a different Hub
  const handleRerouteOrder = async (orderId: string, newHubId: string) => {
    if (!newHubId) return
    setReroutingOrderId(orderId)
    try {
      const res = await fetch(`/api/v1/admin/orders/${orderId}/reroute-hub`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ hub_id: newHubId })
      })
      if (!res.ok) throw new Error('Failed to re-route order')
      toast.success('Order re-routed to new regional hub successfully!')
      fetchHubData()
    } catch (err: any) {
      toast.error(err.message || 'Error re-routing order')
    } finally {
      setReroutingOrderId(null)
    }
  }

  // 1-Click WhatsApp Dispatch Helper
  const openWhatsAppDispatch = (item: HubOrderItem, hub: PrintHub | undefined) => {
    const rawPhone = hub?.whatsapp_number || hub?.phone || item.hub_whatsapp || item.hub_phone || ''
    const cleanPhone = rawPhone.replace(/[^0-9]/g, '')
    const targetPhone = cleanPhone.startsWith('254') ? cleanPhone : cleanPhone.startsWith('0') ? '254' + cleanPhone.slice(1) : cleanPhone

    const downloadLink = `/api/v1/orders/${encodeURIComponent(item.order_number)}/download-package`
    const message = `*SUCCESS CARD REGIONAL PRINT DISPATCH* 🖨️
-----------------------------------
*Order Number:* #${item.order_number}
*Candidate Name:* ${item.recipient_full_names} (Adm: ${item.admission_number || 'N/A'})
*Destination School:* ${item.school_name} ${item.class_form ? `(${item.class_form})` : ''}
*County / Zone:* ${item.county_name} ${item.sub_county_name ? `• ${item.sub_county_name}` : ''}
*Card Size:* ${item.size} 4-Page Deluxe
*Custom Photo:* ${item.custom_photo_storage_path ? 'YES (High-Res Attached)' : 'NO (Standard)'}
*Print Hub:* ${item.hub_name || hub?.name || 'Regional Hub'}

*DOWNLOAD PRINT-READY PACKAGE:*
${downloadLink}

_Please print, perform quality inspection, and dispatch to school gate. Thank you!_`

    const waUrl = `https://wa.me/${targetPhone}?text=${encodeURIComponent(message)}`
    window.open(waUrl, '_blank')
  }

  // Metrics summary calculations
  const totalPartnerHubs = hubs.length
  const totalCardsInNetwork = hubs.reduce((acc, h) => acc + Number(h.total_cards || 0), 0)
  const totalPendingInQueue = hubs.reduce((acc, h) => acc + Number(h.pending_cards || 0), 0)
  const totalPayableCOGS = hubs.reduce((acc, h) => acc + Number(h.total_cogs_kes || 0), 0)

  // Filtered orders list
  const filteredOrders = useMemo(() => {
    return allHubOrders.filter(ord => {
      if (selectedHubFilter !== 'all') {
        const matchingHub = hubs.find(h => h.id === selectedHubFilter)
        if (matchingHub && ord.hub_name !== matchingHub.name) return false
      }
      if (statusFilter !== 'all' && ord.order_status !== statusFilter) return false
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchName = ord.recipient_full_names?.toLowerCase().includes(q)
        const matchSchool = ord.school_name?.toLowerCase().includes(q)
        const matchOrder = ord.order_number?.toLowerCase().includes(q)
        const matchCounty = ord.county_name?.toLowerCase().includes(q)
        if (!matchName && !matchSchool && !matchOrder && !matchCounty) return false
      }
      return true
    })
  }, [allHubOrders, selectedHubFilter, statusFilter, searchQuery, hubs])

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* ─── TOP HEADER & KPIS ──────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 text-[10px] font-extrabold uppercase tracking-widest border border-purple-200 dark:border-purple-800">
              DISTRIBUTED FULFILLMENT NETWORK
            </span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            Regional Print Partner Hubs
          </h2>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
            Auto-route card orders to local print shops close to recipient schools for rapid same-day printing and school-gate delivery.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={fetchHubData}
            disabled={loading}
            className="p-2.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white shadow-sm"
            title="Refresh Hub Metrics"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-pink-500' : ''}`} />
          </button>

          <button
            onClick={handleOpenAddHub}
            className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-lg shadow-purple-500/20 transition-transform hover:scale-105"
          >
            <Plus className="w-4 h-4" /> Add Partner Print Hub
          </button>
        </div>
      </div>

      {/* ─── METRICS CARDS ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-1">
          <div className="flex justify-between items-center text-slate-500 dark:text-zinc-400">
            <span className="text-[11px] font-extrabold uppercase tracking-wider">Active Partner Hubs</span>
            <Printer className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">{totalPartnerHubs} Hubs</div>
          <p className="text-[11px] text-emerald-600 font-bold">Covering 47 Counties</p>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-1">
          <div className="flex justify-between items-center text-slate-500 dark:text-zinc-400">
            <span className="text-[11px] font-extrabold uppercase tracking-wider">Awaiting Print</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400">{totalPendingInQueue} Cards</div>
          <p className="text-[11px] text-slate-400">Pending hub pickup & print</p>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-1">
          <div className="flex justify-between items-center text-slate-500 dark:text-zinc-400">
            <span className="text-[11px] font-extrabold uppercase tracking-wider">Total Network Volume</span>
            <Layers className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">{totalCardsInNetwork} Cards</div>
          <p className="text-[11px] text-slate-400">Lifetime regional prints</p>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-1">
          <div className="flex justify-between items-center text-slate-500 dark:text-zinc-400">
            <span className="text-[11px] font-extrabold uppercase tracking-wider">Hub Partner Payouts</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">KES {totalPayableCOGS.toLocaleString()}</div>
          <p className="text-[11px] text-slate-400">Accrued printing COGS</p>
        </div>
      </div>

      {/* ─── HUBS DIRECTORY GRID ────────────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Globe className="w-4 h-4 text-pink-500" /> Regional Print Partner Directory ({hubs.length})
          </h3>
          <span className="text-xs text-slate-500 dark:text-zinc-400">
            Click <strong>Download Batch ZIP</strong> or <strong>WhatsApp</strong> to dispatch to partners
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {hubs.map((hub) => (
            <div
              key={hub.id}
              className={`p-5 rounded-3xl bg-white dark:bg-zinc-900 border transition-all duration-200 hover:shadow-lg space-y-4 flex flex-col justify-between ${
                selectedHubFilter === hub.id
                  ? 'border-purple-500 ring-2 ring-purple-500/20'
                  : 'border-zinc-200 dark:border-zinc-800'
              }`}
            >
              <div className="space-y-3">
                <div className="flex justify-between items-start gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold shadow-inner">
                      <Printer className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-900 dark:text-white text-sm leading-tight">{hub.name}</h4>
                      <button
                        type="button"
                        onClick={() => setExpandedCountyHubId(expandedCountyHubId === hub.id ? null : hub.id)}
                        className="text-[10px] text-slate-400 hover:text-pink-500 dark:hover:text-pink-400 flex items-center gap-1 mt-0.5 transition-colors cursor-pointer group"
                        title="Click to view assigned counties"
                      >
                        <MapPin className="w-3 h-3 text-pink-500" />
                        <span className="font-bold underline decoration-dotted group-hover:text-pink-600">
                          {hub.mapped_counties_count || 0} / {counties.length || 47} Counties Mapped
                        </span>
                      </button>
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                    hub.status === 'active'
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                      : hub.status === 'standby'
                      ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                      : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                  }`}>
                    {hub.status}
                  </span>
                </div>

                {/* Expandable Mapped Counties Tag Cloud */}
                {expandedCountyHubId === hub.id && (
                  <div className="p-3 rounded-2xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/50 space-y-2 animate-in fade-in">
                    <div className="flex justify-between items-center text-[10px] font-bold text-purple-900 dark:text-purple-300">
                      <span>Assigned Coverage ({hub.mapped_counties_count || 0} Counties):</span>
                      <button
                        onClick={() => handleOpenCoverageMapping(hub)}
                        className="text-pink-600 hover:underline"
                      >
                        Edit →
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1 max-h-28 overflow-y-auto">
                      {hub.mapped_counties_names ? (
                        hub.mapped_counties_names.split(', ').map(cName => (
                          <span key={cName} className="px-1.5 py-0.5 rounded-md bg-white dark:bg-zinc-800 border border-purple-200 dark:border-purple-800 text-[9px] font-bold text-slate-800 dark:text-zinc-200 shadow-2xs">
                            {cName}
                          </span>
                        ))
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">No counties mapped yet</span>
                      )}
                    </div>
                  </div>
                )}

                {/* Contact details */}
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800/80 text-xs space-y-1.5">
                  <div className="flex items-center justify-between text-slate-700 dark:text-zinc-300">
                    <span className="font-semibold text-slate-400 text-[11px]">Partner Contact:</span>
                    <strong className="text-slate-900 dark:text-white">{hub.contact_person || 'Assigned Manager'}</strong>
                  </div>
                  {hub.phone && (
                    <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-zinc-400">
                      <span>Phone:</span>
                      <strong>{hub.phone}</strong>
                    </div>
                  )}
                  {hub.address && (
                    <p className="text-[10px] text-slate-400 italic line-clamp-1">📍 {hub.address}</p>
                  )}
                  <div className="pt-1 border-t border-zinc-200 dark:border-zinc-800 flex justify-between items-center text-[10px]">
                    <span className="text-slate-400">Print Fee:</span>
                    <span className="font-bold text-pink-600 dark:text-pink-400">KES {Number(hub.cost_per_card_kes).toLocaleString()} / card</span>
                  </div>
                </div>

                {/* Queue status breakdown */}
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800/80">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block">Queue</span>
                    <span className="font-black text-amber-600 text-sm">{hub.pending_cards || 0}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800/80">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block">Printing</span>
                    <span className="font-black text-blue-600 text-sm">{hub.printing_cards || 0}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800/80">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block">Shipped</span>
                    <span className="font-black text-emerald-600 text-sm">{hub.delivered_cards || 0}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <div className="flex gap-1.5">
                  <button
                    onClick={() => handleDownloadHubBatchZip(hub)}
                    disabled={downloadingHubId === hub.id}
                    className="flex-1 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-bold flex items-center justify-center gap-1 shadow-md shadow-purple-600/20 transition-transform hover:scale-102 disabled:opacity-50"
                    title="Download complete batch ZIP for this hub organized by school"
                  >
                    {downloadingHubId === hub.id ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Download className="w-3.5 h-3.5" />
                    )}
                    Batch ZIP
                  </button>

                  <button
                    onClick={() => handleOpenCoverageMapping(hub)}
                    className="p-2 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 text-xs font-bold"
                    title="Map Counties Coverage"
                  >
                    <MapPin className="w-3.5 h-3.5 text-pink-500" />
                  </button>

                  <button
                    onClick={() => handleOpenEditHub(hub)}
                    className="p-2 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 text-xs font-bold"
                    title="Edit Hub Settings"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleDeleteHub(hub)}
                    className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 text-xs font-bold"
                    title="Delete Hub"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  onClick={() => setSelectedHubFilter(selectedHubFilter === hub.id ? 'all' : hub.id)}
                  className={`w-full py-1.5 rounded-xl text-[11px] font-extrabold flex items-center justify-center gap-1 transition-colors ${
                    selectedHubFilter === hub.id
                      ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                      : 'bg-slate-50 dark:bg-zinc-950 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {selectedHubFilter === hub.id ? 'Showing Hub Queue ✓' : 'Filter Queue to this Hub →'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── LIVE REGIONAL ORDERS QUEUE ─────────────────────────────────────── */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm space-y-4">
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Package className="w-5 h-5 text-pink-500" />
                Live Regional Print & Dispatch Queue
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                Dispatch orders directly to partner print shops via WhatsApp, download print packages, or re-route to nearby hubs.
              </p>
            </div>

            {/* Hub Selector Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => setSelectedHubFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  selectedHubFilter === 'all'
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                    : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400'
                }`}
              >
                All Hubs ({allHubOrders.length})
              </button>
              {hubs.map(h => (
                <button
                  key={h.id}
                  onClick={() => setSelectedHubFilter(h.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    selectedHubFilter === h.id
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                      : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:text-slate-900'
                  }`}
                >
                  {h.name}
                </button>
              ))}
            </div>
          </div>

          {/* Search & Status Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search candidate name, school, admission #, county, or order #..."
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-pink-500"
              />
            </div>

            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-pink-500"
            >
              <option value="all">All Production Statuses</option>
              <option value="routed_to_print">Routed to Print Hub</option>
              <option value="printing">Printing Card</option>
              <option value="dispatched">Dispatched with Local Rider</option>
              <option value="delivered">Delivered at School Gate</option>
            </select>
          </div>
        </div>

        {/* Orders Table */}
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400 animate-pulse">Loading regional dispatch queue...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">No orders found matching the selected hub or search filters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-zinc-800/50 text-slate-500 dark:text-zinc-400 font-semibold border-b border-zinc-200 dark:border-zinc-800 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-4">Order & Date</th>
                  <th className="p-4">Candidate & Destination School</th>
                  <th className="p-4">Card Specs</th>
                  <th className="p-4">Assigned Print Hub</th>
                  <th className="p-4">Production Status</th>
                  <th className="p-4 text-right">Partner Dispatch Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {filteredOrders.map(item => {
                  const currentHub = hubs.find(h => h.name === item.hub_name)
                  return (
                    <tr key={item.item_id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                      <td className="p-4 font-bold text-slate-900 dark:text-white">
                        #{item.order_number}
                        <span className="block text-[10px] font-normal text-slate-400 mt-0.5">
                          {new Date(item.order_created_at).toLocaleDateString([], { dateStyle: 'medium' })}
                        </span>
                      </td>

                      <td className="p-4">
                        <div className="font-extrabold text-slate-900 dark:text-white text-xs">
                          {item.recipient_full_names}
                        </div>
                        <div className="text-[11px] text-pink-600 dark:text-pink-400 font-bold mt-0.5">
                          🏫 {item.school_name} {item.class_form ? `(${item.class_form})` : ''}
                        </div>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          📍 {item.county_name} {item.sub_county_name ? `• ${item.sub_county_name}` : ''} • Adm: {item.admission_number || 'N/A'}
                        </span>
                      </td>

                      <td className="p-4">
                        <span className="px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-extrabold text-[10px]">
                          {item.size} DELUXE
                        </span>
                        {item.custom_photo_storage_path && (
                          <span className="ml-1 px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-extrabold text-[10px]">
                            📸 Photo
                          </span>
                        )}
                        <span className="block text-[10px] text-slate-500 mt-1 line-clamp-1 italic">
                          "{item.message_body?.substring(0, 45)}..."
                        </span>
                      </td>

                      <td className="p-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-slate-900 dark:text-white text-xs">
                            🖨️ {item.hub_name || 'Regional Hub'}
                          </span>
                        </div>
                        {/* Re-route dropdown */}
                        <div className="mt-1 flex items-center gap-1">
                          <span className="text-[9px] text-slate-400">Re-route:</span>
                          <select
                            value={currentHub?.id || ''}
                            onChange={(e) => handleRerouteOrder(item.order_id, e.target.value)}
                            disabled={reroutingOrderId === item.order_id}
                            className="text-[10px] font-bold p-1 rounded-lg bg-slate-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 focus:outline-none"
                          >
                            {hubs.map(h => (
                              <option key={h.id} value={h.id}>{h.name}</option>
                            ))}
                          </select>
                        </div>
                      </td>

                      <td className="p-4">
                        <select
                          value={item.order_status}
                          onChange={(e) => handleUpdateOrderStatus(item.order_id, e.target.value)}
                          className={`rounded-xl border text-[11px] font-bold p-1.5 focus:outline-none ${
                            item.order_status === 'delivered'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800'
                              : item.order_status === 'dispatched'
                              ? 'bg-blue-50 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800'
                              : item.order_status === 'printing'
                              ? 'bg-purple-50 text-purple-800 border-purple-300 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800'
                              : 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800'
                          }`}
                        >
                          <option value="routed_to_print">Routed to Print Hub</option>
                          <option value="printing">Printing Card</option>
                          <option value="dispatched">Dispatched with Rider</option>
                          <option value="delivered">Delivered at School Gate</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>

                      <td className="p-4 text-right space-x-1.5 whitespace-nowrap">
                        {/* 1-Click WhatsApp Dispatch */}
                        <button
                          onClick={() => openWhatsAppDispatch(item, currentHub)}
                          className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[11px] inline-flex items-center gap-1 shadow-sm transition-transform hover:scale-105"
                          title="Open WhatsApp chat with pre-filled print details & package link"
                        >
                          <MessageSquare className="w-3.5 h-3.5" /> WhatsApp Hub
                        </button>

                        {/* Download Single Card Resources ZIP */}
                        <button
                          onClick={() => handleDownloadItemZip(item)}
                          disabled={downloadingItemId === item.item_id}
                          className="px-2.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-[11px] inline-flex items-center gap-1 shadow-sm transition-transform hover:scale-105 disabled:opacity-50"
                          title="Download card design, print PDF, and production docket"
                        >
                          {downloadingItemId === item.item_id ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Package className="w-3.5 h-3.5" />
                          )}
                          Card ZIP
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

      {/* ─── MODAL 1: ADD / EDIT PRINT HUB ──────────────────────────────────── */}
      {showAddHubModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 my-8 animate-in scale-in">
            <div className="flex justify-between items-start border-b border-zinc-200 dark:border-zinc-800 pb-4">
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 text-[10px] font-extrabold uppercase">
                  {editingHub ? 'UPDATE PRINT HUB' : 'NEW REGIONAL PARTNER'}
                </span>
                <h3 className="text-xl font-black text-slate-900 dark:text-white mt-1">
                  {editingHub ? editingHub.name : 'Add Regional Print Hub'}
                </h3>
              </div>
              <button
                onClick={() => setShowAddHubModal(false)}
                className="p-2 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-500 hover:text-slate-900 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveHub} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-zinc-300">Hub / Print Shop Name *</label>
                <input
                  type="text"
                  required
                  value={hubName}
                  onChange={e => setHubName(e.target.value)}
                  placeholder="e.g. Eldoret Rapid Print & Courier"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-slate-900 dark:text-white font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-zinc-300">Contact Person</label>
                  <input
                    type="text"
                    value={hubContact}
                    onChange={e => setHubContact(e.target.value)}
                    placeholder="e.g. Peter Mutua"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-slate-900 dark:text-white font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-zinc-300">Phone Number</label>
                  <input
                    type="text"
                    value={hubPhone}
                    onChange={e => setHubPhone(e.target.value)}
                    placeholder="07XXXXXXXX"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-slate-900 dark:text-white font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-zinc-300">WhatsApp Number (for 1-click dispatch)</label>
                  <input
                    type="text"
                    value={hubWhatsapp}
                    onChange={e => setHubWhatsapp(e.target.value)}
                    placeholder="+2547XXXXXXXX"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-slate-900 dark:text-white font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-zinc-300">Dispatch Email</label>
                  <input
                    type="email"
                    value={hubEmail}
                    onChange={e => setHubEmail(e.target.value)}
                    placeholder="print@partner.co.ke"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-slate-900 dark:text-white font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-zinc-300">Physical Base / Workshop Address</label>
                <input
                  type="text"
                  value={hubAddress}
                  onChange={e => setHubAddress(e.target.value)}
                  placeholder="e.g. West End Mall, Ground Floor, Nakuru"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-slate-900 dark:text-white font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-zinc-300">Operational Status</label>
                  <select
                    value={hubStatus}
                    onChange={e => setHubStatus(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-slate-900 dark:text-white font-bold"
                  >
                    <option value="active">Active (Taking Orders)</option>
                    <option value="standby">Standby</option>
                    <option value="maintenance">Maintenance / Offline</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-zinc-300">Print Fee per Card (KES COGS)</label>
                  <input
                    type="number"
                    min="50"
                    max="1000"
                    value={hubCost}
                    onChange={e => setHubCost(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-slate-900 dark:text-white font-bold"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddHubModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-zinc-800 font-bold text-slate-700 dark:text-zinc-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingHub}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-extrabold shadow-md disabled:opacity-50"
                >
                  {submittingHub ? 'Saving...' : editingHub ? 'Save Changes' : 'Create Print Hub'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 2: COUNTY COVERAGE MAPPING ──────────────────────────────── */}
      {mappingHub && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-xl rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 my-8 animate-in scale-in">
            <div className="flex justify-between items-start border-b border-zinc-200 dark:border-zinc-800 pb-4">
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-pink-100 dark:bg-pink-950 text-pink-700 dark:text-pink-300 text-[10px] font-extrabold uppercase">
                  COUNTY COVERAGE ROUTING
                </span>
                <h3 className="text-xl font-black text-slate-900 dark:text-white mt-1">
                  {mappingHub.name} Coverage
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                  Select which counties will automatically route orders to this regional print hub.
                </p>
              </div>
              <button
                onClick={() => setMappingHub(null)}
                className="p-2 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-500 hover:text-slate-900 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Region Filter & Search Header */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div>
                    <span className="font-extrabold text-slate-900 dark:text-white text-xs">
                      {selectedCountyIds.length} of {counties.length || 47} Counties Assigned
                    </span>
                    <span className="text-[11px] text-pink-600 dark:text-pink-400 font-bold ml-2">
                      ({Math.round((selectedCountyIds.length / (counties.length || 1)) * 100)}% Network Coverage)
                    </span>
                  </div>
                  <div className="flex gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setSelectedCountyIds(counties.map(c => c.id))}
                      className="text-[11px] text-pink-600 dark:text-pink-400 font-bold hover:underline"
                    >
                      Select All 47
                    </button>
                    <span className="text-slate-300 dark:text-zinc-700">•</span>
                    <button
                      type="button"
                      onClick={() => setSelectedCountyIds([])}
                      className="text-[11px] text-slate-500 hover:underline"
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                {/* Region Filter Pills */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setModalRegionFilter('all')}
                    className={`px-2.5 py-1 rounded-xl text-[10px] font-extrabold transition-all ${
                      modalRegionFilter === 'all'
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:text-slate-900'
                    }`}
                  >
                    All 47 Counties
                  </button>
                  {Object.keys(KENYA_REGIONS_MAP).map(regName => (
                    <button
                      key={regName}
                      type="button"
                      onClick={() => setModalRegionFilter(regName)}
                      className={`px-2.5 py-1 rounded-xl text-[10px] font-extrabold transition-all ${
                        modalRegionFilter === regName
                          ? 'bg-purple-600 text-white shadow-sm'
                          : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:text-slate-900'
                      }`}
                    >
                      {regName} ({KENYA_REGIONS_MAP[regName].length})
                    </button>
                  ))}
                </div>

                {/* Search & Quick Region Action */}
                <div className="flex flex-col sm:flex-row gap-2 items-center">
                  <div className="relative flex-1 w-full">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={modalCountySearch}
                      onChange={e => setModalCountySearch(e.target.value)}
                      placeholder="Filter by county name (e.g. Mombasa, Nakuru, Uasin Gishu)..."
                      className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-pink-500"
                    />
                    {modalCountySearch && (
                      <button
                        type="button"
                        onClick={() => setModalCountySearch('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {modalRegionFilter !== 'all' && (
                    <div className="flex gap-1.5 shrink-0 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={() => handleSelectRegionCounties(modalRegionFilter)}
                        className="flex-1 sm:flex-initial px-3 py-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-[10px] font-extrabold"
                      >
                        + Select All {modalRegionFilter}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeselectRegionCounties(modalRegionFilter)}
                        className="flex-1 sm:flex-initial px-3 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 text-[10px] font-bold"
                      >
                        - Deselect {modalRegionFilter}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* 47 Counties Checkbox Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-72 overflow-y-auto p-2.5 bg-slate-50 dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                {modalFilteredCounties.length === 0 ? (
                  <div className="col-span-full py-8 text-center text-xs text-slate-400">
                    No counties found matching "{modalCountySearch}".
                  </div>
                ) : (
                  modalFilteredCounties.map(county => {
                    const isChecked = selectedCountyIds.includes(county.id)
                    // Find region for county
                    let countyRegion = 'General'
                    for (const [rName, cList] of Object.entries(KENYA_REGIONS_MAP)) {
                      if (cList.some(name => name.toLowerCase() === county.name.toLowerCase())) {
                        countyRegion = rName
                        break
                      }
                    }

                    return (
                      <label
                        key={county.id}
                        className={`flex items-start gap-2 p-2.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                          isChecked
                            ? 'bg-purple-100/80 dark:bg-purple-950/80 border-purple-400 dark:border-purple-700 text-purple-950 dark:text-purple-100 shadow-xs'
                            : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-400 hover:bg-slate-100/60 dark:hover:bg-zinc-800/60'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedCountyIds([...selectedCountyIds, county.id])
                            } else {
                              setSelectedCountyIds(selectedCountyIds.filter(id => id !== county.id))
                            }
                          }}
                          className="w-4 h-4 rounded text-purple-600 focus:ring-0 mt-0.5"
                        />
                        <div className="min-w-0 flex-1">
                          <span className="truncate block font-bold text-xs">{county.name}</span>
                          <span className="text-[9px] text-slate-400 dark:text-zinc-500 block truncate">
                            {countyRegion}
                          </span>
                        </div>
                      </label>
                    )
                  })
                )}
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setMappingHub(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-zinc-800 font-bold text-slate-700 dark:text-zinc-300 text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCoverageMapping}
                disabled={savingMapping}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-extrabold text-xs shadow-md disabled:opacity-50"
              >
                {savingMapping ? 'Saving...' : `Save (${selectedCountyIds.length} Counties)`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
