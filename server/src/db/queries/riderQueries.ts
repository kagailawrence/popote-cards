import { query, queryOne } from '../../config/db'

export interface Rider {
  id: string
  name: string
  phone: string
  is_active: boolean
}

export interface Delivery {
  id: string
  order_item_id: string
  rider_id: string | null
  delivery_note_storage_path: string | null
  delivered_at: Date | null
  rider_payment_status: 'unpaid' | 'paid'
  created_at: Date
}

export async function getActiveRiders(): Promise<Rider[]> {
  return query<Rider>(`SELECT id, name, phone, is_active FROM riders WHERE is_active = true ORDER BY name ASC`)
}

export async function assignRiderToOrderItem(orderItemId: string, riderId: string): Promise<Delivery> {
  const existing = await queryOne<Delivery>(`SELECT id FROM deliveries WHERE order_item_id = $1`, [orderItemId])
  if (existing) {
    return (await queryOne<Delivery>(
      `UPDATE deliveries SET rider_id = $1 WHERE order_item_id = $2 RETURNING *`,
      [riderId, orderItemId]
    ))!
  }
  return (await queryOne<Delivery>(
    `INSERT INTO deliveries (order_item_id, rider_id) VALUES ($1, $2) RETURNING *`,
    [orderItemId, riderId]
  ))!
}

export async function recordDeliveryProof(
  orderItemId: string,
  deliveryNotePath: string
): Promise<Delivery> {
  return (await queryOne<Delivery>(
    `UPDATE deliveries
     SET delivery_note_storage_path = $1, delivered_at = now()
     WHERE order_item_id = $2
     RETURNING *`,
    [deliveryNotePath, orderItemId]
  ))!
}
