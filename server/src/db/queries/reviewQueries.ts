import { query, queryOne } from '../../config/db'

export interface Review {
  id: string
  order_id: string | null
  order_number: string | null
  customer_name: string
  customer_phone: string | null
  customer_role: string
  school_name: string | null
  location: string | null
  rating: number
  comment: string
  card_type: string | null
  category: 'parent' | 'teacher' | 'relative' | 'other'
  is_verified: boolean
  is_approved: boolean
  created_at: Date
}

export interface ReviewStats {
  total_reviews: number
  average_rating: number
  rating_breakdown: {
    5: number
    4: number
    3: number
    2: number
    1: number
  }
}

/**
 * Ensure reviews table exists on server start
 */
export async function ensureReviewsTable(): Promise<void> {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
        order_number TEXT,
        customer_name TEXT NOT NULL,
        customer_phone TEXT,
        customer_role TEXT NOT NULL DEFAULT 'Parent',
        school_name TEXT,
        location TEXT,
        rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
        comment TEXT NOT NULL,
        card_type TEXT,
        category TEXT NOT NULL DEFAULT 'parent' CHECK (category IN ('parent', 'teacher', 'relative', 'other')),
        is_verified BOOLEAN NOT NULL DEFAULT false,
        is_approved BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);
      CREATE INDEX IF NOT EXISTS idx_reviews_category ON reviews(category);
      CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_reviews_is_approved ON reviews(is_approved);
      CREATE INDEX IF NOT EXISTS idx_reviews_order_number ON reviews(order_number);
    `)
  } catch (err) {
    console.error('[reviewQueries] Failed to ensure reviews table:', err)
  }
}

export async function createReview(data: {
  customerName: string
  customerPhone?: string
  customerRole?: string
  schoolName?: string
  location?: string
  rating: number
  comment: string
  cardType?: string
  category?: 'parent' | 'teacher' | 'relative' | 'other'
  orderNumber?: string
}): Promise<Review> {
  await ensureReviewsTable()

  let orderId: string | null = null
  let isVerified = false

  // Verify against existing orders if order number provided
  if (data.orderNumber && data.orderNumber.trim()) {
    const trimmedOrderNum = data.orderNumber.trim()
    const foundOrder = await queryOne<{ id: string; status: string; customer_phone?: string }>(
      `SELECT o.id, o.status, c.phone as customer_phone
       FROM orders o
       JOIN customers c ON c.id = o.customer_id
       WHERE LOWER(o.order_number) = LOWER($1)
       LIMIT 1`,
      [trimmedOrderNum]
    )

    if (foundOrder) {
      orderId = foundOrder.id
      isVerified = true
    }
  }

  const row = await queryOne<Review>(
    `INSERT INTO reviews (
       order_id, order_number, customer_name, customer_phone, customer_role,
       school_name, location, rating, comment, card_type, category, is_verified, is_approved
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, true)
     RETURNING *`,
    [
      orderId,
      data.orderNumber ? data.orderNumber.trim() : null,
      data.customerName.trim(),
      data.customerPhone ? data.customerPhone.trim() : null,
      data.customerRole?.trim() || 'Parent of Candidate',
      data.schoolName?.trim() || null,
      data.location?.trim() || null,
      Math.min(5, Math.max(1, Math.round(data.rating))),
      data.comment.trim(),
      data.cardType?.trim() || 'A4 KCSE Deluxe Gold Foil',
      data.category || 'parent',
      isVerified,
    ]
  )

  return row!
}

export async function getApprovedReviews(options?: {
  category?: string
  minRating?: number
  limit?: number
  offset?: number
  sort?: 'newest' | 'highest_rating'
}): Promise<Review[]> {
  await ensureReviewsTable()

  const params: any[] = []
  let sql = `SELECT * FROM reviews WHERE is_approved = true`

  if (options?.category && options.category !== 'all') {
    params.push(options.category)
    sql += ` AND category = $${params.length}`
  }

  if (options?.minRating && options.minRating > 0) {
    params.push(options.minRating)
    sql += ` AND rating >= $${params.length}`
  }

  if (options?.sort === 'highest_rating') {
    sql += ` ORDER BY rating DESC, created_at DESC`
  } else {
    sql += ` ORDER BY created_at DESC`
  }

  const limit = options?.limit ?? 50
  params.push(limit)
  sql += ` LIMIT $${params.length}`

  if (options?.offset) {
    params.push(options.offset)
    sql += ` OFFSET $${params.length}`
  }

  return query<Review>(sql, params)
}

export async function getReviewStats(): Promise<ReviewStats> {
  await ensureReviewsTable()

  const statsRow = await queryOne<{
    total_reviews: string
    avg_rating: string
    count_5: string
    count_4: string
    count_3: string
    count_2: string
    count_1: string
  }>(`
    SELECT
      COUNT(*) as total_reviews,
      COALESCE(AVG(rating), 5.0) as avg_rating,
      COUNT(*) FILTER (WHERE rating = 5) as count_5,
      COUNT(*) FILTER (WHERE rating = 4) as count_4,
      COUNT(*) FILTER (WHERE rating = 3) as count_3,
      COUNT(*) FILTER (WHERE rating = 2) as count_2,
      COUNT(*) FILTER (WHERE rating = 1) as count_1
    FROM reviews
    WHERE is_approved = true
  `)

  const total = statsRow ? parseInt(statsRow.total_reviews, 10) : 0
  const avg = statsRow ? parseFloat(statsRow.avg_rating) : 5.0

  return {
    total_reviews: total,
    average_rating: Number((isNaN(avg) ? 5.0 : avg).toFixed(2)),
    rating_breakdown: {
      5: statsRow ? parseInt(statsRow.count_5, 10) : 0,
      4: statsRow ? parseInt(statsRow.count_4, 10) : 0,
      3: statsRow ? parseInt(statsRow.count_3, 10) : 0,
      2: statsRow ? parseInt(statsRow.count_2, 10) : 0,
      1: statsRow ? parseInt(statsRow.count_1, 10) : 0,
    },
  }
}

export async function getAllReviewsAdmin(options?: {
  status?: 'all' | 'approved' | 'pending'
  limit?: number
}): Promise<Review[]> {
  await ensureReviewsTable()

  const params: any[] = []
  let sql = `SELECT * FROM reviews`

  if (options?.status === 'approved') {
    sql += ` WHERE is_approved = true`
  } else if (options?.status === 'pending') {
    sql += ` WHERE is_approved = false`
  }

  sql += ` ORDER BY created_at DESC`

  const limit = options?.limit ?? 100
  params.push(limit)
  sql += ` LIMIT $${params.length}`

  return query<Review>(sql, params)
}

export async function updateReviewApproval(
  id: string,
  isApproved: boolean,
  isVerified?: boolean
): Promise<Review | null> {
  await ensureReviewsTable()

  let sql = `UPDATE reviews SET is_approved = $1`
  const params: any[] = [isApproved]

  if (isVerified !== undefined) {
    params.push(isVerified)
    sql += `, is_verified = $${params.length}`
  }

  params.push(id)
  sql += ` WHERE id = $${params.length} RETURNING *`

  return queryOne<Review>(sql, params)
}

export async function deleteReview(id: string): Promise<boolean> {
  await ensureReviewsTable()
  const res = await query(`DELETE FROM reviews WHERE id = $1 RETURNING id`, [id])
  return res.length > 0
}
