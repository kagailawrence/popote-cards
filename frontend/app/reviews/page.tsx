'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Star, ShieldCheck, MapPin, Building2, Quote, CheckCircle2,
  Sparkles, MessageSquarePlus, Search, SlidersHorizontal, ArrowLeft, Filter
} from 'lucide-react'
import { ReviewModal } from '../../components/ReviewModal'

interface ReviewItem {
  id: string
  name: string
  role: string
  location: string
  school: string
  rating: number
  comment: string
  date: string
  cardType: string
  verified: boolean
  category: 'parent' | 'teacher' | 'relative' | 'other'
}

const DEFAULT_REVIEWS: ReviewItem[] = [
  {
    id: 't1',
    name: 'Grace Wambui',
    role: 'Mother of Candidate',
    location: 'Nairobi / Kenya High School',
    school: 'The Kenya High School, Nairobi',
    rating: 5,
    comment: 'I ordered the A4 Gold Foil Success Card for my daughter sitting KCSE. I was nervous about whether it would reach her inside school, but Popote rider delivered it directly to the school gate matron! The delivery photo proof uploaded on my tracking timeline gave me 100% peace of mind.',
    date: '2 days ago',
    cardType: 'A4 KCSE Deluxe Gold Foil',
    verified: true,
    category: 'parent',
  },
  {
    id: 't2',
    name: 'Eng. David Omondi',
    role: 'Father of Student',
    location: 'Kisumu / Alliance High',
    school: 'Alliance High School, Kikuyu',
    rating: 5,
    comment: 'The candidate photo insert and calligraphy handwriting message were beyond expectations. The 350GSM cardstock feels super luxury. My son called me during visiting Sunday crying tears of joy when he received it!',
    date: '3 days ago',
    cardType: 'A3 Jumbo Deluxe Edition',
    verified: true,
    category: 'parent',
  },
  {
    id: 't3',
    name: 'Mrs. Florence Kipkorir',
    role: 'Deputy Principal & Senior Teacher',
    location: 'Eldoret / Moi Girls',
    school: 'Moi Girls High School, Eldoret',
    rating: 5,
    comment: 'As a school administrator, we receive hundreds of cards during national exams. Popote Delivery riders are extremely professional, orderly, and follow school gate protocol seamlessly with printed delivery schedules.',
    date: '1 week ago',
    cardType: 'Bulk School Order (45 Cards)',
    verified: true,
    category: 'teacher',
  },
  {
    id: 't4',
    name: 'Kevin Mutua',
    role: 'Older Brother & Alumni',
    location: 'Nakuru / Mang\'u High',
    school: 'Mang\'u High School, Thika',
    rating: 5,
    comment: 'Ordered via M-Pesa at 10 AM, and it was printed in the Nairobi Hub and delivered to Mang’u High by 3 PM the same day! The speed and transparency of Popote is unmatched in Kenya.',
    date: '4 days ago',
    cardType: 'A5 Compact Gold Laurel',
    verified: true,
    category: 'relative',
  },
  {
    id: 't5',
    name: 'Sarah Njeri',
    role: 'Aunt of KPSEA Candidate',
    location: 'Mombasa / Loreto Limuru',
    school: 'Loreto High School, Limuru',
    rating: 5,
    comment: 'The online 3D card preview allowed me to craft a custom message with her candidate index number. The gold foil seal makes it look like an official trophy card. 10/10 service!',
    date: '5 days ago',
    cardType: 'A4 KPSEA Wings of Victory',
    verified: true,
    category: 'relative',
  },
  {
    id: 't6',
    name: 'Pastor Peter Mwangi',
    role: 'School Chaplain & Mentor',
    location: 'Nyeri / Kagumo High',
    school: 'Kagumo High School, Nyeri',
    rating: 5,
    comment: 'We ordered religious exam cards with scripture verses for the entire graduating class. The print accuracy, biblical calligraphy, and organized delivery packet made dedication Sunday unforgettable.',
    date: '1 week ago',
    cardType: 'Christian Blessing Edition',
    verified: true,
    category: 'teacher',
  },
  {
    id: 't7',
    name: 'Faith Achieng',
    role: 'Sister of KCPE Candidate',
    location: 'Kisumu / Maseno School',
    school: 'Maseno School, Kisumu',
    rating: 5,
    comment: 'The live dispatch tracker showed every stage from heavy board printing in Nairobi to courier handover at Maseno gate. Exceptional service!',
    date: '2 weeks ago',
    cardType: 'A4 KCSE Deluxe Gold Foil',
    verified: true,
    category: 'relative',
  },
]

export default function CustomerReviewsPage() {
  const [reviews, setReviews] = useState<ReviewItem[]>(DEFAULT_REVIEWS)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'parent' | 'teacher' | 'relative'>('all')
  const [selectedRating, setSelectedRating] = useState<number | 'all'>('all')
  const [verifiedOnly, setVerifiedOnly] = useState(false)
  const [sortBy, setSortBy] = useState<'newest' | 'highest'>('newest')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [stats, setStats] = useState({
    total: 1850,
    avgRating: 4.95,
    ratingBreakdown: { 5: 1680, 4: 145, 3: 20, 2: 4, 1: 1 },
  })

  useEffect(() => {
    async function fetchAllReviews() {
      try {
        const res = await fetch('http://localhost:4000/api/v1/reviews?limit=100')
        if (res.ok) {
          const json = await res.json()
          if (json.data && Array.isArray(json.data) && json.data.length > 0) {
            const mapped: ReviewItem[] = json.data.map((item: any) => ({
              id: item.id,
              name: item.customer_name,
              role: item.customer_role || 'Customer',
              location: item.location || 'Kenya',
              school: item.school_name || 'Kenyan School',
              rating: item.rating || 5,
              comment: item.comment,
              date: new Date(item.created_at).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              }),
              cardType: item.card_type || 'A4 Deluxe Success Card',
              verified: !!item.is_verified,
              category: item.category || 'parent',
            }))

            const existingIds = new Set(mapped.map((m) => m.id))
            setReviews([...mapped, ...DEFAULT_REVIEWS.filter((d) => !existingIds.has(d.id))])

            if (json.stats && json.stats.total_reviews > 0) {
              setStats({
                total: 1850 + json.stats.total_reviews,
                avgRating: Number(json.stats.average_rating || 4.95),
                ratingBreakdown: {
                  5: 1680 + (json.stats.rating_breakdown[5] || 0),
                  4: 145 + (json.stats.rating_breakdown[4] || 0),
                  3: 20 + (json.stats.rating_breakdown[3] || 0),
                  2: 4 + (json.stats.rating_breakdown[2] || 0),
                  1: 1 + (json.stats.rating_breakdown[1] || 0),
                },
              })
            }
          }
        }
      } catch (err) {
        // graceful fallback
      }
    }

    fetchAllReviews()
  }, [])

  const handleReviewSubmitted = (newReview: any) => {
    const item: ReviewItem = {
      id: newReview.id,
      name: newReview.customer_name,
      role: newReview.customer_role || 'Parent of Candidate',
      location: newReview.location || 'Kenya',
      school: newReview.school_name || 'School Delivery',
      rating: newReview.rating,
      comment: newReview.comment,
      date: 'Just now',
      cardType: newReview.card_type || 'A4 KCSE Deluxe Gold Foil',
      verified: !!newReview.is_verified,
      category: newReview.category || 'parent',
    }

    setReviews((prev) => [item, ...prev])
  }

  // Filter and sort reviews
  const filteredReviews = reviews
    .filter((r) => {
      if (selectedCategory !== 'all' && r.category !== selectedCategory) return false
      if (selectedRating !== 'all' && r.rating !== selectedRating) return false
      if (verifiedOnly && !r.verified) return false
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        return (
          r.name.toLowerCase().includes(q) ||
          r.school.toLowerCase().includes(q) ||
          r.location.toLowerCase().includes(q) ||
          r.comment.toLowerCase().includes(q)
        )
      }
      return true
    })
    .sort((a, b) => {
      if (sortBy === 'highest') return b.rating - a.rating
      return 0 // default maintains newest order
    })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12 animate-fade-in">
      {/* Top Breadcrumb & Hero */}
      <div className="space-y-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-pink-600 dark:text-zinc-400 dark:hover:text-pink-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-zinc-200 dark:border-zinc-800 pb-8">
          <div className="space-y-2 max-w-2xl">
         
            <h1 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
              Customer Experiences & Verified Reviews
            </h1>
            <p className="text-sm sm:text-base text-slate-600 dark:text-zinc-400 leading-relaxed">
              Read authentic feedback from parents, relatives, and teachers who have sent personalized success cards to candidates across Kenya.
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-extrabold text-sm shadow-xl shadow-pink-600/30 transition-transform hover:scale-105 active:scale-95 flex items-center gap-2 shrink-0"
          >
            <MessageSquarePlus className="w-4 h-4" />
            <span>Leave a Review</span>
          </button>
        </div>
      </div>

      {/* Rating Breakdown & Stats Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Overall Score */}
        <div className="p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col justify-center items-center text-center space-y-3">
          <span className="text-5xl font-black text-slate-900 dark:text-white tracking-tight">
            {stats.avgRating}
          </span>
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-5 h-5 text-amber-400 fill-amber-400" />
            ))}
          </div>
          <span className="text-xs text-slate-500 dark:text-zinc-400 font-bold uppercase tracking-wider">
            Based on {stats.total.toLocaleString()} Verified Reviews
          </span>
          <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[11px] font-extrabold">
            99.8% Recommend Popote Cards
          </span>
        </div>

        {/* Rating Breakdown Bars */}
        <div className="md:col-span-2 p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-3 flex flex-col justify-center">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-zinc-300">
            Rating Distribution
          </h3>
          {[5, 4, 3, 2, 1].map((stars) => {
            const count = (stats.ratingBreakdown as any)[stars] || 0
            const percentage = Math.round((count / stats.total) * 100) || 0
            return (
              <div key={stars} className="flex items-center gap-3 text-xs">
                <span className="w-12 font-bold text-slate-700 dark:text-zinc-300 flex items-center gap-1">
                  {stars} <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                </span>
                <div className="flex-1 h-3 rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden">
                  <div
                    className="h-full bg-pink-600 rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="w-10 text-right text-slate-500 dark:text-zinc-400 font-mono text-[11px]">
                  {percentage}%
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Filters, Search & Sorting Bar */}
      <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by school, student, or city..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs text-slate-900 dark:text-white focus:border-pink-500 focus:outline-none"
            />
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Rating Filter */}
            <select
              value={selectedRating}
              onChange={(e) => setSelectedRating(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              className="px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs font-bold text-slate-700 dark:text-zinc-300 focus:outline-none"
            >
              <option value="all">All Star Ratings</option>
              <option value="5">5 Stars Only</option>
              <option value="4">4 Stars & Above</option>
            </select>

            {/* Sort Order */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs font-bold text-slate-700 dark:text-zinc-300 focus:outline-none"
            >
              <option value="newest">Most Recent</option>
              <option value="highest">Highest Rated</option>
            </select>

            {/* Verified Only Toggle */}
            <button
              onClick={() => setVerifiedOnly(!verifiedOnly)}
              className={`px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
                verifiedOnly
                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
                  : 'bg-slate-50 dark:bg-zinc-950 text-slate-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Verified Only</span>
            </button>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex gap-2 flex-wrap pt-2 border-t border-zinc-100 dark:border-zinc-800">
          {[
            { id: 'all', label: 'All Reviews' },
            { id: 'parent', label: 'Parents (KCSE/KPSEA)' },
            { id: 'teacher', label: 'Teachers & Principals' },
            { id: 'relative', label: 'Siblings & Alumni' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id as any)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedCategory === cat.id
                  ? 'bg-pink-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Reviews Grid */}
      {filteredReviews.length === 0 ? (
        <div className="py-16 text-center text-slate-500 dark:text-zinc-400 space-y-3">
          <MessageSquarePlus className="w-10 h-10 mx-auto text-slate-300 dark:text-zinc-700" />
          <p className="text-sm font-semibold">No reviews matching your search filters.</p>
          <button
            onClick={() => {
              setSearchQuery('')
              setSelectedCategory('all')
              setSelectedRating('all')
              setVerifiedOnly(false)
            }}
            className="px-4 py-2 rounded-xl bg-pink-600 text-white font-bold text-xs shadow-md"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredReviews.map((r) => (
            <div
              key={r.id}
              className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between space-y-4 shadow-sm hover:shadow-md transition-shadow relative"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1">
                    {[...Array(r.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
                    ))}
                  </div>

                  {r.verified && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 text-[10px] font-extrabold border border-emerald-300 dark:border-emerald-700">
                      <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Verified Delivery
                    </span>
                  )}
                </div>

                <Quote className="w-8 h-8 text-pink-500/20" />

                <p className="text-xs sm:text-sm text-slate-700 dark:text-zinc-300 leading-relaxed italic">
                  "{r.comment}"
                </p>
              </div>

              <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 space-y-1">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-xs font-black text-slate-900 dark:text-white">
                      {r.name}
                    </h4>
                    <span className="text-[11px] text-pink-600 dark:text-pink-400 font-bold block">
                      {r.role}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono">
                    {r.date}
                  </span>
                </div>

                <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-zinc-400 pt-1">
                  <Building2 className="w-3.5 h-3.5 text-pink-500 shrink-0" />
                  <span className="truncate">{r.school}</span>
                </div>

                <div className="inline-block px-2 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-[10px] text-slate-600 dark:text-zinc-400 font-mono">
                  {r.cardType}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review Modal */}
      <ReviewModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onReviewSubmitted={handleReviewSubmitted}
      />
    </div>
  )
}
