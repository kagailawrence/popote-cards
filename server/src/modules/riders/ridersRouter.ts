import { Router } from 'express'
import { getActiveRiders, assignRiderToOrderItem, recordDeliveryProof } from '../../db/queries/riderQueries'
import { requireAuth } from '../../middleware/auth'
import { uploadDeliveryNote, moveToPermanentStorage } from '../../middleware/upload'
import { queryOne } from '../../config/db'
import { sendOrderDeliveredEmail } from '../../services/emailService'

const router = Router()

router.get('/', requireAuth(['admin', 'super_admin', 'rider_manager']), async (_req, res, next) => {
  try {
    const riders = await getActiveRiders()
    res.json({ data: riders })
  } catch (err) {
    next(err)
  }
})

router.post('/assign', requireAuth(['admin', 'super_admin', 'rider_manager']), async (req, res, next) => {
  try {
    const { orderItemId, riderId } = req.body
    if (!orderItemId || !riderId) return res.status(400).json({ error: 'orderItemId and riderId are required' })

    const delivery = await assignRiderToOrderItem(orderItemId, riderId)
    res.json({ data: delivery })
  } catch (err) {
    next(err)
  }
})

router.post('/proof', requireAuth(['admin', 'super_admin', 'rider_manager']), uploadDeliveryNote.single('note'), async (req, res, next) => {
  try {
    const { orderItemId } = req.body
    if (!orderItemId || !req.file) {
      return res.status(400).json({ error: 'orderItemId and note file are required' })
    }

    const storagePath = await moveToPermanentStorage(req.file.path, 'delivery-notes')
    const delivery = await recordDeliveryProof(orderItemId, storagePath)

    // Lookup customer info for delivery email dispatch
    try {
      const orderInfo = await queryOne<any>(
        `SELECT o.order_number, c.email, oi.recipient_full_names, oi.school_name, co.name as county_name
         FROM order_items oi
         JOIN orders o ON o.id = oi.order_id
         JOIN customers c ON c.id = o.customer_id
         LEFT JOIN counties co ON co.id = oi.county_id
         WHERE oi.id = $1`,
        [orderItemId]
      )

      if (orderInfo?.email) {
        sendOrderDeliveredEmail(orderInfo.email, {
          orderNumber: orderInfo.order_number,
          recipientNames: orderInfo.recipient_full_names,
          schoolNames: orderInfo.school_name,
          countyName: orderInfo.county_name,
          deliveredAt: new Date().toLocaleString('en-KE', { timeZone: 'Africa/Nairobi' }),
        }).catch((e) => console.error('[Email] Rider delivery proof notification error:', e))
      }
    } catch (lookupErr) {
      console.warn('[Riders] Could not dispatch delivery notification email:', lookupErr)
    }

    res.json({ data: delivery })
  } catch (err) {
    next(err)
  }
})

export default router

