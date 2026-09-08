'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { X, Phone, User, MapPin, Package, CheckCircle2, AlertCircle, ShoppingCart } from 'lucide-react'

interface ManualOrderModalProps {
  isOpen: boolean
  onClose: () => void
  onOrderCreated: () => void
  token: string
}

export default function ManualOrderModal({ isOpen, onClose, onOrderCreated, token }: ManualOrderModalProps) {
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [recipientName, setRecipientName] = useState('')
  const [admissionNumber, setAdmissionNumber] = useState('')
  const [schoolName, setSchoolName] = useState('')
  const [selectedSize, setSelectedSize] = useState<'A5' | 'A4' | 'A3'>('A4')
  const [messageBody, setMessageBody] = useState('Wishing you great success in your KCSE exams!')
  const [selectedDesignId, setSelectedDesignId] = useState('')
  const [selectedCountyId, setSelectedCountyId] = useState('')
  const [selectedSubCountyId, setSelectedSubCountyId] = useState('')
  const [initialStatus, setInitialStatus] = useState<'paid' | 'pending_payment'>('paid')

  const [designs, setDesigns] = useState<any[]>([])
  const [counties, setCounties] = useState<any[]>([])
  const [subCounties, setSubCounties] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (!isOpen) return
    const fetchCatalogData = async () => {
      try {
        const [desRes, ctyRes] = await Promise.all([
          fetch('/api/v1/catalog/designs'),
          fetch('/api/v1/locations/counties')
        ])
        const desData = await desRes.json()
        const ctyData = await ctyRes.json()
        if (desData.data) {
          setDesigns(desData.data)
          if (desData.data[0]) setSelectedDesignId(desData.data[0].id)
        }
        if (ctyData.data) {
          setCounties(ctyData.data)
          if (ctyData.data[0]) {
            setSelectedCountyId(ctyData.data[0].id)
            fetchSubCounties(ctyData.data[0].id)
          }
        }
      } catch (err) {
        console.error('Failed to load modal data', err)
      }
    }
    fetchCatalogData()
  }, [isOpen])

  const fetchSubCounties = async (countyId: string) => {
    try {
      const res = await fetch(`/api/v1/locations/counties/${countyId}/sub-counties`)
      const data = await res.json()
      if (data.data) {
        setSubCounties(data.data)
        if (data.data[0]) setSelectedSubCountyId(data.data[0].id)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleCountyChange = (countyId: string) => {
    setSelectedCountyId(countyId)
    fetchSubCounties(countyId)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const payload = {
        customer: { phone, email: email || undefined },
        channel: 'phone',
        initialStatus,
        items: [
          {
            design_id: selectedDesignId,
            size: selectedSize,
            message_body: messageBody,
            recipient_full_names: recipientName,
            admission_number: admissionNumber,
            school_name: schoolName,
            county_id: selectedCountyId,
            sub_county_id: selectedSubCountyId
          }
        ]
      }

      const res = await fetch('/api/v1/admin/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create order')

      toast.success(`Order #${data.data.order.order_number} captured successfully!`)
      onOrderCreated()
      onClose()
    } catch (err: any) {
      toast.error(err.message || 'Failed to capture manual order')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-2xl rounded-3xl p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-pink-100 dark:bg-pink-950/50 text-pink-600 dark:text-pink-400 flex items-center justify-center font-bold">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">Centralized Phone Order Capture</h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400">Capture manual & phone orders directly into POS</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-600 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Customer Details */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-800/40 space-y-3">
            <h3 className="font-extrabold text-slate-800 dark:text-zinc-200 flex items-center gap-1.5 uppercase text-[10px] tracking-wider">
              <User className="w-3.5 h-3.5" /> Customer Contact Info
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold mb-1 text-slate-600 dark:text-zinc-400">Customer Phone *</label>
                <input
                  type="text" required placeholder="07XXXXXXXX" value={phone} onChange={e => setPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1 text-slate-600 dark:text-zinc-400">Email (Optional)</label>
                <input
                  type="email" placeholder="customer@gmail.com" value={email} onChange={e => setEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Student Recipient & School */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-800/40 space-y-3">
            <h3 className="font-extrabold text-slate-800 dark:text-zinc-200 flex items-center gap-1.5 uppercase text-[10px] tracking-wider">
              <MapPin className="w-3.5 h-3.5" /> Student & Delivery School
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold mb-1 text-slate-600 dark:text-zinc-400">Student Name *</label>
                <input
                  type="text" required placeholder="John Doe" value={recipientName} onChange={e => setRecipientName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1 text-slate-600 dark:text-zinc-400">Adm Number *</label>
                <input
                  type="text" required placeholder="ADM-10293" value={admissionNumber} onChange={e => setAdmissionNumber(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1 text-slate-600 dark:text-zinc-400">School Name *</label>
                <input
                  type="text" required placeholder="Alliance High School" value={schoolName} onChange={e => setSchoolName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-slate-900 dark:text-white"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block font-semibold mb-1 text-slate-600 dark:text-zinc-400">County *</label>
                <select
                  value={selectedCountyId} onChange={e => handleCountyChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-slate-900 dark:text-white"
                >
                  {counties.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block font-semibold mb-1 text-slate-600 dark:text-zinc-400">Sub-County *</label>
                <select
                  value={selectedSubCountyId} onChange={e => setSelectedSubCountyId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-slate-900 dark:text-white"
                >
                  {subCounties.map(s => <option key={s.id} value={s.id}>{s.name} ({s.zone})</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Card Selection */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-800/40 space-y-3">
            <h3 className="font-extrabold text-slate-800 dark:text-zinc-200 flex items-center gap-1.5 uppercase text-[10px] tracking-wider">
              <Package className="w-3.5 h-3.5" /> Card Configuration
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold mb-1 text-slate-600 dark:text-zinc-400">Select Card Design *</label>
                <select
                  value={selectedDesignId} onChange={e => setSelectedDesignId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-slate-900 dark:text-white"
                >
                  {designs.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block font-semibold mb-1 text-slate-600 dark:text-zinc-400">Card Size *</label>
                <div className="flex gap-2">
                  {(['A5', 'A4', 'A3'] as const).map(sz => (
                    <button
                      type="button" key={sz} onClick={() => setSelectedSize(sz)}
                      className={`flex-1 py-2 rounded-xl font-bold transition-all border ${selectedSize === sz ? 'bg-pink-600 text-white border-pink-600' : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300'}`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {/* Faith Theme Selection */}
            <div>
              <label className="block font-semibold mb-1 text-slate-600 dark:text-zinc-400">Faith Orientation / Blessing Theme *</label>
              <div className="grid grid-cols-3 gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => {
                    setMessageBody('Philippians 4:13: I can do all things through Christ who strengthens me. May the Almighty Lord grant you divine wisdom and great triumph in your KCSE exams!')
                  }}
                  className="py-1.5 px-2 rounded-xl text-xs font-bold border bg-pink-50 dark:bg-pink-950/40 border-pink-400 text-pink-700 dark:text-pink-300 text-center"
                >
                  ✝️ Christian
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMessageBody('Wishing you tremendous clarity, sharp focus, and immense success in your examinations. May your hard work yield flying colors!')
                  }}
                  className="py-1.5 px-2 rounded-xl text-xs font-bold border bg-slate-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 text-center"
                >
                  🎓 Secular / General
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMessageBody('May Allah (SWT) ease your examinations, illuminate your intellect, and grant you victory. Rabbi Zidni Ilma!')
                  }}
                  className="py-1.5 px-2 rounded-xl text-xs font-bold border bg-slate-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 text-center"
                >
                  ☪️ Islamic
                </button>
              </div>
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-600 dark:text-zinc-400">Card Message Body *</label>
              <textarea
                rows={2} required value={messageBody} onChange={e => setMessageBody(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-slate-900 dark:text-white text-xs"
              />
            </div>
          </div>

          {/* Payment Status */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-pink-50/50 dark:bg-pink-950/20 border border-pink-200 dark:border-pink-900/40">
            <div>
              <span className="font-extrabold text-slate-900 dark:text-white">Payment Status</span>
              <p className="text-[10px] text-slate-500">Mark if cash/MPesa already received over phone</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button" onClick={() => setInitialStatus('paid')}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs ${initialStatus === 'paid' ? 'bg-emerald-600 text-white' : 'bg-white dark:bg-zinc-800 text-slate-600'}`}
              >
                ✓ Paid
              </button>
              <button
                type="button" onClick={() => setInitialStatus('pending_payment')}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs ${initialStatus === 'pending_payment' ? 'bg-amber-600 text-white' : 'bg-white dark:bg-zinc-800 text-slate-600'}`}
              >
                Pending
              </button>
            </div>
          </div>

          <button
            type="submit" disabled={loading}
            className="w-full py-3 rounded-2xl bg-pink-600 hover:bg-pink-700 text-white font-extrabold text-sm shadow-lg shadow-pink-500/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <ShoppingCart className="w-4 h-4" />
            {loading ? 'Creating Order...' : 'Capture & Submit Phone Order'}
          </button>
        </form>
      </div>
    </div>
  )
}
