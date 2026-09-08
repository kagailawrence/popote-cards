'use client'

import { useState } from 'react'
import { AlertCircle, CheckCircle2, ShieldAlert, Send } from 'lucide-react'
import { toast } from 'sonner'

export default function DisputePage() {
  const [orderNumber, setOrderNumber] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [channel, setChannel] = useState<'whatsapp' | 'email' | 'call'>('whatsapp')
  const [mpesaTransactionCode, setMpesaTransactionCode] = useState('')
  const [description, setDescription] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ticketCreated, setTicketCreated] = useState<any>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!orderNumber || !customerPhone || !description) {
      const msg = 'Please fill in Order Number, Customer Phone, and Issue Description.'
      setError(msg)
      toast.error(msg)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/v1/disputes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderNumber,
          customerPhone,
          channel,
          mpesaTransactionCode: mpesaTransactionCode || undefined,
          description,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to submit dispute')

      setTicketCreated(data.data)
      toast.success('Dispute ticket submitted successfully!')
    } catch (err: any) {
      const msg = err.message || 'Submission error'
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Raise Support Ticket or Dispute</h1>
        <p className="text-slate-600 dark:text-zinc-400 text-sm mt-1">
          Having an issue with print details, delivery timeframe, or M-Pesa payment? Submit a dispute ticket for instant resolution.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {ticketCreated ? (
        <div className="p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-pink-500/40 text-center space-y-4 shadow-xl">
          <div className="w-16 h-16 rounded-full bg-green-50 dark:bg-green-950 border border-green-300 dark:border-green-500/30 flex items-center justify-center mx-auto text-green-600 dark:text-green-400">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Dispute Ticket Received</h2>
          <p className="text-xs text-slate-600 dark:text-zinc-400 max-w-md mx-auto">
            Ticket for Order <strong className="text-pink-600 dark:text-pink-400">{ticketCreated.order_number}</strong> has been assigned to our support desk. We will reach you on <strong className="text-slate-900 dark:text-white">{ticketCreated.customer_phone}</strong> via {ticketCreated.channel.toUpperCase()}.
          </p>
          <button
            onClick={() => {
              setTicketCreated(null)
              setOrderNumber('')
              setDescription('')
            }}
            className="px-6 py-2.5 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-900 dark:text-white font-semibold text-xs transition-colors"
          >
            Submit Another Ticket
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-6 shadow-sm dark:shadow-2xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-400 mb-1">Order Number *</label>
              <input
                type="text"
                required
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                placeholder="e.g. ORD-1724500000"
                className="w-full rounded-xl bg-slate-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-slate-900 dark:text-white text-xs p-3.5 focus:border-pink-500 focus:outline-none shadow-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-400 mb-1">Contact Phone Number *</label>
              <input
                type="tel"
                required
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="e.g. 0712345678"
                className="w-full rounded-xl bg-slate-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-slate-900 dark:text-white text-xs p-3.5 focus:border-pink-500 focus:outline-none shadow-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-400 mb-1">Preferred Response Channel</label>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value as any)}
                className="w-full rounded-xl bg-slate-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-slate-900 dark:text-white text-xs p-3.5 focus:outline-none shadow-sm"
              >
                <option value="whatsapp">WhatsApp Message</option>
                <option value="call">Direct Phone Call</option>
                <option value="email">Email Response</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-400 mb-1">M-Pesa Trans Code (Optional)</label>
              <input
                type="text"
                value={mpesaTransactionCode}
                onChange={(e) => setMpesaTransactionCode(e.target.value)}
                placeholder="e.g. QKH7892301"
                className="w-full rounded-xl bg-slate-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-slate-900 dark:text-white text-xs p-3.5 focus:border-pink-500 focus:outline-none shadow-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-400 mb-1">Issue Description *</label>
            <textarea
              rows={4}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the issue with your order (e.g. incorrect student name, wrong delivery address, delayed dispatch)..."
              className="w-full rounded-xl bg-slate-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-slate-900 dark:text-white text-xs p-4 focus:border-pink-500 focus:outline-none shadow-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-extrabold text-sm shadow-lg shadow-pink-600/30 flex items-center justify-center gap-2 transition-transform hover:scale-[1.01]"
          >
            <Send className="w-4 h-4" /> Submit Support Dispute Ticket
          </button>
        </form>
      )}
    </div>
  )
}
