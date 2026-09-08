import { Router } from 'express'
import {
  getPriceMatrix,
  getCalculatedPrice,
  updatePriceRule,
  getDeliveryPricing,
  updateDeliveryPricing,
} from '../../db/queries/pricingQueries'
import { getSubCountyById } from '../../db/queries/locationQueries'
import { requireAuth } from '../../middleware/auth'

const router = Router()

// GET full card size / zone price matrix
router.get('/matrix', async (_req, res, next) => {
  try {
    const matrix = await getPriceMatrix()
    res.json({ data: matrix })
  } catch (err) {
    next(err)
  }
})

// PATCH individual card size price rule (Admin only)
router.patch('/matrix/:id', requireAuth(['admin', 'super_admin']), async (req, res, next) => {
  try {
    const { amountKes } = req.body
    if (amountKes === undefined || isNaN(Number(amountKes)) || Number(amountKes) < 0) {
      return res.status(400).json({ error: 'Valid positive amountKes is required' })
    }

    const updated = await updatePriceRule(req.params.id as string, Number(amountKes))
    res.json({ data: updated })
  } catch (err) {
    next(err)
  }
})

// GET delivery pricing for CBD and Outskirts zones (Public)
router.get('/delivery', async (_req, res, next) => {
  try {
    const pricing = await getDeliveryPricing()
    res.json({ data: pricing })
  } catch (err) {
    next(err)
  }
})

// PATCH delivery pricing for CBD and/or Outskirts (Admin only)
router.patch('/delivery', requireAuth(['admin', 'super_admin']), async (req, res, next) => {
  try {
    const { cbd, outskirts, zone, amountKes, label } = req.body

    // Single zone update format: { zone: 'cbd', amountKes: 180, label?: string }
    if (zone && (zone === 'cbd' || zone === 'outskirts')) {
      if (amountKes === undefined || isNaN(Number(amountKes)) || Number(amountKes) < 0) {
        return res.status(400).json({ error: 'Valid positive amountKes is required' })
      }
      const updated = await updateDeliveryPricing(zone, Number(amountKes), label)
      const current = await getDeliveryPricing()
      return res.json({ data: { updated, ...current } })
    }

    // Bulk update format: { cbd: 180, outskirts: 350 }
    if (cbd !== undefined) {
      if (isNaN(Number(cbd)) || Number(cbd) < 0) {
        return res.status(400).json({ error: 'Valid positive CBD delivery fee is required' })
      }
      await updateDeliveryPricing('cbd', Number(cbd))
    }

    if (outskirts !== undefined) {
      if (isNaN(Number(outskirts)) || Number(outskirts) < 0) {
        return res.status(400).json({ error: 'Valid positive Outskirts delivery fee is required' })
      }
      await updateDeliveryPricing('outskirts', Number(outskirts))
    }

    const current = await getDeliveryPricing()
    res.json({ data: current })
  } catch (err) {
    next(err)
  }
})

// Calculate card price dynamically
router.get('/calculate', async (req, res, next) => {
  try {
    const { size, isCustomPhoto, subCountyId } = req.query as {
      size: 'A3' | 'A4' | 'A5'
      isCustomPhoto: string
      subCountyId?: string
    }

    if (!size || !['A3', 'A4', 'A5'].includes(size)) {
      return res.status(400).json({ error: 'Valid size (A3, A4, A5) is required' })
    }

    let zone = 'cbd'
    if (subCountyId) {
      const subCounty = await getSubCountyById(subCountyId)
      if (subCounty) {
        zone = subCounty.zone
      }
    }

    const hasPhoto = isCustomPhoto === 'true'
    const price = await getCalculatedPrice(size, hasPhoto, zone)
    const delivery = await getDeliveryPricing()
    const deliveryFee = zone === 'outskirts' ? delivery.outskirts : delivery.cbd

    res.json({
      data: {
        size,
        isCustomPhoto: hasPhoto,
        zone,
        amountKes: price,
        deliveryFeeKes: deliveryFee,
        totalWithDeliveryKes: price + deliveryFee,
      },
    })
  } catch (err) {
    next(err)
  }
})

export default router
