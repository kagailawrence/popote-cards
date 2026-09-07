import 'dotenv/config'
import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import compression from 'compression'
import pinoHttp from 'pino-http'
import { randomUUID } from 'crypto'

import authRouter from './modules/auth/authRouter'
import catalogRouter from './modules/catalog/catalogRouter'
import locationsRouter from './modules/locations/locationsRouter'
import pricingRouter from './modules/pricing/pricingRouter'
import ordersRouter from './modules/orders/ordersRouter'
import paymentsRouter from './modules/payments/paymentsRouter'
import filesRouter from './modules/files/filesRouter'
import ridersRouter from './modules/riders/ridersRouter'
import disputesRouter from './modules/disputes/disputesRouter'
import adminRouter from './modules/admin/adminRouter'
import renderingRouter from './modules/rendering/renderingRouter'
import exportRouter from './modules/admin/exportRouter'
import { inventoryRouter } from './modules/inventory/inventoryRouter'
import reviewsRouter from './modules/reviews/reviewsRouter'
import { errorHandler } from './middleware/errorHandler'
import { apiLimiter } from './middleware/rateLimiter'

export const app = express()

// Security headers per Section 4.3 & CSP
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
        imgSrc: ["'self'", 'data:', 'blob:', 'http://localhost:4000', 'http://localhost:3000', 'https:'],
        connectSrc: ["'self'", 'http://localhost:4000', 'http://localhost:3000', 'https://sandbox.safaricom.co.ke', 'https://api.safaricom.co.ke'],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
        upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
      },
    },
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
)

app.use(
  cors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
    credentials: true,
  })
)

// HTTP Parameter Pollution (HPP) defense
app.use((req, _res, next) => {
  if (req.query && typeof req.query === 'object') {
    for (const key of Object.keys(req.query)) {
      if (Array.isArray(req.query[key])) {
        req.query[key] = (req.query[key] as string[])[(req.query[key] as string[]).length - 1]
      }
    }
  }
  next()
})

app.use(compression())
app.use(express.json({ limit: '100kb' }))

// Pino HTTP logger with sensitive field redaction per Section 4.5
app.use(
  pinoHttp({
    redact: ['req.headers.authorization', 'req.body.password', 'req.body.cardNumber'],
    autoLogging: false,
  })
)

// Request Correlation ID
app.use((req, res, next) => {
  const reqId = (req.headers['x-request-id'] as string) || randomUUID()
  res.setHeader('X-Request-Id', reqId)
  next()
})

// Health Endpoint per Section 4.5 & 8
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'fair-server',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  })
})

// Global API rate limiter
app.use('/api', apiLimiter)

// Route Mounts
app.use('/api/v1/auth', authRouter)
app.use('/api/v1/catalog', catalogRouter)
app.use('/api/v1/locations', locationsRouter)
app.use('/api/v1/pricing', pricingRouter)
app.use('/api/v1/orders', ordersRouter)
app.use('/api/v1/payments', paymentsRouter)
app.use('/api/v1/files', filesRouter)
app.use('/api/v1/riders', ridersRouter)
app.use('/api/v1/disputes', disputesRouter)
app.use('/api/v1/inventory', inventoryRouter)
app.use('/api/v1/rendering', renderingRouter)
app.use('/api/v1/reviews', reviewsRouter)
app.use('/api/v1/admin/export', exportRouter)
app.use('/api/v1/admin', adminRouter)

// 404 & Centralized Error Handler
app.use((_req, res) => res.status(404).json({ error: 'Endpoint not found' }))
app.use(errorHandler)
