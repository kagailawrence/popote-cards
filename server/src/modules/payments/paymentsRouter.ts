import { Router } from 'express'
import { z } from 'zod'
import { randomUUID } from 'crypto'
import {
  createMpesaTransaction,
  findMpesaTransactionByCheckoutId,
  updateMpesaTransactionCallback,
  markTransactionTimedOut,
} from '../../db/queries/paymentQueries'
import { normalizePhoneNumber, isValidKenyanPhone } from '../../utils/phoneUtils'
import { updateOrderStatus, getOrderDetailsWithItems } from '../../db/queries/orderQueries'
import { paymentLimiter } from '../../middleware/rateLimiter'
import { enqueueNotificationJob, enqueuePrintRoutingJob } from '../../jobs/queues'
import { NotFoundError, BadRequestError, ConflictError, UnauthorizedError } from '../../utils/errors'
import { redis } from '../../config/redis'
import { emitOrderStatusUpdated } from '../../services/orderEvents'

const router = Router()

// In-memory fallback lock set if Redis is offline during local dev
const memoryLocks = new Set<string>()

async function acquirePaymentLock(orderId: string, ttlMs = 15000): Promise<() => Promise<void>> {
  const lockKey = `lock:stk:${orderId}`
  let lockAcquired = false

  try {
    const result = await redis.set(lockKey, 'locked', 'PX', ttlMs, 'NX')
    if (result === 'OK') {
      lockAcquired = true
    }
  } catch {
    // If Redis is unreachable, fallback to in-memory locking
    if (!memoryLocks.has(orderId)) {
      memoryLocks.add(orderId)
      lockAcquired = true
      setTimeout(() => memoryLocks.delete(orderId), ttlMs)
    }
  }

  if (!lockAcquired) {
    throw new ConflictError('A payment prompt is currently active for this order. Please check your phone or wait a moment.')
  }

  return async () => {
    try {
      await redis.del(lockKey)
    } catch {}
    memoryLocks.delete(orderId)
  }
}

const stkPushSchema = z.object({
  orderId: z.string().uuid(),
  phone: z.string().refine(isValidKenyanPhone, {
    message: 'Invalid Kenyan phone number format. Must be a valid Kenyan mobile number (e.g. 07XXXXXXXX or 2547XXXXXXXX).',
  }),
  amountKes: z.number().positive(),
})

// Trigger M-Pesa STK Push
router.post('/stk-push', paymentLimiter, async (req, res, next) => {
  let releaseLock: (() => Promise<void>) | null = null
  try {
    const parse = stkPushSchema.safeParse(req.body)
    if (!parse.success) {
      throw new BadRequestError('Invalid STK Push request data', parse.error.format())
    }

    const { orderId, phone, amountKes } = parse.data
    const normalizedPhone = normalizePhoneNumber(phone)

    // Acquire lock to prevent duplicate payment prompts & race conditions
    releaseLock = await acquirePaymentLock(orderId)

    // 1. Verify order existence
    const order = await getOrderDetailsWithItems(orderId)
    if (!order) {
      throw new NotFoundError(`Order with ID '${orderId}' not found`)
    }

    // 2. Verify order status
    if (order.status === 'paid') {
      throw new ConflictError('Order has already been paid and processed')
    }
    if (order.status === 'cancelled') {
      throw new BadRequestError('Cannot initiate payment for a cancelled order')
    }

    // 3. Verify amount matching (prevent price tampering)
    const expectedAmount = parseFloat(order.total_amount_kes)
    if (Math.abs(expectedAmount - amountKes) > 1.0) {
      throw new BadRequestError(
        `Payment amount (KSh ${amountKes}) does not match order total (KSh ${expectedAmount})`
      )
    }

    // Simulated Safaricom Daraja CheckoutRequestID for sandbox/production
    const checkoutRequestId = `ws_CO_${Date.now()}_${randomUUID().slice(0, 8)}`

    const tx = await createMpesaTransaction(orderId, checkoutRequestId, normalizedPhone, amountKes)

    res.json({
      data: {
        checkoutRequestId: tx.checkout_request_id,
        status: 'STK_PUSH_SENT',
        message: `Please complete the prompt on phone ${normalizedPhone}`,
        amountKes,
      },
    })
  } catch (err) {
    if (releaseLock) {
      await releaseLock().catch(() => {})
    }
    next(err)
  }
})

// Daraja Callback Handler (Idempotent per prompt.md Section 4.6 & Webhook Verification)
router.post('/mpesa/callback', async (req, res, next) => {
  try {
    // 1. Verify Webhook Authenticity if secret is configured
    const webhookSecret = process.env.MPESA_WEBHOOK_SECRET
    if (webhookSecret) {
      const incomingToken =
        req.headers['x-mpesa-secret'] ||
        req.headers['x-daraja-token'] ||
        req.query.secret ||
        req.query.token

      if (incomingToken !== webhookSecret) {
        return res.status(401).json({ error: 'Unauthorized M-Pesa webhook callback: invalid secret' })
      }
    }

    const body = req.body
    const stkCallback = body?.Body?.stkCallback || body?.stkCallback || body

    const checkoutRequestId = stkCallback?.CheckoutRequestID ?? body?.checkoutRequestId
    const resultCode = stkCallback?.ResultCode ?? (body?.success ? 0 : 1)
    const resultDesc = stkCallback?.ResultDesc ?? (body?.success ? 'Success' : 'Transaction failed or cancelled')

    if (!checkoutRequestId) {
      return res.status(400).json({ error: 'Missing CheckoutRequestID in callback payload', code: 'MISSING_CHECKOUT_ID' })
    }

    const existingTx = await findMpesaTransactionByCheckoutId(checkoutRequestId)
    if (!existingTx) {
      // Return HTTP 200 to Safaricom to acknowledge delivery attempt
      return res.status(200).json({ received: true, note: 'Unknown CheckoutRequestID' })
    }

    // Idempotence check: if already processed, return 200 immediately
    if (existingTx.status === 'success' || existingTx.status === 'failed' || existingTx.status === 'cancelled') {
      return res.status(200).json({ received: true, note: 'Already processed' })
    }

    if (resultCode === 0) {
      // Payment Successful
      const items = stkCallback?.CallbackMetadata?.Item || []
      const receipt = items.find((i: any) => i.Name === 'MpesaReceiptNumber')?.Value || `MPESA_${randomUUID().slice(0, 8).toUpperCase()}`

      await updateMpesaTransactionCallback(checkoutRequestId, 'success', receipt, {
        raw: body,
        resultCode,
        resultDesc,
      })

      await updateOrderStatus(existingTx.order_id, 'paid', 'mpesa_callback', `Receipt: ${receipt}`)
      emitOrderStatusUpdated(existingTx.order_id, 'paid', { receipt })

      // Enqueue background jobs per Section 4.6
      try {
        await enqueueNotificationJob(existingTx.order_id, 'payment_success')
        await enqueuePrintRoutingJob(existingTx.order_id)
      } catch (queueErr) {
        console.error('[payment-queue-error]', queueErr)
      }
    } else {
      // Payment Failed/Cancelled
      let failureReason = resultDesc
      if (resultCode === 1032) {
        failureReason = 'Transaction cancelled by customer on phone'
      } else if (resultCode === 1037) {
        failureReason = 'Timeout waiting for customer PIN entry'
      } else if (resultCode === 1) {
        failureReason = 'Insufficient M-Pesa balance or payment rejected'
      }

      await updateMpesaTransactionCallback(checkoutRequestId, 'failed', null, {
        raw: body,
        resultCode,
        resultDesc,
        failureReason,
      })
    }

    res.status(200).json({ received: true })
  } catch (err) {
    next(err)
  }
})

// Check transaction status polling with auto-timeout (2 minutes)
router.get('/status/:checkoutRequestId', async (req, res, next) => {
  try {
    const { checkoutRequestId } = req.params
    const tx = await findMpesaTransactionByCheckoutId(checkoutRequestId)

    if (!tx) {
      throw new NotFoundError(`Transaction '${checkoutRequestId}' not found`)
    }

    let currentStatus = tx.status
    let failureReason = tx.raw_callback?.failureReason || tx.raw_callback?.resultDesc || null

    // Check for auto-timeout if status is still pending after 2 minutes (120,000 ms)
    const timeoutMs = 120 * 1000
    const ageMs = Date.now() - new Date(tx.created_at).getTime()

    if (currentStatus === 'pending' && ageMs > timeoutMs) {
      await markTransactionTimedOut(checkoutRequestId)
      currentStatus = 'timed_out'
      failureReason = 'M-Pesa STK Push prompt timed out waiting for PIN input (120s).'
    }

    res.json({
      data: {
        checkoutRequestId: tx.checkout_request_id,
        orderId: tx.order_id,
        status: currentStatus,
        receiptNumber: tx.mpesa_receipt_number,
        amountKes: tx.amount_kes,
        phone: tx.phone,
        failureReason,
        createdAt: tx.created_at,
      },
    })
  } catch (err) {
    next(err)
  }
})

export default router
