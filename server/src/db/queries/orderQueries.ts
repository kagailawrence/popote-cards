import { pool, query, queryOne } from '../../config/db'
import path from 'path'

export interface Customer {
  id: string
  phone: string
  email: string | null
  created_at: Date
}

export interface Order {
  id: string
  order_number: string
  customer_id: string
  status: string
  total_amount_kes: number
  channel: 'web' | 'phone' | 'agent'
  shipped_at: Date | null
  delivered_at: Date | null
  placed_by_admin_id: string | null
  created_at: Date
  updated_at: Date
}

export interface OrderItem {
  id: string
  order_id: string
  design_id: string
  size: string
  custom_photo_storage_path: string | null
  message_body: string
  message_font: string | null
  message_colour: string | null
  recipient_full_names: string
  admission_number: string
  school_name: string
  county_id: string
  sub_county_id: string
  po_box: string | null
  class_form: string | null
  unit_price_kes: number
  cogs_kes: number
  print_region_id: string | null
  print_status: string
  created_at: Date
}

export async function findOrCreateCustomer(phone: string, email?: string): Promise<Customer> {
  const existing = await queryOne<Customer>(`SELECT id, phone, email, created_at FROM customers WHERE phone = $1`, [phone])
  if (existing) return existing

  return (await queryOne<Customer>(
    `INSERT INTO customers (phone, email) VALUES ($1, $2) RETURNING id, phone, email, created_at`,
    [phone, email ?? null]
  ))!
}

export async function createOrderTransaction(
  customerId: string,
  totalAmountKes: number,
  items: Array<{
    design_id: string
    size: 'A3' | 'A4' | 'A5'
    custom_photo_storage_path?: string
    message_body: string
    message_font?: string
    message_colour?: string
    recipient_full_names: string
    admission_number: string
    school_name: string
    county_id: string
    sub_county_id: string
    po_box?: string
    class_form?: string
    unit_price_kes: number
    cogs_kes?: number
    print_region_id?: string
  }>,
  options?: {
    channel?: 'web' | 'phone' | 'agent'
    placedByAdminId?: string
    initialStatus?: string
  }
): Promise<{ order: Order; orderItems: OrderItem[] }> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const orderNum = 'SC-' + Math.floor(100000 + Math.random() * 900000)
    const channel = options?.channel ?? 'web'
    const status = options?.initialStatus ?? 'pending_payment'
    const adminId = options?.placedByAdminId ?? null

    const orderRes = await client.query<Order>(
      `INSERT INTO orders (order_number, customer_id, total_amount_kes, status, channel, placed_by_admin_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, order_number, customer_id, status, total_amount_kes, channel, shipped_at, delivered_at, placed_by_admin_id, created_at, updated_at`,
      [orderNum, customerId, totalAmountKes, status, channel, adminId]
    )
    const order = orderRes.rows[0]

    const orderItems: OrderItem[] = []
    for (const item of items) {
      if (!item.recipient_full_names?.trim() || item.recipient_full_names.trim().length < 2) {
        throw new Error('Every order item must have a valid student full name (min 2 characters).')
      }
      if (!item.admission_number?.trim()) {
        throw new Error('Every order item must have a student admission/index number.')
      }
      if (!item.school_name?.trim() || item.school_name.trim().length < 2) {
        throw new Error('Every order item must have a student school or institution name.')
      }
      if (!item.county_id || !item.sub_county_id) {
        throw new Error('Every order item must have a designated delivery county and sub-county.')
      }

      // Auto-resolve print region if not explicitly passed
      let printRegionId = item.print_region_id ?? null
      if (!printRegionId && item.county_id) {
        const regionRes = await client.query<{ print_region_id: string }>(
          `SELECT print_region_id FROM county_print_regions WHERE county_id = $1 LIMIT 1`,
          [item.county_id]
        )
        printRegionId = regionRes.rows[0]?.print_region_id ?? null
      }

      const itemRes = await client.query<OrderItem>(
        `INSERT INTO order_items (
          order_id, design_id, size, custom_photo_storage_path, message_body, message_font, message_colour,
          recipient_full_names, admission_number, school_name, county_id, sub_county_id, po_box, class_form,
          unit_price_kes, cogs_kes, print_region_id, print_status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, 'queued')
        RETURNING *`,
        [
          order.id, item.design_id, item.size, item.custom_photo_storage_path ?? null,
          item.message_body, item.message_font ?? null, item.message_colour ?? null,
          item.recipient_full_names, item.admission_number, item.school_name,
          item.county_id, item.sub_county_id, item.po_box ?? null, item.class_form ?? null,
          item.unit_price_kes, item.cogs_kes ?? 150.00, printRegionId
        ]
      )
      orderItems.push(itemRes.rows[0])

      // Auto-reserve stock for size
      await client.query(
        `UPDATE inventory_items
         SET stock_quantity = GREATEST(0, stock_quantity - 1),
             reserved_quantity = reserved_quantity + 1,
             updated_at = now()
         WHERE size = $1`,
        [item.size]
      )
    }

    // Log initial status change
    await client.query(
      `INSERT INTO order_status_logs (order_id, from_status, to_status, changed_by, notes)
       VALUES ($1, NULL, $2, $3, $4)`,
      [order.id, status, adminId ? `admin:${adminId}` : 'customer', `Order created via ${channel}`]
    )

    await client.query('COMMIT')
    return { order, orderItems }
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

export async function updateOrderStatus(
  orderId: string,
  newStatus: string,
  changedBy: string = 'system',
  notes?: string
): Promise<void> {
  const current = await queryOne<{ status: string }>(`SELECT status FROM orders WHERE id = $1`, [orderId])
  const oldStatus = current?.status ?? null

  let timeSql = ''
  if (newStatus === 'dispatched') {
    timeSql = ', shipped_at = now()'
  } else if (newStatus === 'delivered') {
    timeSql = ', delivered_at = now()'
  }

  await query(`UPDATE orders SET status = $1, updated_at = now() ${timeSql} WHERE id = $2`, [newStatus, orderId])

  await query(
    `INSERT INTO order_status_logs (order_id, from_status, to_status, changed_by, notes)
     VALUES ($1, $2, $3, $4, $5)`,
    [orderId, oldStatus, newStatus, changedBy, notes ?? null]
  )
}

export async function getOrderByNumberAndPhone(orderNumber: string, phone?: string): Promise<{ order: Order; customer: Customer; items: OrderItem[] } | null> {
  let sql = `SELECT o.id, o.order_number, o.customer_id, o.status, o.total_amount_kes, o.channel, o.shipped_at, o.delivered_at, o.placed_by_admin_id, o.created_at, o.updated_at, c.phone, c.email
     FROM orders o
     JOIN customers c ON c.id = o.customer_id
     WHERE UPPER(o.order_number) = UPPER($1)`
  const params: any[] = [orderNumber]

  if (phone) {
    params.push(phone)
    sql += ` AND c.phone = $2`
  }

  const orderData = await queryOne<Order & { phone: string; email: string | null }>(sql, params)
  if (!orderData) return null

  const items = await query<OrderItem>(
    `SELECT id, order_id, design_id, size, custom_photo_storage_path, message_body, message_font, message_colour,
            recipient_full_names, admission_number, school_name, county_id, sub_county_id, po_box, class_form,
            unit_price_kes, cogs_kes, print_region_id, print_status, created_at
     FROM order_items WHERE order_id = $1`,
    [orderData.id]
  )

  return {
    order: {
      id: orderData.id,
      order_number: orderData.order_number,
      customer_id: orderData.customer_id,
      status: orderData.status,
      total_amount_kes: parseFloat(orderData.total_amount_kes as any),
      channel: orderData.channel,
      shipped_at: orderData.shipped_at,
      delivered_at: orderData.delivered_at,
      placed_by_admin_id: orderData.placed_by_admin_id,
      created_at: orderData.created_at,
      updated_at: orderData.updated_at
    },
    customer: {
      id: orderData.customer_id,
      phone: orderData.phone,
      email: orderData.email,
      created_at: orderData.created_at
    },
    items
  }
}

export async function getOrderTrackingTimeline(orderNumber: string, phone?: string): Promise<any | null> {
  const result = await getOrderByNumberAndPhone(orderNumber, phone)
  if (!result) return null

  const logs = await query(
    `SELECT from_status, to_status, changed_by, notes, created_at
     FROM order_status_logs
     WHERE order_id = $1
     ORDER BY created_at ASC`,
    [result.order.id]
  )

  const items = await query<any>(
    `SELECT oi.*, d.name as design_name, co.name as county_name, sc.name as sub_county_name, pr.name as print_region_name
     FROM order_items oi
     LEFT JOIN designs d ON d.id = oi.design_id
     LEFT JOIN counties co ON co.id = oi.county_id
     LEFT JOIN sub_counties sc ON sc.id = oi.sub_county_id
     LEFT JOIN print_regions pr ON pr.id = oi.print_region_id
     WHERE oi.order_id = $1`,
    [result.order.id]
  )

  const deliveryInfo = await queryOne<any>(
    `SELECT d.*, r.name as rider_name, r.phone as rider_phone
     FROM deliveries d
     LEFT JOIN riders r ON r.id = d.rider_id
     JOIN order_items oi ON oi.id = d.order_item_id
     WHERE oi.order_id = $1
     ORDER BY d.created_at DESC LIMIT 1`,
    [result.order.id]
  )

  return {
    ...result,
    items,
    timeline: logs,
    delivery: deliveryInfo ?? null
  }
}

export async function listAllOrders(limit = 50, offset = 0): Promise<any[]> {
  return query(
    `SELECT o.id, o.order_number, o.status, o.total_amount_kes, o.channel, o.shipped_at, o.delivered_at, o.created_at, c.phone, c.email,
            (SELECT count(*) FROM order_items oi WHERE oi.order_id = o.id) as item_count,
            (SELECT string_agg(oi.recipient_full_names, ', ') FROM order_items oi WHERE oi.order_id = o.id) as recipients,
            (SELECT string_agg(DISTINCT co.name, ', ') FROM order_items oi JOIN counties co ON co.id = oi.county_id WHERE oi.order_id = o.id) as destination_counties,
            (SELECT string_agg(DISTINCT pr.name, ', ') FROM order_items oi JOIN print_regions pr ON pr.id = oi.print_region_id WHERE oi.order_id = o.id) as print_hubs
     FROM orders o
     JOIN customers c ON c.id = o.customer_id
     ORDER BY o.created_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  )
}

export async function getOrderSummary(orderId: string): Promise<any | null> {
  const rows = await query(
    `SELECT o.id, o.order_number, o.status, o.total_amount_kes, o.channel, o.shipped_at, o.delivered_at, o.created_at, c.phone, c.email,
            (SELECT count(*) FROM order_items oi WHERE oi.order_id = o.id) as item_count,
            (SELECT string_agg(oi.recipient_full_names, ', ') FROM order_items oi WHERE oi.order_id = o.id) as recipients,
            (SELECT string_agg(DISTINCT co.name, ', ') FROM order_items oi JOIN counties co ON co.id = oi.county_id WHERE oi.order_id = o.id) as destination_counties,
            (SELECT string_agg(DISTINCT pr.name, ', ') FROM order_items oi JOIN print_regions pr ON pr.id = oi.print_region_id WHERE oi.order_id = o.id) as print_hubs
     FROM orders o
     JOIN customers c ON c.id = o.customer_id
     WHERE o.id = $1`,
    [orderId]
  )
  return rows[0] || null
}

export async function getOrderDetailsWithItems(orderId: string): Promise<any> {
  const order = await queryOne<any>(
    `SELECT o.id, o.order_number, o.status, o.total_amount_kes, o.channel, o.shipped_at, o.delivered_at, o.created_at, c.phone, c.email
     FROM orders o
     JOIN customers c ON c.id = o.customer_id
     WHERE o.id = $1`,
    [orderId]
  )
  if (!order) return null

  const items = await query<any>(
    `SELECT oi.*, d.name as design_name, co.name as county_name, sc.name as sub_county_name, pr.name as print_region_name
     FROM order_items oi
     LEFT JOIN designs d ON d.id = oi.design_id
     LEFT JOIN counties co ON co.id = oi.county_id
     LEFT JOIN sub_counties sc ON sc.id = oi.sub_county_id
     LEFT JOIN print_regions pr ON pr.id = oi.print_region_id
     WHERE oi.order_id = $1`,
    [orderId]
  )

  const itemsWithDimensions = items.map((item: any) => {
    const dimensionsMap: Record<string, any> = {
      A5: { trimMm: '148 x 210 mm', bleedMm: '152 x 214 mm', widthMm: 148, heightMm: 210, boardWeight: '350 GSM Heavy Board' },
      A4: { trimMm: '210 x 297 mm', bleedMm: '214 x 301 mm', widthMm: 210, heightMm: 297, boardWeight: '350 GSM Heavy Board' },
      A3: { trimMm: '297 x 420 mm', bleedMm: '301 x 424 mm', widthMm: 297, heightMm: 420, boardWeight: '350 GSM Heavy Board' },
    }
    return {
      ...item,
      dimensions: dimensionsMap[item.size] || dimensionsMap['A4'],
      photo_url: item.custom_photo_storage_path ? `http://localhost:4000/api/v1/files/customer-photos/${path.basename(item.custom_photo_storage_path)}` : null
    }
  })

  const logs = await query(
    `SELECT from_status, to_status, changed_by, notes, created_at
     FROM order_status_logs
     WHERE order_id = $1
     ORDER BY created_at ASC`,
    [orderId]
  )

  return { ...order, items: itemsWithDimensions, timeline: logs }
}

