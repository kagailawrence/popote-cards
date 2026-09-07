import { Router } from 'express'
import { getActiveRiders, assignRiderToOrderItem, recordDeliveryProof } from '../../db/queries/riderQueries'
import { requireAuth } from '../../middleware/auth'
import { uploadDeliveryNote, moveToPermanentStorage } from '../../middleware/upload'

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

    res.json({ data: delivery })
  } catch (err) {
    next(err)
  }
})

export default router
