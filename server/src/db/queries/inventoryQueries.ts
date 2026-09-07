import { query, queryOne, pool } from '../../config/db'

export interface InventoryItem {
  id: string
  name: string
  sku: string
  size: 'A3' | 'A4' | 'A5' | 'universal'
  stock_quantity: number
  reserved_quantity: number
  reorder_threshold: number
  unit_cogs_kes: number
  created_at: Date
  updated_at: Date
}

export async function listInventoryItems(): Promise<InventoryItem[]> {
  return query<InventoryItem>(
    `SELECT id, name, sku, size, stock_quantity, reserved_quantity, reorder_threshold, unit_cogs_kes, created_at, updated_at
     FROM inventory_items
     ORDER BY size ASC, name ASC`
  )
}

export async function updateStockQuantity(
  itemId: string,
  newQuantity: number,
  reason: 'manual_restock' | 'refund_restock',
  notes?: string
): Promise<InventoryItem> {
  const item = await queryOne<InventoryItem>(
    `UPDATE inventory_items
     SET stock_quantity = $1, updated_at = now()
     WHERE id = $2
     RETURNING *`,
    [newQuantity, itemId]
  )

  if (item) {
    await query(
      `INSERT INTO inventory_logs (inventory_item_id, change_amount, reason, notes)
       VALUES ($1, $2, $3, $4)`,
      [itemId, newQuantity, reason, notes ?? null]
    )
  }

  return item!
}

export async function reserveStockForSize(size: string, quantity: number = 1, orderId?: string): Promise<boolean> {
  const item = await queryOne<InventoryItem>(
    `SELECT id, stock_quantity, reserved_quantity FROM inventory_items WHERE size = $1 LIMIT 1`,
    [size]
  )
  if (!item) return false

  await query(
    `UPDATE inventory_items
     SET stock_quantity = GREATEST(0, stock_quantity - $1),
         reserved_quantity = reserved_quantity + $1,
         updated_at = now()
     WHERE id = $2`,
    [quantity, item.id]
  )

  await query(
    `INSERT INTO inventory_logs (inventory_item_id, change_amount, reason, order_id, notes)
     VALUES ($1, $2, 'order_reserved', $3, 'Stock reserved for order placement')`,
    [item.id, -quantity, orderId ?? null]
  )

  return true
}

export async function releaseStockForSize(size: string, quantity: number = 1, orderId?: string, isRefundRestock: boolean = false): Promise<boolean> {
  const item = await queryOne<InventoryItem>(
    `SELECT id, stock_quantity, reserved_quantity FROM inventory_items WHERE size = $1 LIMIT 1`,
    [size]
  )
  if (!item) return false

  if (isRefundRestock) {
    await query(
      `UPDATE inventory_items
       SET stock_quantity = stock_quantity + $1,
           reserved_quantity = GREATEST(0, reserved_quantity - $1),
           updated_at = now()
       WHERE id = $2`,
      [quantity, item.id]
    )
  } else {
    await query(
      `UPDATE inventory_items
       SET reserved_quantity = GREATEST(0, reserved_quantity - $1),
           updated_at = now()
       WHERE id = $2`,
      [quantity, item.id]
    )
  }

  await query(
    `INSERT INTO inventory_logs (inventory_item_id, change_amount, reason, order_id, notes)
     VALUES ($1, $2, $3, $4, 'Stock adjustment from order status change/cancel')`,
    [item.id, quantity, isRefundRestock ? 'refund_restock' : 'order_cancelled', orderId ?? null]
  )

  return true
}
