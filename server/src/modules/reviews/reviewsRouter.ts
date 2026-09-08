import { Router } from 'express'
import { z } from 'zod'
import {
  createReview,
  getApprovedReviews,
  getReviewStats,
  getAllReviewsAdmin,
  updateReviewApproval,
  deleteReview,
} from '../../db/queries/reviewQueries'
import { requireAuth } from '../../middleware/auth'
import { getOrSetCache, invalidateCachePattern } from '../../utils/cache'

const router = Router()

async function invalidateReviewsCache() {
  await invalidateCachePattern('reviews:*')
}

const createReviewSchema = z.object({
  customerName: z.string().min(2, 'Name must be at least 2 characters'),
  customerPhone: z.string().optional(),
  customerRole: z.string().optional(),
  schoolName: z.string().optional(),
  location: z.string().optional(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(5, 'Review comment must be at least 5 characters'),
  cardType: z.string().optional(),
  category: z.enum(['parent', 'teacher', 'relative', 'other']).optional(),
  orderNumber: z.string().optional(),
})

// Public: Get all approved reviews + summary statistics
router.get('/', async (req, res, next) => {
  try {
    const category = req.query.category as string | undefined
    const minRating = req.query.minRating ? parseInt(req.query.minRating as string, 10) : undefined
    const sort = req.query.sort as 'newest' | 'highest_rating' | undefined
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50
    const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0

    const cacheKey = `reviews:approved:${category || 'all'}:${minRating || 0}:${sort || 'newest'}:${limit}:${offset}`

    const [reviews, stats] = await Promise.all([
      getOrSetCache(cacheKey, 900, async () => {
        return getApprovedReviews({ category, minRating, sort, limit, offset })
      }),
      getOrSetCache('reviews:stats', 1800, async () => {
        return getReviewStats()
      }),
    ])

    res.json({
      data: reviews,
      stats,
    })
  } catch (err) {
    next(err)
  }
})

// Public: Get aggregate statistics only
router.get('/stats', async (_req, res, next) => {
  try {
    const stats = await getOrSetCache('reviews:stats', 1800, async () => {
      return getReviewStats()
    })
    res.json({ data: stats })
  } catch (err) {
    next(err)
  }
})

// Public: Submit a review
router.post('/', async (req, res, next) => {
  try {
    const parse = createReviewSchema.safeParse(req.body)
    if (!parse.success) {
      return res.status(400).json({
        error: 'Invalid review parameters',
        details: parse.error.format(),
      })
    }

    const createdReview = await createReview(parse.data)
    await invalidateReviewsCache()

    res.status(201).json({
      data: createdReview,
      message: 'Thank you! Your review has been submitted successfully.',
    })
  } catch (err) {
    next(err)
  }
})

// Admin: Get all reviews (approved and pending)
router.get('/admin/all', requireAuth(['admin', 'super_admin']), async (req, res, next) => {
  try {
    const status = req.query.status as 'all' | 'approved' | 'pending' | undefined
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 100

    const [reviews, stats] = await Promise.all([
      getAllReviewsAdmin({ status, limit }),
      getOrSetCache('reviews:stats', 1800, async () => {
        return getReviewStats()
      }),
    ])

    res.json({
      data: reviews,
      stats,
    })
  } catch (err) {
    next(err)
  }
})

// Admin: Toggle approval status or verified status
router.patch('/admin/:id', requireAuth(['admin', 'super_admin']), async (req, res, next) => {
  try {
    const id = req.params.id as string
    const { isApproved, isVerified } = req.body

    if (typeof isApproved !== 'boolean' && typeof isVerified !== 'boolean') {
      return res.status(400).json({ error: 'Provide isApproved or isVerified boolean' })
    }

    const updated = await updateReviewApproval(id, isApproved ?? true, isVerified)
    if (!updated) {
      return res.status(404).json({ error: 'Review not found' })
    }

    await invalidateReviewsCache()

    res.json({
      data: updated,
      message: 'Review updated successfully',
    })
  } catch (err) {
    next(err)
  }
})

// Admin: Delete review
router.delete('/admin/:id', requireAuth(['admin', 'super_admin']), async (req, res, next) => {
  try {
    const id = req.params.id as string
    const deleted = await deleteReview(id)
    if (!deleted) {
      return res.status(404).json({ error: 'Review not found' })
    }

    await invalidateReviewsCache()

    res.json({
      success: true,
      message: 'Review deleted successfully',
    })
  } catch (err) {
    next(err)
  }
})

export default router
