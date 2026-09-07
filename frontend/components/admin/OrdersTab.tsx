'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import {
  Package, Search, Filter, Download, Printer, RefreshCw, Eye, CheckCircle2,
  Clock, Truck, ChevronRight, X, FileText, Phone, UserCheck, ShieldAlert, Sparkles, MapPin
} from 'lucide-react'

interface Order {
  id: string
  order_number: string
  status: string
  total_amount_kes: number
  channel?: 'web' | 'phone' | 'agent'
  created_at: string
  phone: string
  email?: string
  item_count: number
  recipients?: string
  destination_counties?: string
  print_hubs?: string
  items?: any[]
}

interface OrdersTabProps {
  token: string
  onOpenManualOrder?: () => void
}

export default function OrdersTab({ token, onOpenManualOrder }: OrdersTabProps) {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [channelFilter, setChannelFilter] = useState<string>('all')

  // Inspection Modal State (Print Package Inspector)
  const [selectedOrderForPrint, setSelectedOrderForPrint] = useState<Order | null>(null)
  const [loadingOrderDetails, setLoadingOrderDetails] = useState(false)
  const [downloadingOrderId, setDownloadingOrderId] = useState<string | null>(null)
  const [downloadingItemId, setDownloadingItemId] = useState<string | null>(null)

  // Order Details / Timeline Modal State
  const [selectedOrderForTimeline, setSelectedOrderForTimeline] = useState<any>(null)
  const [loadingTimeline, setLoadingTimeline] = useState(false)

  // Live Real-Time Order Stream State
  const [liveConnected, setLiveConnected] = useState(false)
  const [newOrderToast, setNewOrderToast] = useState<Order | null>(null)
  const [highlightedOrderIds, setHighlightedOrderIds] = useState<string[]>([])

  // Synthesize pleasant two-tone chime for incoming orders
  const playNewOrderChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
      if (!AudioCtx) return
      const ctx = new AudioCtx()
      
      const osc1 = ctx.createOscillator()
      const osc2 = ctx.createOscillator()
      const gainNode = ctx.createGain()

      osc1.type = 'sine'
      osc1.frequency.setValueAtTime(587.33, ctx.currentTime) // D5
      osc1.frequency.setValueAtTime(880, ctx.currentTime + 0.12) // A5

      gainNode.gain.setValueAtTime(0.25, ctx.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7)

      osc1.connect(gainNode)
      gainNode.connect(ctx.destination)

      osc1.start(ctx.currentTime)
      osc1.stop(ctx.currentTime + 0.7)
    } catch {
      // Audio context policy or not supported
    }
  }

  const fetchOrders = async () => {
    setLoading(true)
    setError('')
    try {
      const activeTok = token || (typeof window !== 'undefined' ? (localStorage.getItem('fair_admin_token') || localStorage.getItem('fair_token')) : '')
      const res = await fetch('http://localhost:4000/api/v1/admin/orders?limit=100', {
        headers: { Authorization: `Bearer ${activeTok}` }
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to fetch platform orders')
      setOrders(data.data || [])
    } catch (err: any) {
      setError(err.message || 'Error loading orders')
    } finally {
      setLoading(false)
    }
  }

  const fetchOrdersSilently = async () => {
    try {
      const activeTok = token || (typeof window !== 'undefined' ? (localStorage.getItem('fair_admin_token') || localStorage.getItem('fair_token')) : '')
      const res = await fetch('http://localhost:4000/api/v1/admin/orders?limit=100', {
        headers: { Authorization: `Bearer ${activeTok}` }
      })
      const data = await res.json()
      if (res.ok && data.data) {
        setOrders(data.data)
      }
    } catch {}
  }

  useEffect(() => {
    fetchOrders()
  }, [token])

  // Real-Time Server-Sent Events (SSE) live connection
  useEffect(() => {
    const activeTok = token || (typeof window !== 'undefined' ? (localStorage.getItem('fair_admin_token') || localStorage.getItem('fair_token')) : '')
    if (!activeTok) return

    let eventSource: EventSource | null = null
    let pollInterval: NodeJS.Timeout | null = null

    const connectSSE = () => {
      try {
        const streamUrl = `http://localhost:4000/api/v1/admin/orders/stream?token=${encodeURIComponent(activeTok)}`
        eventSource = new EventSource(streamUrl)

        eventSource.onopen = () => {
          setLiveConnected(true)
        }

        eventSource.addEventListener('order_created', (e) => {
          try {
            const newOrder: Order = JSON.parse(e.data)
            if (newOrder && newOrder.id) {
              setOrders(prev => {
                if (prev.some(o => o.id === newOrder.id)) return prev
                return [newOrder, ...prev]
              })

              // Highlight newly arrived order row and play audio chime
              setHighlightedOrderIds(prev => [...prev, newOrder.id])
              setNewOrderToast(newOrder)
              playNewOrderChime()

              // Auto-remove highlight glow after 12s
              setTimeout(() => {
                setHighlightedOrderIds(prev => prev.filter(id => id !== newOrder.id))
              }, 12000)

              // Auto-hide toast notification after 9s
              setTimeout(() => {
                setNewOrderToast(current => current?.id === newOrder.id ? null : current)
              }, 9000)
            }
          } catch (err) {
            console.error('Failed to parse order_created SSE event', err)
          }
        })

        eventSource.addEventListener('order_updated', (e) => {
          try {
            const data = JSON.parse(e.data)
            if (data.orderId && data.status) {
              setOrders(prev => prev.map(o => o.id === data.orderId ? { ...o, status: data.status } : o))
            }
          } catch (err) {
            console.error('Failed to parse order_updated SSE event', err)
          }
        })

        eventSource.onerror = () => {
          setLiveConnected(false)
          eventSource?.close()
          // Reconnect after 5 seconds
          setTimeout(connectSSE, 5000)
        }
      } catch (err) {
        setLiveConnected(false)
      }
    }

    connectSSE()

    // Smart background fallback refresh every 25 seconds
    pollInterval = setInterval(() => {
      fetchOrdersSilently()
    }, 25000)

    return () => {
      if (eventSource) eventSource.close()
      if (pollInterval) clearInterval(pollInterval)
    }
  }, [token])

  // Status Change Handler
  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch(`http://localhost:4000/api/v1/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update status')

      // Optimistic state update
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o))
      toast.success(`Order status updated to '${newStatus}'`)
    } catch (err: any) {
      toast.error(err.message || 'Error updating order status')
    }
  }

  // Open Print Inspection Modal
  const handleOpenPrintModal = async (orderId: string) => {
    const found = orders.find(o => o.id === orderId)
    if (!found) return
    setSelectedOrderForPrint(found)
    setLoadingOrderDetails(true)
    try {
      const res = await fetch(`http://localhost:4000/api/v1/admin/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (res.ok && data.data) {
        setSelectedOrderForPrint(data.data)
      }
    } catch (err: any) {
      console.error('Failed to load order item print specs', err)
      toast.error(err.message || 'Failed to load order print specs')
    } finally {
      setLoadingOrderDetails(false)
    }
  }

  // Open Order Audit Timeline Modal
  const handleOpenTimelineModal = async (orderNumber: string) => {
    setLoadingTimeline(true)
    setSelectedOrderForTimeline(null)
    try {
      const res = await fetch(`http://localhost:4000/api/v1/orders/timeline/${orderNumber}`)
      const data = await res.json()
      if (res.ok && data.data) {
        setSelectedOrderForTimeline(data.data)
      }
    } catch (err: any) {
      console.error('Failed to load order tracking timeline', err)
      toast.error(err.message || 'Failed to load tracking timeline')
    } finally {
      setLoadingTimeline(false)
    }
  }

  // PDF & ZIP Handlers
  const handleDownloadItemPdf = async (item: any) => {
    try {
      let res = await fetch(`http://localhost:4000/api/v1/rendering/vector-pdf/${item.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          recipientName: item.recipient_full_names,
          admNo: item.admission_number,
          schoolName: item.school_name,
          message: item.message_body || 'May God grant you knowledge and wisdom as you sit for your KCSE Examinations!',
          font: item.message_font || 'serif',
          colour: item.message_colour || '#ec4899'
        })
      })

      if (!res.ok) {
        // Fallback to export router item download
        res = await fetch(`http://localhost:4000/api/v1/admin/export/items/${item.id}/download-pdf`, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          }
        })
      }

      if (!res.ok) {
        let errMessage = 'Failed to generate high-resolution print PDF'
        try {
          const errData = await res.json()
          if (errData.error) errMessage = errData.error
        } catch {}
        throw new Error(errMessage)
      }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `PRINT_${item.size || 'CARD'}_${(item.recipient_full_names || 'Recipient').replace(/\s+/g, '_')}.pdf`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Vector Print PDF generated and downloaded!')
    } catch (err: any) {
      toast.error(err.message || 'Error generating PDF')
    }
  }

  const handleDownloadOrderZip = async (orderId: string, orderNumber: string) => {
    setDownloadingOrderId(orderId)
    try {
      const res = await fetch(`http://localhost:4000/api/v1/admin/export/orders/${orderId}/zip`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      })

      if (!res.ok) {
        let errMessage = 'Failed to generate order resource package'
        try {
          const errData = await res.json()
          if (errData.error) errMessage = errData.error
        } catch {}
        throw new Error(errMessage)
      }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Order_${orderNumber}_Design_and_Resources_Package.zip`
      a.click()
      URL.revokeObjectURL(url)
      toast.success(`Resource package for #${orderNumber} downloaded!`)
    } catch (err: any) {
      toast.error(err.message || 'Error downloading compressed order package')
    } finally {
      setDownloadingOrderId(null)
    }
  }

  const handleDownloadItemZip = async (itemId: string, recipientName: string, orderNumber: string) => {
    setDownloadingItemId(itemId)
    try {
      const res = await fetch(`http://localhost:4000/api/v1/admin/export/items/${itemId}/zip`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      })

      if (!res.ok) {
        let errMessage = 'Failed to generate card resource package'
        try {
          const errData = await res.json()
          if (errData.error) errMessage = errData.error
        } catch {}
        throw new Error(errMessage)
      }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Card_${orderNumber}_${(recipientName || 'Card').replace(/\s+/g, '_')}_Resources.zip`
      a.click()
      URL.revokeObjectURL(url)
      toast.success(`Card package for ${recipientName} downloaded!`)
    } catch (err: any) {
      toast.error(err.message || 'Error downloading compressed card package')
    } finally {
      setDownloadingItemId(null)
    }
  }

  const generateDocketHtml = (item: any, orderNumber: string, orderData?: any) => {
    const photoFileName = item.custom_photo_storage_path ? item.custom_photo_storage_path.split('/').pop() : ''
    const photoUrl = photoFileName
      ? `http://localhost:4000/api/v1/files/customer-photos/${photoFileName}?token=${token}`
      : ''

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8"/>
        <title>PRINT DOCKET #${orderNumber} • ${item.recipient_full_names}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@600;800&family=Playfair+Display:ital,wght@0,600;0,700;1,400&family=Inter:wght@400;600;800;900&display=swap');
          
          @page { size: A4 portrait; margin: 12mm; }
          * { box-sizing: border-box; }
          body { 
            font-family: 'Inter', system-ui, sans-serif; 
            padding: 24px; 
            color: #0f172a; 
            max-width: 900px; 
            margin: 0 auto;
            background: #fff;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .docket-header { 
            display: flex; 
            justify-content: space-between; 
            align-items: flex-start; 
            border-bottom: 3px solid #be185d; 
            padding-bottom: 16px; 
            margin-bottom: 24px; 
          }
          .badge { 
            background: #fce7f3; 
            color: #9d174d; 
            font-weight: 800; 
            padding: 6px 14px; 
            border-radius: 9999px; 
            font-size: 11px; 
            letter-spacing: 0.08em; 
            text-transform: uppercase;
            border: 1px solid #f472b6;
            display: inline-block;
          }
          .order-title { font-size: 26px; font-weight: 900; margin: 8px 0 4px 0; color: #111827; }
          .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
          .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px; }
          .card-box { 
            background: #f8fafc; 
            border: 1.5px solid #e2e8f0; 
            border-radius: 14px; 
            padding: 16px; 
            margin-bottom: 18px; 
          }
          .label { font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
          .val-lg { font-size: 18px; font-weight: 900; color: #0f172a; margin-top: 2px; }
          .val-md { font-size: 14px; font-weight: 800; color: #1e293b; margin-top: 2px; }
          .val-sm { font-size: 12px; font-weight: 600; color: #334155; margin-top: 2px; }
          .highlight-tag { color: #db2777; font-weight: 900; }
          .message-box { 
            font-family: 'Playfair Display', Georgia, serif; 
            font-size: 17px; 
            font-style: italic; 
            line-height: 1.6;
            background: #fff; 
            border: 1.5px dashed #f472b6; 
            padding: 22px; 
            border-radius: 12px; 
            color: ${item.message_colour || '#9d174d'};
            text-align: center;
            margin-top: 10px;
          }
          .photo-container {
            border: 2px solid #e2e8f0;
            border-radius: 12px;
            overflow: hidden;
            width: 140px;
            height: 170px;
            background: #e2e8f0;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .photo-img { width: 100%; height: 100%; object-fit: cover; }
          .checklist-item { display: flex; align-items: center; gap: 8px; font-size: 11px; font-weight: 700; color: #475569; margin-bottom: 6px; }
          .checkbox { width: 14px; height: 14px; border: 1.5px solid #94a3b8; border-radius: 3px; }
          .print-btn-bar { 
            background: #0f172a; 
            color: #fff; 
            padding: 12px 20px; 
            border-radius: 12px; 
            margin-bottom: 20px; 
            display: flex; 
            justify-content: space-between; 
            align-items: center; 
          }
          .print-btn {
            background: #ec4899;
            color: #fff;
            border: none;
            padding: 8px 18px;
            border-radius: 8px;
            font-weight: 800;
            font-size: 12px;
            cursor: pointer;
          }
          @media print {
            .no-print { display: none !important; }
            body { padding: 0; }
            .card-box { border: 1px solid #cbd5e1; }
          }
        </style>
      </head>
      <body>
        <div class="print-btn-bar no-print">
          <div>
            <strong>Commercial Production Docket</strong> — Ready for Print & Quality Control
          </div>
          <button class="print-btn" onclick="window.print()">🖨️ Click to Print Docket (Ctrl+P)</button>
        </div>

        <div class="docket-header">
          <div>
            <span class="badge">FAIR SUCCESS CARDS • COMMERCIAL PRINT PACKAGE (${item.size || 'A4'})</span>
            <h1 class="order-title">Order #${orderNumber}</h1>
            <div class="val-sm">Placed: ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} | Status: <strong>${item.print_status || 'PRINT QUEUED'}</strong></div>
          </div>
          <div style="text-align: right;">
            <div class="label">Target Print Hub</div>
            <div class="val-lg highlight-tag">📍 ${item.print_region_name || orderData?.print_hubs || 'Central Hub'}</div>
            <div class="val-sm">Customer: ${orderData?.phone || 'Direct POS'}</div>
          </div>
        </div>

        <!-- Candidate Master Details Banner -->
        <div class="card-box" style="background: #fdf2f8; border-color: #fbcfe8;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div class="label" style="color: #be185d;">Candidate Recipient Information</div>
            <span style="background: #be185d; color: #fff; font-size: 10px; font-weight: 800; padding: 2px 10px; border-radius: 9999px;">
              ${item.religion === 'christian' || (!item.religion && (!item.message_body || item.message_body.toLowerCase().includes('god') || item.message_body.toLowerCase().includes('christ') || item.message_body.toLowerCase().includes('lord') || item.message_body.toLowerCase().includes('philippians') || item.message_body.toLowerCase().includes('jeremiah'))) ? '✝️ Christian Blessing' : item.religion === 'muslim' || (item.message_body && item.message_body.toLowerCase().includes('allah')) ? '☪️ Islamic Blessing' : '🎓 General / Secular'}
            </span>
          </div>
          <div class="val-lg" style="font-size: 22px; color: #831843;">🎓 ${item.recipient_full_names}</div>
          <div class="grid-3" style="margin-top: 12px;">
            <div>
              <div class="label">Index / Admission No</div>
              <div class="val-md">${item.admission_number}</div>
            </div>
            <div>
              <div class="label">School / Institution</div>
              <div class="val-md">${item.school_name} ${item.class_form ? `(${item.class_form})` : ''}</div>
            </div>
            <div>
              <div class="label">Destination County & Sub-County</div>
              <div class="val-md">${item.county_name || orderData?.destination_counties || 'Kenya'}${item.sub_county_name ? ` • ${item.sub_county_name}` : ''}</div>
            </div>
          </div>
        </div>

        <!-- Typography & Message Specifications -->
        <div class="card-box">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div class="label">Personal Calligraphy Inscription (Inside Right - Page 3)</div>
            <div class="val-sm" style="font-family: monospace;">Font: ${item.message_font || 'serif'} | Colour: ${item.message_colour || '#be185d'}</div>
          </div>
          
          <div class="message-box">
            <div style="font-weight: 700; margin-bottom: 8px; font-size: 20px;">Dear ${item.recipient_full_names},</div>
            "${item.message_body || item.custom_message || 'May God grant you wisdom and excellent triumph in your exams!'}"
            <div style="margin-top: 12px; font-size: 13px; color: #64748b; font-style: italic;">With Warmest Wishes & Sincere Prayers</div>
          </div>
        </div>

        <!-- Inside Left Photo Insert & Technical Specs -->
        <div class="grid-2">
          <div class="card-box">
            <div class="label">Inside Left Insert (Page 2)</div>
            ${photoFileName ? `
              <div style="display: flex; gap: 16px; align-items: center; margin-top: 10px;">
                <div class="photo-container">
                  <img class="photo-img" src="${photoUrl}" alt="Candidate Photo" onerror="this.onerror=null; this.src='http://localhost:4000/api/v1/files/design-images/${photoFileName}'"/>
                </div>
                <div>
                  <div class="label">Status</div>
                  <div class="val-md highlight-tag">✓ Custom Photo Attached</div>
                  <div class="label" style="margin-top: 8px;">File Name</div>
                  <div class="val-sm" style="font-family: monospace; font-size: 10px; word-break: break-all;">${photoFileName}</div>
                </div>
              </div>
            ` : `
              <div style="margin-top: 10px; padding: 20px; text-align: center; border: 1.5px dashed #cbd5e1; border-radius: 10px; color: #64748b; font-size: 12px;">
                <strong>Standard Dedication Crest</strong><br/>
                No custom photo attached. Elegant candidate crest will be rendered.
              </div>
            `}
          </div>

          <div class="card-box">
            <div class="label">Quality & Print Shop Production Checklist</div>
            <div style="margin-top: 10px;">
              <div class="checklist-item"><div class="checkbox"></div> 350 GSM Heavy Board Loaded (${item.size || 'A4'})</div>
              <div class="checklist-item"><div class="checkbox"></div> 4-Page Dual-Sided Color Calibration Verified</div>
              <div class="checklist-item"><div class="checkbox"></div> Machine Crease & Center Folding Completed</div>
              <div class="checklist-item"><div class="checkbox"></div> Student Index & School Name Match Checked</div>
              <div class="checklist-item"><div class="checkbox"></div> Poly-bag & Envelop Seal Applied</div>
              <div class="checklist-item"><div class="checkbox"></div> Regional Rider Routing Tag Attached</div>
            </div>
          </div>
        </div>

        <!-- Footer Stamp -->
        <div style="border-top: 1px solid #e2e8f0; padding-top: 12px; display: flex; justify-content: space-between; font-size: 10px; color: #94a3b8; font-family: monospace;">
          <span>FAIR CARDS KENYA PRODUCTION SYSTEM • ITEM ID: ${item.id}</span>
          <span>PRINT OPERATOR INITIALS: _________</span>
        </div>
      </body>
      </html>
    `
  }

  const handleDownloadCardPrintPackage = (item: any, orderNumber: string) => {
    const htmlContent = generateDocketHtml(item, orderNumber, selectedOrderForPrint)
    const blob = new Blob([htmlContent], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `PRINT_DOCKET_${orderNumber}_${item.recipient_full_names.replace(/\s+/g, '_')}.html`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handlePrintDocketDirectly = (item: any, orderNumber: string) => {
    const htmlContent = generateDocketHtml(item, orderNumber, selectedOrderForPrint)
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(htmlContent)
      printWindow.document.close()
      printWindow.focus()
    }
  }

  const handleDownloadPhotoAsset = async (item: any, orderNumber: string) => {
    if (!item.custom_photo_storage_path) return
    const photoFileName = item.custom_photo_storage_path.split('/').pop()
    const photoUrl = `http://localhost:4000/api/v1/files/customer-photos/${photoFileName}?token=${token}`
    
    try {
      let res = await fetch(photoUrl)
      if (!res.ok) {
        res = await fetch(`http://localhost:4000/api/v1/files/design-images/${photoFileName}`)
      }
      if (!res.ok) throw new Error('Could not download photo resource')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const ext = photoFileName.includes('.') ? photoFileName.split('.').pop() : 'jpg'
      a.download = `PHOTO_${orderNumber}_${item.recipient_full_names.replace(/\s+/g, '_')}.${ext}`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Candidate photo asset downloaded')
    } catch (err: any) {
      toast.error(err.message || 'Error downloading photo asset')
    }
  }

  const handleBulkExportZip = async () => {
    try {
      const res = await fetch('http://localhost:4000/api/v1/admin/export/regional-print-zip', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Bulk export failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `REGIONAL_PRINT_PACKAGE_${new Date().toISOString().slice(0, 10)}.zip`
      a.click()
      toast.success('Bulk Print Package ZIP downloaded successfully!')
    } catch (err: any) {
      toast.error(err.message || 'Error exporting print package ZIP archive')
    }
  }

  // Filtered Orders
  const filteredOrders = orders.filter(o => {
    const query = searchQuery.toLowerCase()
    const matchesSearch =
      o.order_number.toLowerCase().includes(query) ||
      o.phone.includes(query) ||
      (o.recipients && o.recipients.toLowerCase().includes(query)) ||
      (o.destination_counties && o.destination_counties.toLowerCase().includes(query))

    const matchesStatus = statusFilter === 'all' || o.status === statusFilter
    const matchesChannel = channelFilter === 'all' || o.channel === channelFilter

    return matchesSearch && matchesStatus && matchesChannel
  })

  // KPI Calculations
  const totalRev = orders.reduce((sum, o) => sum + Number(o.total_amount_kes), 0)
  const paidCount = orders.filter(o => o.status === 'paid' || o.status === 'delivered' || o.status === 'dispatched').length
  const pendingCount = orders.filter(o => o.status === 'pending_payment').length

  return (
    <div className="space-y-6">
      {/* Live New Order Pop-up Notification Banner */}
      {newOrderToast && (
        <div className="p-4 rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white shadow-2xl shadow-emerald-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in slide-in-from-top-4 duration-300 border border-emerald-400/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-white/20 backdrop-blur-md shadow-inner shrink-0">
              <Sparkles className="w-5 h-5 text-yellow-300 animate-spin" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-white/25 px-2 py-0.5 rounded-full">
                  🔔 INSTANT LIVE ORDER
                </span>
                <span className="text-xs font-black">#{newOrderToast.order_number}</span>
              </div>
              <p className="text-xs font-medium text-emerald-50 mt-0.5">
                New order from <strong className="text-white">{newOrderToast.phone}</strong> for <strong className="text-white">{newOrderToast.recipients || `${newOrderToast.item_count} Candidate(s)`}</strong> • <span className="font-extrabold text-yellow-300">KES {Number(newOrderToast.total_amount_kes).toLocaleString()}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={() => {
                handleOpenPrintModal(newOrderToast.id)
                setNewOrderToast(null)
              }}
              className="px-4 py-2 rounded-xl bg-white text-emerald-900 font-extrabold text-xs shadow-md hover:bg-emerald-50 transition-all flex items-center gap-1.5 active:scale-95"
            >
              <Printer className="w-3.5 h-3.5 text-emerald-700" /> Inspect Print Package
            </button>
            <button
              onClick={() => setNewOrderToast(null)}
              className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* KPI Overview Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Total Platform Orders</span>
          <div className="text-2xl font-black text-slate-900 dark:text-white">{orders.length} orders</div>
          <span className="text-[10px] text-pink-600 dark:text-pink-400 font-bold block">Gross Revenue: KES {totalRev.toLocaleString()}</span>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Paid & Processing</span>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{paidCount} orders</div>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block">Cleared for regional print routing</span>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Pending Payment</span>
          <div className="text-2xl font-black text-amber-500">{pendingCount} orders</div>
          <span className="text-[10px] text-amber-500 font-bold block">Awaiting customer M-Pesa confirmation</span>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between shadow-sm">
          <div className="flex gap-2">
            {onOpenManualOrder && (
              <button
                onClick={onOpenManualOrder}
                className="flex-1 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-extrabold text-xs shadow-sm transition-transform hover:scale-105 flex items-center justify-center gap-1.5"
              >
                <Phone className="w-3.5 h-3.5" /> + POS Order
              </button>
            )}
            <button
              onClick={handleBulkExportZip}
              className="p-2.5 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 text-slate-800 dark:text-zinc-200 text-xs font-bold transition-all"
              title="Bulk Export Regional Print ZIP Archive"
            >
              <Download className="w-4 h-4 text-pink-500" />
            </button>
          </div>
          <span className="text-[10px] text-slate-400 dark:text-zinc-500 text-center block pt-1">Export ZIP or launch agent phone order</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white dark:bg-zinc-900 p-4 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search Order #, phone, candidate name..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-pink-500"
            />
          </div>

          {/* Real-Time Live Status Pill */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold shrink-0">
            <span className="relative flex h-2 w-2">
              {liveConnected && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              )}
              <span className={`relative inline-flex rounded-full h-2 w-2 ${liveConnected ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
            </span>
            <span className="text-[11px]">{liveConnected ? 'Live Sync Active' : 'Connecting...'}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-slate-900 dark:text-white font-bold"
          >
            <option value="all">All Statuses</option>
            <option value="pending_payment">Pending Payment</option>
            <option value="paid">Paid & Ready</option>
            <option value="routed_to_print">Routed to Print Hub</option>
            <option value="printing">Printing</option>
            <option value="dispatched">Dispatched / Out for Delivery</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled / Refunded</option>
          </select>

          {/* Channel Filter */}
          <select
            value={channelFilter}
            onChange={e => setChannelFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-slate-900 dark:text-white font-bold"
          >
            <option value="all">All Channels</option>
            <option value="web">Web Storefront</option>
            <option value="phone">Phone / POS Capture</option>
            <option value="agent">Agent Field Order</option>
          </select>

          <button
            onClick={fetchOrders}
            className="p-2 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 text-slate-700 dark:text-zinc-200 transition-all"
            title="Refresh List"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Order Table */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500 animate-pulse">Loading platform order records...</div>
        ) : error ? (
          <div className="p-6 text-center text-xs text-red-500">{error}</div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">No orders found matching the filter criteria.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 dark:text-zinc-300">
              <thead className="bg-slate-50 dark:bg-zinc-950 text-slate-500 dark:text-zinc-400 uppercase tracking-wider font-semibold border-b border-zinc-200 dark:border-zinc-800 text-[10px]">
                <tr>
                  <th className="p-4">Order # & Timestamp</th>
                  <th className="p-4">Channel</th>
                  <th className="p-4">Customer Phone</th>
                  <th className="p-4">Candidate Recipient(s)</th>
                  <th className="p-4">Destination & Hub</th>
                  <th className="p-4">Total KES</th>
                  <th className="p-4">Status & Transition</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/80">
                {filteredOrders.map(o => {
                  const isHighlighted = highlightedOrderIds.includes(o.id)

                  return (
                    <tr
                      key={o.id}
                      className={`transition-all duration-500 ${
                        isHighlighted
                          ? 'bg-emerald-500/15 dark:bg-emerald-950/50 border-l-4 border-l-emerald-500 shadow-inner'
                          : 'hover:bg-slate-50/50 dark:hover:bg-zinc-800/30'
                      }`}
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleOpenTimelineModal(o.order_number)}
                            className="font-bold text-slate-900 dark:text-white hover:text-pink-600 dark:hover:text-pink-400 text-xs text-left"
                          >
                            #{o.order_number}
                          </button>
                          {isHighlighted && (
                            <span className="px-1.5 py-0.5 rounded-full bg-emerald-600 text-white text-[9px] font-black uppercase tracking-wider animate-pulse">
                              JUST IN
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 dark:text-zinc-500 block mt-0.5">
                          {new Date(o.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        </span>
                      </td>

                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          o.channel === 'phone'
                            ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300'
                            : o.channel === 'agent'
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                            : 'bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300'
                        }`}>
                          {o.channel || 'web'}
                        </span>
                      </td>

                      <td className="p-4 font-mono font-semibold text-slate-800 dark:text-zinc-200">
                        {o.phone}
                      </td>

                      <td className="p-4 font-semibold text-slate-900 dark:text-white max-w-xs truncate">
                        {o.recipients || `${o.item_count} Candidate(s)`}
                      </td>

                      <td className="p-4">
                        <div className="space-y-0.5">
                          <span className="font-bold text-slate-800 dark:text-zinc-200 block text-[11px]">
                            📍 {o.destination_counties || 'Kenya'}
                          </span>
                          {o.print_hubs && (
                            <span className="text-[10px] text-pink-600 dark:text-pink-400 font-extrabold uppercase block">
                              🖨️ {o.print_hubs}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="p-4 font-black text-pink-600 dark:text-pink-400">
                        KES {Number(o.total_amount_kes).toLocaleString()}
                      </td>

                      <td className="p-4">
                        <select
                          value={o.status}
                          onChange={e => handleStatusUpdate(o.id, e.target.value)}
                          className="rounded-xl bg-slate-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 text-xs font-bold text-slate-900 dark:text-white p-1.5 focus:outline-none focus:ring-1 focus:ring-pink-500"
                        >
                          <option value="pending_payment">pending_payment</option>
                          <option value="paid">paid</option>
                          <option value="routed_to_print">routed_to_print</option>
                          <option value="printing">printing</option>
                          <option value="dispatched">dispatched</option>
                          <option value="delivered">delivered</option>
                          <option value="cancelled">cancelled</option>
                        </select>
                      </td>

                      <td className="p-4 text-right space-x-1 whitespace-nowrap">
                        <button
                          onClick={() => handleDownloadOrderZip(o.id, o.order_number)}
                          disabled={downloadingOrderId === o.id}
                          className="px-2.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-[11px] inline-flex items-center gap-1 shadow-sm transition-transform hover:scale-105 disabled:opacity-50"
                          title="Download compressed ZIP package containing designs, vector print PDFs, candidate photos, and production dockets"
                        >
                          {downloadingOrderId === o.id ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Package className="w-3.5 h-3.5" />
                          )}
                          ZIP Package
                        </button>
                        <button
                          onClick={() => handleOpenPrintModal(o.id)}
                          className="px-3 py-1.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-bold text-[11px] inline-flex items-center gap-1 shadow-sm transition-transform hover:scale-105"
                        >
                          <Printer className="w-3.5 h-3.5" /> Inspect Print PDFs
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

      {/* --- PRINT PACKAGE INSPECTOR MODAL --- */}
      {selectedOrderForPrint && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 max-w-3xl w-full space-y-6 shadow-2xl animate-scale-in my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-4">
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-pink-100 dark:bg-pink-950 text-pink-700 dark:text-pink-300 text-[10px] font-extrabold uppercase tracking-widest border border-pink-300 dark:border-pink-800">
                  COMMERCIAL PRINT INSPECTOR
                </span>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                  Order #{selectedOrderForPrint.order_number}
                </h2>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                  Customer Phone: <strong>{selectedOrderForPrint.phone}</strong> | Delivery Status: <strong>{selectedOrderForPrint.status}</strong>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownloadOrderZip(selectedOrderForPrint.id, selectedOrderForPrint.order_number)}
                  disabled={downloadingOrderId === selectedOrderForPrint.id}
                  className="px-3.5 py-2 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-purple-500/20 transition-transform hover:scale-105 disabled:opacity-50"
                  title="Download all designs, high-resolution vector print PDFs, uploaded photos, and production dockets in one compressed ZIP"
                >
                  {downloadingOrderId === selectedOrderForPrint.id ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Package className="w-4 h-4" />
                  )}
                  Download Order ZIP
                </button>
                <button
                  onClick={() => setSelectedOrderForPrint(null)}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {loadingOrderDetails ? (
              <div className="p-8 text-center text-slate-500 animate-pulse text-xs">Loading order print specifications...</div>
            ) : (
              <div className="space-y-6">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-zinc-300">
                  Order Items & High-Resolution Vector Print PDFs ({selectedOrderForPrint.items?.length || 0})
                </h3>

                <div className="space-y-4">
                  {selectedOrderForPrint.items?.map((item: any) => (
                    <div
                      key={item.id}
                      className="p-5 rounded-2xl bg-slate-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-4 shadow-sm"
                    >
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 pb-3 border-b border-zinc-200 dark:border-zinc-800/80">
                        <div>
                          <span className="text-xs font-bold text-pink-600 dark:text-pink-400 uppercase tracking-wider">
                            {item.size} Print Card Package
                          </span>
                          <div className="flex items-center gap-2">
                            <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                              Candidate: {item.recipient_full_names}
                            </h4>
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-pink-100 dark:bg-pink-950 text-pink-700 dark:text-pink-300 border border-pink-300 dark:border-pink-800">
                              {item.religion === 'christian' || (!item.religion && (!item.message_body || item.message_body.toLowerCase().includes('god') || item.message_body.toLowerCase().includes('christ') || item.message_body.toLowerCase().includes('lord') || item.message_body.toLowerCase().includes('philippians') || item.message_body.toLowerCase().includes('jeremiah'))) ? '✝️ Christian Blessing' : item.religion === 'muslim' || (item.message_body && item.message_body.toLowerCase().includes('allah')) ? '☪️ Islamic' : '🎓 General'}
                            </span>
                          </div>
                          <span className="text-xs text-slate-500 dark:text-zinc-400">
                            Index / ADM: <strong>{item.admission_number}</strong> | School: <strong>{item.school_name}</strong> {item.class_form ? `(${item.class_form})` : ''}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            onClick={() => handleDownloadOrderZip(selectedOrderForPrint.id, selectedOrderForPrint.order_number)}
                            disabled={downloadingOrderId === selectedOrderForPrint.id}
                            className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-transform hover:scale-105 disabled:opacity-50"
                            title="Download full order resources ZIP archive"
                          >
                            <Package className="w-4 h-4" /> Download ZIP
                          </button>

                          <button
                            onClick={() => handleDownloadItemPdf(item)}
                            className="px-3.5 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-transform hover:scale-105"
                          >
                            <Download className="w-4 h-4" /> Download 4-Page Print PDF
                          </button>

                          {item.custom_photo_storage_path && (
                            <button
                              onClick={() => handleDownloadPhotoAsset(item, selectedOrderForPrint.order_number)}
                              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-transform hover:scale-105"
                              title="Download high-resolution candidate photo resource to mount/print manually"
                            >
                              <Download className="w-4 h-4" /> Candidate Photo
                            </button>
                          )}

                          <button
                            onClick={() => handlePrintDocketDirectly(item, selectedOrderForPrint.order_number)}
                            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
                          >
                            <Printer className="w-4 h-4 text-pink-400" /> Production Docket
                          </button>

                          <button
                            onClick={() => handleDownloadCardPrintPackage(item, selectedOrderForPrint.order_number)}
                            className="px-3.5 py-2 rounded-xl bg-slate-200 dark:bg-zinc-800 hover:bg-slate-300 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
                          >
                            <FileText className="w-4 h-4 text-pink-500" /> HTML Specs
                          </button>
                        </div>
                      </div>

                      {/* Custom Message preview & Photo */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        <div className="space-y-1">
                          <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-zinc-500">Personal Calligraphy Message (Page 3)</span>
                          <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1">
                            <p className="italic text-slate-800 dark:text-zinc-200 font-serif text-sm">
                              "{item.message_body || item.custom_message || 'Standard Congratulatory Wish'}"
                            </p>
                            <div className="text-[10px] text-slate-400 font-mono flex gap-3 pt-1">
                              <span>Font: <strong>{item.message_font || 'serif'}</strong></span>
                              <span>Colour: <strong style={{ color: item.message_colour || '#ec4899' }}>{item.message_colour || '#ec4899'}</strong></span>
                            </div>
                          </div>
                        </div>

                        {item.custom_photo_storage_path && (
                          <div className="space-y-1">
                            <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-zinc-500">Candidate Photo Resource (For Manual Insertion)</span>
                            <div className="flex items-center gap-3 p-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                              <img
                                src={`http://localhost:4000/api/v1/files/customer-photos/${item.custom_photo_storage_path.split('/').pop()}?token=${token}`}
                                alt="Candidate photo"
                                loading="lazy"
                                decoding="async"
                                onError={(e: any) => {
                                  e.target.onerror = null
                                  e.target.src = `http://localhost:4000/api/v1/files/design-images/${item.custom_photo_storage_path.split('/').pop()}`
                                }}
                                className="w-14 h-14 object-cover rounded-xl border-2 border-purple-500 shadow-sm"
                              />
                              <div className="space-y-1">
                                <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 block">External Photo Asset</span>
                                <button
                                  onClick={() => handleDownloadPhotoAsset(item, selectedOrderForPrint.order_number)}
                                  className="text-[11px] text-purple-600 dark:text-purple-400 hover:underline font-bold inline-flex items-center gap-1"
                                >
                                  <Download className="w-3 h-3" /> Download High-Res File &rarr;
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- AUDIT TIMELINE MODAL --- */}
      {selectedOrderForTimeline && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-2xl rounded-3xl p-6 shadow-2xl space-y-6 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  Order Audit Trail — #{selectedOrderForTimeline.order.order_number}
                </h3>
                <span className="text-xs text-slate-500 dark:text-zinc-400">
                  Customer: <strong>{selectedOrderForTimeline.customer.phone}</strong> | Placed via: <strong>{selectedOrderForTimeline.order.channel}</strong>
                </span>
              </div>
              <button onClick={() => setSelectedOrderForTimeline(null)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800"><X className="w-4 h-4" /></button>
            </div>

            {/* Lifecycle Timeline Stepper */}
            <div className="space-y-3">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-zinc-500">Status History Audit Logs</h4>
              <div className="space-y-2 border-l-2 border-pink-500/30 pl-4">
                {selectedOrderForTimeline.timeline?.map((log: any, idx: number) => (
                  <div key={idx} className="relative text-xs space-y-0.5">
                    <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-pink-500 border-2 border-white dark:border-zinc-900" />
                    <div className="font-bold text-slate-900 dark:text-white">
                      Status changed to <span className="uppercase text-pink-600 dark:text-pink-400">{log.to_status}</span> by <span className="font-mono text-slate-500">{log.changed_by}</span>
                    </div>
                    {log.notes && <p className="text-[11px] text-slate-500 italic">"{log.notes}"</p>}
                    <span className="text-[10px] text-slate-400 block">{new Date(log.created_at).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Items Summary */}
            <div className="space-y-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                Order Content Specifications ({selectedOrderForTimeline.items?.length || 0})
              </h4>
              <div className="space-y-2 text-xs">
                {selectedOrderForTimeline.items?.map((item: any) => (
                  <div key={item.id} className="p-3 rounded-2xl bg-slate-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white block">{item.recipient_full_names} ({item.size})</span>
                      <span className="text-slate-500 text-[11px] block">{item.school_name} | {item.county_name} -&gt; {item.sub_county_name}</span>
                    </div>
                    <span className="font-bold text-pink-600">KES {item.unit_price_kes}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
