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

const router = Router()

router.get('/counties', async (_req, res, next) => {
  try {
    const counties = await getCounties()
    res.json({ data: counties })
  } catch (err) {
    next(err)
  }
})

router.get('/counties/:countyId/sub-counties', async (req, res, next) => {
  try {
    const subCounties = await getSubCountiesByCountyId(req.params.countyId)
    res.json({ data: subCounties })
  } catch (err) {
    next(err)
  }
})

router.get('/sub-counties', async (_req, res, next) => {
  try {
    const all = await getAllSubCounties()
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
    res.status(201).json({ data: county })
  } catch (err) {
    next(err)
  }
})

router.delete('/counties/:id', requireAuth(['admin', 'super_admin']), async (req, res, next) => {
  try {
    await deleteCounty(req.params.id as string)
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
    res.json({ data: updated })
  } catch (err) {
    next(err)
  }
})

router.delete('/sub-counties/:id', requireAuth(['admin', 'super_admin']), async (req, res, next) => {
  try {
    await deleteSubCounty(req.params.id as string)
    res.json({ success: true })
  } catch (err) {
    next(err)
  }
})

export default router
