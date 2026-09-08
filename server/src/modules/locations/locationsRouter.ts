import { Router } from 'express'
import {
  getCounties,
  getSubCountiesByCountyId,
  getAllSubCounties,
  createCounty,
  createSubCounty,
  deleteCounty,
  deleteSubCounty,
  updateCounty,
  updateSubCounty
} from '../../db/queries/locationQueries'
import { requireAuth } from '../../middleware/auth'
import { getOrSetCache, invalidateCachePattern } from '../../utils/cache'

const router = Router()

async function invalidateLocationCache() {
  await invalidateCachePattern('locations:*')
}

router.get('/counties', async (_req, res, next) => {
  try {
    const counties = await getOrSetCache('locations:counties:all', 86400, async () => {
      return getCounties()
    })
    res.json({ data: counties })
  } catch (err) {
    next(err)
  }
})

router.get('/counties/:countyId/sub-counties', async (req, res, next) => {
  try {
    const { countyId } = req.params
    const subCounties = await getOrSetCache(`locations:county:${countyId}:sub-counties`, 86400, async () => {
      return getSubCountiesByCountyId(countyId)
    })
    res.json({ data: subCounties })
  } catch (err) {
    next(err)
  }
})

router.get('/sub-counties', async (_req, res, next) => {
  try {
    const all = await getOrSetCache('locations:sub-counties:all', 86400, async () => {
      return getAllSubCounties()
    })
    res.json({ data: all })
  } catch (err) {
    next(err)
  }
})

router.post('/counties', requireAuth(['admin', 'super_admin']), async (req, res, next) => {
  try {
    const { name } = req.body
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'County name is required' })
    }
    const county = await createCounty(name.trim())
    await invalidateLocationCache()
    res.status(201).json({ data: county })
  } catch (err) {
    next(err)
  }
})

router.delete('/counties/:id', requireAuth(['admin', 'super_admin']), async (req, res, next) => {
  try {
    await deleteCounty(req.params.id as string)
    await invalidateLocationCache()
    res.json({ success: true })
  } catch (err) {
    next(err)
  }
})

router.post('/sub-counties', requireAuth(['admin', 'super_admin']), async (req, res, next) => {
  try {
    const { countyId, name, zone } = req.body
    if (!countyId || !name || !['cbd', 'outskirts'].includes(zone)) {
      return res.status(400).json({ error: 'countyId, name, and valid zone (cbd/outskirts) are required' })
    }
    const subCounty = await createSubCounty(countyId, name.trim(), zone)
    await invalidateLocationCache()
    res.status(201).json({ data: subCounty })
  } catch (err) {
    next(err)
  }
})

router.patch('/counties/:id', requireAuth(['admin', 'super_admin']), async (req, res, next) => {
  try {
    const { name } = req.body
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'County name is required' })
    }
    const updated = await updateCounty(req.params.id as string, name.trim())
    await invalidateLocationCache()
    res.json({ data: updated })
  } catch (err) {
    next(err)
  }
})

router.patch('/sub-counties/:id', requireAuth(['admin', 'super_admin']), async (req, res, next) => {
  try {
    const { name, zone } = req.body
    if (!name || !['cbd', 'outskirts'].includes(zone)) {
      return res.status(400).json({ error: 'name and valid zone (cbd/outskirts) are required' })
    }
    const updated = await updateSubCounty(req.params.id as string, name.trim(), zone)
    await invalidateLocationCache()
    res.json({ data: updated })
  } catch (err) {
    next(err)
  }
})

router.delete('/sub-counties/:id', requireAuth(['admin', 'super_admin']), async (req, res, next) => {
  try {
    await deleteSubCounty(req.params.id as string)
    await invalidateLocationCache()
    res.json({ success: true })
  } catch (err) {
    next(err)
  }
})

export default router
