'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import {
  Star, ShieldCheck, CheckCircle2, XCircle, Trash2,
  Search, Filter, RefreshCw, AlertCircle, Eye, EyeOff, Building2, User
} from 'lucide-react'

interface ReviewsTabProps {
  token: string
}

export default function ReviewsTab({ token }: ReviewsTabProps) {
  const [reviews, setReviews] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'pending'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const fetchReviews = async () => {
    setLoading(true)
    setError(null)
    try {
      let url = '/api/v1/reviews/admin/all'
      if (statusFilter !== 'all') {
        url += `?status=${statusFilter}`
      }
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to fetch reviews')

      setReviews(data.data || [])
      setStats(data.stats || null)
    } catch (err: any) {
      toast.error(err.message || 'Error loading reviews')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReviews()
  }, [token, statusFilter])

  const handleToggleApproval = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/v1/reviews/admin/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isApproved: !currentStatus }),
      })
      if (!res.ok) throw new Error('Failed to update review status')

      toast.success(`Review ${!currentStatus ? 'Approved & Published' : 'Hidden from site'}`)
      fetchReviews()
    } catch (err: any) {
      toast.error(err.message || 'Update failed')
    }
  }

  const handleToggleVerified = async (id: string, currentVerified: boolean) => {
    try {
      const res = await fetch(`/api/v1/reviews/admin/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isVerified: !currentVerified }),
      })
      if (!res.ok) throw new Error('Failed to update verified status')

      toast.success(`Verified badge ${!currentVerified ? 'Enabled' : 'Disabled'}`)
      fetchReviews()
    } catch (err: any) {
      toast.error(err.message || 'Update failed')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this customer review?')) return
    try {
      const res = await fetch(`/api/v1/reviews/admin/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to delete review')

      toast.success('Review permanently deleted.')
      fetchReviews()
    } catch (err: any) {
      toast.error(err.message || 'Delete failed')
    }
  }

  const filteredReviews = reviews.filter((r) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      r.customer_name?.toLowerCase().includes(q) ||
      r.school_name?.toLowerCase().includes(q) ||
      r.order_number?.toLowerCase().includes(q) ||
      r.comment?.toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-6">
      {/* Header & Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-1">
          <span className="text-xs font-bold text-slate-500 dark:text-zinc-400">Total Customer Reviews</span>
          <p className="text-2xl font-black text-slate-900 dark:text-white">
            {stats?.total_reviews ?? reviews.length}
          </p>
          <span className="text-[10px] text-pink-600 dark:text-pink-400 font-bold">Platform-wide</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-1">
          <span className="text-xs font-bold text-slate-500 dark:text-zinc-400">Average Rating</span>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black text-amber-500">
              {stats?.average_rating ?? '5.0'}
            </span>
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              ))}
            </div>
          </div>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">Top Quality CSAT</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-1">
          <span className="text-xs font-bold text-slate-500 dark:text-zinc-400">5-Star Reviews</span>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {stats?.rating_breakdown?.[5] ?? 0}
          </p>
          <span className="text-[10px] text-slate-400">Highest Tier Feedback</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-1">
          <span className="text-xs font-bold text-slate-500 dark:text-zinc-400">Verified Delivery Badge</span>
          <p className="text-2xl font-black text-blue-600 dark:text-blue-400">
            {reviews.filter((r) => r.is_verified).length}
          </p>
          <span className="text-[10px] text-blue-500">Order-linked reviews</span>
        </div>
      </div>

      {/* Control Bar: Filters & Search */}
      <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              statusFilter === 'all'
                ? 'bg-pink-600 text-white shadow-md'
                : 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300'
            }`}
          >
            All Reviews ({reviews.length})
          </button>
          <button
            onClick={() => setStatusFilter('approved')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              statusFilter === 'approved'
                ? 'bg-pink-600 text-white shadow-md'
                : 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300'
            }`}
          >
            Published Only
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              statusFilter === 'pending'
                ? 'bg-pink-600 text-white shadow-md'
                : 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300'
            }`}
          >
            Hidden / Pending
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by customer, school, order #..."
              className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs text-slate-900 dark:text-white focus:outline-none"
            />
          </div>

          <button
            onClick={fetchReviews}
            disabled={loading}
            className="p-2 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300"
            title="Refresh Reviews"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Reviews Table / List */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
        {filteredReviews.length === 0 ? (
          <div className="p-12 text-center text-slate-500 dark:text-zinc-400 text-xs font-semibold">
            No customer reviews found matching the current criteria.
          </div>
        ) : (
          <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {filteredReviews.map((rev) => (
              <div
                key={rev.id}
                className="p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-slate-50/60 dark:hover:bg-zinc-950/40 transition-colors"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Stars */}
                    <div className="flex items-center gap-0.5">
                      {[...Array(rev.rating)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      ))}
                    </div>

                    <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                      {rev.customer_name}
                    </span>

                    <span className="text-[11px] text-pink-600 dark:text-pink-400 font-bold">
                      ({rev.customer_role || 'Customer'})
                    </span>

                    {rev.is_verified && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-extrabold border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Verified Delivery
                      </span>
                    )}

                    {rev.order_number && (
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-[10px] text-slate-600 dark:text-zinc-400 font-mono">
                        #{rev.order_number}
                      </span>
                    )}

                    <span className="text-[10px] text-slate-400 dark:text-zinc-500">
                      {new Date(rev.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 dark:text-zinc-300 italic">
                    "{rev.comment}"
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500 dark:text-zinc-400">
                    {rev.school_name && (
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-pink-500" /> {rev.school_name}
                      </span>
                    )}
                    {rev.card_type && (
                      <span className="px-2 py-0.5 rounded bg-pink-50 dark:bg-pink-950/40 text-pink-700 dark:text-pink-300 text-[10px] font-medium">
                        {rev.card_type}
                      </span>
                    )}
                    {rev.customer_phone && (
                      <span className="text-[10px] text-slate-400 font-mono">
                        Phone: {rev.customer_phone}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
                  <button
                    onClick={() => handleToggleVerified(rev.id, rev.is_verified)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                      rev.is_verified
                        ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                        : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700'
                    }`}
                    title="Toggle Verified Badge"
                  >
                    {rev.is_verified ? 'Verified ✓' : 'Mark Verified'}
                  </button>

                  <button
                    onClick={() => handleToggleApproval(rev.id, rev.is_approved)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors ${
                      rev.is_approved
                        ? 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-amber-100'
                        : 'bg-green-600 text-white'
                    }`}
                  >
                    {rev.is_approved ? (
                      <>
                        <EyeOff className="w-3.5 h-3.5" /> Hide
                      </>
                    ) : (
                      <>
                        <Eye className="w-3.5 h-3.5" /> Publish
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleDelete(rev.id)}
                    className="p-2 rounded-xl bg-red-50 dark:bg-red-950/50 hover:bg-red-100 dark:hover:bg-red-900/60 text-red-600 dark:text-red-400 transition-colors"
                    title="Delete Review"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
