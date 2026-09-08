import { query, queryOne } from '../../config/db'
import { escapeSqlLike } from '../../utils/sanitize'

export interface AdminUserRecord {
  id: string
  email: string
  role: string
  failed_login_attempts: number
  locked_until: Date | null
  created_at: Date
  updated_at: Date
}

export interface CustomerRecord {
  id: string
  phone: string
  email: string | null
  created_at: Date
  total_orders: number
  total_spent_kes: number
  last_order_date: Date | null
}

export interface RiderRecord {
  id: string
  name: string
  phone: string
  is_active: boolean
  total_deliveries?: number
}

// ─── Admin Users ─────────────────────────────────────────────────────────────

export async function listAdminUsers(): Promise<AdminUserRecord[]> {
  return query<AdminUserRecord>(
    `SELECT id, email, role, failed_login_attempts, locked_until, created_at, updated_at
     FROM admins
     ORDER BY created_at DESC`
  )
}

export async function createAdminUser(email: string, passwordHash: string, role: string = 'admin'): Promise<AdminUserRecord> {
  const row = await queryOne<AdminUserRecord>(
    `INSERT INTO admins (email, password_hash, role)
     VALUES ($1, $2, $3)
     RETURNING id, email, role, failed_login_attempts, locked_until, created_at, updated_at`,
    [email.toLowerCase().trim(), passwordHash, role]
  )
  return row!
}

export async function updateAdminUser(
  id: string,
  data: { role?: string; email?: string; unlock?: boolean }
): Promise<AdminUserRecord | null> {
  const fields: string[] = []
  const values: any[] = []

  if (data.email !== undefined) {
    values.push(data.email.toLowerCase().trim())
    fields.push(`email = $${values.length}`)
  }
  if (data.role !== undefined) {
    values.push(data.role)
    fields.push(`role = $${values.length}`)
  }
  if (data.unlock) {
    fields.push(`failed_login_attempts = 0`)
    fields.push(`locked_until = NULL`)
  }

  if (fields.length === 0) return null

  fields.push(`updated_at = now()`)
  values.push(id)

  const sql = `UPDATE admins SET ${fields.join(', ')} WHERE id = $${values.length} RETURNING id, email, role, failed_login_attempts, locked_until, created_at, updated_at`
  return queryOne<AdminUserRecord>(sql, values)
}

export async function updateAdminPassword(id: string, passwordHash: string): Promise<boolean> {
  const result = await query(
    `UPDATE admins
     SET password_hash = $1, failed_login_attempts = 0, locked_until = NULL, updated_at = now()
     WHERE id = $2`,
    [passwordHash, id]
  )
  return true
}

export async function deleteAdminUser(id: string): Promise<boolean> {
  await query(`DELETE FROM refresh_tokens WHERE admin_id = $1`, [id])
  await query(`DELETE FROM admins WHERE id = $1`, [id])
  return true
}

// ─── Customer Directory ──────────────────────────────────────────────────────

export async function listCustomers(search?: string, limit = 100, offset = 0): Promise<CustomerRecord[]> {
  let searchClause = ''
  const params: any[] = []

  if (search && search.trim()) {
    const escaped = escapeSqlLike(search.trim())
    params.push(`%${escaped}%`)
    searchClause = `WHERE c.phone ILIKE $${params.length} OR c.email ILIKE $${params.length}`
  }

  params.push(limit, offset)

  const sql = `
    SELECT c.id, c.phone, c.email, c.created_at,
           COUNT(o.id)::int as total_orders,
           COALESCE(SUM(o.total_amount_kes), 0)::numeric as total_spent_kes,
           MAX(o.created_at) as last_order_date
    FROM customers c
    LEFT JOIN orders o ON o.customer_id = c.id
    ${searchClause}
    GROUP BY c.id, c.phone, c.email, c.created_at
    ORDER BY c.created_at DESC
    LIMIT $${params.length - 1} OFFSET $${params.length}
  `

  return query<CustomerRecord>(sql, params)
}

export async function getCustomerOrders(customerId: string): Promise<any[]> {
  return query(
    `SELECT o.id, o.order_number, o.status, o.total_amount_kes, o.channel, o.created_at,
            (SELECT count(*) FROM order_items oi WHERE oi.order_id = o.id) as item_count,
            (SELECT string_agg(oi.recipient_full_names, ', ') FROM order_items oi WHERE oi.order_id = o.id) as recipients
     FROM orders o
     WHERE o.customer_id = $1
     ORDER BY o.created_at DESC`,
    [customerId]
  )
}

// ─── Riders Management ───────────────────────────────────────────────────────

export async function listRidersWithStats(): Promise<RiderRecord[]> {
  return query<RiderRecord>(
    `SELECT r.id, r.name, r.phone, r.is_active,
            COUNT(d.id)::int as total_deliveries
     FROM riders r
     LEFT JOIN deliveries d ON d.rider_id = r.id
     GROUP BY r.id, r.name, r.phone, r.is_active
     ORDER BY r.name ASC`
  )
}

export async function createRider(name: string, phone: string, isActive = true): Promise<RiderRecord> {
  const row = await queryOne<RiderRecord>(
    `INSERT INTO riders (name, phone, is_active)
     VALUES ($1, $2, $3)
     RETURNING id, name, phone, is_active`,
    [name.trim(), phone.trim(), isActive]
  )
  return row!
}

export async function updateRider(id: string, name: string, phone: string, isActive: boolean): Promise<RiderRecord | null> {
  return queryOne<RiderRecord>(
    `UPDATE riders
     SET name = $1, phone = $2, is_active = $3
     WHERE id = $4
     RETURNING id, name, phone, is_active`,
    [name.trim(), phone.trim(), isActive, id]
  )
}

export async function deleteRider(id: string): Promise<boolean> {
  await query(`DELETE FROM deliveries WHERE rider_id = $1`, [id])
  await query(`DELETE FROM riders WHERE id = $1`, [id])
  return true
}
