'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Package, AlertTriangle, RefreshCw, Plus, CheckCircle, ShieldAlert } from 'lucide-react'

interface InventoryItem {
  id: string
  sku: string
  name: string
  size: string
  stock_quantity: number
  reserved_quantity: number
  reorder_threshold: number
  unit_cogs_kes: number
  updated_at: string
}

interface InventoryTabProps {
  token: string
}

export default function InventoryTab({ token }: InventoryTabProps) {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [lowStockCount, setLowStockCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Restock modal state
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [newQuantity, setNewQuantity] = useState<number>(0)
  const [restockReason, setRestockReason] = useState('manual_restock')
  const [restockNotes, setRestockNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchInventory = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/v1/inventory', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to fetch inventory')
      setItems(data.data || [])
      setLowStockCount(data.summary?.low_stock_count || 0)
    } catch (err: any) {
      toast.error(err.message || 'Error loading inventory')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInventory()
  }, [token])

  const handleOpenRestock = (item: InventoryItem) => {
    setSelectedItem(item)
    setNewQuantity(item.stock_quantity)
    setRestockReason('manual_restock')
    setRestockNotes('')
  }

  const handleSaveStock = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedItem) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/v1/inventory/${selectedItem.id}/stock`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          new_quantity: newQuantity,
          reason: restockReason,
          notes: restockNotes
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update stock')
      toast.success(`Inventory stock for ${selectedItem.name} updated!`)
      setSelectedItem(null)
      fetchInventory()
    } catch (err: any) {
      toast.error(err.message || 'Failed to update stock')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Banner Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Total SKUs Monitored</p>
            <h4 className="text-xl font-extrabold text-slate-900 dark:text-white">{items.length}</h4>
          </div>
        </div>

        <div className={`p-4 rounded-3xl border shadow-sm flex items-center gap-4 ${lowStockCount > 0 ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50' : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800'}`}>
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold ${lowStockCount > 0 ? 'bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'}`}>
            {lowStockCount > 0 ? <AlertTriangle className="w-6 h-6" /> : <CheckCircle className="w-6 h-6" />}
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Low Stock Alerts</p>
            <h4 className="text-xl font-extrabold text-slate-900 dark:text-white">{lowStockCount} SKUs</h4>
          </div>
        </div>

        <div className="p-4 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Stock Ledger</p>
            <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">Real-Time Sync</h4>
          </div>
          <button
            onClick={fetchInventory}
            className="p-3 rounded-2xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 transition-all"
            title="Refresh Inventory"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">Paper Board & Raw Material Stock</h3>
          <span className="text-xs text-slate-500">350 GSM Heavy Board Stock Allocation</span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">Loading stock levels...</div>
        ) : error ? (
          <div className="p-6 text-center text-xs text-red-500">{error}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-zinc-800/50 text-slate-500 dark:text-zinc-400 font-semibold border-b border-zinc-200 dark:border-zinc-800 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-4">SKU / Item Name</th>
                  <th className="p-4">Size</th>
                  <th className="p-4">Available Stock</th>
                  <th className="p-4">Reserved (Orders)</th>
                  <th className="p-4">Reorder Threshold</th>
                  <th className="p-4">Unit COGS (KES)</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {items.map(item => {
                  const available = item.stock_quantity - item.reserved_quantity
                  const isLow = available <= item.reorder_threshold
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                      <td className="p-4 font-bold text-slate-900 dark:text-white">
                        {item.name}
                        <span className="block text-[10px] font-normal text-slate-400">{item.sku}</span>
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-1 rounded-lg bg-pink-100 text-pink-700 dark:bg-pink-950/60 dark:text-pink-300 font-extrabold text-[10px]">
                          {item.size}
                        </span>
                      </td>
                      <td className="p-4 font-extrabold text-slate-900 dark:text-white text-sm">
                        {item.stock_quantity} units
                      </td>
                      <td className="p-4 text-slate-600 dark:text-zinc-400 font-medium">
                        {item.reserved_quantity} units
                      </td>
                      <td className="p-4 text-slate-500">
                        {item.reorder_threshold} units
                      </td>
                      <td className="p-4 font-semibold text-slate-800 dark:text-zinc-300">
                        KES {parseFloat(item.unit_cogs_kes as any).toLocaleString()}
                      </td>
                      <td className="p-4">
                        {isLow ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 font-bold text-[10px]">
                            <ShieldAlert className="w-3 h-3" /> Low Stock Warning
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold text-[10px]">
                            <CheckCircle className="w-3 h-3" /> Healthy Stock
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleOpenRestock(item)}
                          className="px-3 py-1.5 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-bold text-[11px] shadow-sm transition-all inline-flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" /> Adjust / Restock
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Restock Adjustment Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Adjust Stock Level</h3>
            <p className="text-xs text-slate-500">Modifying stock quantity for <span className="font-bold text-pink-600">{selectedItem.name} ({selectedItem.size})</span></p>

            <form onSubmit={handleSaveStock} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-slate-600 dark:text-zinc-400">Current Total Stock</label>
                <input
                  type="number" required min="0" value={newQuantity} onChange={e => setNewQuantity(parseInt(e.target.value) || 0)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-slate-900 dark:text-white font-extrabold text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-600 dark:text-zinc-400">Adjustment Reason</label>
                <select
                  value={restockReason} onChange={e => setRestockReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-slate-900 dark:text-white"
                >
                  <option value="manual_restock">Manual Supplier Restock</option>
                  <option value="audit_reconciliation">Inventory Audit Reconciliation</option>
                  <option value="damaged_spoilage">Damaged / Printing Spoilage</option>
                  <option value="dispute_return">Dispute Restock Return</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-600 dark:text-zinc-400">Audit Notes (Optional)</label>
                <input
                  type="text" placeholder="e.g. Received 500 sheets from Paper Corp" value={restockNotes} onChange={e => setRestockNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button" onClick={() => setSelectedItem(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-zinc-800 font-bold text-slate-700 dark:text-zinc-300"
                >
                  Cancel
                </button>
                <button
                  type="submit" disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-extrabold shadow-md shadow-pink-500/20"
                >
                  {submitting ? 'Saving...' : 'Update Stock Ledger'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
