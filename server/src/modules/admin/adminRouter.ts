import { Router } from 'express'
import { z } from 'zod'
import { listAllOrders, updateOrderStatus, getOrderDetailsWithItems, findOrCreateCustomer, createOrderTransaction, getOrderSummary } from '../../db/queries/orderQueries'
import { normalizePhoneNumber, isValidKenyanPhone } from '../../utils/phoneUtils'
import { getCalculatedPrice } from '../../db/queries/pricingQueries'
import {
  getSubCountyById,
  getPrintRegionForCounty,
  listPrintHubsWithMetrics,
  getPrintHubById,
  createPrintHub,
  updatePrintHub,
  deletePrintHub,
  getHubAssignedCounties,
  assignCountiesToHub,
  getHubOrders,
  rerouteOrderItemsToHub,
} from '../../db/queries/locationQueries'
import { releaseStockForSize } from '../../db/queries/inventoryQueries'
import { requireAuth, AuthenticatedRequest, hashPassword } from '../../middleware/auth'
import { query } from '../../config/db'
import { logAuditEvent } from '../../services/auditService'
import { orderEvents, emitOrderCreated, emitOrderStatusUpdated } from '../../services/orderEvents'
import {
  sendOrderDispatchedEmail,
  sendOrderDeliveredEmail,
  sendOrderTrackingUpdateEmail,
} from '../../services/emailService'
import {
  listAdminUsers,
  createAdminUser,
  updateAdminUser,
  updateAdminPassword,
  deleteAdminUser,
  listCustomers,
  getCustomerOrders,
  listRidersWithStats,
  createRider,
  updateRider,
  deleteRider,
} from '../../db/queries/userQueries'

const router = Router()

router.use(requireAuth(['admin', 'super_admin', 'rider_manager']))

// ─── Real-Time Live Order Stream (Server-Sent Events) ──────────────────────
router.get('/orders/stream', (req: any, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  })

  res.write(`data: ${JSON.stringify({ type: 'connected', timestamp: Date.now() })}\n\n`)

  const onOrderCreated = (order: any) => {
    res.write(`event: order_created\ndata: ${JSON.stringify(order)}\n\n`)
  }

  const onOrderUpdated = (data: any) => {
    res.write(`event: order_updated\ndata: ${JSON.stringify(data)}\n\n`)
  }

  orderEvents.on('order:created', onOrderCreated)
  orderEvents.on('order:updated', onOrderUpdated)

  // Keep-alive heartbeat every 20 seconds
  const keepAlive = setInterval(() => {
    res.write(`data: ${JSON.stringify({ type: 'ping', timestamp: Date.now() })}\n\n`)
  }, 20000)

  req.on('close', () => {
    clearInterval(keepAlive)
    orderEvents.off('order:created', onOrderCreated)
    orderEvents.off('order:updated', onOrderUpdated)
    res.end()
  })
})

router.get('/orders', async (req, res, next) => {
  try {
    const limit = Number(req.query.limit ?? 50)
    const offset = Number(req.query.offset ?? 0)
    const orders = await listAllOrders(limit, offset)
    res.json({ data: orders })
  } catch (err) {
    next(err)
  }
})

router.get('/orders/:id', async (req, res, next) => {
  try {
    const orderDetails = await getOrderDetailsWithItems(req.params.id)
    if (!orderDetails) {
      return res.status(404).json({ error: 'Order not found' })
    }
    res.json({ data: orderDetails })
  } catch (err) {
    next(err)
  }
})

router.patch('/orders/:id/status', async (req: AuthenticatedRequest, res, next) => {
  try {
    const orderId = req.params.id as string
    const { status } = req.body
    const validStatuses = ['pending_payment', 'paid', 'routed_to_print', 'printing', 'dispatched', 'delivered', 'disputed', 'cancelled']
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status string' })
    }

    const previousOrder = await getOrderDetailsWithItems(orderId)
    await updateOrderStatus(orderId, status, req.user ? `admin:${req.user.id}` : 'admin')

    // Emit real-time update
    emitOrderStatusUpdated(orderId, status, { previousStatus: previousOrder?.status })

    await logAuditEvent({
      userId: req.user?.id,
      role: req.user?.role,
      action: 'ORDER_STATUS_UPDATE',
      entityType: 'order',
      entityId: orderId,
      oldValues: { status: previousOrder?.status },
      newValues: { status },
      req,
    })

    // Dispatch automated email notification if customer email exists
    if (previousOrder?.email) {
      const recipientNames = previousOrder.items?.map((i: any) => i.recipient_full_names).join(', ') || 'Candidate'
      const schoolNames = previousOrder.items?.map((i: any) => i.school_name).join(', ') || 'School'
      const countyName = previousOrder.items?.[0]?.county_name

      if (status === 'dispatched') {
        sendOrderDispatchedEmail(previousOrder.email, {
          orderNumber: previousOrder.order_number,
          recipientNames,
          schoolNames,
          countyName,
        }).catch((e) => console.error('[Email] Dispatched notification error:', e))
      } else if (status === 'delivered') {
        sendOrderDeliveredEmail(previousOrder.email, {
          orderNumber: previousOrder.order_number,
          recipientNames,
          schoolNames,
          countyName,
        }).catch((e) => console.error('[Email] Delivered notification error:', e))
      } else if (status === 'printing' || status === 'routed_to_print') {
        sendOrderTrackingUpdateEmail(previousOrder.email, {
          orderNumber: previousOrder.order_number,
          recipientNames,
          schoolNames,
          statusTitle: status === 'printing' ? 'Printing in Progress 🖨️' : 'Routed to Print Hub 🏢',
          statusDescription:
            status === 'printing'
              ? `Your card for ${recipientNames} is currently being printed on premium heavy board.`
              : `Your order has been routed to our regional printing hub for processing.`,
        }).catch((e) => console.error('[Email] Tracking update notification error:', e))
      }
    }

    res.json({ success: true, orderId, status })
  } catch (err) {
    next(err)
  }
})

router.get('/stats', async (_req, res, next) => {
  try {
    const counts = await query(`
      SELECT 
        (SELECT count(*) FROM orders) as total_orders,
        (SELECT count(*) FROM orders WHERE status = 'paid') as paid_orders,
        (SELECT count(*) FROM orders WHERE status = 'delivered') as delivered_orders,
        (SELECT count(*) FROM disputes WHERE status = 'open') as open_disputes,
        (SELECT COALESCE(sum(total_amount_kes), 0) FROM orders WHERE status IN ('paid', 'delivered')) as total_revenue
    `)
    res.json({ data: counts[0] })
  } catch (err) {
    next(err)
  }
})

const manualOrderSchema = z.object({
  customer: z.object({
    phone: z.string().refine(isValidKenyanPhone, {
      message: 'Invalid Kenyan phone number format.',
    }),
    email: z.string().email().optional(),
  }),
  channel: z.enum(['phone', 'agent', 'web']).optional(),
  initialStatus: z.enum(['paid', 'pending_payment', 'routed_to_print']).optional(),
  items: z.array(
    z.object({
      design_id: z.string().uuid('Valid design UUID is required'),
      size: z.enum(['A3', 'A4', 'A5']),
      custom_photo_storage_path: z.string().optional(),
      message_body: z.string().min(1, 'Message body is required'),
      message_font: z.string().optional(),
      message_colour: z.string().optional(),
      recipient_full_names: z.string().min(2, 'Student full names are mandatory'),
      admission_number: z.string().min(1, 'Student admission/index number is mandatory'),
      school_name: z.string().min(2, 'School name is mandatory'),
      county_id: z.string().uuid('Valid county selection is mandatory'),
      sub_county_id: z.string().uuid('Valid sub-county selection is mandatory'),
      po_box: z.string().optional(),
      class_form: z.string().optional(),
    })
  ).min(1, 'At least one order item with student details is required'),
})

// ─── Centralized Manual / Phone Order Capture ──────────────────────────────
router.post('/orders', async (req: any, res, next) => {
  try {
    const parse = manualOrderSchema.safeParse(req.body)
    if (!parse.success) {
      return res.status(400).json({ error: 'Invalid order input data: student information is required', details: parse.error.format() })
    }

    const { customer, items, channel, initialStatus } = parse.data

    const normalizedPhone = normalizePhoneNumber(customer.phone)
    const dbCustomer = await findOrCreateCustomer(normalizedPhone, customer.email)

    let totalAmount = 0
    const processedItems = []

    for (const item of items) {
      const subCounty = await getSubCountyById(item.sub_county_id)
      const hasPhoto = Boolean(item.custom_photo_storage_path)
      const unitPrice = await getCalculatedPrice(item.size, hasPhoto, subCounty?.zone || 'cbd')
      const printRegion = await getPrintRegionForCounty(item.county_id)

      totalAmount += unitPrice
      processedItems.push({
        ...item,
        unit_price_kes: unitPrice,
        cogs_kes: item.size === 'A3' ? 280 : (item.size === 'A4' ? 180 : 120),
        print_region_id: printRegion?.id,
      })
    }

    const adminId = req.user?.id
    const result = await createOrderTransaction(dbCustomer.id, totalAmount, processedItems, {
      channel: channel || 'phone',
      placedByAdminId: adminId,
      initialStatus: initialStatus || 'paid'
    })

    // Emit real-time creation event
    try {
      const summary = await getOrderSummary(result.order.id)
      if (summary) emitOrderCreated(summary)
    } catch (e) {
      console.error('Failed to emit order:created for manual order', e)
    }

    await logAuditEvent({
      userId: req.user?.id,
      role: req.user?.role,
      action: 'ADMIN_MANUAL_ORDER_CREATE',
      entityType: 'order',
      entityId: result.order.id,
      newValues: { totalAmountKes: totalAmount, channel: channel || 'phone', itemCount: processedItems.length },
      req,
    })

    res.status(201).json({ data: result })
  } catch (err) {
    next(err)
  }
})

// ─── Process Dispute Refund & Inventory Restock ────────────────────────────
router.post('/disputes/:id/refund', async (req: any, res, next) => {
  try {
    const { id } = req.params
    const { refund_amount_kes, refund_reason, restock_inventory } = req.body

    const disputeRow = await query(`SELECT order_id FROM disputes WHERE id = $1`, [id])
    if (!disputeRow.length) return res.status(404).json({ error: 'Dispute not found' })

    const orderId = disputeRow[0].order_id

    await query(
      `UPDATE disputes
       SET refund_status = 'approved',
           refund_amount_kes = $1,
           refund_reason = $2,
           restock_inventory = $3,
           status = 'resolved',
           resolved_at = now()
       WHERE id = $4`,
      [refund_amount_kes || 0, refund_reason || 'Admin Approved Refund', Boolean(restock_inventory), id]
    )

    await updateOrderStatus(orderId, 'cancelled', req.user?.id ? `admin:${req.user.id}` : 'admin', `Refund approved: ${refund_reason || 'N/A'}`)

    if (restock_inventory) {
      const orderItems = await query(`SELECT size FROM order_items WHERE order_id = $1`, [orderId])
      for (const item of orderItems) {
        await releaseStockForSize(item.size, 1, orderId, true)
      }
    }

    await logAuditEvent({
      userId: req.user?.id,
      role: req.user?.role,
      action: 'DISPUTE_REFUND_PROCESSED',
      entityType: 'dispute',
      entityId: id,
      newValues: { orderId, refund_amount_kes, refund_reason, restock_inventory: Boolean(restock_inventory) },
      req,
    })

    res.json({ success: true, disputeId: id, orderId })
  } catch (err) {
    next(err)
  }
})

// ─── Comprehensive Analytics Endpoint ───────────────────────────────────────
router.get('/analytics', async (_req, res, next) => {
  try {
    // Sales & Financials + Real COGS
    const salesStats = await query(`
      SELECT
        COALESCE(SUM(o.total_amount_kes), 0)::numeric as gross_revenue,
        COALESCE(SUM(CASE WHEN o.status IN ('paid', 'delivered', 'routed_to_print', 'printing', 'dispatched') THEN o.total_amount_kes ELSE 0 END), 0)::numeric as net_revenue,
        COALESCE(SUM(CASE WHEN o.status IN ('paid', 'delivered', 'routed_to_print', 'printing', 'dispatched') THEN (SELECT COALESCE(SUM(cogs_kes), 0) FROM order_items WHERE order_id = o.id) ELSE 0 END), 0)::numeric as total_cogs,
        COUNT(*)::int as total_order_count,
        COUNT(CASE WHEN o.status IN ('paid', 'delivered', 'routed_to_print', 'printing', 'dispatched') THEN 1 END)::int as paid_order_count,
        COUNT(CASE WHEN o.status IN ('cancelled', 'disputed') THEN 1 END)::int as refunded_order_count,
        COUNT(CASE WHEN o.status = 'delivered' THEN 1 END)::int as delivered_count,
        COUNT(CASE WHEN o.status = 'pending_payment' THEN 1 END)::int as pending_count
      FROM orders o
    `)

    const sales = salesStats[0]
    const grossRevenue = parseFloat(sales.gross_revenue) || 0
    const netRevenue = parseFloat(sales.net_revenue) || 0
    const totalCogs = parseFloat(sales.total_cogs) || 0
    const totalOrders = parseInt(sales.total_order_count) || 0
    const paidOrders = parseInt(sales.paid_order_count) || 0
    const refundedOrders = parseInt(sales.refunded_order_count) || 0
    const aov = paidOrders > 0 ? netRevenue / paidOrders : 0
    const refundRate = totalOrders > 0 ? (refundedOrders / totalOrders) * 100 : 0
    const grossProfitMargin = netRevenue > 0 ? ((netRevenue - totalCogs) / netRevenue) * 100 : 0

    // Inventory & Stock Alerts
    const inventoryStats = await query(`
      SELECT
        COUNT(*)::int as total_items,
        COUNT(CASE WHEN (stock_quantity - reserved_quantity) <= reorder_threshold THEN 1 END)::int as low_stock_count
      FROM inventory_items
    `)
    const lowStockCount = parseInt(inventoryStats[0]?.low_stock_count) || 0

    // Speed & Lead Times
    const speedStats = await query(`
      SELECT
        COALESCE(AVG(EXTRACT(EPOCH FROM (shipped_at - created_at))/3600), 0)::numeric as avg_fulfillment_hours,
        COALESCE(AVG(EXTRACT(EPOCH FROM (delivered_at - shipped_at))/3600), 0)::numeric as avg_delivery_hours
      FROM orders
      WHERE shipped_at IS NOT NULL
    `)
    const avgFulfillmentHours = Math.round(parseFloat(speedStats[0]?.avg_fulfillment_hours || 0) * 10) / 10
    const avgDeliveryHours = Math.round(parseFloat(speedStats[0]?.avg_delivery_hours || 0) * 10) / 10

    // Channel Distribution
    const channelStats = await query(`
      SELECT channel, COUNT(*)::int as count
      FROM orders
      GROUP BY channel
      ORDER BY count DESC
    `)

    // Today vs Yesterday comparison for trend indicators
    const trendData = await query(`
      SELECT
        COALESCE(SUM(CASE WHEN created_at::date = CURRENT_DATE THEN total_amount_kes ELSE 0 END), 0)::numeric as today_revenue,
        COALESCE(SUM(CASE WHEN created_at::date = CURRENT_DATE - 1 THEN total_amount_kes ELSE 0 END), 0)::numeric as yesterday_revenue,
        COUNT(CASE WHEN created_at::date = CURRENT_DATE THEN 1 END)::int as today_orders,
        COUNT(CASE WHEN created_at::date = CURRENT_DATE - 1 THEN 1 END)::int as yesterday_orders
      FROM orders
      WHERE status NOT IN ('cancelled')
    `)
    const trend = trendData[0]

    // Top-Selling Products (by order count and revenue)
    const topProducts = await query(`
      SELECT
        d.id as design_id,
        d.name as design_name,
        COUNT(oi.id)::int as order_count,
        COALESCE(SUM(oi.unit_price_kes), 0)::numeric as total_revenue
      FROM order_items oi
      JOIN designs d ON d.id = oi.design_id
      JOIN orders o ON o.id = oi.order_id
      WHERE o.status NOT IN ('cancelled')
      GROUP BY d.id, d.name
      ORDER BY order_count DESC
      LIMIT 5
    `)

    // Slow-Moving Inventory (designs with 0 orders in last 30 days)
    const slowMoving = await query(`
      SELECT d.id as design_id, d.name as design_name, d.created_at
      FROM designs d
      WHERE d.is_active = true
        AND d.id NOT IN (
          SELECT DISTINCT oi.design_id
          FROM order_items oi
          JOIN orders o ON o.id = oi.order_id
          WHERE o.created_at >= NOW() - INTERVAL '30 days'
            AND o.status NOT IN ('cancelled')
        )
      ORDER BY d.created_at ASC
    `)

    // Size distribution
    const sizeDistribution = await query(`
      SELECT oi.size, COUNT(*)::int as count
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      WHERE o.status NOT IN ('cancelled')
      GROUP BY oi.size
      ORDER BY count DESC
    `)

    res.json({
      data: {
        sales: {
          gross_revenue: grossRevenue,
          net_revenue: netRevenue,
          total_cogs: totalCogs,
          gross_profit_margin: Math.round(grossProfitMargin * 10) / 10,
          aov: Math.round(aov * 100) / 100,
          total_order_count: totalOrders,
          paid_order_count: paidOrders,
          refunded_order_count: refundedOrders,
          refund_rate: Math.round(refundRate * 100) / 100,
          delivered_count: parseInt(sales.delivered_count) || 0,
          pending_count: parseInt(sales.pending_count) || 0,
        },
        operations: {
          low_stock_count: lowStockCount,
          avg_fulfillment_hours: avgFulfillmentHours,
          avg_delivery_hours: avgDeliveryHours,
          channel_distribution: channelStats
        },
        trends: {
          today_revenue: parseFloat(trend.today_revenue) || 0,
          yesterday_revenue: parseFloat(trend.yesterday_revenue) || 0,
          today_orders: parseInt(trend.today_orders) || 0,
          yesterday_orders: parseInt(trend.yesterday_orders) || 0,
        },
        top_products: topProducts.map(p => ({
          design_id: p.design_id,
          design_name: p.design_name,
          order_count: parseInt(p.order_count),
          total_revenue: parseFloat(p.total_revenue) || 0,
        })),
        slow_moving: slowMoving.map(s => ({
          design_id: s.design_id,
          design_name: s.design_name,
        })),
        size_distribution: sizeDistribution
      }
    })
  } catch (err) {
    next(err)
  }
})

// ─── 30-Day Revenue Sparkline Time Series ──────────────────────────────────
router.get('/analytics/revenue-chart', async (_req, res, next) => {
  try {
    const dailyData = await query(`
      SELECT
        d.day::date::text as date,
        COALESCE(SUM(o.total_amount_kes), 0)::numeric as revenue,
        COUNT(o.id)::int as orders
      FROM generate_series(CURRENT_DATE - INTERVAL '29 days', CURRENT_DATE, '1 day'::interval) d(day)
      LEFT JOIN orders o ON o.created_at::date = d.day::date AND o.status NOT IN ('cancelled')
      GROUP BY d.day
      ORDER BY d.day ASC
    `)

    res.json({
      data: dailyData.map(row => ({
        date: row.date,
        revenue: parseFloat(row.revenue) || 0,
        orders: parseInt(row.orders) || 0,
      }))
    })
  } catch (err) {
    next(err)
  }
})

// ─── Security Audit Logs Listing ───────────────────────────────────────────
router.get('/audit-logs', async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit ?? 50), 100)
    const offset = Number(req.query.offset ?? 0)
    const action = req.query.action as string | undefined

    let sql = `SELECT * FROM audit_logs`
    const params: any[] = []

    if (action) {
      sql += ` WHERE action = $1`
      params.push(action)
    }

    sql += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`
    params.push(limit, offset)

    const logs = await query(sql, params)
    res.json({ data: logs })
  } catch (err) {
    next(err)
  }
})

// ─── Staff & Admin Users Management ───────────────────────────────────────
router.get('/users', async (_req, res, next) => {
  try {
    const users = await listAdminUsers()
    res.json({ data: users })
  } catch (err) {
    next(err)
  }
})

router.post('/users', async (req: AuthenticatedRequest, res, next) => {
  try {
    const { email, password, role } = req.body
    if (!email || !password || !email.trim()) {
      return res.status(400).json({ error: 'Email and password are required' })
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long' })
    }
    const validRoles = ['admin', 'super_admin', 'rider_manager', 'support']
    const assignedRole = validRoles.includes(role) ? role : 'admin'

    const pwdHash = await hashPassword(password)
    const newUser = await createAdminUser(email, pwdHash, assignedRole)

    await logAuditEvent({
      userId: req.user?.id,
      role: req.user?.role,
      action: 'ADMIN_USER_CREATED',
      entityType: 'admin_user',
      entityId: newUser.id,
      newValues: { email: newUser.email, role: newUser.role },
      req,
    })

    res.status(201).json({ data: newUser })
  } catch (err: any) {
    if (err.code === '23505') {
      return res.status(400).json({ error: 'A user with this email already exists.' })
    }
    next(err)
  }
})

router.patch('/users/:id', async (req: AuthenticatedRequest, res, next) => {
  try {
    const { role, email, unlock } = req.body
    const updated = await updateAdminUser(req.params.id as string, { role, email, unlock })
    if (!updated) return res.status(404).json({ error: 'User not found' })

    await logAuditEvent({
      userId: req.user?.id,
      role: req.user?.role,
      action: 'ADMIN_USER_UPDATED',
      entityType: 'admin_user',
      entityId: req.params.id as string,
      newValues: { role, email, unlock },
      req,
    })

    res.json({ data: updated })
  } catch (err) {
    next(err)
  }
})

router.patch('/users/:id/password', async (req: AuthenticatedRequest, res, next) => {
  try {
    const { newPassword } = req.body
    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters' })
    }
    const pwdHash = await hashPassword(newPassword)
    await updateAdminPassword(req.params.id as string, pwdHash)

    await logAuditEvent({
      userId: req.user?.id,
      role: req.user?.role,
      action: 'ADMIN_PASSWORD_RESET',
      entityType: 'admin_user',
      entityId: req.params.id as string,
      req,
    })

    res.json({ success: true, message: 'Password reset successfully' })
  } catch (err) {
    next(err)
  }
})

router.delete('/users/:id', async (req: AuthenticatedRequest, res, next) => {
  try {
    const targetId = req.params.id as string
    if (req.user?.id === targetId) {
      return res.status(400).json({ error: 'You cannot delete your own active administrator account.' })
    }
    await deleteAdminUser(targetId)

    await logAuditEvent({
      userId: req.user?.id,
      role: req.user?.role,
      action: 'ADMIN_USER_DELETED',
      entityType: 'admin_user',
      entityId: targetId,
      req,
    })

    res.json({ success: true })
  } catch (err) {
    next(err)
  }
})

// ─── Customer Directory ───────────────────────────────────────────────────
router.get('/customers', async (req, res, next) => {
  try {
    const search = req.query.search as string | undefined
    const limit = Math.min(Number(req.query.limit ?? 100), 200)
    const offset = Number(req.query.offset ?? 0)
    const customers = await listCustomers(search, limit, offset)
    res.json({ data: customers })
  } catch (err) {
    next(err)
  }
})

router.get('/customers/:id/orders', async (req, res, next) => {
  try {
    const orders = await getCustomerOrders(req.params.id as string)
    res.json({ data: orders })
  } catch (err) {
    next(err)
  }
})

// ─── Riders Management ────────────────────────────────────────────────────
router.get('/riders', async (_req, res, next) => {
  try {
    const riders = await listRidersWithStats()
    res.json({ data: riders })
  } catch (err) {
    next(err)
  }
})

router.post('/riders', async (req: AuthenticatedRequest, res, next) => {
  try {
    const { name, phone, is_active } = req.body
    if (!name || !phone || !name.trim() || !phone.trim()) {
      return res.status(400).json({ error: 'Rider name and phone number are required' })
    }
    const rider = await createRider(name, phone, is_active !== undefined ? Boolean(is_active) : true)
    res.status(201).json({ data: rider })
  } catch (err: any) {
    if (err.code === '23505') {
      return res.status(400).json({ error: 'A rider with this phone number already exists.' })
    }
    next(err)
  }
})

router.patch('/riders/:id', async (req, res, next) => {
  try {
    const { name, phone, is_active } = req.body
    const updated = await updateRider(req.params.id as string, name, phone, Boolean(is_active))
    res.json({ data: updated })
  } catch (err) {
    next(err)
  }
})

router.delete('/riders/:id', async (req, res, next) => {
  try {
    await deleteRider(req.params.id as string)
    res.json({ success: true })
  } catch (err) {
    next(err)
  }
})

// ─── Regional Print Hubs Management ───────────────────────────────────────

router.get('/hubs', async (_req, res, next) => {
  try {
    const hubs = await listPrintHubsWithMetrics()
    res.json({ data: hubs })
  } catch (err) {
    next(err)
  }
})

router.get('/hubs/:id', async (req, res, next) => {
  try {
    const hub = await getPrintHubById(req.params.id as string)
    if (!hub) return res.status(404).json({ error: 'Hub not found' })
    res.json({ data: hub })
  } catch (err) {
    next(err)
  }
})

router.post('/hubs', async (req: AuthenticatedRequest, res, next) => {
  try {
    const { name, contact_person, phone, whatsapp_number, email, address, status, cost_per_card_kes } = req.body
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Hub name is required' })
    }
    const hub = await createPrintHub({
      name,
      contact_person,
      phone,
      whatsapp_number,
      email,
      address,
      status,
      cost_per_card_kes: cost_per_card_kes ? Number(cost_per_card_kes) : undefined,
    })
    res.status(201).json({ data: hub })
  } catch (err: any) {
    if (err.code === '23505') {
      return res.status(400).json({ error: 'A print hub with this name already exists.' })
    }
    next(err)
  }
})

router.patch('/hubs/:id', async (req: AuthenticatedRequest, res, next) => {
  try {
    const { name, contact_person, phone, whatsapp_number, email, address, status, cost_per_card_kes } = req.body
    const updated = await updatePrintHub(req.params.id as string, {
      name,
      contact_person,
      phone,
      whatsapp_number,
      email,
      address,
      status,
      cost_per_card_kes: cost_per_card_kes !== undefined ? Number(cost_per_card_kes) : undefined,
    })
    if (!updated) return res.status(404).json({ error: 'Hub not found' })
    res.json({ data: updated })
  } catch (err) {
    next(err)
  }
})

router.delete('/hubs/:id', async (req: AuthenticatedRequest, res, next) => {
  try {
    await deletePrintHub(req.params.id as string)
    res.json({ success: true })
  } catch (err) {
    next(err)
  }
})

router.get('/hubs/:id/counties', async (req, res, next) => {
  try {
    const counties = await getHubAssignedCounties(req.params.id as string)
    res.json({ data: counties })
  } catch (err) {
    next(err)
  }
})

router.put('/hubs/:id/counties', async (req: AuthenticatedRequest, res, next) => {
  try {
    const { county_ids } = req.body
    if (!Array.isArray(county_ids)) {
      return res.status(400).json({ error: 'county_ids must be an array of county UUIDs' })
    }
    await assignCountiesToHub(req.params.id as string, county_ids)
    res.json({ success: true })
  } catch (err) {
    next(err)
  }
})

router.get('/hubs/:id/orders', async (req, res, next) => {
  try {
    const orders = await getHubOrders(req.params.id as string)
    res.json({ data: orders })
  } catch (err) {
    next(err)
  }
})

router.patch('/orders/:id/reroute-hub', async (req: AuthenticatedRequest, res, next) => {
  try {
    const { hub_id } = req.body
    if (!hub_id) {
      return res.status(400).json({ error: 'Target hub_id is required' })
    }
    await rerouteOrderItemsToHub(req.params.id as string, hub_id)
    emitOrderStatusUpdated(req.params.id as string, 'routed_to_print')
    res.json({ success: true, message: 'Order successfully re-routed to new print hub' })
  } catch (err) {
    next(err)
  }
})

export default router


