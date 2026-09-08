'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft, Upload, Save, Eye, Check, AlertCircle, Layers,
  Image as ImageIcon, Sparkles, ExternalLink, DollarSign, Tag, Percent
} from 'lucide-react'
import { getCookie } from '@/lib/cookies'

interface PageRecord {
  id: string
  design_id: string
  page_type: 'front' | 'inside_left' | 'inside_right' | 'back'
  storage_path: string
  width_px: number
  height_px: number
  url: string
}

export default function AdminDesignStudioPage() {
  const params = useParams()
  const router = useRouter()
  const designId = params.id as string

  const [design, setDesign] = useState<any>(null)
  const [pages, setPages] = useState<PageRecord[]>([])
  const [selectedPageType, setSelectedPageType] = useState<'front' | 'inside_left' | 'inside_right' | 'back'>('front')

  // 3-Size Pricing State (A5, A4, A3)
  const [priceA5Kes, setPriceA5Kes] = useState('500')
  const [priceA4Kes, setPriceA4Kes] = useState('850')
  const [priceA3Kes, setPriceA3Kes] = useState('1400')

  const [compareAtA5Kes, setCompareAtA5Kes] = useState('')
  const [compareAtA4Kes, setCompareAtA4Kes] = useState('')
  const [compareAtA3Kes, setCompareAtA3Kes] = useState('')

  const [discountPercent, setDiscountPercent] = useState('')
  const [savingPricing, setSavingPricing] = useState(false)

  // Capability & Status Flags
  const [isActive, setIsActive] = useState(true)
  const [cardType, setCardType] = useState<'standard' | 'customizable'>('customizable')
  const [defaultMessage, setDefaultMessage] = useState('')
  const [allowsCustomMessage, setAllowsCustomMessage] = useState(true)
  const [allowsCustomPhoto, setAllowsCustomPhoto] = useState(true)

  // UI state
  const [loading, setLoading] = useState(true)
  const [statusMsg, setStatusMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Page Upload state
  const [uploadingPage, setUploadingPage] = useState<string | null>(null)
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false)

  const getAuthToken = () => {
    if (typeof window === 'undefined') return null
    return getCookie('fair_admin_token') || localStorage.getItem('fair_admin_token') || localStorage.getItem('fair_token')
  }

  useEffect(() => {
    fetchDesignData()
  }, [designId])

  const fetchDesignData = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/v1/catalog/designs/${designId}`)
      const data = await res.json()
      if (data.data) {
        setDesign(data.data)
        const baseA4 = data.data.price_a4_kes || data.data.price_kes || 850
        setPriceA4Kes(String(baseA4))
        setPriceA5Kes(String(data.data.price_a5_kes || Math.round(Number(baseA4) * 0.65)))
        setPriceA3Kes(String(data.data.price_a3_kes || Math.round(Number(baseA4) * 1.65)))

        setCompareAtA4Kes(data.data.compare_at_a4_kes ? String(data.data.compare_at_a4_kes) : (data.data.compare_at_price_kes ? String(data.data.compare_at_price_kes) : ''))
        setCompareAtA5Kes(data.data.compare_at_a5_kes ? String(data.data.compare_at_a5_kes) : '')
        setCompareAtA3Kes(data.data.compare_at_a3_kes ? String(data.data.compare_at_a3_kes) : '')

        setDiscountPercent(data.data.discount_percent ? String(data.data.discount_percent) : '')
        setIsActive(data.data.is_active ?? true)
        setCardType(data.data.card_type || 'customizable')
        setDefaultMessage(data.data.default_message || 'Wishing you tremendous success, excellence, and God’s grace in your final examinations. We believe in your brilliance!')
        setAllowsCustomMessage(data.data.allows_custom_message ?? true)
        setAllowsCustomPhoto(data.data.allows_custom_photo ?? true)
        if (data.data.pages) setPages(data.data.pages)
      }
    } catch (err) {
      console.error('Failed to load design specs', err)
    } finally {
      setLoading(false)
    }
  }

  const cleanPriceInput = (val: string | number, fallback: number): number => {
    if (val === undefined || val === null || val === '') return fallback
    const cleaned = String(val).replace(/[^0-9.]/g, '')
    const num = parseFloat(cleaned)
    return isNaN(num) || num <= 0 ? fallback : num
  }

  const cleanOptPriceInput = (val: string | number): number | null => {
    if (val === undefined || val === null || val === '') return null
    const cleaned = String(val).replace(/[^0-9.]/g, '')
    const num = parseFloat(cleaned)
    return isNaN(num) || num <= 0 ? null : num
  }

  const cleanOptIntInput = (val: string | number): number | null => {
    if (val === undefined || val === null || val === '') return null
    const cleaned = String(val).replace(/[^0-9]/g, '')
    const num = parseInt(cleaned, 10)
    return isNaN(num) || num <= 0 ? null : num
  }

  const handleUploadPageImage = async (pageType: 'front' | 'inside_left' | 'inside_right' | 'back', file: File) => {
    setUploadingPage(pageType)
    setErrorMsg(null)
    const token = getAuthToken()
    if (!token) {
      setErrorMsg('Admin authentication required. Please log in to your admin account to upload artworks.')
      setUploadingPage(null)
      return
    }
    try {
      const formData = new FormData()
      formData.append('image', file)

      const uploadRes = await fetch('/api/v1/files/upload-design-image', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })
      const uploadData = await uploadRes.json()
      if (uploadRes.status === 401) {
        throw new Error('Your session has expired. Please log in again to renew your 24-hour admin session.')
      }
      if (!uploadRes.ok) throw new Error(uploadData.error || 'Page upload failed')

      const pageRes = await fetch(`/api/v1/catalog/designs/${designId}/pages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          pageType: pageType,
          storagePath: uploadData.data.storagePath,
        }),
      })

      const pageData = await pageRes.json()
      if (pageRes.status === 401) {
        throw new Error('Your session has expired. Please log in again to renew your 24-hour admin session.')
      }
      if (pageRes.ok) {
        setStatusMsg(`Updated ${pageType.replace('_', ' ')} page artwork successfully!`)
        if (pageData.data) {
          setPages((prev) => {
            const next = prev.filter((p) => p.page_type !== pageType)
            return [...next, pageData.data]
          })
        }
        fetchDesignData()
      } else {
        throw new Error(pageData.error || 'Failed to save page record')
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error updating page')
    } finally {
      setUploadingPage(null)
    }
  }

  const handleUploadThumbnailImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingThumbnail(true)
    setErrorMsg(null)
    const token = getAuthToken()
    if (!token) {
      setErrorMsg('Admin authentication required. Please log in to your admin account to upload thumbnails.')
      setUploadingThumbnail(false)
      return
    }
    try {
      const formData = new FormData()
      formData.append('image', file)

      const uploadRes = await fetch('/api/v1/files/upload-design-image', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })
      const uploadData = await uploadRes.json()
      if (uploadRes.status === 401) {
        throw new Error('Your session has expired. Please log in again to renew your 24-hour admin session.')
      }
      if (!uploadRes.ok) throw new Error(uploadData.error || 'Thumbnail upload failed')

      const thumbRes = await fetch(`/api/v1/catalog/designs/${designId}/thumbnail`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          storagePath: uploadData.data.storagePath,
        }),
      })

      const thumbData = await thumbRes.json()
      if (thumbRes.status === 401) {
        throw new Error('Your session has expired. Please log in again to renew your 24-hour admin session.')
      }
      if (thumbRes.ok) {
        setStatusMsg('Updated catalog thumbnail image successfully!')
        if (thumbData.thumbnail_url) {
          setDesign((prev: any) => prev ? { ...prev, thumbnail_url: thumbData.thumbnail_url } : prev)
        }
        fetchDesignData()
      } else {
        throw new Error(thumbData.error || 'Failed to save thumbnail')
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Thumbnail upload failed')
    } finally {
      setUploadingThumbnail(false)
    }
  }

  const handleSavePricingAndStatus = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingPricing(true)
    setErrorMsg(null)
    const token = getAuthToken()
    try {
      const pA5 = cleanPriceInput(priceA5Kes, 500)
      const pA4 = cleanPriceInput(priceA4Kes, 850)
      const pA3 = cleanPriceInput(priceA3Kes, 1400)

      const cA5 = cleanOptPriceInput(compareAtA5Kes)
      const cA4 = cleanOptPriceInput(compareAtA4Kes)
      const cA3 = cleanOptPriceInput(compareAtA3Kes)
      const disc = cleanOptIntInput(discountPercent)

      const res = await fetch(`/api/v1/catalog/designs/${designId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          name: design?.name || 'Success Card',
          description: design?.description || '',
          isActive: isActive,
          is_active: isActive,
          cardType: cardType,
          defaultMessage: cardType === 'standard' ? defaultMessage : null,
          allowsCustomMessage: cardType === 'customizable' ? allowsCustomMessage : false,
          allowsCustomPhoto: cardType === 'customizable' ? allowsCustomPhoto : false,
          priceKes: pA4,
          priceA5Kes: pA5,
          priceA4Kes: pA4,
          priceA3Kes: pA3,
          compareAtA5Kes: cA5,
          compareAtA4Kes: cA4,
          compareAtA3Kes: cA3,
          compareAtPriceKes: cA4,
          discountPercent: disc,
        }),
      })

      const data = await res.json()
      if (res.status === 401) {
        throw new Error('Your session has expired. Please log in again to renew your 24-hour admin session.')
      }
      if (!res.ok) throw new Error(data.error || 'Failed to update pricing and state')

      setStatusMsg('Card pricing, status & settings saved successfully!')
      fetchDesignData()
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save settings')
    } finally {
      setSavingPricing(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center text-slate-500 dark:text-zinc-400">
        Loading card studio workspace...
      </div>
    )
  }

  const pageTypes: Array<{ type: 'front' | 'inside_left' | 'inside_right' | 'back'; label: string; desc: string }> = [
    { type: 'front', label: 'Page 1: Front Cover', desc: 'Main cover image shown in catalog and folded state' },
    { type: 'inside_left', label: 'Page 2: Inside Left', desc: 'Left inner page (decorative motif or candidate photo zone)' },
    { type: 'inside_right', label: 'Page 3: Inside Right', desc: 'Right inner page (dedicated congratulatory message area)' },
    { type: 'back', label: 'Page 4: Back Cover', desc: 'Back of card with official branding and barcode' },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-6">
        <div>
          <button
            onClick={() => router.push('/admin')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-pink-600 dark:text-zinc-400 dark:hover:text-pink-400 mb-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Admin Dashboard
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {design?.name}
            </h1>
            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              className={`px-3 py-1 rounded-full text-xs font-extrabold flex items-center gap-1.5 transition-all shadow-sm ${
                isActive
                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                  : 'bg-zinc-200 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 border border-zinc-300 dark:border-zinc-700'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-400'}`} />
              {isActive ? 'Live & Published' : 'Hidden Draft'}
            </button>
          </div>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
            Manage the 4 card page artworks, state, format and individual prices for A5, A4, and A3 card sizes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href={`/design/${designId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-extrabold text-xs flex items-center gap-2 shadow-md transition-transform hover:scale-105"
            title="Review live customer customization and 4-page 3D studio"
          >
            <ExternalLink className="w-4 h-4" /> Open Store Preview
          </a>
        </div>
      </div>

      {/* Notifications */}
      {statusMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>{statusMsg}</span>
          </div>
          <button onClick={() => setStatusMsg(null)} className="text-emerald-600 hover:text-emerald-800 text-xs font-bold">Dismiss</button>
        </div>
      )}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 text-xs font-semibold flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-red-600 hover:text-red-800 text-xs font-bold">Dismiss</button>
        </div>
      )}

      {/* --- 1. 3-SIZE CARD PRICING & STATUS CONFIGURATION --- */}
      <form onSubmit={handleSavePricingAndStatus} className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-6 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-4">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-pink-500" /> Card State & 3-Size Pricing
            </h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Set custom selling prices, comparison prices, format and publish state for this card.
            </p>
          </div>
          <button
            type="submit"
            disabled={savingPricing}
            className="px-5 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-extrabold text-xs flex items-center gap-2 shadow-md transition-transform hover:scale-105"
          >
            <Save className="w-4 h-4" /> {savingPricing ? 'Saving...' : 'Save Settings & Prices'}
          </button>
        </div>

        {/* Status & Format Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Active Status Box */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
            <div>
              <span className="block text-xs font-bold text-slate-900 dark:text-white">Storefront Visibility State</span>
              <span className="block text-[11px] text-slate-500 dark:text-zinc-400">
                {isActive ? 'Visible to all customers in the catalog.' : 'Hidden from storefront catalog (Draft mode).'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-zinc-300 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300'
              }`}
            >
              {isActive ? '✓ Published (Active)' : 'Draft (Inactive)'}
            </button>
          </div>

          {/* Card Format Box */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
            <div>
              <span className="block text-xs font-bold text-slate-900 dark:text-white">Card Format Type</span>
              <span className="block text-[11px] text-slate-500 dark:text-zinc-400">
                {cardType === 'standard' ? 'Pre-Printed fixed master message.' : 'Customizable handwritten message & photo insert.'}
              </span>
            </div>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setCardType('standard')
                  setAllowsCustomMessage(false)
                  setAllowsCustomPhoto(false)
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  cardType === 'standard'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400'
                }`}
              >
                Pre-Printed
              </button>
              <button
                type="button"
                onClick={() => {
                  setCardType('customizable')
                  setAllowsCustomMessage(true)
                  setAllowsCustomPhoto(true)
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  cardType === 'customizable'
                    ? 'bg-pink-600 text-white shadow-sm'
                    : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400'
                }`}
              >
                Customizable
              </button>
            </div>
          </div>
        </div>

        {cardType === 'standard' && (
          <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-1.5">
            <label className="block text-xs font-bold text-amber-900 dark:text-amber-300">
              Pre-Printed Standard Greeting Message (Page 3)
            </label>
            <textarea
              rows={2}
              value={defaultMessage}
              onChange={(e) => setDefaultMessage(e.target.value)}
              placeholder="Enter the fixed blessing/congratulatory message..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-slate-900 dark:text-white text-xs"
            />
          </div>
        )}

        {/* 3 Size Columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* A5 Card Tier */}
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-3">
            <div className="flex justify-between items-center border-b border-zinc-200 dark:border-zinc-800 pb-2">
              <span className="font-black text-sm text-slate-900 dark:text-white">A5 Compact Fold</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-pink-100 dark:bg-pink-950 text-pink-700 dark:text-pink-300 uppercase">A5 Tier</span>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-zinc-300 mb-1">Selling Price (KSh) *</label>
              <input
                type="number"
                min="0"
                step="any"
                required
                value={priceA5Kes}
                onChange={(e) => setPriceA5Kes(e.target.value)}
                placeholder="500"
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-slate-900 dark:text-white font-black text-sm text-pink-600 dark:text-pink-400"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-zinc-400 mb-1">Original / Strikethrough Price (KSh)</label>
              <input
                type="number"
                min="0"
                step="any"
                value={compareAtA5Kes}
                onChange={(e) => setCompareAtA5Kes(e.target.value)}
                placeholder="e.g. 700"
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-slate-900 dark:text-white font-semibold text-xs"
              />
            </div>
          </div>

          {/* A4 Card Tier */}
          <div className="p-5 rounded-2xl bg-pink-500/5 border-2 border-pink-500/30 space-y-3 relative shadow-sm">
            <div className="flex justify-between items-center border-b border-pink-500/20 pb-2">
              <span className="font-black text-sm text-slate-900 dark:text-white">A4 Standard Fold</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-pink-600 text-white uppercase">Most Popular</span>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-zinc-300 mb-1">Selling Price (KSh) *</label>
              <input
                type="number"
                min="0"
                step="any"
                required
                value={priceA4Kes}
                onChange={(e) => {
                  const val = e.target.value
                  setPriceA4Kes(val)
                  const p = parseFloat(val)
                  const orig = parseFloat(compareAtA4Kes)
                  if (orig > p && p > 0) {
                    setDiscountPercent(Math.round(((orig - p) / orig) * 100).toString())
                  }
                }}
                placeholder="850"
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-pink-300 dark:border-pink-800 text-slate-900 dark:text-white font-black text-sm text-pink-600 dark:text-pink-400"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-zinc-400 mb-1">Original / Strikethrough Price (KSh)</label>
              <input
                type="number"
                min="0"
                step="any"
                value={compareAtA4Kes}
                onChange={(e) => {
                  const val = e.target.value
                  setCompareAtA4Kes(val)
                  const orig = parseFloat(val)
                  const p = parseFloat(priceA4Kes)
                  if (orig > p && p > 0) {
                    setDiscountPercent(Math.round(((orig - p) / orig) * 100).toString())
                  } else if (!val) {
                    setDiscountPercent('')
                  }
                }}
                placeholder="e.g. 1200"
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-slate-900 dark:text-white font-semibold text-xs"
              />
            </div>
          </div>

          {/* A3 Card Tier */}
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-3">
            <div className="flex justify-between items-center border-b border-zinc-200 dark:border-zinc-800 pb-2">
              <span className="font-black text-sm text-slate-900 dark:text-white">A3 Jumbo Banner</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 uppercase">A3 Tier</span>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-zinc-300 mb-1">Selling Price (KSh) *</label>
              <input
                type="number"
                min="0"
                step="any"
                required
                value={priceA3Kes}
                onChange={(e) => setPriceA3Kes(e.target.value)}
                placeholder="1400"
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-slate-900 dark:text-white font-black text-sm text-pink-600 dark:text-pink-400"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-zinc-400 mb-1">Original / Strikethrough Price (KSh)</label>
              <input
                type="number"
                min="0"
                step="any"
                value={compareAtA3Kes}
                onChange={(e) => setCompareAtA3Kes(e.target.value)}
                placeholder="e.g. 2000"
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-slate-900 dark:text-white font-semibold text-xs"
              />
            </div>
          </div>
        </div>

        {/* Global / Badge Discount info */}
        <div className="pt-2 flex items-center justify-between text-xs border-t border-zinc-100 dark:border-zinc-800">
          <span className="text-slate-500 dark:text-zinc-400">
            Catalog Discount Badge:{' '}
            <strong className="text-emerald-600 dark:text-emerald-400">{discountPercent ? `${discountPercent}% OFF` : 'No Discount'}</strong>
          </span>
          <div className="flex items-center gap-2">
            <label className="text-[11px] text-slate-500">Custom Discount %:</label>
            <input
              type="number"
              min="0"
              max="100"
              step="any"
              value={discountPercent}
              onChange={(e) => setDiscountPercent(e.target.value)}
              placeholder="e.g. 29"
              className="w-20 px-2 py-1 rounded-lg bg-slate-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-center font-bold"
            />
          </div>
        </div>
      </form>

      {/* --- 2. CATALOG THUMBNAIL PREVIEW --- */}
      <div className="p-6 rounded-3xl bg-slate-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-2xl overflow-hidden bg-slate-900 border border-zinc-200 dark:border-zinc-800 shrink-0 flex items-center justify-center shadow-inner">
            {design?.thumbnail_url ? (
              <img src={design.thumbnail_url} alt="Catalog thumbnail" loading="lazy" decoding="async" className="w-full h-full object-cover" />
            ) : (
              <ImageIcon className="w-8 h-8 text-pink-500 opacity-60" />
            )}
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-pink-500" /> Catalog Listing Thumbnail
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
              High-speed compressed thumbnail shown in store catalog listings.
            </p>
          </div>
        </div>

        <label className="px-4 py-2.5 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-700 text-slate-900 dark:text-white font-extrabold text-xs flex items-center gap-2 cursor-pointer shadow-sm transition-transform hover:scale-105">
          <Upload className="w-4 h-4 text-pink-500" />
          {uploadingThumbnail ? 'Uploading Thumbnail...' : 'Upload Compressed Thumbnail'}
          <input type="file" accept="image/*" className="hidden" onChange={handleUploadThumbnailImage} />
        </label>
      </div>

      {/* --- 3. 4-PAGE ARTWORK MANAGER --- */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-pink-500" /> 4-Page Card Artworks
          </h2>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
            Upload high-resolution artworks for each page of the greeting card.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {pageTypes.map((pt) => {
            const pageRecord = pages.find((p) => p.page_type === pt.type)
            const isCurrentUploading = uploadingPage === pt.type

            return (
              <div
                key={pt.type}
                className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-4 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
                    <div>
                      <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">{pt.label}</h3>
                      <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">{pt.desc}</p>
                    </div>
                    {pageRecord ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-extrabold flex items-center gap-1">
                        <Check className="w-3 h-3" /> Ready
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-[10px] font-extrabold">
                        Pending Artwork
                      </span>
                    )}
                  </div>

                  {/* Artwork Preview Canvas */}
                  <div className="relative w-full h-60 rounded-2xl overflow-hidden bg-slate-950 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center mt-3 shadow-inner">
                    {pageRecord?.url ? (
                      <img
                        src={pageRecord.url}
                        alt={pt.label}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="text-center space-y-2 text-slate-500">
                        <ImageIcon className="w-10 h-10 mx-auto text-pink-500 opacity-40" />
                        <span className="text-xs block font-bold">No Artwork Uploaded Yet</span>
                        <span className="text-[10px] block text-slate-400">Click button below to upload</span>
                      </div>
                    )}

                    {pageRecord && (
                      <div className="absolute bottom-2 right-2 px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md text-white text-[10px] font-mono">
                        {pageRecord.width_px} x {pageRecord.height_px} px
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-2">
                  <label className="w-full py-3 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-pink-600 hover:text-white dark:hover:bg-pink-600 text-slate-800 dark:text-zinc-200 font-extrabold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-sm">
                    <Upload className="w-4 h-4" />
                    {isCurrentUploading ? 'Uploading Artwork...' : pageRecord ? `Replace ${pt.label}` : `Upload ${pt.label}`}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0]
                        if (f) handleUploadPageImage(pt.type, f)
                      }}
                    />
                  </label>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
