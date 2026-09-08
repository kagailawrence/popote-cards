'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useCartStore, CartItem } from '../../store/useCartStore'
import { ShoppingBag, Trash2, ArrowRight, ShieldCheck, AlertTriangle, Edit3, UserCheck, Check, X } from 'lucide-react'
import { toast } from 'sonner'

interface County {
  id: string
  name: string
}

interface SubCounty {
  id: string
  county_id: string
  name: string
  zone: 'cbd' | 'outskirts'
}

export default function CartPage() {
  const router = useRouter()
  const { items, removeItem, updateItem, clearCart, getTotalAmount } = useCartStore()
  const [mounted, setMounted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Edit Recipient Modal State
  const [editingItem, setEditingItem] = useState<CartItem | null>(null)
  const [editRecipientName, setEditRecipientName] = useState('')
  const [editAdmNo, setEditAdmNo] = useState('')
  const [editSchool, setEditSchool] = useState('')
  const [editClass, setEditClass] = useState('')
  const [editCountyId, setEditCountyId] = useState('')
  const [editSubCountyId, setEditSubCountyId] = useState('')

  const [counties, setCounties] = useState<County[]>([])
  const [subCounties, setSubCounties] = useState<SubCounty[]>([])
  const [deliveryRates, setDeliveryRates] = useState<{ cbd: number; outskirts: number }>({ cbd: 150, outskirts: 300 })

  useEffect(() => {
    setMounted(true)
    async function loadLocationsAndPricing() {
      try {
        const [countiesRes, delRes] = await Promise.all([
          fetch('/api/v1/locations/counties'),
          fetch('/api/v1/pricing/delivery'),
        ])
        const cData = await countiesRes.json()
        if (cData.data) setCounties(cData.data)

        if (delRes.ok) {
          const dData = await delRes.json()
          if (dData.data) {
            setDeliveryRates({
              cbd: Number(dData.data.cbd) || 150,
              outskirts: Number(dData.data.outskirts) || 300,
            })
          }
        }
      } catch (err) {
        console.error('Failed to load counties or delivery rates', err)
      }
    }
    loadLocationsAndPricing()
  }, [])

  useEffect(() => {
    if (!editCountyId) {
      setSubCounties([])
      return
    }
    async function loadSubCounties() {
      try {
        const res = await fetch(`/api/v1/locations/counties/${editCountyId}/sub-counties`)
        const data = await res.json()
        if (data.data) setSubCounties(data.data)
      } catch (err) {
        console.error('Failed to load subcounties', err)
      }
    }
    loadSubCounties()
  }, [editCountyId])

  if (!mounted) return <div className="p-12 text-center text-slate-500 dark:text-zinc-500 animate-pulse">Loading Cart...</div>

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center mx-auto text-slate-500 dark:text-zinc-500 shadow-sm">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Your Cart is Empty</h1>
        <p className="text-slate-600 dark:text-zinc-400 text-sm max-w-md mx-auto">
          Explore our card collection and customize a beautiful success card for a student or loved one.
        </p>
        <Link
          href="/catalog"
          className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-bold text-sm shadow-lg shadow-pink-600/30 transition-transform hover:scale-[1.02]"
        >
          Browse Cards <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    )
  }

  // Validate that recipient information is complete for all items
  const isItemValid = (item: CartItem) => {
    const isPlaceholder = item.recipientFullNames === 'Student / Candidate'
    return (
      Boolean(item.recipientFullNames && item.recipientFullNames.trim().length >= 2 && !isPlaceholder) &&
      Boolean(item.admissionNumber && item.admissionNumber.trim().length >= 1) &&
      Boolean(item.schoolName && item.schoolName.trim().length >= 2) &&
      Boolean(item.countyId) &&
      Boolean(item.subCountyId)
    )
  }

  const invalidItems = items.filter((item) => !isItemValid(item))
  const allItemsValid = invalidItems.length === 0
  const totalAmount = getTotalAmount()

  const handleOpenEditModal = (item: CartItem) => {
    setEditingItem(item)
    setEditRecipientName(item.recipientFullNames === 'Student / Candidate' ? '' : item.recipientFullNames)
    setEditAdmNo(item.admissionNumber === 'ADM-001' ? '' : item.admissionNumber)
    setEditSchool(item.schoolName === 'Kenyan Secondary School' ? '' : item.schoolName)
    setEditClass(item.studentClass || '')
    setEditCountyId(item.countyId || '')
    setEditSubCountyId(item.subCountyId || '')
    setError(null)
  }

  const handleSaveEditRecipient = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingItem) return

    if (!editRecipientName.trim() || editRecipientName.trim().length < 2) {
      const msg = 'Recipient full name must be at least 2 characters.'
      setError(msg)
      toast.error(msg)
      return
    }
    if (!editAdmNo.trim()) {
      const msg = 'Admission or Index Number is required.'
      setError(msg)
      toast.error(msg)
      return
    }
    if (!editSchool.trim() || editSchool.trim().length < 2) {
      const msg = 'School name is required.'
      setError(msg)
      toast.error(msg)
      return
    }
    if (!editCountyId || !editSubCountyId) {
      const msg = 'County and Sub-County selection is required.'
      setError(msg)
      toast.error(msg)
      return
    }

    const countyObj = counties.find((c) => c.id === editCountyId)
    const subCountyObj = subCounties.find((s) => s.id === editSubCountyId)

    updateItem(editingItem.id, {
      recipientFullNames: editRecipientName.trim(),
      admissionNumber: editAdmNo.trim(),
      schoolName: editSchool.trim(),
      studentClass: editClass.trim() || undefined,
      countyId: editCountyId,
      countyName: countyObj?.name || editingItem.countyName,
      subCountyId: editSubCountyId,
      subCountyName: subCountyObj?.name || editingItem.subCountyName,
      zone: subCountyObj?.zone || editingItem.zone || 'cbd',
    })

    setEditingItem(null)
    setError(null)
    toast.success('Recipient details updated successfully!')
  }

  const handleProceedToCheckout = () => {
    if (!allItemsValid) {
      const msg = 'Recipient student and school delivery details are required for every card before checkout.'
      setError(msg)
      toast.error(msg)
      return
    }
    router.push('/checkout')
  }

  const handleRemoveItem = (id: string, name: string) => {
    removeItem(id)
    toast.info(`Removed "${name}" from cart`)
  }

  const handleClearCart = () => {
    clearCart()
    toast.info('Cart cleared')
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div className="flex justify-between items-center border-b border-zinc-200 dark:border-zinc-800 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Your Shopping Cart</h1>
          <p className="text-slate-600 dark:text-zinc-400 text-sm mt-1">{items.length} card(s) ready for print & delivery</p>
        </div>
        <button
          onClick={handleClearCart}
          className="text-xs font-semibold text-slate-500 dark:text-zinc-500 hover:text-red-500 transition-colors"
        >
          Clear Cart
        </button>
      </div>

      {!allItemsValid && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700/80 text-amber-800 dark:text-amber-200 text-xs flex items-start gap-3 shadow-sm">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-extrabold text-sm">Recipient Information Required</p>
            <p className="mt-0.5 leading-relaxed">
              Every success card must have complete candidate details (Recipient Name, Admission No, School, County, Sub-County) before checkout.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Cart Items List */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => {
            const valid = isItemValid(item)
            return (
              <div
                key={item.id}
                className={`rounded-2xl bg-white dark:bg-zinc-900 border p-6 flex flex-col sm:flex-row justify-between gap-6 relative shadow-sm transition-colors ${
                  valid
                    ? 'border-zinc-200 dark:border-zinc-800'
                    : 'border-amber-400 dark:border-amber-600 bg-amber-50/20 dark:bg-amber-950/10'
                }`}
              >
                <div className="space-y-3 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-pink-100 dark:bg-pink-950 border border-pink-300 dark:border-pink-500/30 text-pink-700 dark:text-pink-400 text-[10px] font-bold">
                      {item.size} Card
                    </span>
                    <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">{item.designName}</h3>

                    {!valid && (
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 text-[10px] font-bold flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Incomplete Details
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-slate-600 dark:text-zinc-400 space-y-1">
                    <p>
                      <span className="text-slate-500 dark:text-zinc-500 font-medium">Recipient:</span>{' '}
                      <strong className={valid ? 'text-slate-900 dark:text-white' : 'text-amber-600 dark:text-amber-400'}>
                        {item.recipientFullNames}
                      </strong>{' '}
                      ({item.admissionNumber})
                    </p>
                    <p>
                      <span className="text-slate-500 dark:text-zinc-500 font-medium">Destination:</span>{' '}
                      {item.schoolName} {item.studentClass ? `(${item.studentClass})` : ''}, {item.subCountyName}, {item.countyName}
                    </p>
                    <p className="italic text-slate-700 dark:text-zinc-300 font-serif line-clamp-2 pt-1 border-t border-zinc-200 dark:border-zinc-800/80 mt-2">
                      "{item.messageBody}"
                    </p>
                  </div>

                  <button
                    onClick={() => handleOpenEditModal(item)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-pink-50 dark:hover:bg-pink-950/40 text-pink-600 dark:text-pink-400 text-xs font-bold transition-colors border border-zinc-200 dark:border-zinc-700"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> {valid ? 'Edit Recipient Details' : 'Fill Recipient Details'}
                  </button>
                </div>

                <div className="flex sm:flex-col justify-between items-end gap-4 border-t sm:border-t-0 border-zinc-200 dark:border-zinc-800 pt-4 sm:pt-0">
                  <span className="text-lg font-extrabold text-pink-600 dark:text-pink-500">
                    KSh {item.unitPriceKes.toLocaleString()}
                  </span>
                  <button
                    onClick={() => handleRemoveItem(item.id, item.designName)}
                    className="p-2 rounded-lg bg-slate-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-slate-500 dark:text-zinc-400 hover:text-red-500 hover:border-red-500/50 transition-colors shadow-sm"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Order Summary Box */}
        <div className="lg:col-span-1 p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-6 shadow-sm dark:shadow-xl">
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">Order Summary</h2>

          {(() => {
            const cardsSubtotal = items.reduce((sum, i) => sum + i.unitPriceKes, 0)
            const deliverySubtotal = items.reduce((sum, i) => {
              const fee = i.zone === 'outskirts' ? deliveryRates.outskirts : deliveryRates.cbd
              return sum + fee
            }, 0)
            const grandTotal = cardsSubtotal + deliverySubtotal

            return (
              <>
                <div className="space-y-3 text-sm border-b border-zinc-200 dark:border-zinc-800 pb-4">
                  <div className="flex justify-between text-slate-600 dark:text-zinc-400">
                    <span>Cards Subtotal ({items.length} item{items.length > 1 ? 's' : ''})</span>
                    <span className="font-bold text-slate-900 dark:text-white">KSh {cardsSubtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-zinc-400">
                    <div>
                      <span className="block">School Delivery Fee</span>
                      <span className="text-[11px] text-slate-400 dark:text-zinc-500">
                        ({items.filter((i) => i.zone === 'outskirts').length} Outskirts, {items.filter((i) => i.zone !== 'outskirts').length} CBD)
                      </span>
                    </div>
                    <span className="font-bold text-slate-900 dark:text-white">KSh {deliverySubtotal.toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center text-lg font-extrabold text-slate-900 dark:text-white">
                  <span>Total Payable</span>
                  <span className="text-pink-600 dark:text-pink-500">KSh {grandTotal.toLocaleString()}</span>
                </div>
              </>
            )
          })()}

          <button
            onClick={handleProceedToCheckout}
            disabled={!allItemsValid}
            className="w-full py-4 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-extrabold text-sm shadow-lg shadow-pink-600/30 flex items-center justify-center gap-2 transition-transform hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            Proceed to Checkout <ArrowRight className="w-4 h-4" />
          </button>

          <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500 dark:text-zinc-500 pt-2">
            <ShieldCheck className="w-4 h-4 text-pink-500" /> Direct Delivery to Recipient School
          </div>
        </div>
      </div>

      {/* Edit Recipient Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <form onSubmit={handleSaveEditRecipient} className="max-w-lg w-full rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-pink-500" /> Recipient Details: {editingItem.designName}
              </h3>
              <button type="button" onClick={() => setEditingItem(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">Candidate Full Names *</label>
                <input
                  type="text"
                  required
                  value={editRecipientName}
                  onChange={(e) => setEditRecipientName(e.target.value)}
                  placeholder="e.g. Mary Wanjiku Kinuthia"
                  className="w-full rounded-xl bg-slate-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-slate-900 dark:text-white text-xs p-3 focus:border-pink-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">Admission / Index No *</label>
                  <input
                    type="text"
                    required
                    value={editAdmNo}
                    onChange={(e) => setEditAdmNo(e.target.value)}
                    placeholder="e.g. ADM-8492"
                    className="w-full rounded-xl bg-slate-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-slate-900 dark:text-white text-xs p-3 focus:border-pink-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">Class / Stream</label>
                  <input
                    type="text"
                    value={editClass}
                    onChange={(e) => setEditClass(e.target.value)}
                    placeholder="e.g. Form 4 West"
                    className="w-full rounded-xl bg-slate-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-slate-900 dark:text-white text-xs p-3 focus:border-pink-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">School / Institution Name *</label>
                <input
                  type="text"
                  required
                  value={editSchool}
                  onChange={(e) => setEditSchool(e.target.value)}
                  placeholder="e.g. Alliance High School"
                  className="w-full rounded-xl bg-slate-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-slate-900 dark:text-white text-xs p-3 focus:border-pink-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">County *</label>
                  <select
                    required
                    value={editCountyId}
                    onChange={(e) => setEditCountyId(e.target.value)}
                    className="w-full rounded-xl bg-slate-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-slate-900 dark:text-white text-xs p-3 focus:border-pink-500 focus:outline-none"
                  >
                    <option value="">Select County</option>
                    {counties.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">Sub-County *</label>
                  <select
                    required
                    value={editSubCountyId}
                    onChange={(e) => setEditSubCountyId(e.target.value)}
                    disabled={!editCountyId}
                    className="w-full rounded-xl bg-slate-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-slate-900 dark:text-white text-xs p-3 focus:border-pink-500 focus:outline-none disabled:opacity-50"
                  >
                    <option value="">Select Sub-County</option>
                    {subCounties.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="pt-2 flex gap-3">
              <button
                type="submit"
                className="flex-1 py-3 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs shadow-md flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" /> Save Recipient Information
              </button>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="px-4 py-3 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-xs font-semibold"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
