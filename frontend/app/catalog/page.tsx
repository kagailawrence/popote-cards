'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import {
  Filter, ArrowRight, Search, X, RotateCcw, SlidersHorizontal, Check, Tag, ShoppingBag, UserCheck, Lock, Wand2
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { CardThumbnailVisual } from '../../components/CardThumbnailVisual'

interface Design {
  id: string
  name: string
  description: string
  card_type?: 'standard' | 'customizable'
  default_message?: string | null
  allows_custom_message?: boolean
  allows_custom_photo: boolean
  thumbnail_url?: string | null
  images: any[]
  pages?: any[]
  price_kes?: number
  price_a5_kes?: number
  price_a4_kes?: number
  price_a3_kes?: number
  compare_at_price_kes?: number | null
  compare_at_a5_kes?: number | null
  compare_at_a4_kes?: number | null
  compare_at_a3_kes?: number | null
  discount_percent?: number | null
  base_price_kes?: number
  categories?: Category[]
}

interface Category {
  id: string
  type: string
  name: string
}

export default function CatalogPage() {
  const router = useRouter()
  const [designs, setDesigns] = useState<Design[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  // Filter States
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedOccasion, setSelectedOccasion] = useState<string>('')
  const [selectedStyle, setSelectedStyle] = useState<string>('')
  const [selectedReligion, setSelectedReligion] = useState<string>('')
  const [cardTypeFilter, setCardTypeFilter] = useState<'all' | 'standard' | 'customizable'>('all')

  // Price Range States
  const [pricePreset, setPricePreset] = useState<'all' | 'under500' | '500-1000' | '1000-1500' | '1500plus' | 'custom'>('all')
  const [minPrice, setMinPrice] = useState<number>(0)
  const [maxPrice, setMaxPrice] = useState<number>(3000)

  // Feature Toggles
  const [onlyPhotoAllowed, setOnlyPhotoAllowed] = useState(false)

  // Sort State
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'name-asc'>('featured')

  // Mobile Filter Drawer State
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false)

  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await fetch('http://localhost:4000/api/v1/catalog/categories')
        const data = await res.json()
        if (data.data) setCategories(data.data)
      } catch (err) {
        console.error('Failed to load categories', err)
      }
    }
    loadCategories()
  }, [])

  useEffect(() => {
    async function loadDesigns() {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        if (selectedOccasion) params.append('occasion', selectedOccasion)
        if (selectedStyle) params.append('style', selectedStyle)
        if (selectedReligion) params.append('religion', selectedReligion)

        const res = await fetch(`http://localhost:4000/api/v1/catalog/designs?${params.toString()}`)
        const data = await res.json()
        if (data.data) {
          const enriched = data.data.map((d: any) => ({
            ...d,
            price_kes: d.price_kes ? Number(d.price_kes) : (d.base_price_kes ? Number(d.base_price_kes) : 850),
            price_a5_kes: d.price_a5_kes ? Number(d.price_a5_kes) : Math.round(Number(d.price_kes || 850) * 0.65),
            price_a4_kes: d.price_a4_kes ? Number(d.price_a4_kes) : Number(d.price_kes || 850),
            price_a3_kes: d.price_a3_kes ? Number(d.price_a3_kes) : Math.round(Number(d.price_kes || 850) * 1.65),
            base_price_kes: d.price_a5_kes ? Number(d.price_a5_kes) : (d.price_kes ? Number(d.price_kes) : 500),
          }))
          setDesigns(enriched)
        }
      } catch (err) {
        console.error('Failed to load designs', err)
      } finally {
        setLoading(false)
      }
    }
    loadDesigns()
  }, [selectedOccasion, selectedStyle, selectedReligion])

  const occasions = categories.filter((c) => c.type === 'occasion')
  const styles = categories.filter((c) => c.type === 'style')

  // Direct user to customizer to collect required recipient information
  const handleDirectToCustomizer = (designId: string) => {
    router.push(`/design/${designId}`)
  }

  const handleSelectPricePreset = (preset: typeof pricePreset) => {
    setPricePreset(preset)
    if (preset === 'all') {
      setMinPrice(0)
      setMaxPrice(3000)
    } else if (preset === 'under500') {
      setMinPrice(0)
      setMaxPrice(500)
    } else if (preset === '500-1000') {
      setMinPrice(500)
      setMaxPrice(1000)
    } else if (preset === '1000-1500') {
      setMinPrice(1000)
      setMaxPrice(1500)
    } else if (preset === '1500plus') {
      setMinPrice(1500)
      setMaxPrice(3000)
    }
  }

  const resetAllFilters = () => {
    setSearchQuery('')
    setSelectedOccasion('')
    setSelectedStyle('')
    setSelectedReligion('')
    setCardTypeFilter('all')
    setPricePreset('all')
    setMinPrice(0)
    setMaxPrice(3000)
    setOnlyPhotoAllowed(false)
    setSortBy('featured')
  }

  // Filter & Sort Pipeline
  const filteredDesigns = useMemo(() => {
    return designs
      .filter((d) => {
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase()
          const matchesName = d.name.toLowerCase().includes(q)
          const matchesDesc = d.description?.toLowerCase().includes(q)
          if (!matchesName && !matchesDesc) return false
        }
        if (onlyPhotoAllowed && !d.allows_custom_photo) return false

        if (cardTypeFilter === 'standard') {
          const isStd = d.card_type === 'standard' || !d.allows_custom_message
          if (!isStd) return false
        } else if (cardTypeFilter === 'customizable') {
          const isCustom = d.card_type === 'customizable' || d.allows_custom_message
          if (!isCustom) return false
        }

        const price = d.base_price_kes || 500
        if (price < minPrice || price > maxPrice) return false

        return true
      })
      .sort((a, b) => {
        const priceA = a.base_price_kes || 500
        const priceB = b.base_price_kes || 500

        if (sortBy === 'price-asc') return priceA - priceB
        if (sortBy === 'price-desc') return priceB - priceA
        if (sortBy === 'name-asc') return a.name.localeCompare(b.name)
        return 0
      })
  }, [designs, searchQuery, cardTypeFilter, onlyPhotoAllowed, minPrice, maxPrice, sortBy])

  const activeFiltersCount =
    (selectedOccasion ? 1 : 0) +
    (selectedStyle ? 1 : 0) +
    (selectedReligion ? 1 : 0) +
    (cardTypeFilter !== 'all' ? 1 : 0) +
    (searchQuery ? 1 : 0) +
    (pricePreset !== 'all' ? 1 : 0) +
    (onlyPhotoAllowed ? 1 : 0)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-slide-up relative">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-transparent p-6 sm:p-8 rounded-3xl border border-pink-500/20">
        <div>
          <span className="text-xs uppercase font-extrabold tracking-wider text-pink-600 dark:text-pink-400">
            KCSE & Exam Success Cards Collection
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mt-1">
            Browse Success Cards
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400 mt-1 max-w-xl">
            Choose between <strong>Standard Pre-Printed Cards</strong> (quick order with instant blessings) and <strong>Customizable Cards</strong> (custom messages & photo inserts).
          </p>
        </div>

        {/* Search Input in Top Banner */}
        <div className="w-full md:w-72 relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by card name..."
            className="w-full pl-9 pr-4 py-2.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-pink-500 focus:outline-none shadow-sm"
          />
        </div>
      </div>

      {/* Main Layout: Sidebar Filters + Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-start">
        {/* Mobile Filter Toggle Button */}
        <div className="md:hidden flex justify-between items-center">
          <button
            onClick={() => setMobileFilterOpen(true)}
            className="px-4 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-200 text-xs font-bold flex items-center gap-2 shadow-sm"
          >
            <Filter className="w-4 h-4 text-pink-600" />
            Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}
          </button>

          <span className="text-xs text-slate-500 dark:text-zinc-400 font-semibold">
            {filteredDesigns.length} designs available
          </span>
        </div>

        {/* Sidebar Filters */}
        <aside
          className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-sm p-4 md:p-0 md:static md:z-0 md:bg-transparent transition-opacity ${mobileFilterOpen ? 'block' : 'hidden md:block'
            }`}
        >
          <div className="bg-white dark:bg-zinc-900 md:bg-transparent rounded-3xl md:rounded-none p-6 md:p-0 max-h-[90vh] md:max-h-none overflow-y-auto space-y-6 border md:border-none border-zinc-200 dark:border-zinc-800 shadow-xl md:shadow-none">
            {/* Sidebar Title */}
            <div className="flex justify-between items-center pb-2 border-b border-zinc-200 dark:border-zinc-800">
              <span className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <SlidersHorizontal className="w-4 h-4 text-pink-600" /> Filter Catalog
              </span>
              {activeFiltersCount > 0 && (
                <button
                  onClick={resetAllFilters}
                  className="text-[11px] font-bold text-pink-600 hover:text-pink-500 flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" /> Reset
                </button>
              )}
            </div>

            {/* 1. Card Format Filter */}
            <div className="space-y-2.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-400 uppercase tracking-wider">
                Card Format
              </label>
              <div className="space-y-1.5">
                {[
                  { key: 'all', label: 'All Card Formats' },
                  { key: 'standard', label: 'Standard / Pre-Printed' },
                  { key: 'customizable', label: 'Customizable Message' },
                ].map((fmt) => (
                  <button
                    key={fmt.key}
                    onClick={() => setCardTypeFilter(fmt.key as any)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${cardTypeFilter === fmt.key
                        ? 'bg-pink-600 text-white shadow-sm'
                        : 'bg-slate-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:border-zinc-300'
                      }`}
                  >
                    <span>{fmt.label}</span>
                    {cardTypeFilter === fmt.key && <Check className="w-3.5 h-3.5" />}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Occasion Filter */}
            {occasions.length > 0 && (
              <div className="space-y-3 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-400 uppercase tracking-wider">Occasion</label>
                <div className="flex flex-wrap gap-1.5">
                  {occasions.map((occ) => {
                    const isSelected = selectedOccasion === occ.name
                    return (
                      <button
                        key={occ.id}
                        onClick={() => setSelectedOccasion(isSelected ? '' : occ.name)}
                        className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${isSelected
                            ? 'bg-pink-600 text-white border-pink-600 shadow-sm'
                            : 'bg-slate-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-400 hover:border-zinc-400'
                          }`}
                      >
                        {occ.name}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* 3. Price Preset Buttons */}
            <div className="space-y-3 pt-2 border-t border-zinc-200 dark:border-zinc-800">
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-400 uppercase tracking-wider">Price Range (KES)</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: 'all', label: 'All Prices' },
                  { key: 'under500', label: 'Under 500' },
                  { key: '500-1000', label: '500 – 1,000' },
                  { key: '1000-1500', label: '1,000 – 1,500' },
                  { key: '1500plus', label: '1,500+' },
                ].map((p) => (
                  <button
                    key={p.key}
                    onClick={() => handleSelectPricePreset(p.key as any)}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all text-center ${pricePreset === p.key
                        ? 'bg-pink-600 text-white border-pink-600 shadow-sm'
                        : 'bg-slate-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:border-zinc-300'
                      }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Customization Feature Toggles */}
            <div className="space-y-3 pt-2 border-t border-zinc-200 dark:border-zinc-800">
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-400 uppercase tracking-wider">Features</label>
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 dark:text-zinc-300">
                <input
                  type="checkbox"
                  checked={onlyPhotoAllowed}
                  onChange={(e) => setOnlyPhotoAllowed(e.target.checked)}
                  className="w-4 h-4 rounded bg-slate-50 dark:bg-zinc-950 border-zinc-300 dark:border-zinc-800 text-pink-600 focus:ring-0"
                />
                <span>Allows Photo Insert</span>
              </label>
            </div>
          </div>
        </aside>

        {/* Right Area: Header Bar + Cards Grid */}
        <main className="md:col-span-3 space-y-6">
          {/* Top Bar */}
          <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                Showing {filteredDesigns.length} design(s)
              </span>

              {cardTypeFilter !== 'all' && (
                <span className="px-2.5 py-1 rounded-full bg-pink-100 dark:bg-pink-950 text-pink-700 dark:text-pink-300 border border-pink-300 dark:border-pink-800 text-[10px] font-bold flex items-center gap-1">
                  Format: {cardTypeFilter === 'standard' ? 'Standard / Pre-Printed' : 'Customizable'}
                  <X className="w-3 h-3 cursor-pointer hover:text-pink-900" onClick={() => setCardTypeFilter('all')} />
                </span>
              )}
              {selectedOccasion && (
                <span className="px-2.5 py-1 rounded-full bg-pink-100 dark:bg-pink-950 text-pink-700 dark:text-pink-300 border border-pink-300 dark:border-pink-800 text-[10px] font-bold flex items-center gap-1">
                  {selectedOccasion}
                  <X className="w-3 h-3 cursor-pointer hover:text-pink-900" onClick={() => setSelectedOccasion('')} />
                </span>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <span className="text-xs text-slate-500 dark:text-zinc-500 font-semibold whitespace-nowrap">Sort By:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="rounded-xl bg-slate-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-slate-900 dark:text-white text-xs p-2.5 focus:border-pink-500 focus:outline-none shadow-sm font-semibold"
              >
                <option value="featured">Featured Designs</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="name-asc">Name: A to Z</option>
              </select>
            </div>
          </div>

          {/* Cards Grid */}
          {loading ? (
            <div className="p-16 text-center text-slate-500 dark:text-zinc-500 animate-pulse">Loading design catalog...</div>
          ) : filteredDesigns.length === 0 ? (
            <div className="p-16 text-center bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 space-y-4 shadow-sm">
              <p className="text-base font-bold text-slate-800 dark:text-zinc-200">No cards match your filter criteria.</p>
              <p className="text-xs text-slate-500 dark:text-zinc-500">Try loosening your filters or switching card formats.</p>
              <button
                onClick={resetAllFilters}
                className="px-5 py-2.5 rounded-xl bg-pink-600 text-white font-bold text-xs shadow-md transition-transform hover:scale-105"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDesigns.map((design) => {
                const isStandard = design.card_type === 'standard' || !design.allows_custom_message
                const pagesArr = Array.isArray((design as any).pages) ? (design as any).pages : []
                const frontPage = pagesArr.find((p: any) => p.page_type === 'front')
                const insidePage = pagesArr.find((p: any) => p.page_type === 'inside_right' || p.page_type === 'inside_left')
                const firstImage = Array.isArray(design.images) && design.images.length > 0 ? design.images[0] : null
                const imageUrl = design.thumbnail_url || frontPage?.url || (typeof firstImage === 'string' ? firstImage : firstImage?.url)
                const secondaryImageUrl = insidePage?.url || null

                return (
                  <div
                    key={design.id}
                    onClick={() => handleDirectToCustomizer(design.id)}
                    className="group relative rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-pink-500/50 card-hover-effect p-5 flex flex-col justify-between space-y-4 shadow-sm cursor-pointer"
                  >
                    {/* Visual Cover Thumbnail Viewport */}
                    <div className="relative">
                      <CardThumbnailVisual
                        cardName={design.name}
                        imageUrl={imageUrl}
                        secondaryImageUrl={secondaryImageUrl}
                        allowsCustomPhoto={design.allows_custom_photo}
                        showThumbStrip={false}
                      />

                      {/* Format Badges Overlay */}
                      <div className="absolute top-2 left-2 flex flex-wrap gap-1 z-20">
                        {isStandard ? (
                          <div className="px-2.5 py-0.5 rounded-full bg-amber-600 text-white text-[10px] font-extrabold shadow-sm flex items-center gap-1">
                            <Lock className="w-3 h-3" /> Pre-Printed
                          </div>
                        ) : (
                          <div className="px-2.5 py-0.5 rounded-full bg-pink-600 text-white text-[10px] font-extrabold shadow-sm flex items-center gap-1">
                            <Wand2 className="w-3 h-3" /> Customizable
                          </div>
                        )}
                        {design.allows_custom_photo && (
                          <div className="px-2.5 py-0.5 rounded-full bg-purple-600 text-white text-[10px] font-extrabold shadow-sm">
                            +Photo
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between items-start gap-2">
                        <h3 className="text-base font-extrabold text-slate-900 dark:text-white group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors">
                          {design.name}
                        </h3>
                        <div className="text-right shrink-0">
                          <div className="flex items-baseline gap-1.5 justify-end">
                            <span className="text-xs font-black text-pink-600 dark:text-pink-400 whitespace-nowrap">
                              From KSh {Number(design.price_a5_kes || Math.round(Number(design.price_kes || 850) * 0.65)).toLocaleString()}
                            </span>
                            {design.compare_at_price_kes && Number(design.compare_at_price_kes) > Number(design.price_kes || 850) && (
                              <span className="text-[10px] text-slate-400 line-through">
                                KSh {Number(design.compare_at_price_kes).toLocaleString()}
                              </span>
                            )}
                          </div>
                          {design.discount_percent && Number(design.discount_percent) > 0 ? (
                            <span className="inline-block px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[9px] font-extrabold mt-0.5">
                              {design.discount_percent}% OFF
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-zinc-400 line-clamp-2">
                        {isStandard
                          ? `Fixed greeting: "${design.default_message || 'Wishing you great success...'}"`
                          : (design.description || 'Personalize with your custom blessing and photo insert.')}
                      </p>

                      {design.categories && design.categories.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {design.categories.map((c: any) => (
                            <span
                              key={c.id || c.name}
                              className="px-2 py-0.5 rounded-md text-[9px] font-extrabold bg-pink-500/10 text-pink-700 dark:text-pink-300 border border-pink-500/20"
                            >
                              {c.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Action Bar */}
                    <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
                      {isStandard ? (
                        <Link
                          href={`/design/${design.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="w-full py-3 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all duration-200 active:scale-95 shadow-md text-center"
                        >
                          <Lock className="w-4 h-4" /> Order Standard Card <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      ) : (
                        <Link
                          href={`/design/${design.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="w-full py-3 px-4 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all duration-200 active:scale-95 shadow-md text-center"
                        >
                          <Wand2 className="w-4 h-4" /> Customize & Order <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
