import { Router } from 'express'
import { z } from 'zod'
import { createDispute, getDisputes, updateDisputeStatus } from '../../db/queries/disputeQueries'
import { getOrderByNumberAndPhone } from '../../db/queries/orderQueries'
import { normalizePhoneNumber, isValidKenyanPhone } from '../../utils/phoneUtils'
import { requireAuth } from '../../middleware/auth'

const router = Router()

const createDisputeSchema = z.object({
  orderNumber: z.string().min(4),
  phone: z.string().refine(isValidKenyanPhone, {
    message: 'Invalid Kenyan phone number format. Must be a valid Kenyan mobile number (e.g. 07XXXXXXXX or 2547XXXXXXXX).',
  }),
  channel: z.enum(['call', 'website']),
  description: z.string().min(5),
  mpesaTransactionCode: z.string().optional(),
})

// Public dispute submission
router.post('/', async (req, res, next) => {
  try {
    const parse = createDisputeSchema.safeParse(req.body)
    if (!parse.success) return res.status(400).json({ error: 'Invalid dispute parameters' })

    const { orderNumber, phone, channel, description, mpesaTransactionCode } = parse.data
    const normalizedPhone = normalizePhoneNumber(phone)
    const orderData = await getOrderByNumberAndPhone(orderNumber, normalizedPhone)
    if (!orderData) {
      return res.status(404).json({ error: 'Matching order not found with provided phone number' })
    }

    const dispute = await createDispute(orderData.order.id, channel, description, mpesaTransactionCode)
    res.status(201).json({
      data: {
        disputeId: dispute.id,
        status: dispute.status,
        message: 'Dispute submitted successfully. Our support team will reach out shortly.',
      },
    })
  } catch (err) {
    next(err)
  }
})

// Admin dispute listing
router.get('/', requireAuth(['admin', 'super_admin']), async (req, res, next) => {
  try {
    const status = req.query.status as string | undefined
    const disputes = await getDisputes(status)
    res.json({ data: disputes })
  } catch (err) {
    next(err)
  }
})

// Admin dispute resolution
router.patch('/:id/status', requireAuth(['admin', 'super_admin']), async (req, res, next) => {
  try {
    const { status } = req.body
    if (!['open', 'in_review', 'resolved'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' })
    }
    await updateDisputeStatus(req.params.id as string, status)
    res.json({ success: true })
  } catch (err) {
    next(err)
  }
})

export default router
