'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  Palette, Plus, Edit2, Trash2, RefreshCw, Search, Sliders, Image as ImageIcon,
  Check, X, FolderPlus, Tag, Eye, Sparkles, Layers, ShieldCheck, Filter, Lock, Wand2
} from 'lucide-react'

interface Category {
  id: string
  type: 'occasion' | 'style' | 'religion'
  name: string
}

interface Design {
  id: string
  name: string
  description: string | null
  card_type?: 'standard' | 'customizable'
  default_message?: string | null
  price_kes: number
  price_a5_kes?: number
  price_a4_kes?: number
  price_a3_kes?: number
  compare_at_price_kes?: number | null
  compare_at_a5_kes?: number | null
  compare_at_a4_kes?: number | null
  compare_at_a3_kes?: number | null
  discount_percent?: number | null
  is_active: boolean
  allows_custom_message: boolean
  allows_custom_photo: boolean
  thumbnail_url: string | null
  created_at: string
  updated_at: string
  categories?: Category[]
  pages?: any[]
}

interface DesignsTabProps {
  token: string
}

export default function DesignsTab({ token }: DesignsTabProps) {
  const [designs, setDesigns] = useState<Design[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [editingDesign, setEditingDesign] = useState<Design | null>(null)

  // New Design Form State (3 Size Pricing)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newCardType, setNewCardType] = useState<'standard' | 'customizable'>('customizable')
  const [newDefaultMessage, setNewDefaultMessage] = useState('Wishing you tremendous success, excellence, and God’s grace in your final examinations. We believe in your brilliance!')
  const [newPriceA5Kes, setNewPriceA5Kes] = useState<number>(500)
  const [newPriceA4Kes, setNewPriceA4Kes] = useState<number>(850)
  const [newPriceA3Kes, setNewPriceA3Kes] = useState<number>(1400)
  const [newCompareAtPriceKes, setNewCompareAtPriceKes] = useState<string>('1200')
  const [newDiscountPercent, setNewDiscountPercent] = useState<string>('29')
  const [newAllowsPhoto, setNewAllowsPhoto] = useState(true)
  const [newAllowsMessage, setNewAllowsMessage] = useState(true)
  const [newSelectedCategoryIds, setNewSelectedCategoryIds] = useState<string[]>([])

  // Edit Design Form State (3 Size Pricing)
  const [editName, setEditName] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editCardType, setEditCardType] = useState<'standard' | 'customizable'>('customizable')
  const [editDefaultMessage, setEditDefaultMessage] = useState('')
  const [editPriceA5Kes, setEditPriceA5Kes] = useState<number>(500)
  const [editPriceA4Kes, setEditPriceA4Kes] = useState<number>(850)
  const [editPriceA3Kes, setEditPriceA3Kes] = useState<number>(1400)
  const [editCompareAtPriceKes, setEditCompareAtPriceKes] = useState<string>('')
  const [editDiscountPercent, setEditDiscountPercent] = useState<string>('')
  const [editIsActive, setEditIsActive] = useState(true)
  const [editAllowsPhoto, setEditAllowsPhoto] = useState(true)
  const [editAllowsMessage, setEditAllowsMessage] = useState(true)
  const [editSelectedCategoryIds, setEditSelectedCategoryIds] = useState<string[]>([])

  // Inline Quick Category Form State
  const [showInlineCatAdd, setShowInlineCatAdd] = useState<'create' | 'edit' | null>(null)
  const [inlineCatType, setInlineCatType] = useState<'occasion' | 'style' | 'religion'>('occasion')
  const [inlineCatName, setInlineCatName] = useState('')
  const [creatingInlineCat, setCreatingInlineCat] = useState(false)

  // New Category Form State
  const [newCategoryType, setNewCategoryType] = useState<'occasion' | 'style' | 'religion'>('occasion')
  const [newCategoryName, setNewCategoryName] = useState('')

  const [submitting, setSubmitting] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    setError('')
    try {
      const designsRes = await fetch('http://localhost:4000/api/v1/catalog/designs')
      const designsData = await designsRes.json()
      if (!designsRes.ok) throw new Error(designsData.error || 'Failed to load design templates')
      setDesigns(designsData.data || [])

      const catRes = await fetch('http://localhost:4000/api/v1/catalog/categories')
      const catData = await catRes.json()
      if (!catRes.ok) throw new Error(catData.error || 'Failed to load categories')
      setCategories(catData.data || [])
    } catch (err: any) {
      setError(err.message || 'Error loading design catalog')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const getActiveToken = () => token || (typeof window !== 'undefined' ? (localStorage.getItem('fair_admin_token') || localStorage.getItem('fair_token')) : '')

  const cleanNum = (val: any, fallback: number): number => {
    if (val === undefined || val === null || val === '') return fallback
    const cleaned = String(val).replace(/[^0-9.]/g, '')
    const num = parseFloat(cleaned)
    return isNaN(num) || num <= 0 ? fallback : num
  }

  const cleanOptNum = (val: any): number | null => {
    if (val === undefined || val === null || val === '') return null
    const cleaned = String(val).replace(/[^0-9.]/g, '')
    const num = parseFloat(cleaned)
    return isNaN(num) || num <= 0 ? null : num
  }

  const cleanOptInt = (val: any): number | null => {
    if (val === undefined || val === null || val === '') return null
    const cleaned = String(val).replace(/[^0-9]/g, '')
    const num = parseInt(cleaned, 10)
    return isNaN(num) || num <= 0 ? null : num
  }

  // --- Design Actions ---
  const handleCreateDesign = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim()) return
    setSubmitting(true)
    const activeTok = getActiveToken()
    try {
      const pA4 = cleanNum(newPriceA4Kes, 850)
      const pA5 = cleanNum(newPriceA5Kes, 500)
      const pA3 = cleanNum(newPriceA3Kes, 1400)
      const cPrice = cleanOptNum(newCompareAtPriceKes)
      const disc = cleanOptInt(newDiscountPercent)

      const res = await fetch('http://localhost:4000/api/v1/catalog/designs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${activeTok}`
        },
        body: JSON.stringify({
          name: newName.trim(),
          description: newDesc.trim(),
          cardType: newCardType,
          defaultMessage: newCardType === 'standard' ? newDefaultMessage.trim() : null,
          allowsCustomPhoto: newCardType === 'customizable' ? newAllowsPhoto : false,
          allowsCustomMessage: newCardType === 'customizable' ? newAllowsMessage : false,
          categoryIds: newSelectedCategoryIds,
          priceKes: pA4,
          priceA5Kes: pA5,
          priceA4Kes: pA4,
          priceA3Kes: pA3,
          compareAtPriceKes: cPrice,
          compareAtA4Kes: cPrice,
          discountPercent: disc,
        })
      })
      const data = await res.json()
      if (res.status === 401) {
        throw new Error('Your session has expired. Please log in again to renew your 24-hour admin session.')
      }
      if (!res.ok) throw new Error(data.error || 'Failed to create design')

      setShowCreateModal(false)
      setNewName('')
      setNewDesc('')
      setNewCardType('customizable')
      setNewPriceA5Kes(500)
      setNewPriceA4Kes(850)
      setNewPriceA3Kes(1400)
      setNewCompareAtPriceKes('1200')
      setNewDiscountPercent('29')
      setNewSelectedCategoryIds([])
      fetchData()

      if (data.data?.id) {
        toast.success('Design template created successfully!')
        window.location.href = `/admin/designs/${data.data.id}/zones`
      }
    } catch (err: any) {
      toast.error(err.message || 'Error creating design')
    } finally {
      setSubmitting(false)
    }
  }

  const handleOpenEdit = (d: Design) => {
    setEditingDesign(d)
    setEditName(d.name)
    setEditDesc(d.description || '')
    setEditCardType(d.card_type || (d.allows_custom_message ? 'customizable' : 'standard'))
    setEditDefaultMessage(d.default_message || 'Wishing you tremendous success, excellence, and God’s grace in your final examinations. We believe in your brilliance!')
    setEditSelectedCategoryIds(d.categories?.map(c => c.id) || [])
    
    const baseA4 = d.price_a4_kes || d.price_kes || 850
    setEditPriceA4Kes(Number(baseA4))
    setEditPriceA5Kes(Number(d.price_a5_kes || Math.round(Number(baseA4) * 0.65)))
    setEditPriceA3Kes(Number(d.price_a3_kes || Math.round(Number(baseA4) * 1.65)))

    setEditCompareAtPriceKes(d.compare_at_a4_kes ? String(d.compare_at_a4_kes) : (d.compare_at_price_kes ? String(d.compare_at_price_kes) : ''))
    setEditDiscountPercent(d.discount_percent ? String(d.discount_percent) : '')
    setEditIsActive(d.is_active)
    setEditAllowsPhoto(d.allows_custom_photo)
    setEditAllowsMessage(d.allows_custom_message)
  }

  const handleUpdateDesign = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingDesign || !editName.trim()) return
    setSubmitting(true)
    const activeTok = getActiveToken()
    try {
      const pA4 = cleanNum(editPriceA4Kes, 850)
      const pA5 = cleanNum(editPriceA5Kes, 500)
      const pA3 = cleanNum(editPriceA3Kes, 1400)
      const cPrice = cleanOptNum(editCompareAtPriceKes)
      const disc = cleanOptInt(editDiscountPercent)

      const res = await fetch(`http://localhost:4000/api/v1/catalog/designs/${editingDesign.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${activeTok}`
        },
        body: JSON.stringify({
          name: editName.trim(),
          description: editDesc.trim(),
          is_active: editIsActive,
          cardType: editCardType,
          defaultMessage: editCardType === 'standard' ? editDefaultMessage.trim() : null,
          allows_custom_message: editCardType === 'customizable' ? editAllowsMessage : false,
          allows_custom_photo: editCardType === 'customizable' ? editAllowsPhoto : false,
          categoryIds: editSelectedCategoryIds,
          priceKes: pA4,
          priceA5Kes: pA5,
          priceA4Kes: pA4,
          priceA3Kes: pA3,
          compareAtPriceKes: cPrice,
          compareAtA4Kes: cPrice,
          discountPercent: disc,
        })
      })
      const data = await res.json()
      if (res.status === 401) {
        throw new Error('Your session has expired. Please log in again to renew your 24-hour admin session.')
      }
      if (!res.ok) throw new Error(data.error || 'Failed to update design')

      toast.success('Design template updated successfully!')
      setEditingDesign(null)
      fetchData()
    } catch (err: any) {
      toast.error(err.message || 'Error updating design')
    } finally {
      setSubmitting(false)
    }
  }

  const handleAddInlineCategory = async (targetModal: 'create' | 'edit') => {
    if (!inlineCatName.trim()) return
    setCreatingInlineCat(true)
    const activeTok = getActiveToken()
    try {
      const res = await fetch('http://localhost:4000/api/v1/catalog/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${activeTok}`
        },
        body: JSON.stringify({
          type: inlineCatType,
          name: inlineCatName.trim()
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to add category')
      
      const newCat: Category = data.data
      setCategories(prev => [...prev.filter(c => c.id !== newCat.id), newCat])
      
      if (targetModal === 'create') {
        setNewSelectedCategoryIds(prev => prev.includes(newCat.id) ? prev : [...prev, newCat.id])
      } else {
        setEditSelectedCategoryIds(prev => prev.includes(newCat.id) ? prev : [...prev, newCat.id])
      }
      setInlineCatName('')
      setShowInlineCatAdd(null)
      toast.success(`Category '${newCat.name}' created!`)
    } catch (err: any) {
      toast.error(err.message || 'Error creating category')
    } finally {
      setCreatingInlineCat(false)
    }
  }

  const toggleCategorySelection = (categoryId: string, targetModal: 'create' | 'edit') => {
    if (targetModal === 'create') {
      setNewSelectedCategoryIds(prev =>
        prev.includes(categoryId) ? prev.filter(id => id !== categoryId) : [...prev, categoryId]
      )
    } else {
      setEditSelectedCategoryIds(prev =>
        prev.includes(categoryId) ? prev.filter(id => id !== categoryId) : [...prev, categoryId]
      )
    }
  }

  const renderCategoryPicker = (targetModal: 'create' | 'edit') => {
    const selectedIds = targetModal === 'create' ? newSelectedCategoryIds : editSelectedCategoryIds
    const occasions = categories.filter(c => c.type === 'occasion')
    const styles = categories.filter(c => c.type === 'style')
    const religions = categories.filter(c => c.type === 'religion')

    return (
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Tag className="w-4 h-4 text-pink-500" />
            <span className="font-extrabold text-slate-900 dark:text-white text-xs">
              Product Categories & Tags ({selectedIds.length} selected)
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              setShowInlineCatAdd(showInlineCatAdd === targetModal ? null : targetModal)
              setInlineCatName('')
            }}
            className="text-[11px] font-bold text-pink-600 hover:text-pink-500 flex items-center gap-1 bg-pink-50 dark:bg-pink-950/50 px-2 py-1 rounded-lg border border-pink-200 dark:border-pink-800/50 transition-colors"
          >
            <Plus className="w-3 h-3" /> Add Category
          </button>
        </div>

        {showInlineCatAdd === targetModal && (
          <div className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-pink-300 dark:border-pink-800/80 space-y-2 shadow-sm animate-in fade-in">
            <div className="text-[11px] font-bold text-slate-700 dark:text-zinc-300">Quick Create Category</div>
            <div className="flex gap-2">
              <select
                value={inlineCatType}
                onChange={e => setInlineCatType(e.target.value as any)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-slate-900 dark:text-white text-xs font-semibold"
              >
                <option value="occasion">Occasion</option>
                <option value="style">Style</option>
                <option value="religion">Religion</option>
              </select>
              <input
                type="text"
                value={inlineCatName}
                onChange={e => setInlineCatName(e.target.value)}
                placeholder="e.g. KCSE 2026, Luxury Floral..."
                className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-slate-900 dark:text-white text-xs"
              />
              <button
                type="button"
                disabled={creatingInlineCat || !inlineCatName.trim()}
                onClick={() => handleAddInlineCategory(targetModal)}
                className="px-3 py-1.5 rounded-lg bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs shrink-0"
              >
                {creatingInlineCat ? '...' : 'Save & Select'}
              </button>
            </div>
          </div>
        )}

        {/* Occasions */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-600 dark:text-purple-400 block">
            Occasions & Exams
          </span>
          <div className="flex flex-wrap gap-1.5">
            {occasions.length === 0 ? (
              <span className="text-[11px] text-slate-400 italic">No occasion categories yet</span>
            ) : (
              occasions.map(c => {
                const isSelected = selectedIds.includes(c.id)
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggleCategorySelection(c.id, targetModal)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                      isSelected
                        ? 'bg-purple-600 text-white shadow-sm ring-2 ring-purple-600/30'
                        : 'bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 hover:border-purple-300'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    {c.name}
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* Styles */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-400 block">
            Styles & Themes
          </span>
          <div className="flex flex-wrap gap-1.5">
            {styles.length === 0 ? (
              <span className="text-[11px] text-slate-400 italic">No style categories yet</span>
            ) : (
              styles.map(c => {
                const isSelected = selectedIds.includes(c.id)
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggleCategorySelection(c.id, targetModal)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-600/30'
                        : 'bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 hover:border-blue-300'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    {c.name}
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* Religions */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400 block">
            Faith & Religion
          </span>
          <div className="flex flex-wrap gap-1.5">
            {religions.length === 0 ? (
              <span className="text-[11px] text-slate-400 italic">No religious categories yet</span>
            ) : (
              religions.map(c => {
                const isSelected = selectedIds.includes(c.id)
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggleCategorySelection(c.id, targetModal)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                      isSelected
                        ? 'bg-amber-600 text-white shadow-sm ring-2 ring-amber-600/30'
                        : 'bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 hover:border-amber-300'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    {c.name}
                  </button>
                )
              })
            )}
          </div>
        </div>
      </div>
    )
  }

  const handleDeleteDesign = async (id: string) => {
    if (!confirm('Are you sure you want to delete this design template? This will remove associated pages.')) return
    try {
      const res = await fetch(`http://localhost:4000/api/v1/catalog/designs/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to delete design')
      toast.success('Design template deleted')
      fetchData()
    } catch (err: any) {
      toast.error(err.message || 'Error deleting design')
    }
  }

  // --- Category Actions ---
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCategoryName.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch('http://localhost:4000/api/v1/catalog/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          type: newCategoryType,
          name: newCategoryName.trim()
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to add category')

      toast.success(`Category '${newCategoryName.trim()}' added!`)
      setNewCategoryName('')
      fetchData()
    } catch (err: any) {
      toast.error(err.message || 'Error creating category')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Delete this category?')) return
    try {
      const res = await fetch(`http://localhost:4000/api/v1/catalog/categories/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to delete category')
      toast.success('Category removed')
      fetchData()
    } catch (err: any) {
      toast.error(err.message || 'Error deleting category')
    }
  }

  // Filter designs
  const filteredDesigns = designs.filter(d => {
    const matchSearch = d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.description && d.description.toLowerCase().includes(searchQuery.toLowerCase()))
    
    if (!matchSearch) return false
    if (selectedCategory === 'all') return true

    return d.categories?.some(c => c.id === selectedCategory)
  })

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">Card Designs Catalog</h2>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
            Manage high-school KCSE & KCPE exam cards, 3-size pricing, and page artwork.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCategoryModal(true)}
            className="px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800 font-extrabold text-xs text-slate-700 dark:text-zinc-300 flex items-center gap-1.5 transition-colors"
          >
            <FolderPlus className="w-4 h-4 text-pink-500" /> Categories
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-pink-500/20 transition-transform hover:scale-105"
          >
            <Plus className="w-4 h-4" /> Add New Card
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search templates by title or keywords..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-pink-500 shadow-sm"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              selectedCategory === 'all'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                : 'bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300'
            }`}
          >
            All Categories
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === c.id
                  ? 'bg-pink-600 text-white shadow-sm'
                  : 'bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Designs */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">Loading design templates...</div>
      ) : filteredDesigns.length === 0 ? (
        <div className="p-12 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-center space-y-3">
          <p className="text-sm font-bold text-slate-600 dark:text-zinc-300">No card templates found</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 rounded-xl bg-pink-600 text-white text-xs font-extrabold"
          >
            Create First Template
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDesigns.map(d => {
            const isStandard = d.card_type === 'standard' || !d.allows_custom_message
            const pA5 = d.price_a5_kes || Math.round(Number(d.price_kes || 850) * 0.65)
            const pA4 = d.price_a4_kes || d.price_kes || 850
            const pA3 = d.price_a3_kes || Math.round(Number(d.price_kes || 850) * 1.65)

            return (
              <div
                key={d.id}
                className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-4 flex flex-col justify-between shadow-sm hover:shadow-md transition-all group"
              >
                <div className="space-y-3">
                  {/* Thumbnail Preview Banner */}
                  <div className="relative w-full h-44 rounded-2xl overflow-hidden bg-slate-950 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center">
                    {d.thumbnail_url ? (
                      <img
                        src={d.thumbnail_url}
                        alt={d.name}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="text-center space-y-1 text-slate-500">
                        <ImageIcon className="w-8 h-8 mx-auto text-pink-500 opacity-60" />
                        <span className="text-[10px] block font-semibold">No Artwork Uploaded</span>
                      </div>
                    )}

                    {/* Badges */}
                    <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider backdrop-blur-md ${
                        d.is_active ? 'bg-emerald-500/80 text-white' : 'bg-slate-800/80 text-slate-300'
                      }`}>
                        {d.is_active ? 'Active' : 'Draft / Off'}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider backdrop-blur-md ${
                        isStandard ? 'bg-amber-600/85 text-white' : 'bg-pink-600/85 text-white'
                      }`}>
                        {isStandard ? '🔒 Standard / Pre-Printed' : '✨ Customizable'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-extrabold text-slate-900 dark:text-white text-base leading-tight">{d.name}</h3>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 line-clamp-2 mt-1">
                      {d.description || 'Deluxe Success Card Template'}
                    </p>

                    {/* Assigned Categories Badges */}
                    {d.categories && d.categories.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {d.categories.map((c) => (
                          <span
                            key={c.id}
                            className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold border ${
                              c.type === 'occasion'
                                ? 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30'
                                : c.type === 'religion'
                                ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30'
                                : 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30'
                            }`}
                          >
                            {c.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 3-Size Pricing & Discount Display */}
                  <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-pink-600 dark:text-pink-400">
                          A5: KSh {Number(pA5).toLocaleString()}
                        </span>
                        <span className="text-slate-300 dark:text-zinc-700">•</span>
                        <span className="font-extrabold text-slate-900 dark:text-white">
                          A4: KSh {Number(pA4).toLocaleString()}
                        </span>
                        <span className="text-slate-300 dark:text-zinc-700">•</span>
                        <span className="font-bold text-slate-600 dark:text-zinc-400">
                          A3: KSh {Number(pA3).toLocaleString()}
                        </span>
                      </div>

                      {d.discount_percent && Number(d.discount_percent) > 0 ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-black">
                          {d.discount_percent}% OFF
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between gap-2">
                  <Link
                    href={`/admin/designs/${d.id}/zones`}
                    className="flex-1 px-3.5 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-transform hover:scale-105"
                  >
                    <Sliders className="w-3.5 h-3.5" /> 4-Page Artwork & Pricing Studio
                  </Link>

                  <div className="flex items-center gap-1">
                    <Link
                      href={`/design/${d.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-xl text-pink-600 dark:text-pink-400 hover:bg-pink-50 dark:hover:bg-pink-950/60 border border-pink-200 dark:border-pink-800/60 transition-colors"
                      title="Review / Live Store Preview"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => handleOpenEdit(d)}
                      className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                      title="Edit Specs & Pricing"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteDesign(d.id)}
                      className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-zinc-800 transition-colors"
                      title="Delete Design"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* --- CREATE DESIGN MODAL --- */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-lg rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Create Card Template</h3>
              <button onClick={() => setShowCreateModal(false)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800"><X className="w-4 h-4" /></button>
            </div>

            <form onSubmit={handleCreateDesign} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-slate-600 dark:text-zinc-400">Template Title *</label>
                <input
                  type="text" required value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Royal Golden KCSE Crest Card"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-slate-900 dark:text-white font-bold"
                />
              </div>

              {/* 3-SIZE PRICING & DISCOUNT SECTION */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-3">
                <label className="block font-bold text-slate-900 dark:text-white">Card Pricing by Size (KSh)</label>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-zinc-400 mb-1">A5 Compact *</label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      required
                      value={newPriceA5Kes}
                      onChange={e => setNewPriceA5Kes(parseFloat(e.target.value) || 0)}
                      placeholder="500"
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-slate-900 dark:text-white font-extrabold text-pink-600 dark:text-pink-400 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-zinc-400 mb-1">A4 Standard *</label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      required
                      value={newPriceA4Kes}
                      onChange={e => {
                        const val = parseFloat(e.target.value) || 0
                        setNewPriceA4Kes(val)
                        const orig = parseFloat(newCompareAtPriceKes)
                        if (orig > val && val > 0) {
                          setNewDiscountPercent(Math.round(((orig - val) / orig) * 100).toString())
                        }
                      }}
                      placeholder="850"
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-slate-900 dark:text-white font-extrabold text-pink-600 dark:text-pink-400 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-zinc-400 mb-1">A3 Jumbo *</label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      required
                      value={newPriceA3Kes}
                      onChange={e => setNewPriceA3Kes(parseFloat(e.target.value) || 0)}
                      placeholder="1400"
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-slate-900 dark:text-white font-extrabold text-pink-600 dark:text-pink-400 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-zinc-200/60 dark:border-zinc-800/60">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-zinc-400 mb-1">Original A4 Price (KSh)</label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={newCompareAtPriceKes}
                      onChange={e => {
                        const val = e.target.value
                        setNewCompareAtPriceKes(val)
                        const orig = parseFloat(val)
                        if (orig > newPriceA4Kes && newPriceA4Kes > 0) {
                          setNewDiscountPercent(Math.round(((orig - newPriceA4Kes) / orig) * 100).toString())
                        } else if (!val) {
                          setNewDiscountPercent('')
                        }
                      }}
                      placeholder="1200"
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-slate-900 dark:text-white font-semibold text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-zinc-400 mb-1">Discount %</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="any"
                      value={newDiscountPercent}
                      onChange={e => setNewDiscountPercent(e.target.value)}
                      placeholder="29"
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-slate-900 dark:text-white font-semibold text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* CARD TYPE SELECTOR */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-2">
                <label className="block font-bold text-slate-900 dark:text-white">Card Customization Format</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setNewCardType('standard')
                      setNewAllowsMessage(false)
                      setNewAllowsPhoto(false)
                    }}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      newCardType === 'standard'
                        ? 'bg-amber-500/10 border-amber-500 text-amber-900 dark:text-amber-200 ring-1 ring-amber-500'
                        : 'border-zinc-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:border-zinc-300'
                    }`}
                  >
                    <span className="font-extrabold block text-xs flex items-center gap-1">
                      <Lock className="w-3.5 h-3.5 text-amber-600" /> Standard / Fixed
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-zinc-400 mt-1 block">
                      Customer cannot change message. Pre-printed card, instant order.
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setNewCardType('customizable')
                      setNewAllowsMessage(true)
                      setNewAllowsPhoto(true)
                    }}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      newCardType === 'customizable'
                        ? 'bg-pink-500/10 border-pink-500 text-pink-900 dark:text-pink-200 ring-1 ring-pink-500'
                        : 'border-zinc-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:border-zinc-300'
                    }`}
                  >
                    <span className="font-extrabold block text-xs flex items-center gap-1">
                      <Wand2 className="w-3.5 h-3.5 text-pink-600" /> Customizable
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-zinc-400 mt-1 block">
                      Customer writes custom message, chooses fonts & uploads photos.
                    </span>
                  </button>
                </div>
              </div>

              {/* Fixed Pre-Printed Message input for Standard Card */}
              {newCardType === 'standard' && (
                <div className="p-3.5 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-1.5">
                  <label className="block font-bold text-amber-900 dark:text-amber-300">
                    Pre-Printed Standard Greeting Message
                  </label>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                    This fixed message will be displayed to customers and rendered on Page 3.
                  </p>
                  <textarea
                    rows={3}
                    value={newDefaultMessage}
                    onChange={e => setNewDefaultMessage(e.target.value)}
                    placeholder="Enter the fixed blessing/congratulatory message..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-slate-900 dark:text-white"
                  />
                </div>
              )}

              {/* CATEGORIES PICKER */}
              {renderCategoryPicker('create')}

              <div>
                <label className="block font-semibold mb-1 text-slate-600 dark:text-zinc-400">Description</label>
                <textarea
                  rows={2} value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Describe the design style, border motifs, and recipient target..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-slate-900 dark:text-white"
                />
              </div>

              {newCardType === 'customizable' && (
                <div className="space-y-2 pt-1">
                  <label className="flex items-center gap-2 font-semibold text-slate-800 dark:text-zinc-200 cursor-pointer">
                    <input
                      type="checkbox" checked={newAllowsMessage} onChange={e => setNewAllowsMessage(e.target.checked)}
                      className="w-4 h-4 rounded text-pink-600 focus:ring-0"
                    />
                    Allows Customer Handwritten Message
                  </label>
                  <label className="flex items-center gap-2 font-semibold text-slate-800 dark:text-zinc-200 cursor-pointer">
                    <input
                      type="checkbox" checked={newAllowsPhoto} onChange={e => setNewAllowsPhoto(e.target.checked)}
                      className="w-4 h-4 rounded text-pink-600 focus:ring-0"
                    />
                    Allows Candidate Photo Upload
                  </label>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-zinc-800 font-bold text-slate-700 dark:text-zinc-300">Cancel</button>
                <button type="submit" disabled={submitting} className="flex-1 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-extrabold shadow-md shadow-pink-500/20">{submitting ? 'Creating...' : 'Create Template'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- EDIT DESIGN MODAL --- */}
      {editingDesign && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-lg rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Edit Template Specs & Pricing</h3>
              <button onClick={() => setEditingDesign(null)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800"><X className="w-4 h-4" /></button>
            </div>

            <form onSubmit={handleUpdateDesign} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-slate-600 dark:text-zinc-400">Template Title</label>
                <input
                  type="text" required value={editName} onChange={e => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-slate-900 dark:text-white font-bold"
                />
              </div>

              {/* 3-SIZE PRICING & DISCOUNT SECTION */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-3">
                <label className="block font-bold text-slate-900 dark:text-white">Card Pricing by Size (KSh)</label>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-zinc-400 mb-1">A5 Compact *</label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      required
                      value={editPriceA5Kes}
                      onChange={e => setEditPriceA5Kes(parseFloat(e.target.value) || 0)}
                      placeholder="500"
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-slate-900 dark:text-white font-extrabold text-pink-600 dark:text-pink-400 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-zinc-400 mb-1">A4 Standard *</label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      required
                      value={editPriceA4Kes}
                      onChange={e => {
                        const val = parseFloat(e.target.value) || 0
                        setEditPriceA4Kes(val)
                        const orig = parseFloat(editCompareAtPriceKes)
                        if (orig > val && val > 0) {
                          setEditDiscountPercent(Math.round(((orig - val) / orig) * 100).toString())
                        }
                      }}
                      placeholder="850"
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-slate-900 dark:text-white font-extrabold text-pink-600 dark:text-pink-400 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-zinc-400 mb-1">A3 Jumbo *</label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      required
                      value={editPriceA3Kes}
                      onChange={e => setNewPriceA3Kes(parseFloat(e.target.value) || 0)}
                      placeholder="1400"
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-slate-900 dark:text-white font-extrabold text-pink-600 dark:text-pink-400 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-zinc-200/60 dark:border-zinc-800/60">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-zinc-400 mb-1">Original A4 Price (KSh)</label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={editCompareAtPriceKes}
                      onChange={e => {
                        const val = e.target.value
                        setEditCompareAtPriceKes(val)
                        const orig = parseFloat(val)
                        if (orig > editPriceA4Kes && editPriceA4Kes > 0) {
                          setEditDiscountPercent(Math.round(((orig - editPriceA4Kes) / orig) * 100).toString())
                        } else if (!val) {
                          setEditDiscountPercent('')
                        }
                      }}
                      placeholder="1200"
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-slate-900 dark:text-white font-semibold text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-zinc-400 mb-1">Discount %</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="any"
                      value={editDiscountPercent}
                      onChange={e => setEditDiscountPercent(e.target.value)}
                      placeholder="29"
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-slate-900 dark:text-white font-semibold text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* CARD TYPE SELECTOR */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-2">
                <label className="block font-bold text-slate-900 dark:text-white">Card Customization Format</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditCardType('standard')
                      setEditAllowsMessage(false)
                      setEditAllowsPhoto(false)
                    }}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      editCardType === 'standard'
                        ? 'bg-amber-500/10 border-amber-500 text-amber-900 dark:text-amber-200 ring-1 ring-amber-500'
                        : 'border-zinc-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:border-zinc-300'
                    }`}
                  >
                    <span className="font-extrabold block text-xs flex items-center gap-1">
                      <Lock className="w-3.5 h-3.5 text-amber-600" /> Standard / Fixed
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-zinc-400 mt-1 block">
                      Customer cannot change message. Pre-printed card, instant order.
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEditCardType('customizable')
                      setEditAllowsMessage(true)
                      setEditAllowsPhoto(true)
                    }}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      editCardType === 'customizable'
                        ? 'bg-pink-500/10 border-pink-500 text-pink-900 dark:text-pink-200 ring-1 ring-pink-500'
                        : 'border-zinc-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:border-zinc-300'
                    }`}
                  >
                    <span className="font-extrabold block text-xs flex items-center gap-1">
                      <Wand2 className="w-3.5 h-3.5 text-pink-600" /> Customizable
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-zinc-400 mt-1 block">
                      Customer writes custom message, chooses fonts & uploads photos.
                    </span>
                  </button>
                </div>
              </div>

              {editCardType === 'standard' && (
                <div className="p-3.5 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-1.5">
                  <label className="block font-bold text-amber-900 dark:text-amber-300">
                    Pre-Printed Standard Greeting Message
                  </label>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                    This fixed message will be displayed to customers and rendered on Page 3.
                  </p>
                  <textarea
                    rows={3}
                    value={editDefaultMessage}
                    onChange={e => setEditDefaultMessage(e.target.value)}
                    placeholder="Enter the fixed blessing/congratulatory message..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-slate-900 dark:text-white"
                  />
                </div>
              )}

              {/* CATEGORIES PICKER */}
              {renderCategoryPicker('edit')}

              <div>
                <label className="block font-semibold mb-1 text-slate-600 dark:text-zinc-400">Description</label>
                <textarea
                  rows={2} value={editDesc} onChange={e => setEditDesc(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-2 pt-1 border-t border-zinc-100 dark:border-zinc-800">
                <label className="flex items-center gap-2 font-semibold text-slate-800 dark:text-zinc-200 cursor-pointer">
                  <input
                    type="checkbox" checked={editIsActive} onChange={e => setEditIsActive(e.target.checked)}
                    className="w-4 h-4 rounded text-pink-600 focus:ring-0"
                  />
                  Template Published & Active in Storefront Catalog
                </label>
                {editCardType === 'customizable' && (
                  <>
                    <label className="flex items-center gap-2 font-semibold text-slate-800 dark:text-zinc-200 cursor-pointer">
                      <input
                        type="checkbox" checked={editAllowsMessage} onChange={e => setEditAllowsMessage(e.target.checked)}
                        className="w-4 h-4 rounded text-pink-600 focus:ring-0"
                      />
                      Allows Customer Handwritten Message
                    </label>
                    <label className="flex items-center gap-2 font-semibold text-slate-800 dark:text-zinc-200 cursor-pointer">
                      <input
                        type="checkbox" checked={editAllowsPhoto} onChange={e => setEditAllowsPhoto(e.target.checked)}
                        className="w-4 h-4 rounded text-pink-600 focus:ring-0"
                      />
                      Allows Candidate Photo Upload
                    </label>
                  </>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setEditingDesign(null)} className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-zinc-800 font-bold text-slate-700 dark:text-zinc-300">Cancel</button>
                <button type="submit" disabled={submitting} className="flex-1 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-extrabold shadow-md shadow-pink-500/20">{submitting ? 'Saving...' : 'Save Specs'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MANAGE CATEGORIES MODAL --- */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-lg rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-pink-500" /> Catalog Categories & Occasions
              </h3>
              <button onClick={() => setShowCategoryModal(false)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800"><X className="w-4 h-4" /></button>
            </div>

            {/* Category Add Form */}
            <form onSubmit={handleCreateCategory} className="flex items-center gap-2 text-xs">
              <select
                value={newCategoryType} onChange={e => setNewCategoryType(e.target.value as any)}
                className="px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-slate-900 dark:text-white font-bold"
              >
                <option value="occasion">Occasion</option>
                <option value="style">Style</option>
                <option value="religion">Religion</option>
              </select>
              <input
                type="text" required value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} placeholder="e.g. KCSE Exams 2026"
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-slate-900 dark:text-white"
              />
              <button type="submit" disabled={submitting} className="px-4 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-bold shrink-0">{submitting ? '...' : 'Add'}</button>
            </form>

            {/* List */}
            <div className="space-y-2 max-h-60 overflow-y-auto pt-2 pr-1 border-t border-zinc-100 dark:border-zinc-800 text-xs">
              {categories.map(cat => (
                <div key={cat.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-pink-100 dark:bg-pink-950 text-pink-700 dark:text-pink-300 font-extrabold text-[10px] uppercase">
                      {cat.type}
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white">{cat.name}</span>
                  </div>
                  <button onClick={() => handleDeleteCategory(cat.id)} className="p-1 rounded text-slate-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
