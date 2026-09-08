'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import {
  Truck, DollarSign, Save, RefreshCw, CheckCircle2,
  MapPin, ShieldCheck, Info, Sparkles, Building, Trees
} from 'lucide-react'

interface PricingTabProps {
  token: string
}

interface DeliveryPricingData {
  cbd: number
  outskirts: number
  rules: Array<{
    zone: 'cbd' | 'outskirts'
    amount_kes: number
    label: string
    updated_at?: string
  }>
}

export default function PricingTab({ token }: PricingTabProps) {
  const [loading, setLoading] = useState(true)
  const [savingDelivery, setSavingDelivery] = useState(false)
  
  // Delivery zone pricing state
  const [cbdRate, setCbdRate] = useState<number>(150)
  const [outskirtsRate, setOutskirtsRate] = useState<number>(300)
  const [deliveryData, setDeliveryData] = useState<DeliveryPricingData | null>(null)

  const fetchPricingData = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/v1/pricing/delivery')
      if (res.ok) {
        const dData = await res.json()
        if (dData.data) {
          setDeliveryData(dData.data)
          setCbdRate(Number(dData.data.cbd) || 150)
          setOutskirtsRate(Number(dData.data.outskirts) || 300)
        }
      }
    } catch (err: any) {
      console.error('Failed to load delivery pricing data', err)
      toast.error('Could not load delivery pricing configuration.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPricingData()
  }, [])

  // Save Delivery Rates
  const handleSaveDeliveryRates = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isNaN(cbdRate) || cbdRate < 0 || isNaN(outskirtsRate) || outskirtsRate < 0) {
      toast.error('Please enter valid positive delivery amounts.')
      return
    }

    setSavingDelivery(true)
    try {
      const res = await fetch('/api/v1/pricing/delivery', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          cbd: Number(cbdRate),
          outskirts: Number(outskirtsRate),
        }),
      })

      if (res.ok) {
        toast.success('School delivery rates updated! New rates are now active on checkout.')
        fetchPricingData()
      } else {
        if (res.status === 401) {
          toast.error('Session expired or unauthorized. Please log in again.')
        } else {
          const errData = await res.json().catch(() => ({}))
          toast.error(errData.error || 'Failed to update delivery rates.')
        }
      }
    } catch (err: any) {
      toast.error(err.message || 'Delivery rate update failed.')
    } finally {
      setSavingDelivery(false)
    }
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Section Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-pink-600 via-rose-600 to-amber-600 text-white shadow-xl relative overflow-hidden">
        <div className="z-10 space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-bold">
            <Truck className="w-3.5 h-3.5 text-yellow-300" />
            <span>Delivery Fee Configuration</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black">School Delivery Pricing</h2>
          <p className="text-xs text-white/80 max-w-2xl">
            Set the two school delivery fees (CBD vs Outskirts). All deliveries across Kenya are calculated using these rates regardless of card size.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchPricingData}
          disabled={loading}
          className="z-10 px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white backdrop-blur-md border border-white/20 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Rates</span>
        </button>
      </div>

      {/* DELIVERY PRICING CARD (CBD vs Outskirts) */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-md space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-pink-100 dark:bg-pink-950/60 text-pink-600 dark:text-pink-400">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                Delivery Rates (2 Zones)
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Every secondary school in Kenya belongs to a Sub-County classified as either <strong>Town Center / CBD</strong> or <strong>Outskirts / Rural</strong>.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSaveDeliveryRates} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* CBD / Town Center Zone */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-50/70 to-blue-50/50 dark:from-indigo-950/30 dark:to-zinc-900 border border-indigo-200/80 dark:border-indigo-900/50 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-[10px] font-extrabold uppercase tracking-wider border border-indigo-200 dark:border-indigo-800">
                    Zone 1: CBD / Town Center
                  </span>
                  <h4 className="text-base font-extrabold text-slate-900 dark:text-white mt-1">
                    Near CBD & Urban Centers
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-zinc-400 mt-0.5">
                    Schools located near county headquarters, commercial business districts, and main town centers.
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                  <Building className="w-5 h-5" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                  CBD Delivery Fee (KES)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400 dark:text-zinc-500">
                    KES
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="10"
                    required
                    value={cbdRate}
                    onChange={(e) => setCbdRate(parseFloat(e.target.value) || 0)}
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-zinc-950 text-slate-900 dark:text-white font-extrabold text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white/70 dark:bg-zinc-900/80 border border-indigo-100 dark:border-indigo-950/60 text-[11px] text-slate-600 dark:text-zinc-400 space-y-1">
                <div className="font-bold text-indigo-700 dark:text-indigo-300 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Example Coverage:
                </div>
                <div>Kenya High School, Starehe Boys, Nairobi School, Mombasa Central, Kisumu CBD schools.</div>
              </div>
            </div>

            {/* Outskirts / Rural Zone */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-amber-50/70 to-orange-50/50 dark:from-amber-950/30 dark:to-zinc-900 border border-amber-200/80 dark:border-amber-900/50 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-[10px] font-extrabold uppercase tracking-wider border border-amber-200 dark:border-amber-800">
                    Zone 2: Outskirts / Rural
                  </span>
                  <h4 className="text-base font-extrabold text-slate-900 dark:text-white mt-1">
                    Outskirts & Regional Distance
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-zinc-400 mt-0.5">
                    Schools located in rural sub-counties, boarding schools outside town centers, and regional courier transit points.
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <Trees className="w-5 h-5" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                  Outskirts Delivery Fee (KES)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400 dark:text-zinc-500">
                    KES
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="10"
                    required
                    value={outskirtsRate}
                    onChange={(e) => setOutskirtsRate(parseFloat(e.target.value) || 0)}
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-amber-200 dark:border-amber-800 bg-white dark:bg-zinc-950 text-slate-900 dark:text-white font-extrabold text-lg focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white/70 dark:bg-zinc-900/80 border border-amber-100 dark:border-amber-950/60 text-[11px] text-slate-600 dark:text-zinc-400 space-y-1">
                <div className="font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Example Coverage:
                </div>
                <div>Alliance High (Kikuyu Outskirts), Kapsabet High, Mang'u High, Maseno School, Turkana & Garissa.</div>
              </div>
            </div>

          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <div className="text-xs text-slate-500 dark:text-zinc-400 flex items-center gap-2">
              <Info className="w-4 h-4 text-pink-500 shrink-0" />
              <span>Updating these fees immediately adjusts delivery costs calculated in customer cart & checkout across the entire platform.</span>
            </div>

            <button
              type="submit"
              disabled={savingDelivery}
              className="px-8 py-3.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-bold text-sm shadow-md shadow-pink-600/20 hover:shadow-lg flex items-center gap-2 transition-all cursor-pointer disabled:opacity-70 shrink-0"
            >
              {savingDelivery ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Delivery Rates</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* How it Works Information Card */}
      <div className="p-6 rounded-3xl bg-slate-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 text-xs text-slate-600 dark:text-zinc-400 space-y-2">
        <h4 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-500" /> Transparent Automated Checkout Breakdown
        </h4>
        <p>
          When a customer chooses a school during card customization or checkout:
        </p>
        <ul className="list-disc list-inside space-y-1 pl-1">
          <li>The platform looks up the school's Sub-County zone (CBD or Outskirts).</li>
          <li>The delivery fee above is added as a dedicated line item to the order total.</li>
          <li>The customer sees the card price and the school delivery fee clearly separated before completing payment via M-Pesa.</li>
        </ul>
      </div>
    </div>
  )
}
