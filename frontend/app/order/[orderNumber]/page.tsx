'use client'

import { use, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { CheckCircle2, Clock, Truck, Printer, MapPin, FileCheck, Search, AlertCircle, Star } from 'lucide-react'
import { isValidKenyanPhone, normalizePhoneNumber, sanitizePhoneInput } from '../../../lib/phoneUtils'
import { ReviewModal } from '../../../components/ReviewModal'

export default function OrderTrackingPage({ params }: { params: Promise<{ orderNumber: string }> }) {
  const resolvedParams = use(params)
  const phoneParam = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('phone') || '' : ''

  const [phoneInput, setPhoneInput] = useState(phoneParam)
  const [orderData, setOrderData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isReviewOpen, setIsReviewOpen] = useState(false)

  const fetchTracking = async (orderNum: string, phone: string) => {
    if (!phone) return
    if (!isValidKenyanPhone(phone)) {
      setError('Please enter a valid Safaricom phone number (e.g. 07XXXXXXXX or 2547XXXXXXXX).')
      setOrderData(null)
      return
    }
    const normalizedPhone = normalizePhoneNumber(phone)
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/v1/orders/timeline/${encodeURIComponent(orderNum)}?phone=${encodeURIComponent(normalizedPhone)}`)
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Order not found. Please verify the order number and phone number.')
      }
      setOrderData(data.data)
    } catch (err: any) {
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        setError('Network connection error. Unable to reach order tracking server.')
      } else {
        setError(err.message || 'Lookup failed')
      }
      setOrderData(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (phoneParam) {
      fetchTracking(resolvedParams.orderNumber, phoneParam)
    }
  }, [resolvedParams.orderNumber, phoneParam])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    fetchTracking(resolvedParams.orderNumber, phoneInput)
  }

  const stages = [
    { key: 'pending_payment', label: 'Order Placed', icon: Clock },
    { key: 'paid', label: 'Payment Confirmed', icon: CheckCircle2 },
    { key: 'routed_to_print', label: 'Routed to Print Hub', icon: Printer },
    { key: 'printing', label: 'Printing Card', icon: Printer },
    { key: 'dispatched', label: 'Out for Delivery', icon: Truck },
    { key: 'delivered', label: 'Delivered', icon: FileCheck },
  ]

  const getStageIndex = (status: string) => {
    const map: Record<string, number> = {
      pending_payment: 0,
      paid: 1,
      routed_to_print: 2,
      printing: 3,
      dispatched: 4,
      delivered: 5,
    }
    return map[status] ?? 0
  }

  const currentStageIdx = orderData ? getStageIndex(orderData.order.status) : 0

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Order Tracking</h1>
          <p className="text-slate-600 dark:text-zinc-400 text-sm mt-1">
            Tracking Order <strong className="text-pink-600 dark:text-pink-400">{resolvedParams.orderNumber}</strong>
          </p>
        </div>
      </div>

      {!orderData && (
        <form onSubmit={handleSearchSubmit} className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-4 shadow-sm">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-zinc-400">
            Verify Phone Number to View Order Timeline
          </label>
          <div className="flex gap-3">
            <input
              type="tel"
              required
              value={phoneInput}
              onChange={(e) => setPhoneInput(sanitizePhoneInput(e.target.value))}
              placeholder="Enter Phone Number used at checkout (e.g. 0712345678)"
              className="flex-1 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-slate-900 dark:text-white text-sm p-3.5 focus:border-pink-500 focus:outline-none shadow-sm"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-bold text-sm shadow-md flex items-center gap-1.5 disabled:opacity-50"
            >
              <Search className="w-4 h-4" /> Track Order
            </button>
          </div>
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800/80 text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </form>
      )}

      {orderData && (
        <div className="space-y-8">
          {/* Status Progression Timeline Bar */}
          <div className="p-8 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-8 shadow-sm dark:shadow-xl">
            <div className="flex justify-between items-center border-b border-zinc-200 dark:border-zinc-800 pb-4">
              <div>
                <span className="text-xs uppercase text-slate-500 dark:text-zinc-500 font-bold">Current Order Status</span>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white uppercase tracking-wider">{orderData.order.status.replace(/_/g, ' ')}</h2>
              </div>
              <span className="px-3 py-1.5 rounded-full bg-pink-50 dark:bg-pink-950 border border-pink-300 dark:border-pink-500/30 text-pink-700 dark:text-pink-400 text-xs font-bold">
                KSh {Number(orderData.order.total_amount_kes).toLocaleString()}
              </span>
            </div>

            {/* Stepper */}
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-4">
              {stages.map((stage, idx) => {
                const Icon = stage.icon
                const isCompleted = idx <= currentStageIdx
                return (
                  <div key={stage.key} className="flex flex-col items-center text-center space-y-2">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all ${
                        isCompleted
                          ? 'bg-pink-600 border-pink-500 text-white shadow-lg shadow-pink-500/20'
                          : 'bg-slate-100 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-slate-400 dark:text-zinc-600'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className={`text-[11px] font-semibold ${isCompleted ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-zinc-500'}`}>
                      {stage.label}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Order Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-3 shadow-sm">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <MapPin className="w-4 h-4 text-pink-500" /> Delivery Destinations
              </h3>
              {orderData.items?.map((item: any) => (
                <div key={item.id} className="text-xs border-t border-zinc-200 dark:border-zinc-800/80 pt-3 space-y-1">
                  <p className="font-semibold text-slate-900 dark:text-white">{item.recipient_full_names} ({item.admission_number})</p>
                  <p className="text-slate-600 dark:text-zinc-400">{item.school_name}</p>
                  <p className="text-pink-600 dark:text-pink-400 font-medium">Print Status: {item.print_status}</p>
                </div>
              ))}
            </div>

            {/* Leave Review Card */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-950/40 dark:to-purple-950/40 border border-pink-200 dark:border-pink-800/60 space-y-3 shadow-sm">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" /> Rate Experience
              </h3>
              <p className="text-xs text-slate-600 dark:text-zinc-400">
                Share your feedback on card printing & school gate delivery. Your review gets an instant Verified Delivery badge!
              </p>
              <button
                onClick={() => setIsReviewOpen(true)}
                className="w-full mt-2 px-4 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs shadow-md shadow-pink-600/30 flex items-center justify-center gap-1.5 transition-transform hover:scale-105"
              >
                <Star className="w-3.5 h-3.5 fill-white" /> Leave Verified Review
              </button>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-3 shadow-sm">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Customer Support</h3>
              <p className="text-xs text-slate-600 dark:text-zinc-400">
                If you have questions regarding this order or require correction, you can raise an instant dispute.
              </p>
              <a
                href="/dispute"
                className="inline-block mt-2 px-4 py-2 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-pink-600 dark:text-pink-400 hover:border-pink-500 text-xs font-bold shadow-sm"
              >
                Submit Support Request
              </a>
            </div>
          </div>

          <ReviewModal
            isOpen={isReviewOpen}
            onClose={() => setIsReviewOpen(false)}
            initialOrderNumber={resolvedParams.orderNumber}
            initialSchoolName={orderData.items?.[0]?.school_name || ''}
            initialPhone={phoneInput}
            initialCardType={orderData.items?.[0]?.size ? `${orderData.items[0].size} Deluxe Success Card` : ''}
          />
        </div>
      )}
    </div>
  )
}
