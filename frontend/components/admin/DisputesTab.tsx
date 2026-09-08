'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { ShieldAlert, DollarSign, CheckCircle2, RefreshCw, RotateCcw, AlertCircle } from 'lucide-react'

interface DisputeItem {
  id: string
  order_id: string
  order_number?: string
  reason: string
  details?: string
  status: string
  refund_status: string
  refund_amount_kes: number
  created_at: string
}

interface DisputesTabProps {
  token: string
}

export default function DisputesTab({ token }: DisputesTabProps) {
  const [disputes, setDisputes] = useState<DisputeItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Refund Modal State
  const [selectedDispute, setSelectedDispute] = useState<DisputeItem | null>(null)
  const [refundAmount, setRefundAmount] = useState<number>(0)
  const [refundReason, setRefundReason] = useState('')
  const [restockInventory, setRestockInventory] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const fetchDisputes = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/v1/disputes', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to fetch disputes')
      setDisputes(data.data || [])
    } catch (err: any) {
      toast.error(err.message || 'Error fetching disputes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDisputes()
  }, [token])

  const handleOpenRefund = (d: DisputeItem) => {
    setSelectedDispute(d)
    setRefundAmount(d.refund_amount_kes || 500)
    setRefundReason('Printing / Customization Quality Dispute')
    setRestockInventory(true)
  }

  const handleProcessRefund = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDispute) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/v1/admin/disputes/${selectedDispute.id}/refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          refund_amount_kes: refundAmount,
          refund_reason: refundReason,
          restock_inventory: restockInventory
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to process refund')
      toast.success(`Refund of KES ${refundAmount} processed successfully!`)
      setSelectedDispute(null)
      fetchDisputes()
    } catch (err: any) {
      toast.error(err.message || 'Error processing refund')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-5 rounded-3xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-500 flex items-center justify-center font-bold">
            <RotateCcw className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">Dispute & Refund Workflow</h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400">Automated dispute resolution with one-click refund approvals and inventory restocking</p>
          </div>
        </div>
        <button
          onClick={fetchDisputes}
          className="p-2.5 rounded-2xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-200 transition-all hover:bg-slate-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Disputes Table */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">Loading disputes...</div>
        ) : error ? (
          <div className="p-6 text-center text-xs text-red-500">{error}</div>
        ) : disputes.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">No active customer disputes found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-zinc-800/50 text-slate-500 dark:text-zinc-400 font-semibold border-b border-zinc-200 dark:border-zinc-800 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-4">Dispute ID</th>
                  <th className="p-4">Order ID</th>
                  <th className="p-4">Reason</th>
                  <th className="p-4">Dispute Status</th>
                  <th className="p-4">Refund Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {disputes.map(d => (
                  <tr key={d.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                    <td className="p-4 font-mono font-bold text-slate-900 dark:text-white">
                      #{d.id.slice(0, 8)}
                    </td>
                    <td className="p-4 font-mono text-slate-600 dark:text-zinc-400">
                      #{d.order_number || d.order_id.slice(0, 8)}
                    </td>
                    <td className="p-4 font-medium text-slate-800 dark:text-zinc-200 max-w-xs truncate">
                      {d.reason}
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] uppercase ${d.status === 'resolved' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'}`}>
                        {d.status}
                      </span>
                    </td>
                    <td className="p-4 font-semibold">
                      {d.refund_status === 'approved' ? (
                        <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Approved (KES {d.refund_amount_kes})
                        </span>
                      ) : (
                        <span className="text-slate-400 font-normal">Pending Approval</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      {d.refund_status !== 'approved' && (
                        <button
                          onClick={() => handleOpenRefund(d)}
                          className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] inline-flex items-center gap-1 shadow-sm"
                        >
                          <DollarSign className="w-3.5 h-3.5" /> Process Refund
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Process Refund Modal */}
      {selectedDispute && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Approve Refund & Restock</h3>
            <p className="text-xs text-slate-500">Processing dispute for order <span className="font-mono font-bold">#{selectedDispute.order_id.slice(0, 8)}</span></p>

            <form onSubmit={handleProcessRefund} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-slate-600 dark:text-zinc-400">Refund Amount (KES)</label>
                <input
                  type="number" required min="1" value={refundAmount} onChange={e => setRefundAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-slate-900 dark:text-white font-extrabold text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-600 dark:text-zinc-400">Refund Reason</label>
                <input
                  type="text" required value={refundReason} onChange={e => setRefundReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700">
                <input
                  type="checkbox" id="restockCheck" checked={restockInventory} onChange={e => setRestockInventory(e.target.checked)}
                  className="w-4 h-4 rounded text-pink-600 focus:ring-pink-500"
                />
                <label htmlFor="restockCheck" className="text-xs font-semibold text-slate-700 dark:text-zinc-300 cursor-pointer">
                  Return paper board stock back to inventory
                </label>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button" onClick={() => setSelectedDispute(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-zinc-800 font-bold text-slate-700 dark:text-zinc-300"
                >
                  Cancel
                </button>
                <button
                  type="submit" disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold shadow-md shadow-amber-500/20"
                >
                  {submitting ? 'Processing...' : 'Approve Refund'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
