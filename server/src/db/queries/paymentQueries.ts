import { query, queryOne } from '../../config/db'

export interface MpesaTransaction {
  id: string
  order_id: string
  checkout_request_id: string
  mpesa_receipt_number: string | null
  phone: string
  amount_kes: number
  status: 'pending' | 'success' | 'failed' | 'cancelled' | 'timed_out'
  raw_callback: any
  created_at: Date
}

export async function createMpesaTransaction(
  orderId: string,
  checkoutRequestId: string,
  phone: string,
  amountKes: number
): Promise<MpesaTransaction> {
  const row = await queryOne<MpesaTransaction>(
    `INSERT INTO mpesa_transactions (order_id, checkout_request_id, phone, amount_kes, status)
     VALUES ($1, $2, $3, $4, 'pending')
     RETURNING *`,
    [orderId, checkoutRequestId, phone, amountKes]
  )
  return row!
}

export async function findMpesaTransactionByCheckoutId(checkoutRequestId: string): Promise<MpesaTransaction | null> {
  return queryOne<MpesaTransaction>(
    `SELECT id, order_id, checkout_request_id, mpesa_receipt_number, phone, amount_kes, status, raw_callback, created_at
     FROM mpesa_transactions WHERE checkout_request_id = $1`,
    [checkoutRequestId]
  )
}

export async function findLatestMpesaTransactionByOrderId(orderId: string): Promise<MpesaTransaction | null> {
  return queryOne<MpesaTransaction>(
    `SELECT id, order_id, checkout_request_id, mpesa_receipt_number, phone, amount_kes, status, raw_callback, created_at
     FROM mpesa_transactions WHERE order_id = $1 ORDER BY created_at DESC LIMIT 1`,
    [orderId]
  )
}

export async function updateMpesaTransactionCallback(
  checkoutRequestId: string,
  status: 'success' | 'failed' | 'cancelled' | 'timed_out',
  receiptNumber: string | null,
  rawCallback: any
): Promise<MpesaTransaction | null> {
  return queryOne<MpesaTransaction>(
    `UPDATE mpesa_transactions
     SET status = $1, mpesa_receipt_number = $2, raw_callback = $3
     WHERE checkout_request_id = $4
     RETURNING *`,
    [status, receiptNumber, rawCallback, checkoutRequestId]
  )
}

export async function markTransactionTimedOut(checkoutRequestId: string): Promise<MpesaTransaction | null> {
  return queryOne<MpesaTransaction>(
    `UPDATE mpesa_transactions
     SET status = 'timed_out', raw_callback = jsonb_build_object('reason', 'STK_PUSH_TIMEOUT', 'timedOutAt', now())
     WHERE checkout_request_id = $1 AND status = 'pending'
     RETURNING *`,
    [checkoutRequestId]
  )
}
