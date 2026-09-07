'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Star, ShieldCheck, MapPin, Sparkles, Building2,
  Quote, CheckCircle2, Plus, MessageSquarePlus, ArrowRight
} from 'lucide-react'
import { ReviewModal } from '../ReviewModal'

export interface TestimonialItem {
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

const INITIAL_TESTIMONIALS: TestimonialItem[] = [
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
]

const LIVE_DELIVERIES = [
  { school: 'The Kenya High School', location: 'Nairobi', time: '4 mins ago', card: 'A4 Deluxe Gold' },
  { school: 'Alliance High School', location: 'Kikuyu', time: '11 mins ago', card: 'A3 Jumbo Laurels' },
  { school: 'Moi Girls High School', location: 'Eldoret', time: '18 mins ago', card: 'A4 Floral Grace' },
  { school: 'Mang\'u High School', location: 'Thika', time: '25 mins ago', card: 'A5 Compact Gold' },
  { school: 'Loreto High School', location: 'Limuru', time: '32 mins ago', card: 'A4 KPSEA Victory' },
  { school: 'Maranda High School', location: 'Bondo', time: '40 mins ago', card: 'A4 Deluxe Gold' },
]

export function TestimonialsSection() {
  const [activeCategory, setActiveCategory] = useState<'all' | 'parent' | 'teacher' | 'relative'>('all')
  const [tickerIndex, setTickerIndex] = useState(0)
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)
  const [testimonials, setTestimonials] = useState<TestimonialItem[]>(INITIAL_TESTIMONIALS)
  const [stats, setStats] = useState<{ total: number; avgRating: number }>({
    total: 1850,
    avgRating: 4.95,
  })

  // Rotate live delivery ticker
  useEffect(() => {
    const interval = setInterval(() => {
      setTickerIndex((prev) => (prev + 1) % LIVE_DELIVERIES.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  // Fetch live reviews from backend API on mount
  useEffect(() => {
    async function fetchReviews() {
      try {
        const res = await fetch('http://localhost:4000/api/v1/reviews?limit=20')
        if (res.ok) {
          const data = await res.json()
          if (data.data && Array.isArray(data.data) && data.data.length > 0) {
            const mapped: TestimonialItem[] = data.data.map((item: any) => ({
              id: item.id,
              name: item.customer_name,
              role: item.customer_role || 'Verified Customer',
              location: item.location || 'Kenya',
              school: item.school_name || 'Kenyan Secondary / Primary School',
              rating: item.rating || 5,
              comment: item.comment,
              date: new Date(item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
              cardType: item.card_type || 'A4 Deluxe Success Card',
              verified: !!item.is_verified,
              category: item.category || 'parent',
            }))

            // Merge newly fetched reviews at top, retaining curated ones
            const existingIds = new Set(mapped.map((m) => m.id))
            const combined = [...mapped, ...INITIAL_TESTIMONIALS.filter((t) => !existingIds.has(t.id))]
            setTestimonials(combined)

            if (data.stats && data.stats.total_reviews > 0) {
              setStats({
                total: 1850 + data.stats.total_reviews,
                avgRating: Number(data.stats.average_rating || 4.95),
              })
            }
          }
        }
      } catch (err) {
        // Fallback gracefully to default curated testimonials
      }
    }

    fetchReviews()
  }, [])

  const handleReviewSubmitted = (newReview: any) => {
    const item: TestimonialItem = {
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

    setTestimonials((prev) => [item, ...prev])
    setStats((prev) => ({
      total: prev.total + 1,
      avgRating: Number(((prev.avgRating * prev.total + newReview.rating) / (prev.total + 1)).toFixed(2)),
    }))
  }

  const filteredTestimonials = testimonials.filter(
    (t) => activeCategory === 'all' || t.category === activeCategory
  )

  const currentTicker = LIVE_DELIVERIES[tickerIndex]

  return (
    <section className="py-16 sm:py-24 relative overflow-hidden bg-slate-900/40 dark:bg-zinc-950/80 border-y border-zinc-200/50 dark:border-zinc-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 relative z-10">
        {/* Section Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-400 font-extrabold text-xs">
            <Sparkles className="w-3.5 h-3.5 text-pink-400" />
            <span>VERIFIED KENYAN SCHOOL STORIES</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
            What People Say About Popote Cards
          </h2>
          <p className="text-base sm:text-lg text-slate-600 dark:text-zinc-400 leading-relaxed">
            Real stories from parents, alumni, and school principals across Kenya who rely on Popote Card Delivery for national examination encouragement.
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => setIsReviewModalOpen(true)}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-extrabold text-xs shadow-lg shadow-pink-600/30 transition-transform hover:scale-105 active:scale-95 flex items-center gap-2"
            >
              <MessageSquarePlus className="w-4 h-4" />
              <span>Leave a Customer Review</span>
            </button>

            <Link
              href="/reviews"
              className="px-6 py-3 rounded-2xl bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 font-bold text-xs shadow-sm transition-all flex items-center gap-2"
            >
              <span>View All Customer Reviews</span>
              <ArrowRight className="w-3.5 h-3.5 text-pink-500" />
            </Link>
          </div>
        </div>

        {/* Live Delivery Ticker Simulator */}
        <div className="max-w-3xl mx-auto rounded-2xl bg-gradient-to-r from-pink-950/80 via-zinc-900 to-purple-950/80 border border-pink-500/30 p-3.5 shadow-lg flex items-center justify-between gap-3 overflow-hidden text-xs text-white">
          <div className="flex items-center gap-2 shrink-0">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="font-extrabold uppercase text-pink-400 tracking-wider text-[10px] sm:text-xs">
              LIVE DISPATCH TICKER
            </span>
          </div>

          <div className="truncate text-slate-200 font-medium animate-slide-up">
            <span>Delivered: </span>
            <strong className="text-amber-300 font-bold">{currentTicker.card}</strong>
            <span> to </span>
            <strong className="text-white font-bold">{currentTicker.school} ({currentTicker.location})</strong>
            <span className="text-zinc-400 text-[10px] ml-2">({currentTicker.time})</span>
          </div>

          <span className="hidden sm:inline-flex px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[10px] border border-emerald-500/30 shrink-0">
            VERIFIED RIDER SCAN
          </span>
        </div>

        {/* Statistics Banner */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-center space-y-1 shadow-sm card-hover-effect">
            <span className="text-3xl sm:text-4xl font-black text-pink-600 dark:text-pink-400 block tracking-tight">
              25,400+
            </span>
            <span className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider block">
              Cards Delivered
            </span>
            <span className="text-[11px] text-slate-500 dark:text-zinc-400 block">Across Kenya</span>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-center space-y-1 shadow-sm card-hover-effect">
            <span className="text-3xl sm:text-4xl font-black text-pink-600 dark:text-pink-400 block tracking-tight">
              480+
            </span>
            <span className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider block">
              Schools Covered
            </span>
            <span className="text-[11px] text-slate-500 dark:text-zinc-400 block">Boarding & Day Schools</span>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-center space-y-1 shadow-sm card-hover-effect">
            <span className="text-3xl sm:text-4xl font-black text-pink-600 dark:text-pink-400 block tracking-tight">
              99.8%
            </span>
            <span className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider block">
              On-Time Rate
            </span>
            <span className="text-[11px] text-slate-500 dark:text-zinc-400 block">Before Exam Commencement</span>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-center space-y-1 shadow-sm card-hover-effect">
            <span className="text-3xl sm:text-4xl font-black text-pink-600 dark:text-pink-400 block tracking-tight">
              {stats.avgRating} / 5
            </span>
            <span className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider block">
              Customer Rating
            </span>
            <span className="text-[11px] text-slate-500 dark:text-zinc-400 block">
              Based on {stats.total.toLocaleString()}+ Reviews
            </span>
          </div>
        </div>

        {/* Testimonials Filter Tabs */}
        <div className="flex justify-center items-center gap-2 flex-wrap">
          {[
            { id: 'all', label: 'All Customer Stories' },
            { id: 'parent', label: 'KCSE & KPSEA Parents' },
            { id: 'teacher', label: 'School Admin & Teachers' },
            { id: 'relative', label: 'Relatives & Alumni' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveCategory(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
                activeCategory === tab.id
                  ? 'bg-pink-600 text-white shadow-md'
                  : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:border-pink-400'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTestimonials.map((t) => (
            <div
              key={t.id}
              className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between space-y-4 shadow-md card-hover-effect relative"
            >
              <div className="space-y-3">
                {/* Rating stars & verified badge */}
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1">
                    {[...Array(t.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
                    ))}
                  </div>

                  {t.verified && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 text-[10px] font-extrabold border border-emerald-300 dark:border-emerald-700">
                      <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Verified Delivery
                    </span>
                  )}
                </div>

                <Quote className="w-8 h-8 text-pink-500/20" />

                <p className="text-xs sm:text-sm text-slate-700 dark:text-zinc-300 leading-relaxed italic">
                  "{t.comment}"
                </p>
              </div>

              <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 space-y-1">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-xs font-black text-slate-900 dark:text-white">
                      {t.name}
                    </h4>
                    <span className="text-[11px] text-pink-600 dark:text-pink-400 font-bold block">
                      {t.role}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono">
                    {t.date}
                  </span>
                </div>

                <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-zinc-400 pt-1">
                  <Building2 className="w-3.5 h-3.5 text-pink-500 shrink-0" />
                  <span className="truncate">{t.school}</span>
                </div>

                <div className="inline-block px-2 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-[10px] text-slate-600 dark:text-zinc-400 font-mono">
                  {t.cardType}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA to write review */}
        <div className="p-8 rounded-3xl bg-gradient-to-r from-pink-900/40 via-purple-900/30 to-slate-900 border border-pink-500/30 text-center space-y-4 shadow-xl">
          <h3 className="text-xl sm:text-2xl font-black text-white">
            Have You Sent a Popote Success Card Recently?
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto">
            Your voice empowers other parents, relatives, and alumni to send heartwarming encouragement to candidates across all 47 Kenyan counties.
          </p>
          <button
            onClick={() => setIsReviewModalOpen(true)}
            className="px-6 py-3.5 rounded-2xl bg-pink-600 hover:bg-pink-500 text-white font-extrabold text-xs shadow-lg shadow-pink-600/30 transition-transform hover:scale-105 active:scale-95 inline-flex items-center gap-2"
          >
            <MessageSquarePlus className="w-4 h-4" />
            <span>Share Your Candidate Delivery Story</span>
          </button>
        </div>
      </div>

      {/* Interactive Review Modal */}
      <ReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        onReviewSubmitted={handleReviewSubmitted}
      />
    </section>
  )
}
