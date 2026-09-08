import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import crypto from 'crypto'
import { findAdminById, saveRefreshToken, findRefreshToken, revokeRefreshToken } from '../db/queries/authQueries'

const DEFAULT_ACCESS_SECRET = 'super-secret-development-jwt-key-32-chars-min'
const DEFAULT_REFRESH_SECRET = 'super-secret-refresh-key-32-chars-min'

if (process.env.NODE_ENV === 'production') {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32 || process.env.JWT_SECRET.includes('development')) {
    console.warn('[Security Warning] JWT_SECRET should be set in production with at least 32 high-entropy characters.')
  }
  if (!process.env.JWT_REFRESH_SECRET || process.env.JWT_REFRESH_SECRET.length < 32 || process.env.JWT_REFRESH_SECRET.includes('development')) {
    console.warn('[Security Warning] JWT_REFRESH_SECRET should be set in production with at least 32 high-entropy characters.')
  }
}

const JWT_ACCESS_SECRET = process.env.JWT_SECRET || DEFAULT_ACCESS_SECRET
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || DEFAULT_REFRESH_SECRET

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string
    role: string
  }
  customer?: {
    id: string
    phone: string
    role: 'customer'
    type: 'access' | 'session'
  }
}

export interface CustomerPayload {
  id: string
  phone: string
  role: 'customer'
  type: 'access' | 'session'
}

export function generateAccessToken(adminId: string, role: string): string {
  return jwt.sign({ id: adminId, role }, JWT_ACCESS_SECRET, {
    algorithm: 'HS256',
    expiresIn: '24h',
  })
}

export async function generateRefreshToken(adminId: string): Promise<string> {
  const token = jwt.sign({ id: adminId }, JWT_REFRESH_SECRET, {
    algorithm: 'HS256',
    expiresIn: '30d',
  })
  const hash = crypto.createHash('sha256').update(token).digest('hex')
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  await saveRefreshToken(adminId, hash, expiresAt)
  return token
}

export function generateCustomerAccessToken(customerId: string, phone: string): string {
  return jwt.sign(
    { id: customerId, phone, role: 'customer', type: 'access' },
    JWT_ACCESS_SECRET,
    { algorithm: 'HS256', expiresIn: '24h' }
  )
}

export function generateCustomerSessionToken(customerId: string, phone: string): string {
  return jwt.sign(
    { id: customerId, phone, role: 'customer', type: 'session' },
    JWT_REFRESH_SECRET,
    { algorithm: 'HS256', expiresIn: '24h' }
  )
}

export function generateCustomerTokens(customerId: string, phone: string) {
  const accessToken = generateCustomerAccessToken(customerId, phone)
  const sessionToken = generateCustomerSessionToken(customerId, phone)
  return { accessToken, sessionToken }
}

export function verifyCustomerSessionToken(rawSessionToken: string): CustomerPayload {
  const payload = jwt.verify(rawSessionToken, JWT_REFRESH_SECRET, { algorithms: ['HS256'] }) as CustomerPayload
  if (payload.role !== 'customer' || payload.type !== 'session') {
    throw new Error('Invalid customer session token')
  }
  return payload
}

export async function verifyAndRotateRefreshToken(rawRefreshToken: string) {
  const payload = jwt.verify(rawRefreshToken, JWT_REFRESH_SECRET, { algorithms: ['HS256'] }) as { id: string }
  const hash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex')
  const stored = await findRefreshToken(hash)

  if (!stored || stored.revoked || new Date(stored.expires_at) < new Date()) {
    throw new Error('Invalid or revoked refresh token')
  }

  // Revoke old token (rotation)
  await revokeRefreshToken(hash)

  const admin = await findAdminById(payload.id)
  if (!admin) throw new Error('Admin user not found')

  const newAccessToken = generateAccessToken(admin.id, admin.role)
  const newRefreshToken = await generateRefreshToken(admin.id)
  return { newAccessToken, newRefreshToken, admin }
}

export function requireAuth(roles: string[] = []) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    let token = req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.split(' ')[1] : undefined
    if (!token && typeof req.query?.token === 'string') {
      token = req.query.token
    }

    if (!token) {
      return res.status(401).json({ error: 'Unauthenticated' })
    }

    try {
      const decoded = jwt.verify(token, JWT_ACCESS_SECRET, { algorithms: ['HS256'] }) as { id: string; role: string }
      req.user = decoded

      if (roles.length > 0 && !roles.includes(decoded.role)) {
        return res.status(403).json({ error: 'Unauthorized role' })
      }
      next()
    } catch (err) {
      return res.status(401).json({ error: 'Invalid or expired token' })
    }
  }
}

export function requireCustomerAuth() {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthenticated customer' })
    }

    const token = authHeader.split(' ')[1]
    try {
      // First try access token secret (5m)
      let decoded: CustomerPayload
      try {
        decoded = jwt.verify(token, JWT_ACCESS_SECRET, { algorithms: ['HS256'] }) as CustomerPayload
      } catch (e) {
        // Fallback to session token secret (1d)
        decoded = jwt.verify(token, JWT_REFRESH_SECRET, { algorithms: ['HS256'] }) as CustomerPayload
      }

      if (decoded.role !== 'customer') {
        return res.status(403).json({ error: 'Unauthorized role for customer access' })
      }

      req.customer = decoded
      next()
    } catch (err) {
      return res.status(401).json({ error: 'Invalid or expired customer session token' })
    }
  }
}

export async function hashPassword(plainText: string): Promise<string> {
  return bcrypt.hash(plainText, 12)
}

export async function comparePassword(plainText: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plainText, hash)
}
