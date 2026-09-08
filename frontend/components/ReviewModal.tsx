'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import {
  Star, X, CheckCircle2, Sparkles, Heart,
  Building2, MapPin, User, ShieldCheck, Tag, FileCheck
} from 'lucide-react'

interface ReviewModalProps {
  isOpen: boolean
  onClose: () => void
  onReviewSubmitted?: (review: any) => void
  initialOrderNumber?: string
  initialSchoolName?: string
  initialCardType?: string
  initialCustomerName?: string
  initialPhone?: string
}

const RATING_LABELS: Record<number, { label: string; desc: string; color: string }> = {
  5: { label: 'Outstanding (5/5)', desc: 'Flawless card print, timely delivery & great experience!', color: 'text-amber-500' },
  4: { label: 'Very Good (4/5)', desc: 'High quality card and smooth delivery to school.', color: 'text-emerald-500' },
  3: { label: 'Average (3/5)', desc: 'Decent experience with room for small improvements.', color: 'text-blue-500' },
  2: { label: 'Fair (2/5)', desc: 'Encountered some delays or minor print issues.', color: 'text-orange-500' },
  1: { label: 'Poor (1/5)', desc: 'Did not meet expectations.', color: 'text-red-500' },
}

const POPULAR_ROLES = [
  'Mother of Candidate',
  'Father of Student',
  'Older Brother / Alumni',
  'Older Sister / Relative',
  'Aunt / Uncle of Candidate',
  'Senior Teacher / Class Master',
  'School Principal / Admin',
  'Guardian / Sponsor',
]

const POPULAR_CARDS = [
  'A4 KCSE Deluxe Gold Foil',
  'A3 Jumbo Deluxe Edition',
  'A5 Compact Gold Laurel',
  'A4 KPSEA Wings of Victory',
  'A4 Floral Grace Edition',
  'Bulk School Candidate Order',
]

export function ReviewModal({
  isOpen,
  onClose,
  onReviewSubmitted,
  initialOrderNumber = '',
  initialSchoolName = '',
  initialCardType = '',
  initialCustomerName = '',
  initialPhone = '',
}: ReviewModalProps) {
  const [rating, setRating] = useState<number>(5)
  const [hoverRating, setHoverRating] = useState<number>(0)
  const [customerName, setCustomerName] = useState(initialCustomerName)
  const [customerPhone, setCustomerPhone] = useState(initialPhone)
  const [customerRole, setCustomerRole] = useState(POPULAR_ROLES[0])
  const [schoolName, setSchoolName] = useState(initialSchoolName)
  const [location, setLocation] = useState('')
  const [cardType, setCardType] = useState(initialCardType || POPULAR_CARDS[0])
  const [category, setCategory] = useState<'parent' | 'teacher' | 'relative' | 'other'>('parent')
  const [orderNumber, setOrderNumber] = useState(initialOrderNumber)
  const [comment, setComment] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)
  const [submittedData, setSubmittedData] = useState<any>(null)

  if (!isOpen) return null

  const handleRoleChange = (selectedRole: string) => {
    setCustomerRole(selectedRole)
    if (selectedRole.includes('Mother') || selectedRole.includes('Father') || selectedRole.includes('Guardian')) {
      setCategory('parent')
    } else if (selectedRole.includes('Teacher') || selectedRole.includes('Principal')) {
      setCategory('teacher')
    } else {
      setCategory('relative')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!customerName.trim() || !comment.trim()) {
      setError('Please provide your name and your review experience.')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/v1/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim() || undefined,
          customerRole: customerRole.trim(),
          schoolName: schoolName.trim() || undefined,
          location: location.trim() || undefined,
          rating,
          comment: comment.trim(),
          cardType: cardType.trim(),
          category,
          orderNumber: orderNumber.trim() || undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit review')
      }

      setSubmittedData(data.data)
      setIsSuccess(true)
      toast.success('Thank you! Your customer review has been submitted.')
      if (onReviewSubmitted) {
        onReviewSubmitted(data.data)
      }
    } catch (err: any) {
      const errMsg = err.message || 'Something went wrong while submitting your review.'
      setError(errMsg)
      toast.error(errMsg)
    } finally {
      setLoading(false)
    }
  }

  const activeRatingInfo = RATING_LABELS[hoverRating || rating] || RATING_LABELS[5]

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 max-w-xl w-full space-y-6 shadow-2xl relative my-8 max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close Modal"
          className="absolute top-5 right-5 p-2 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {isSuccess ? (
          <div className="py-8 text-center space-y-5 animate-scale-in">
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-pink-500 to-rose-400 text-white flex items-center justify-center mx-auto shadow-xl shadow-pink-500/30">
              <Sparkles className="w-10 h-10 animate-bounce" />
            </div>

            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs font-extrabold border border-emerald-300 dark:border-emerald-800 inline-flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Review Published
              </span>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                Thank You, {customerName}!
              </h3>
              <p className="text-sm text-slate-600 dark:text-zinc-400 max-w-md mx-auto">
                Your review helps hundreds of parents and alumni choose inspiring success cards for national exam candidates across Kenya.
              </p>
            </div>

            {submittedData?.is_verified && (
              <div className="p-3.5 rounded-2xl bg-pink-50 dark:bg-pink-950/60 border border-pink-200 dark:border-pink-800/80 text-xs text-pink-700 dark:text-pink-300 font-semibold flex items-center justify-center gap-2">
                <ShieldCheck className="w-4 h-4 text-pink-500" />
                <span>Verified Delivery Badge automatically granted for Order #{submittedData.order_number}!</span>
              </div>
            )}

            <div className="pt-4 flex justify-center gap-3">
              <button
                onClick={onClose}
                className="px-6 py-3 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs shadow-md shadow-pink-600/30 transition-transform active:scale-95"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="space-y-1.5 pr-8">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-pink-100 dark:bg-pink-950 text-pink-600 dark:text-pink-400 font-extrabold text-[10px] uppercase tracking-wider border border-pink-200 dark:border-pink-800/80">
                  Customer Stories & Feedback
                </span>
              </div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Rate Your Popote Card Experience
              </h2>
              <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                Share your experience with Popote card printing quality, school gate delivery, and customer service.
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
                <X className="w-4 h-4 text-red-500 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Star Rating Selector */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/80 text-center space-y-2">
                <label className="block text-xs font-extrabold text-slate-700 dark:text-zinc-300 uppercase tracking-wider">
                  Overall Rating *
                </label>
                <div className="flex justify-center items-center gap-2 py-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-1 hover:scale-125 transition-transform focus:outline-none"
                    >
                      <Star
                        className={`w-8 h-8 transition-colors ${
                          star <= (hoverRating || rating)
                            ? 'text-amber-400 fill-amber-400 filter drop-shadow-md'
                            : 'text-slate-300 dark:text-zinc-700'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <div className="text-xs">
                  <span className={`font-bold ${activeRatingInfo.color}`}>
                    {activeRatingInfo.label}
                  </span>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                    {activeRatingInfo.desc}
                  </p>
                </div>
              </div>

              {/* Name & Role */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                    Your Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Grace Wambui"
                    className="w-full rounded-xl bg-slate-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-slate-900 dark:text-white text-xs p-3 focus:border-pink-500 focus:outline-none shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                    Your Role / Relationship
                  </label>
                  <select
                    value={customerRole}
                    onChange={(e) => handleRoleChange(e.target.value)}
                    className="w-full rounded-xl bg-slate-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-slate-900 dark:text-white text-xs p-3 focus:border-pink-500 focus:outline-none shadow-sm"
                  >
                    {POPULAR_ROLES.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* School Destination & City/County */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                    Recipient School (Optional)
                  </label>
                  <input
                    type="text"
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    placeholder="e.g. The Kenya High School"
                    className="w-full rounded-xl bg-slate-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-slate-900 dark:text-white text-xs p-3 focus:border-pink-500 focus:outline-none shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                    City / County (Optional)
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Nairobi / Kiambu"
                    className="w-full rounded-xl bg-slate-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-slate-900 dark:text-white text-xs p-3 focus:border-pink-500 focus:outline-none shadow-sm"
                  />
                </div>
              </div>

              {/* Card Type Selected */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                    Card Type Purchased
                  </label>
                  <select
                    value={cardType}
                    onChange={(e) => setCardType(e.target.value)}
                    className="w-full rounded-xl bg-slate-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-slate-900 dark:text-white text-xs p-3 focus:border-pink-500 focus:outline-none shadow-sm"
                  >
                    {POPULAR_CARDS.map((card) => (
                      <option key={card} value={card}>
                        {card}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1 flex items-center justify-between">
                    <span>Order Number (Optional)</span>
                    <span className="text-[10px] text-pink-600 dark:text-pink-400 font-bold">Verified Badge</span>
                  </label>
                  <input
                    type="text"
                    value={orderNumber}
                    onChange={(e) => setOrderNumber(e.target.value)}
                    placeholder="e.g. SC-849201"
                    className="w-full rounded-xl bg-slate-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-slate-900 dark:text-white text-xs p-3 focus:border-pink-500 focus:outline-none shadow-sm font-mono"
                  />
                </div>
              </div>

              {/* Review Text */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                  Your Review & Delivery Story *
                </label>
                <textarea
                  rows={4}
                  required
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="How was the card design, 3D preview, personalized message, and rider delivery to the school reception? Tell us your story..."
                  className="w-full rounded-xl bg-slate-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-slate-900 dark:text-white text-xs p-3.5 focus:border-pink-500 focus:outline-none shadow-sm"
                />
                <div className="flex justify-between items-center text-[10px] text-slate-400 dark:text-zinc-500 mt-1">
                  <span>Minimum 5 characters</span>
                  <span>{comment.length} characters</span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-extrabold text-sm shadow-lg shadow-pink-600/30 transition-transform hover:scale-[1.01] active:scale-98 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                {loading ? 'Submitting Review...' : 'Post Customer Review'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
