'use client'

import { useState } from 'react'
import { Search, Package, MapPin, Truck, CheckCircle2, Clock, ShieldCheck, User, School, Phone, Calendar, ArrowRight, Star } from 'lucide-react'
import { ReviewModal } from '../../../components/ReviewModal'

export default function OrderTrackPage() {
  const [orderNumber, setOrderNumber] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [data, setData] = useState<any>(null)
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!orderNumber.trim()) return
    setError('')
    setLoading(true)
    setData(null)

    try {
      let url = `/api/v1/orders/timeline/${orderNumber.trim()}`
      if (phone.trim()) {
        url += `?phone=${encodeURIComponent(phone.trim())}`
      }

      const res = await fetch(url)
      const json = await res.json()

      if (!res.ok) throw new Error(json.error || 'Order not found')
      setData(json.data)
    } catch (err: any) {
      setError(err.message || 'Failed to locate order details')
    } finally {
      setLoading(false)
    }
  }

  const steps = [
    { key: 'pending_payment', label: 'Order Placed', desc: 'Order details captured in central platform' },
    { key: 'paid', label: 'Payment Confirmed', desc: 'Payment verified & order released for processing' },
    { key: 'routed_to_print', label: 'Regional Hub Routed', desc: 'Assigned to nearest regional print center' },
    { key: 'printing', label: 'Heavy Board Printing', desc: '350 GSM paper board printing & custom layout' },
    { key: 'dispatched', label: 'Dispatched with Courier/Rider', desc: 'Out for final delivery to recipient school' },
    { key: 'delivered', label: 'Delivered', desc: 'Successfully handed over to school reception' }
  ]

  const getStepStatus = (stepKey: string, currentStatus: string) => {
    const orderIndex = steps.findIndex(s => s.key === currentStatus)
    const stepIndex = steps.findIndex(s => s.key === stepKey)

    if (currentStatus === 'delivered') return 'completed'
    if (stepIndex < orderIndex) return 'completed'
    if (stepIndex === orderIndex) return 'current'
    return 'upcoming'
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-pink-500 selection:text-white font-sans antialiased pb-20">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-pink-600/10 via-purple-600/5 to-transparent blur-3xl opacity-50"></div>
      </div>

      <div className="relative max-w-4xl mx-auto px-4 pt-12 space-y-10">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-400 font-bold text-xs">
            <ShieldCheck className="w-4 h-4" /> Live Success Card Tracker
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-pink-200 bg-clip-text text-transparent">
            Track Your Success Card Delivery
          </h1>
          <p className="text-sm text-slate-400 max-w-lg mx-auto">
            Real-time status updates from our regional print hubs directly to school gates across Kenya.
          </p>
        </div>

        {/* Lookup Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-zinc-900/90 border border-zinc-800 shadow-2xl backdrop-blur-xl space-y-6">
          <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Order Number *</label>
              <input
                type="text" required placeholder="SC-849201" value={orderNumber} onChange={e => setOrderNumber(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-zinc-950 border border-zinc-800 text-white font-mono font-bold text-sm focus:border-pink-500 focus:outline-none transition-all placeholder:text-zinc-600"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Customer Phone (Optional)</label>
              <input
                type="text" placeholder="07XXXXXXXX" value={phone} onChange={e => setPhone(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-zinc-950 border border-zinc-800 text-white text-sm focus:border-pink-500 focus:outline-none transition-all placeholder:text-zinc-600"
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit" disabled={loading}
                className="w-full py-3 px-6 rounded-2xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-extrabold text-sm shadow-lg shadow-pink-600/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Search className="w-4 h-4" />
                {loading ? 'Locating...' : 'Track Order'}
              </button>
            </div>
          </form>

          {error && (
            <div className="p-4 rounded-2xl bg-red-950/50 border border-red-800 text-red-300 text-xs flex items-center gap-2">
              <Search className="w-4 h-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Tracking Details & Stepper */}
        {data && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Summary Bar */}
            <div className="p-6 rounded-3xl bg-zinc-900/90 border border-zinc-800 shadow-xl flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-xs text-pink-400 font-bold uppercase tracking-wider">Order #{data.order.order_number}</span>
                <h3 className="text-xl font-extrabold text-white">
                  Status: <span className="capitalize text-pink-400">{data.order.status.replace(/_/g, ' ')}</span>
                </h3>
              </div>
              <div className="flex items-center gap-6 text-xs text-slate-400">
                <div>
                  <p className="font-semibold text-slate-500">Placed On</p>
                  <p className="font-bold text-white">{new Date(data.order.created_at).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-500">Total Amount</p>
                  <p className="font-bold text-white">KES {data.order.total_amount_kes.toLocaleString()}</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-500">Channel</p>
                  <p className="font-bold text-pink-400 uppercase">{data.order.channel}</p>
                </div>
              </div>
            </div>

            {/* Visual Stepper */}
            <div className="p-6 sm:p-8 rounded-3xl bg-zinc-900/90 border border-zinc-800 shadow-xl space-y-6">
              <h3 className="font-extrabold text-white text-base flex items-center gap-2">
                <Truck className="w-5 h-5 text-pink-500" /> Fulfillment Timeline
              </h3>

              <div className="space-y-6 relative before:absolute before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-zinc-800">
                {steps.map((step, idx) => {
                  const status = getStepStatus(step.key, data.order.status)
                  return (
                    <div key={step.key} className="relative flex items-start gap-4 pl-10">
                      <div className={`absolute left-0 top-0.5 w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${status === 'completed' ? 'bg-pink-600 text-white shadow-lg shadow-pink-600/30' : (status === 'current' ? 'bg-amber-500 text-white ring-4 ring-amber-500/20' : 'bg-zinc-800 text-zinc-500')}`}>
                        {status === 'completed' ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                      </div>
                      <div>
                        <h4 className={`font-bold text-sm ${status === 'upcoming' ? 'text-zinc-500' : 'text-white'}`}>
                          {step.label}
                        </h4>
                        <p className="text-xs text-zinc-400">{step.desc}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Recipient & School Card */}
            {data.items && data.items.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-6 rounded-3xl bg-zinc-900/90 border border-zinc-800 space-y-3">
                  <h4 className="text-xs font-bold text-pink-400 uppercase tracking-wider flex items-center gap-1.5">
                    <User className="w-4 h-4" /> Student Recipient
                  </h4>
                  <div className="space-y-1 text-xs">
                    <p className="font-extrabold text-white text-sm">{data.items[0].recipient_full_names}</p>
                    <p className="text-slate-400">Admission No: <span className="font-bold text-slate-200">{data.items[0].admission_number}</span></p>
                    <p className="text-slate-400">Class/Form: <span className="font-bold text-slate-200">{data.items[0].class_form || 'Candidate'}</span></p>
                  </div>
                </div>

                <div className="p-6 rounded-3xl bg-zinc-900/90 border border-zinc-800 space-y-3">
                  <h4 className="text-xs font-bold text-pink-400 uppercase tracking-wider flex items-center gap-1.5">
                    <School className="w-4 h-4" /> Delivery Destination
                  </h4>
                  <div className="space-y-1 text-xs">
                    <p className="font-extrabold text-white text-sm">{data.items[0].school_name}</p>
                    <p className="text-slate-400">Location: <span className="font-bold text-slate-200">{data.items[0].sub_county_name}, {data.items[0].county_name} County</span></p>
                    <p className="text-slate-400">Regional Hub: <span className="font-bold text-pink-300">{data.items[0].print_region_name || 'Nairobi Central Hub'}</span></p>
                  </div>
                </div>
              </div>
            )}

            {/* Delivery Rider Details (If assigned) */}
            {data.delivery && (
              <div className="p-6 rounded-3xl bg-blue-950/30 border border-blue-900/50 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-white">Assigned Courier Rider</h4>
                    <p className="text-slate-400">{data.delivery.rider_name || 'Dispatch Courier Agent'}</p>
                  </div>
                </div>
                {data.delivery.rider_phone && (
                  <a
                    href={`tel:${data.delivery.rider_phone}`}
                    className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold inline-flex items-center gap-1.5"
                  >
                    <Phone className="w-3.5 h-3.5" /> Call Rider
                  </a>
                )}
              </div>
            )}

            {/* Rate & Review Card */}
            <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-pink-900/40 via-purple-900/30 to-zinc-900 border border-pink-500/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-xl">
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400" />
                  ))}
                </div>
                <h4 className="text-base font-extrabold text-white">
                  Rate Your Popote Experience for #{data.order.order_number}
                </h4>
                <p className="text-xs text-slate-300 max-w-md">
                  Help other parents and students by sharing your feedback. Verified delivery badge automatically applied.
                </p>
              </div>

              <button
                onClick={() => setIsReviewModalOpen(true)}
                className="px-6 py-3 rounded-2xl bg-pink-600 hover:bg-pink-500 text-white font-extrabold text-xs shadow-lg shadow-pink-600/30 transition-transform hover:scale-105 active:scale-95 shrink-0 flex items-center gap-2"
              >
                <Star className="w-3.5 h-3.5 fill-white" />
                <span>Leave Verified Review</span>
              </button>
            </div>

            {/* Review Modal */}
            <ReviewModal
              isOpen={isReviewModalOpen}
              onClose={() => setIsReviewModalOpen(false)}
              initialOrderNumber={data.order.order_number}
              initialSchoolName={data.items?.[0]?.school_name || ''}
              initialPhone={phone}
              initialCardType={data.items?.[0]?.size ? `${data.items[0].size} Deluxe Success Card` : ''}
            />
          </div>
        )}
      </div>
    </div>
  )
}
