import { Router } from 'express'
import { getPriceMatrix, getCalculatedPrice, updatePriceRule } from '../../db/queries/pricingQueries'
import { getSubCountyById } from '../../db/queries/locationQueries'
import { requireAuth } from '../../middleware/auth'

const router = Router()

router.get('/matrix', async (_req, res, next) => {
  try {
    const matrix = await getPriceMatrix()
    res.json({ data: matrix })
  } catch (err) {
    next(err)
  }
})

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

    res.json({
      data: {
        size,
        isCustomPhoto: hasPhoto,
        zone,
        amountKes: price,
      },
    })
  } catch (err) {
    next(err)
  }
})

export default router
