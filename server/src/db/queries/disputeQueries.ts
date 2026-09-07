import { query, queryOne } from '../../config/db'

export interface Dispute {
  id: string
  order_id: string
  mpesa_transaction_code: string | null
  channel: 'call' | 'website'
  description: string | null
  status: 'open' | 'in_review' | 'resolved'
  created_at: Date
  resolved_at: Date | null
}

export async function createDispute(
  orderId: string,
  channel: 'call' | 'website',
  description?: string,
  mpesaTransactionCode?: string
): Promise<Dispute> {
  const row = await queryOne<Dispute>(
    `INSERT INTO disputes (order_id, channel, description, mpesa_transaction_code)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [orderId, channel, description ?? null, mpesaTransactionCode ?? null]
  )
  return row!
}

export async function getDisputes(status?: string): Promise<any[]> {
  let sql = `
    SELECT d.id, d.order_id, o.order_number, d.mpesa_transaction_code, d.channel, d.description, d.status, d.created_at, d.resolved_at,
           c.phone as customer_phone
    FROM disputes d
    JOIN orders o ON o.id = d.order_id
    JOIN customers c ON c.id = o.customer_id
  `
  const params: any[] = []
  if (status) {
    params.push(status)
    sql += ` WHERE d.status = $1`
  }
  sql += ` ORDER BY d.created_at DESC`
  return query(sql, params)
}

export async function updateDisputeStatus(disputeId: string, status: 'open' | 'in_review' | 'resolved'): Promise<void> {
  const resolvedAt = status === 'resolved' ? new Date() : null
  await query(
    `UPDATE disputes SET status = $1, resolved_at = $2 WHERE id = $3`,
    [status, resolvedAt, disputeId]
  )
}
