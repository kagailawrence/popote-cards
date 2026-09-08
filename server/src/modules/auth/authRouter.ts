import { Router } from 'express'
import { z } from 'zod'
import crypto from 'crypto'
import {
  findAdminByEmail,
  findAdminById,
  recordFailedLogin,
  resetFailedLogins,
  findCustomerByEmail,
  findCustomerByPhone,
  createOrUpdateCustomerAccount,
  updateAdminPassword,
  updateCustomerPassword,
  savePasswordResetToken,
  findValidPasswordResetToken,
  markPasswordResetTokenUsed,
} from '../../db/queries/authQueries'
import { findOrCreateCustomer } from '../../db/queries/orderQueries'
import {
  comparePassword,
  hashPassword,
  generateAccessToken,
  generateRefreshToken,
  verifyAndRotateRefreshToken,
  generateCustomerTokens,
  verifyCustomerSessionToken,
  requireAuth,
} from '../../middleware/auth'
import { authLimiter, passwordResetLimiter } from '../../middleware/rateLimiter'
import { isValidKenyanPhone, normalizePhoneNumber } from '../../utils/phoneUtils'
import { sendWelcomeEmail, sendPasswordResetEmail, sendEmail } from '../../services/emailService'

const router = Router()
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

const registerSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Valid email address is required'),
  phone: z.string().refine(isValidKenyanPhone, {
    message: 'Invalid Kenyan phone number format. Must be a valid Kenyan mobile number (e.g. 07XXXXXXXX or 2547XXXXXXXX).',
  }),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
})

const customerSessionSchema = z.object({
  phone: z.string().refine(isValidKenyanPhone, {
    message: 'Invalid Kenyan phone number format. Must be a valid Kenyan mobile number (e.g. 07XXXXXXXX or 2547XXXXXXXX).',
  }),
  email: z.string().email().optional(),
})

const forgotPasswordSchema = z.object({
  email: z.string().email('Please provide a valid email address'),
})

const resetPasswordSchema = z.object({
  token: z.string().min(10, 'Valid reset token is required'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters long'),
})

// -------------------------------------------------------------
// Admin / Staff Login
// -------------------------------------------------------------
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

// -------------------------------------------------------------
// Customer Registration with Welcome Email
// -------------------------------------------------------------
router.post('/register', authLimiter, async (req, res, next) => {
  try {
    const parse = registerSchema.safeParse(req.body)
    if (!parse.success) {
      return res.status(400).json({ error: 'Invalid registration details', details: parse.error.format() })
    }

    const { fullName, email, phone, password } = parse.data
    const normalizedPhone = normalizePhoneNumber(phone)
    const passwordHash = await hashPassword(password)

    const customer = await createOrUpdateCustomerAccount({
      fullName,
      email: email.toLowerCase().trim(),
      phone: normalizedPhone,
      passwordHash,
    })

    const tokens = generateCustomerTokens(customer.id, customer.phone)

    // Trigger Welcome Email asynchronously (non-blocking)
    sendWelcomeEmail(customer.email || email, {
      name: customer.full_name || fullName,
      loginUrl: `${FRONTEND_URL}/login`,
    }).catch((err) => {
      console.error('[Email] Failed to dispatch welcome email:', err)
    })

    res.status(201).json({
      data: {
        customer: {
          id: customer.id,
          fullName: customer.full_name,
          email: customer.email,
          phone: customer.phone,
        },
        accessToken: tokens.accessToken,
        sessionToken: tokens.sessionToken,
        expiresIn: '24h',
        sessionExpiresIn: '24h',
      },
    })
  } catch (err) {
    next(err)
  }
})

// -------------------------------------------------------------
// Customer Login (Email + Password)
// -------------------------------------------------------------
router.post('/customer/login', authLimiter, async (req, res, next) => {
  try {
    const parse = loginSchema.safeParse(req.body)
    if (!parse.success) return res.status(400).json({ error: 'Invalid email or password format' })

    const { email, password } = parse.data
    const customer = await findCustomerByEmail(email)

    if (!customer || !customer.password_hash) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    const isValid = await comparePassword(password, customer.password_hash)
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    const tokens = generateCustomerTokens(customer.id, customer.phone)

    res.json({
      data: {
        customer: {
          id: customer.id,
          fullName: customer.full_name,
          email: customer.email,
          phone: customer.phone,
        },
        accessToken: tokens.accessToken,
        sessionToken: tokens.sessionToken,
        expiresIn: '24h',
        sessionExpiresIn: '24h',
      },
    })
  } catch (err) {
    next(err)
  }
})

// -------------------------------------------------------------
// Forgot Password Request (Sends Email with Secure Reset Token)
// -------------------------------------------------------------
router.post('/forgot-password', passwordResetLimiter, async (req, res, next) => {
  try {
    const parse = forgotPasswordSchema.safeParse(req.body)
    if (!parse.success) {
      return res.status(400).json({ error: 'Valid email is required' })
    }

    const email = parse.data.email.toLowerCase().trim()

    // Check if admin or customer exists with this email
    const admin = await findAdminByEmail(email)
    const customer = await findCustomerByEmail(email)

    if (admin || customer) {
      const userType: 'admin' | 'customer' = admin ? 'admin' : 'customer'
      const userName = admin ? 'Administrator' : customer?.full_name || 'Customer'

      // Generate cryptographically secure random token (64 hex characters)
      const rawToken = crypto.randomBytes(32).toString('hex')
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour validity

      await savePasswordResetToken(email, tokenHash, userType, expiresAt)

      const resetLink = `${FRONTEND_URL}/reset-password?token=${rawToken}`

      // Send Password Reset Email
      await sendPasswordResetEmail(email, {
        name: userName,
        resetLink,
        resetToken: rawToken,
        expiresMinutes: 60,
      })
    }

    // Always respond with a generic success response to prevent email enumeration
    res.json({
      message: 'If an account exists with this email address, a password reset link has been dispatched to your inbox.',
    })
  } catch (err) {
    next(err)
  }
})

// -------------------------------------------------------------
// Reset Password Submission (Validates Token and Updates Password)
// -------------------------------------------------------------
router.post('/reset-password', passwordResetLimiter, async (req, res, next) => {
  try {
    const parse = resetPasswordSchema.safeParse(req.body)
    if (!parse.success) {
      return res.status(400).json({ error: 'Invalid reset request parameters', details: parse.error.format() })
    }

    const { token, newPassword } = parse.data
    const tokenHash = crypto.createHash('sha256').update(token.trim()).digest('hex')

    const resetRecord = await findValidPasswordResetToken(tokenHash)
    if (!resetRecord) {
      return res.status(400).json({
        error: 'Invalid or expired password reset link. Please request a new password reset.',
      })
    }

    const newPasswordHash = await hashPassword(newPassword)

    if (resetRecord.user_type === 'admin') {
      const admin = await findAdminByEmail(resetRecord.email)
      if (admin) {
        await updateAdminPassword(admin.id, newPasswordHash)
      }
    } else {
      const customer = await findCustomerByEmail(resetRecord.email)
      if (customer) {
        await updateCustomerPassword(customer.id, newPasswordHash)
      }
    }

    // Invalidate the used token
    await markPasswordResetTokenUsed(tokenHash)

    res.json({
      success: true,
      message: 'Your password has been successfully updated! You can now log in with your new password.',
    })
  } catch (err) {
    next(err)
  }
})

// -------------------------------------------------------------
// Refresh Admin Token
// -------------------------------------------------------------
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

// -------------------------------------------------------------
// Customer Session Initiation (Phone + Optional Email)
// -------------------------------------------------------------
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
        expiresIn: '24h',
        sessionExpiresIn: '24h',
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

// -------------------------------------------------------------
// Customer Token Refresh
// -------------------------------------------------------------
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
        expiresIn: '24h',
        sessionExpiresIn: '24h',
      },
    })
  } catch (err: any) {
    res.status(401).json({ error: err.message || 'Invalid customer session token' })
  }
})

export default router
