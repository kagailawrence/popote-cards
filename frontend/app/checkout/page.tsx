'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useCartStore } from '../../store/useCartStore'
import { ShieldCheck, Phone, Loader2, CheckCircle2, XCircle, ArrowRight, RefreshCw, AlertTriangle, HelpCircle, Star, Sparkles, MessageSquarePlus } from 'lucide-react'
import { toast } from 'sonner'

import { isValidKenyanPhone, normalizePhoneNumber, sanitizePhoneInput } from '../../lib/phoneUtils'

export default function CheckoutPage() {
  const router = useRouter()
  const { items, getTotalAmount, clearCart } = useCartStore()
  const [mounted, setMounted] = useState(false)

  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Payment state management
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null)
  const [createdOrderNumber, setCreatedOrderNumber] = useState<string | null>(null)
  const [checkoutRequestId, setCheckoutRequestId] = useState<string | null>(null)
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'success' | 'failed' | 'timed_out'>('pending')
  const [paymentFailureReason, setPaymentFailureReason] = useState<string | null>(null)
  const [retryingPush, setRetryingPush] = useState(false)
  const [orderedItems, setOrderedItems] = useState<any[]>([])

  // Post-checkout review state
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewHoverRating, setReviewHoverRating] = useState(0)
  const [reviewerName, setReviewerName] = useState('')
  const [reviewerRole, setReviewerRole] = useState('Mother of Candidate')
  const [reviewComment, setReviewComment] = useState('')
  const [reviewSubmitting, setReviewSubmitting] = useState(false)
  const [reviewSubmitted, setReviewSubmitted] = useState(false)
  const [deliveryRates, setDeliveryRates] = useState<{ cbd: number; outskirts: number }>({ cbd: 150, outskirts: 300 })

  const pollCountRef = useRef(0)

  useEffect(() => {
    setMounted(true)
    async function loadDeliveryPricing() {
      try {
        const res = await fetch('/api/v1/pricing/delivery')
        if (res.ok) {
          const data = await res.json()
          if (data.data) {
            setDeliveryRates({
              cbd: Number(data.data.cbd) || 150,
              outskirts: Number(data.data.outskirts) || 300,
            })
          }
        }
      } catch (err) {
        console.warn('Failed to load delivery rates on checkout', err)
      }
    }
    loadDeliveryPricing()
  }, [])

  // Poll payment status every 2 seconds when checkoutRequestId is active (max 120 seconds)
  useEffect(() => {
    if (!checkoutRequestId || paymentStatus !== 'pending') return

    pollCountRef.current = 0
    const maxPolls = 60 // 60 * 2s = 120 seconds

    const interval = setInterval(async () => {
      pollCountRef.current += 1

      if (pollCountRef.current >= maxPolls) {
        setPaymentStatus('timed_out')
        setPaymentFailureReason('M-Pesa STK Push prompt timed out after 2 minutes. Please verify your phone or try again.')
        clearInterval(interval)
        return
      }

      try {
        const res = await fetch(`/api/v1/payments/status/${checkoutRequestId}`)
        if (!res.ok) {
          console.warn('Status poll HTTP status:', res.status)
          return
        }
        const data = await res.json()
        const status = data.data?.status

        if (status === 'success') {
          setPaymentStatus('success')
          clearInterval(interval)
          clearCart()
        } else if (status === 'failed' || status === 'cancelled') {
          setPaymentStatus('failed')
          setPaymentFailureReason(data.data?.failureReason || 'Payment was cancelled or failed on the phone handset.')
          clearInterval(interval)
        } else if (status === 'timed_out') {
          setPaymentStatus('timed_out')
          setPaymentFailureReason(data.data?.failureReason || 'STK push request timed out.')
          clearInterval(interval)
        }
      } catch (err) {
        console.error('Polling network error', err)
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [checkoutRequestId, paymentStatus, clearCart])

  if (!mounted) return <div className="p-12 text-center text-slate-500 dark:text-zinc-500 animate-pulse">Loading Checkout...</div>

  if (items.length === 0 && !isModalOpen) {
    router.push('/catalog')
    return null
  }

  const cardsSubtotal = items.reduce((sum, item) => sum + item.unitPriceKes, 0)
  const deliverySubtotal = items.reduce((sum, item) => {
    const fee = item.zone === 'outskirts' ? deliveryRates.outskirts : deliveryRates.cbd
    return sum + fee
  }, 0)
  const totalAmount = cardsSubtotal + deliverySubtotal

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!phone || !isValidKenyanPhone(phone)) {
      const msg = 'Please enter a valid Safaricom phone number (e.g. 0712345678 or 254712345678).'
      setError(msg)
      toast.error(msg)
      return
    }

    // Verify recipient information completeness for all items in order
    for (const item of items) {
      if (
        !item.recipientFullNames ||
        item.recipientFullNames === 'Student / Candidate' ||
        item.recipientFullNames.trim().length < 2 ||
        !item.admissionNumber ||
        !item.schoolName ||
        !item.countyId ||
        !item.subCountyId
      ) {
        const msg = `Card "${item.designName}" is missing required recipient details (Name, Adm No, School, County, Sub-County). Please update recipient info in your cart before checking out.`
        setError(msg)
        toast.error(msg)
        return
      }
    }

    const normalizedPhone = normalizePhoneNumber(phone)
    setOrderedItems([...items])
    setError(null)
    setLoading(true)

    try {
      // Step 1: Create Order (if not already created for retry)
      let orderId = createdOrderId
      let orderNumber = createdOrderNumber

      if (!orderId) {
        const orderPayload = {
          customer: { phone: normalizedPhone, email: email || undefined },
          items: items.map((i) => ({
            design_id: i.designId,
            size: i.size,
            custom_photo_storage_path: i.customPhotoPath,
            message_body: i.messageBody,
            message_font: i.messageFont,
            message_colour: i.messageColour,
            recipient_full_names: i.recipientFullNames,
            admission_number: i.admissionNumber,
            school_name: i.schoolName,
            county_id: i.countyId,
            sub_county_id: i.subCountyId,
            unit_price_kes: i.unitPriceKes,
          })),
        }

        const orderRes = await fetch('/api/v1/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orderPayload),
        })
        const orderData = await orderRes.json()

        if (!orderRes.ok) {
          throw new Error(orderData.error || 'Failed to create order. Please check item details.')
        }

        orderId = orderData.data.orderId
        orderNumber = orderData.data.orderNumber
        setCreatedOrderId(orderId)
        setCreatedOrderNumber(orderNumber)
      }

      // Step 2: Trigger STK Push
      await initiateStkPush(orderId!, normalizedPhone, totalAmount)
      toast.success('M-Pesa STK push prompt sent to your phone!')
    } catch (err: any) {
      let msg = ''
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        msg = 'Network error: Unable to connect to payment server. Please check your internet connection.'
      } else {
        msg = err.message || 'Checkout request failed. Please try again.'
      }
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  // Submit Post-Checkout Review and navigate to order tracking
  const handleSubmitReviewAndTrack = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!createdOrderNumber) return

    setReviewSubmitting(true)
    try {
      if (reviewerName.trim() && reviewComment.trim()) {
        await fetch('/api/v1/reviews', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customerName: reviewerName.trim(),
            customerPhone: phone.trim() || undefined,
            customerRole: reviewerRole,
            schoolName: orderedItems[0]?.schoolName || undefined,
            location: orderedItems[0]?.countyId ? `${orderedItems[0]?.schoolName || 'Kenya'}` : undefined,
            rating: reviewRating,
            comment: reviewComment.trim(),
            cardType: orderedItems[0]?.designName || 'A4 Deluxe Card',
            category: reviewerRole.includes('Teacher') ? 'teacher' : (reviewerRole.includes('Brother') || reviewerRole.includes('Sister') || reviewerRole.includes('Relative') ? 'relative' : 'parent'),
            orderNumber: createdOrderNumber,
          }),
        })
        toast.success('Thank you for your review!')
      }
    } catch (err) {
      console.warn('Post-checkout review submit warning:', err)
    } finally {
      setReviewSubmitting(false)
      setReviewSubmitted(true)
      router.push(`/order/${createdOrderNumber}?phone=${encodeURIComponent(phone)}`)
    }
  }

  const handleSkipToTrack = () => {
    if (createdOrderNumber) {
      router.push(`/order/${createdOrderNumber}?phone=${encodeURIComponent(phone)}`)
    }
  }

  // Helper function to initiate STK push
  const initiateStkPush = async (orderId: string, normPhone: string, amount: number) => {
    setPaymentStatus('pending')
    setPaymentFailureReason(null)

    const paymentRes = await fetch('/api/v1/payments/stk-push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, phone: normPhone, amountKes: amount }),
    })
    const paymentData = await paymentRes.json()

    if (!paymentRes.ok) {
      throw new Error(paymentData.error || 'Failed to initiate M-Pesa payment prompt.')
    }

    setCheckoutRequestId(paymentData.data.checkoutRequestId)
    setIsModalOpen(true)
  }

  // Retry STK Push trigger directly from modal without recreating order
  const handleRetryStkPush = async () => {
    if (!createdOrderId || !phone) return
    setRetryingPush(true)
    setError(null)
    try {
      const normalizedPhone = normalizePhoneNumber(phone)
      await initiateStkPush(createdOrderId, normalizedPhone, totalAmount)
      toast.success('M-Pesa STK push prompt re-sent!')
    } catch (err: any) {
      const msg = err.message || 'Failed to re-send M-Pesa prompt.'
      setError(msg)
      toast.error(msg)
    } finally {
      setRetryingPush(false)
    }
  }

  // Simulate payment callback for instant local dev testing
  const handleSimulateCallback = async () => {
    if (!checkoutRequestId) return
    try {
      await fetch('/api/v1/payments/mpesa/callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          checkoutRequestId,
          success: true,
        }),
      })
    } catch (err) {
      console.error('Simulate callback failed', err)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">M-Pesa Express Checkout</h1>
        <p className="text-slate-600 dark:text-zinc-400 text-sm mt-1">Enter your phone number to receive the instant M-Pesa STK push prompt.</p>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm flex items-start gap-3 shadow-sm">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold">Checkout Alert</p>
            <p className="text-xs mt-0.5 leading-relaxed">{error}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <form onSubmit={handleCheckoutSubmit} className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-4 shadow-sm">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Phone className="w-4 h-4 text-pink-500" /> Buyer Contact Details
            </h2>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-400 mb-1">M-Pesa Phone Number *</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(sanitizePhoneInput(e.target.value))}
                placeholder="e.g. 0712345678"
                className="w-full rounded-xl bg-slate-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-slate-900 dark:text-white text-sm p-4 focus:border-pink-500 focus:outline-none shadow-sm"
              />
              <p className="text-[10px] text-slate-500 dark:text-zinc-500 mt-1">The M-Pesa PIN prompt will be sent directly to this handset.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-400 mb-1">Email Address (Optional for e-receipt)</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. buyer@gmail.com"
                className="w-full rounded-xl bg-slate-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-slate-900 dark:text-white text-sm p-4 focus:border-pink-500 focus:outline-none shadow-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-extrabold text-base shadow-xl shadow-pink-600/30 flex items-center justify-center gap-2 transition-transform hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
            Pay KSh {totalAmount.toLocaleString()} via M-Pesa
          </button>
        </form>

        {/* Order Summary Sidebar */}
        <div className="lg:col-span-1 p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-4 shadow-sm">
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Items in Order ({items.length})</h3>
          <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
            {items.map((item) => {
              const isOutskirts = item.zone === 'outskirts'
              const fee = isOutskirts ? deliveryRates.outskirts : deliveryRates.cbd
              return (
                <div key={item.id} className="text-xs border-b border-zinc-200 dark:border-zinc-800 pb-2.5 space-y-1">
                  <div className="flex justify-between items-start">
                    <p className="font-bold text-slate-900 dark:text-white">{item.designName} ({item.size})</p>
                    <span className="text-pink-600 dark:text-pink-400 font-extrabold">KSh {item.unitPriceKes.toLocaleString()}</span>
                  </div>
                  <p className="text-slate-600 dark:text-zinc-400">
                    For: <strong>{item.recipientFullNames}</strong> • {item.schoolName}
                  </p>
                  <div className="flex items-center justify-between text-[11px] pt-0.5">
                    <span className={`px-2 py-0.5 rounded-full font-bold uppercase text-[9px] ${
                      isOutskirts 
                        ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300' 
                        : 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300'
                    }`}>
                      {isOutskirts ? 'Outskirts Zone' : 'CBD Zone'}
                    </span>
                    <span className="text-slate-500 dark:text-zinc-400">
                      Delivery: KSh {fee.toLocaleString()}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="space-y-2 pt-2 border-t border-zinc-200 dark:border-zinc-800 text-xs">
            <div className="flex justify-between text-slate-600 dark:text-zinc-400">
              <span>Cards Subtotal:</span>
              <span className="font-bold text-slate-900 dark:text-white">KSh {cardsSubtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-slate-600 dark:text-zinc-400">
              <span>School Delivery:</span>
              <span className="font-bold text-slate-900 dark:text-white">KSh {deliverySubtotal.toLocaleString()}</span>
            </div>
            <div className="pt-2 flex justify-between font-extrabold text-slate-900 dark:text-white text-base border-t border-zinc-200 dark:border-zinc-800">
              <span>Total Payable</span>
              <span className="text-pink-600 dark:text-pink-500">KSh {totalAmount.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* M-Pesa STK Push Realtime Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="max-w-lg w-full rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 sm:p-8 text-center space-y-6 shadow-2xl max-h-[95vh] overflow-y-auto my-auto">
            {paymentStatus === 'pending' && (
              <>
                <div className="w-16 h-16 rounded-full bg-pink-50 dark:bg-pink-950 border border-pink-300 dark:border-pink-500/30 flex items-center justify-center mx-auto text-pink-600 dark:text-pink-500">
                  <Loader2 className="w-8 h-8 animate-spin" />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">Check Your Phone</h3>
                  <p className="text-sm text-slate-600 dark:text-zinc-400 mt-2">
                    Enter your M-Pesa PIN on handset <strong className="text-slate-900 dark:text-white">{phone}</strong> to complete payment of KSh {totalAmount.toLocaleString()}.
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs text-slate-500 dark:text-zinc-500 flex items-center justify-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-pink-500" />
                  Waiting for Safaricom notification response...
                </div>

                {/* Local Dev Simulator Helper */}
                <button
                  type="button"
                  onClick={handleSimulateCallback}
                  className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-pink-600 dark:text-pink-400 text-xs font-semibold shadow-sm transition-colors"
                >
                  [Dev] Click to Simulate Instant Successful Payment
                </button>
              </>
            )}

            {paymentStatus === 'success' && (
              <div className="space-y-5 text-left">
                <div className="text-center space-y-2">
                  <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400 shadow-lg shadow-emerald-500/20">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">Payment Received & Confirmed!</h3>
                  <p className="text-xs text-slate-600 dark:text-zinc-400">
                    Order <strong className="text-pink-600 dark:text-pink-400 font-mono font-bold">#{createdOrderNumber}</strong> is officially released and routed to the regional print hub.
                  </p>
                </div>

                {/* Embedded Post-Checkout Review Card */}
                <form
                  onSubmit={handleSubmitReviewAndTrack}
                  className="p-5 rounded-2xl bg-slate-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-3.5 shadow-sm"
                >
                  <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-pink-500" />
                      <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                        Leave a Quick Verified Review
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-extrabold">
                      Verified Buyer Badge
                    </span>
                  </div>

                  {/* Star Rating Picker */}
                  <div className="text-center space-y-1">
                    <span className="text-[11px] font-bold text-slate-600 dark:text-zinc-400">
                      How was your ordering & customization experience?
                    </span>
                    <div className="flex justify-center items-center gap-1 py-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewRating(star)}
                          onMouseEnter={() => setReviewHoverRating(star)}
                          onMouseLeave={() => setReviewHoverRating(0)}
                          className="p-1 hover:scale-125 transition-transform focus:outline-none"
                        >
                          <Star
                            className={`w-6 h-6 transition-colors ${
                              star <= (reviewHoverRating || reviewRating)
                                ? 'text-amber-400 fill-amber-400 filter drop-shadow-sm'
                                : 'text-slate-300 dark:text-zinc-700'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Name & Relationship */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-zinc-300 mb-1">
                        Your Name
                      </label>
                      <input
                        type="text"
                        value={reviewerName}
                        onChange={(e) => setReviewerName(e.target.value)}
                        placeholder="e.g. Grace Wambui"
                        className="w-full rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-slate-900 dark:text-white text-xs p-2.5 focus:border-pink-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-zinc-300 mb-1">
                        Your Relationship
                      </label>
                      <select
                        value={reviewerRole}
                        onChange={(e) => setReviewerRole(e.target.value)}
                        className="w-full rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-slate-900 dark:text-white text-xs p-2.5 focus:outline-none"
                      >
                        <option value="Mother of Candidate">Mother of Candidate</option>
                        <option value="Father of Student">Father of Student</option>
                        <option value="Older Brother / Alumni">Older Brother / Alumni</option>
                        <option value="Older Sister / Relative">Older Sister / Relative</option>
                        <option value="Aunt / Uncle of Candidate">Aunt / Uncle</option>
                        <option value="Senior Teacher / School Admin">Teacher / School Admin</option>
                        <option value="Guardian / Sponsor">Guardian / Sponsor</option>
                      </select>
                    </div>
                  </div>

                  {/* Comment */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-zinc-300 mb-1">
                      Feedback / Delivery Note (Optional)
                    </label>
                    <textarea
                      rows={2}
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="e.g. The 3D card preview was clear and M-Pesa payment prompt was instant!"
                      className="w-full rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-slate-900 dark:text-white text-xs p-2.5 focus:border-pink-500 focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={reviewSubmitting}
                    className="w-full py-3 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-extrabold text-xs shadow-md shadow-pink-600/30 flex items-center justify-center gap-1.5 transition-transform hover:scale-[1.01] active:scale-98 disabled:opacity-50"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    {reviewSubmitting ? 'Saving Review...' : 'Submit Review & Track Order'}
                  </button>
                </form>

                <button
                  type="button"
                  onClick={handleSkipToTrack}
                  className="w-full py-2 text-xs font-bold text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center gap-1 transition-colors"
                >
                  <span>Skip to Live Order Tracking</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {(paymentStatus === 'failed' || paymentStatus === 'timed_out') && (
              <>
                <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-950 border border-red-300 dark:border-red-500/30 flex items-center justify-center mx-auto text-red-600 dark:text-red-400">
                  <XCircle className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                    {paymentStatus === 'timed_out' ? 'STK Prompt Timed Out' : 'Payment Not Completed'}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-zinc-400 mt-2 leading-relaxed">
                    {paymentFailureReason || 'The transaction was cancelled or no response was received.'}
                  </p>
                </div>

                <div className="space-y-2 pt-2">
                  <button
                    onClick={handleRetryStkPush}
                    disabled={retryingPush}
                    className="w-full py-3 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {retryingPush ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                    Re-send M-Pesa Prompt
                  </button>

                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="w-full py-3 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 font-bold text-sm transition-colors"
                  >
                    Edit Phone / Change Details
                  </button>

                  {createdOrderNumber && (
                    <a
                      href={`/dispute`}
                      className="inline-flex items-center gap-1 text-[11px] text-pink-600 dark:text-pink-400 hover:underline pt-1"
                    >
                      <HelpCircle className="w-3 h-3" /> Money deducted? Submit a payment dispute
                    </a>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
