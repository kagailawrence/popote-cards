import { Router } from 'express'
import { z } from 'zod'
import { findAdminByEmail, recordFailedLogin, resetFailedLogins } from '../../db/queries/authQueries'
import { findOrCreateCustomer } from '../../db/queries/orderQueries'
import {
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
  verifyAndRotateRefreshToken,
  generateCustomerTokens,
  verifyCustomerSessionToken,
} from '../../middleware/auth'
import { authLimiter } from '../../middleware/rateLimiter'
import { isValidKenyanPhone, normalizePhoneNumber } from '../../utils/phoneUtils'

const router = Router()

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

const customerSessionSchema = z.object({
  phone: z.string().refine(isValidKenyanPhone, {
    message: 'Invalid Kenyan phone number format. Must be a valid Kenyan mobile number (e.g. 07XXXXXXXX or 2547XXXXXXXX).',
  }),
  email: z.string().email().optional(),
})

router.post('/login', authLimiter, async (req, res, next) => {
  try {
    const parse = loginSchema.safeParse(req.body)
    if (!parse.success) return res.status(400).json({ error: 'Invalid email or password format' })

    const { email, password } = parse.data
    const admin = await findAdminByEmail(email)

    if (!admin) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    if (admin.locked_until && new Date(admin.locked_until) > new Date()) {
      return res.status(429).json({ error: 'Account is temporarily locked. Try again later.' })
    }

    const isValid = await comparePassword(password, admin.password_hash)
    if (!isValid) {
      await recordFailedLogin(admin.id, admin.failed_login_attempts)
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    await resetFailedLogins(admin.id)
    const accessToken = generateAccessToken(admin.id, admin.role)
    const refreshToken = await generateRefreshToken(admin.id)

    res.json({
      data: {
        accessToken,
        refreshToken,
        user: { id: admin.id, email: admin.email, role: admin.role },
      },
    })
  } catch (err) {
    next(err)
  }
})

router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body
    if (!refreshToken) return res.status(400).json({ error: 'Refresh token is required' })

    const { newAccessToken, newRefreshToken, admin } = await verifyAndRotateRefreshToken(refreshToken)
    res.json({
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        user: { id: admin.id, email: admin.email, role: admin.role },
      },
    })
  } catch (err: any) {
    res.status(401).json({ error: err.message || 'Invalid refresh token' })
  }
})

// Customer session initiation (5m access token, 1d session token)
router.post('/customer/session', authLimiter, async (req, res, next) => {
  try {
    const parse = customerSessionSchema.safeParse(req.body)
    if (!parse.success) {
      return res.status(400).json({ error: 'Invalid customer session input', details: parse.error.format() })
    }

    const { phone, email } = parse.data
    const normalizedPhone = normalizePhoneNumber(phone)
    const customer = await findOrCreateCustomer(normalizedPhone, email)

    const tokens = generateCustomerTokens(customer.id, customer.phone)

    res.json({
      data: {
        accessToken: tokens.accessToken,
        sessionToken: tokens.sessionToken,
        expiresIn: '5m',
        sessionExpiresIn: '1d',
        customer: {
          id: customer.id,
          phone: customer.phone,
          email: customer.email,
        },
      },
    })
  } catch (err) {
    next(err)
  }
})

// Customer token refresh using 1d session token
router.post('/customer/refresh', async (req, res, next) => {
  try {
    const { sessionToken } = req.body
    if (!sessionToken) {
      return res.status(400).json({ error: 'Session token is required' })
    }

    const payload = verifyCustomerSessionToken(sessionToken)
    const tokens = generateCustomerTokens(payload.id, payload.phone)

    res.json({
      data: {
        accessToken: tokens.accessToken,
        sessionToken: tokens.sessionToken,
        expiresIn: '5m',
        sessionExpiresIn: '1d',
      },
    })
  } catch (err: any) {
    res.status(401).json({ error: err.message || 'Invalid customer session token' })
  }
})

export default router
