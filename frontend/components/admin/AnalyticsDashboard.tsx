'use client'

import {
  TrendingUp, TrendingDown, Minus, BarChart3, ShoppingCart, Globe, Users,
  Target, Megaphone, MousePointerClick, ChevronDown, ChevronRight, Zap,
  PackageSearch, AlertTriangle, Activity, Timer, Archive, DollarSign,
  Package, ShieldAlert, ArrowUpRight
} from 'lucide-react'
import { useState } from 'react'

interface AnalyticsDashboardProps {
  analytics: any
  revenueChart: any[]
  loading: boolean
}

function TrendBadge({ current, previous }: { current: number; previous: number }) {
  if (previous === 0 && current === 0) return <span className="trend-neutral flex items-center gap-0.5 text-[10px] font-bold"><Minus className="w-3 h-3" /> —</span>
  if (previous === 0) return <span className="trend-up flex items-center gap-0.5 text-[10px] font-bold"><TrendingUp className="w-3 h-3" /> New</span>
  const pct = ((current - previous) / previous) * 100
  if (pct > 0) return <span className="trend-up flex items-center gap-0.5 text-[10px] font-bold"><TrendingUp className="w-3 h-3" /> +{pct.toFixed(0)}%</span>
  if (pct < 0) return <span className="trend-down flex items-center gap-0.5 text-[10px] font-bold"><TrendingDown className="w-3 h-3" /> {pct.toFixed(0)}%</span>
  return <span className="trend-neutral flex items-center gap-0.5 text-[10px] font-bold"><Minus className="w-3 h-3" /> 0%</span>
}

function buildSparkline(data: number[], w: number, h: number): string {
  if (!data.length) return ''
  const max = Math.max(...data, 1)
  const step = w / Math.max(data.length - 1, 1)
  return data.map((v, i) => {
    const x = i * step; const y = h - (v / max) * (h - 4) - 2
    return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')
}

function SectionHeader({ icon: Icon, title, subtitle, expanded, onToggle, color }: any) {
  return (
    <button onClick={onToggle} className="w-full flex items-center gap-3 p-4 rounded-2xl section-header-gradient transition-all hover:scale-[1.005]">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="text-left flex-1">
        <h2 className="text-base font-extrabold text-slate-900 dark:text-white">{title}</h2>
        <p className="text-[11px] text-slate-500 dark:text-zinc-400">{subtitle}</p>
      </div>
      {expanded ? <ChevronDown className="w-5 h-5 text-slate-400" /> : <ChevronRight className="w-5 h-5 text-slate-400" />}
    </button>
  )
}

function MetricCard({ label, value, icon: Icon, color, delay, trend, subtitle }: any) {
  return (
    <div className={`metric-card animate-fade-in-up animate-fade-in-up-${delay}`}>
      <div className="flex items-start justify-between mb-2">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-4.5 h-4.5" />
        </div>
        {trend && <div>{trend}</div>}
      </div>
      <p className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">{value}</p>
      <p className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mt-0.5">{label}</p>
      {subtitle && <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-1">{subtitle}</p>}
    </div>
  )
}

function PlaceholderCard({ label, icon: Icon, color, delay, hint }: any) {
  return (
    <div className={`metric-card placeholder animate-fade-in-up animate-fade-in-up-${delay}`}>
      <div className="flex items-start justify-between mb-2">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-4.5 h-4.5" />
        </div>
        <span className="placeholder-badge"><AlertTriangle className="w-2.5 h-2.5" /> Not Configured</span>
      </div>
      <p className="text-2xl font-extrabold text-slate-300 dark:text-zinc-600">—</p>
      <p className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mt-0.5">{label}</p>
      <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-1.5 italic">{hint}</p>
    </div>
  )
}

export default function AnalyticsDashboard({ analytics, revenueChart, loading }: AnalyticsDashboardProps) {
  const [sections, setSections] = useState({ sales: true, marketing: true, inventory: true })
  const toggle = (k: keyof typeof sections) => setSections(p => ({ ...p, [k]: !p[k] }))

  if (loading && !analytics) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-32 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 animate-pulse" />
        ))}
      </div>
    )
  }

  const s = analytics?.sales
  const t = analytics?.trends
  const o = analytics?.operations

  return (
    <div className="space-y-6">

      {/* ═══════════ 💰 SALES & FINANCIALS ═══════════ */}
      <SectionHeader
        icon={DollarSign} title="Sales & Financials" subtitle="Revenue, orders, AOV, and refund metrics"
        expanded={sections.sales} onToggle={() => toggle('sales')}
        color="bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400"
      />
      {sections.sales && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <MetricCard label="Gross Revenue" value={`KSh ${(s?.gross_revenue || 0).toLocaleString()}`}
            icon={DollarSign} color="bg-pink-100 dark:bg-pink-950 text-pink-600 dark:text-pink-400" delay={1}
            trend={t && <TrendBadge current={t.today_revenue} previous={t.yesterday_revenue} />}
            subtitle="Total sales value before deductions" />
          <MetricCard label="Net Revenue" value={`KSh ${(s?.net_revenue || 0).toLocaleString()}`}
            icon={TrendingUp} color="bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400" delay={2}
            subtitle="After excluding cancelled & disputed orders" />
          <MetricCard label="Average Order Value" value={`KSh ${(s?.aov || 0).toLocaleString()}`}
            icon={BarChart3} color="bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400" delay={3}
            subtitle="Net revenue ÷ paid orders" />
          <MetricCard label="Total Order Count" value={s?.total_order_count || 0}
            icon={Package} color="bg-violet-100 dark:bg-violet-950 text-violet-600 dark:text-violet-400" delay={4}
            trend={t && <TrendBadge current={t.today_orders} previous={t.yesterday_orders} />}
            subtitle={`${s?.paid_order_count || 0} paid · ${s?.pending_count || 0} pending`} />
          <MetricCard label="Return & Refund Rate" value={`${s?.refund_rate || 0}%`}
            icon={ShieldAlert} color={`${(s?.refund_rate || 0) > 5 ? 'bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400' : 'bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400'}`} delay={5}
            subtitle={`${s?.refunded_order_count || 0} cancelled/disputed of ${s?.total_order_count || 0}`} />
          <MetricCard label="Gross Profit Margin" value={`${s?.gross_profit_margin || 0}%`}
            icon={Zap} color="bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400" delay={6}
            subtitle="Gross profit margin derived from card COGS" />
        </div>
      )}

      {/* Revenue Sparkline Chart */}
      {sections.sales && revenueChart.length > 0 && (
        <div className="metric-card animate-fade-in-up animate-fade-in-up-2">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-extrabold text-slate-900 dark:text-white">30-Day Revenue Trend</p>
              <p className="text-[10px] text-slate-400 dark:text-zinc-500">Daily revenue over the last 30 days</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-extrabold text-pink-600 dark:text-pink-400">
                KSh {revenueChart.reduce((a, d) => a + d.revenue, 0).toLocaleString()}
              </p>
              <p className="text-[10px] text-slate-400">Period Total</p>
            </div>
          </div>
          <div className="sparkline-container">
            <svg viewBox={`0 0 400 60`} preserveAspectRatio="none">
              <defs>
                <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ec4899" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#ec4899" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d={buildSparkline(revenueChart.map(d => d.revenue), 400, 60)}
                fill="none" stroke="#ec4899" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d={`${buildSparkline(revenueChart.map(d => d.revenue), 400, 60)} L400,60 L0,60 Z`}
                fill="url(#sparkGrad)" />
            </svg>
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[9px] text-slate-400">{revenueChart[0]?.date}</span>
            <span className="text-[9px] text-slate-400">{revenueChart[revenueChart.length - 1]?.date}</span>
          </div>
        </div>
      )}

      <div className="section-divider" />

      {/* ═══════════ 📈 MARKETING & TRAFFIC ═══════════ */}
      <SectionHeader
        icon={Megaphone} title="Marketing & Traffic" subtitle="Conversion, traffic sources, CAC, and ad performance"
        expanded={sections.marketing} onToggle={() => toggle('marketing')}
        color="bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400"
      />
      {sections.marketing && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <PlaceholderCard label="Conversion Rate (CR)" icon={Target} delay={1}
            color="bg-blue-100 dark:bg-blue-950 text-blue-400" hint="Connect Google Analytics" />
          <PlaceholderCard label="Total Web Traffic" icon={Globe} delay={2}
            color="bg-cyan-100 dark:bg-cyan-950 text-cyan-400" hint="Connect Google Analytics" />
          <PlaceholderCard label="Traffic Sources" icon={ArrowUpRight} delay={3}
            color="bg-indigo-100 dark:bg-indigo-950 text-indigo-400" hint="Requires UTM tracking" />
          <PlaceholderCard label="Customer Acquisition Cost" icon={Users} delay={4}
            color="bg-violet-100 dark:bg-violet-950 text-violet-400" hint="Requires marketing spend data" />
          <PlaceholderCard label="Return on Ad Spend (ROAS)" icon={Megaphone} delay={5}
            color="bg-fuchsia-100 dark:bg-fuchsia-950 text-fuchsia-400" hint="Connect Meta/Google Ads" />
          <PlaceholderCard label="Cart Abandonment Rate" icon={ShoppingCart} delay={6}
            color="bg-orange-100 dark:bg-orange-950 text-orange-400" hint="Requires cart session tracking" />
        </div>
      )}

      <div className="section-divider" />

      {/* ═══════════ 🗒 INVENTORY & OPERATIONS ═══════════ */}
      <SectionHeader
        icon={PackageSearch} title="Inventory & Operations" subtitle="Top products, slow stock, and fulfillment metrics"
        expanded={sections.inventory} onToggle={() => toggle('inventory')}
        color="bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400"
      />
      {sections.inventory && (
        <div className="space-y-4">
          {/* Top-Selling Products */}
          <div className="metric-card animate-fade-in-up animate-fade-in-up-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-extrabold text-slate-900 dark:text-white">Top-Selling Products</p>
                <p className="text-[10px] text-slate-400 dark:text-zinc-500">By order volume and revenue</p>
              </div>
            </div>
            {analytics?.top_products?.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-800">
                      <th className="text-left py-2 px-1 text-[10px] uppercase font-bold text-slate-400 dark:text-zinc-500">#</th>
                      <th className="text-left py-2 px-1 text-[10px] uppercase font-bold text-slate-400 dark:text-zinc-500">Design</th>
                      <th className="text-right py-2 px-1 text-[10px] uppercase font-bold text-slate-400 dark:text-zinc-500">Orders</th>
                      <th className="text-right py-2 px-1 text-[10px] uppercase font-bold text-slate-400 dark:text-zinc-500">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.top_products.map((p: any, i: number) => (
                      <tr key={p.design_id} className="border-b border-zinc-100 dark:border-zinc-800/50 hover:bg-slate-50 dark:hover:bg-zinc-800/30">
                        <td className="py-2.5 px-1 font-bold text-slate-400">{i + 1}</td>
                        <td className="py-2.5 px-1 font-bold text-slate-800 dark:text-zinc-200">{p.design_name}</td>
                        <td className="py-2.5 px-1 text-right font-semibold">{p.order_count}</td>
                        <td className="py-2.5 px-1 text-right font-bold text-pink-600 dark:text-pink-400">KSh {p.total_revenue.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-slate-400 dark:text-zinc-500 italic py-4 text-center">No order data yet</p>
            )}
          </div>

          {/* Slow-Moving, Size, and Channel Distribution Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Slow-Moving Inventory */}
            <div className="metric-card animate-fade-in-up animate-fade-in-up-2">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Archive className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-extrabold text-slate-900 dark:text-white">Slow-Moving Inventory</p>
                  <p className="text-[10px] text-slate-400 dark:text-zinc-500">No orders in last 30 days</p>
                </div>
              </div>
              {analytics?.slow_moving?.length > 0 ? (
                <ul className="space-y-2">
                  {analytics.slow_moving.map((s: any) => (
                    <li key={s.design_id} className="flex items-center justify-between p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40">
                      <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300">{s.design_name}</span>
                      <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">0 orders</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-emerald-500 font-semibold py-4 text-center">✓ All designs have recent orders</p>
              )}
            </div>

            {/* Size Distribution */}
            <div className="metric-card animate-fade-in-up animate-fade-in-up-3">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-950 text-violet-600 dark:text-violet-400 flex items-center justify-center">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-extrabold text-slate-900 dark:text-white">Size Distribution</p>
                  <p className="text-[10px] text-slate-400 dark:text-zinc-500">Card sizes ordered</p>
                </div>
              </div>
              {analytics?.size_distribution?.length > 0 ? (
                <div className="space-y-2">
                  {analytics.size_distribution.map((s: any) => {
                    const total = analytics.size_distribution.reduce((a: number, b: any) => a + b.count, 0)
                    const pct = total > 0 ? (s.count / total) * 100 : 0
                    return (
                      <div key={s.size}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="font-bold text-slate-700 dark:text-zinc-300">{s.size}</span>
                          <span className="font-semibold text-slate-500">{s.count} ({pct.toFixed(0)}%)</span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden">
                          <div className="h-full rounded-full bg-gradient-to-r from-pink-500 to-violet-500 transition-all duration-700"
                            style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic py-4 text-center">No data</p>
              )}
            </div>

            {/* Channel Distribution */}
            <div className="metric-card animate-fade-in-up animate-fade-in-up-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-extrabold text-slate-900 dark:text-white">Channel Breakdown</p>
                  <p className="text-[10px] text-slate-400 dark:text-zinc-500">Sales channels</p>
                </div>
              </div>
              {o?.channel_distribution?.length > 0 ? (
                <div className="space-y-2">
                  {o.channel_distribution.map((c: any) => {
                    const total = o.channel_distribution.reduce((a: number, b: any) => a + b.count, 0)
                    const pct = total > 0 ? (c.count / total) * 100 : 0
                    return (
                      <div key={c.channel}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="font-bold text-slate-700 dark:text-zinc-300 capitalize">{c.channel}</span>
                          <span className="font-semibold text-slate-500">{c.count} ({pct.toFixed(0)}%)</span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden">
                          <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-700"
                            style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic py-4 text-center">No channel data yet</p>
              )}
            </div>
          </div>

          {/* Live cards for fulfillment metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <MetricCard label="Low Stock Alerts" value={o?.low_stock_count !== undefined ? `${o.low_stock_count} SKUs` : '0 SKUs'}
              icon={AlertTriangle} color={o?.low_stock_count > 0 ? 'bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400' : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400'} delay={4}
              subtitle="SKUs below their designated reorder point" />
            <MetricCard label="Fulfillment Speed" value={o?.avg_fulfillment_hours ? `${o.avg_fulfillment_hours} hrs` : '—'}
              icon={Timer} color="bg-teal-100 dark:bg-teal-950 text-teal-600 dark:text-teal-400" delay={5}
              subtitle="Avg hours from payment to rider dispatch" />
            <MetricCard label="Delivery Lead Time" value={o?.avg_delivery_hours ? `${o.avg_delivery_hours} hrs` : '—'}
              icon={Activity} color="bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400" delay={6}
              subtitle="Avg hours from dispatch to school handoff" />
          </div>
        </div>
      )}
    </div>
  )
}
