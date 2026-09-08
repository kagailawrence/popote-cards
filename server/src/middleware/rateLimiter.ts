import rateLimit, { Options, RateLimitRequestHandler } from 'express-rate-limit'
import { Request, Response, NextFunction } from 'express'

/**
 * Standardized JSON response handler for rate limit exceeded events
 */
function createRateLimitHandler(customMessage: string) {
  return (req: Request, res: Response, _next: NextFunction, options: Options) => {
    const retryAfter = res.getHeader('Retry-After') || Math.ceil(options.windowMs / 1000)
    res.status(options.statusCode).json({
      error: customMessage,
      code: 'RATE_LIMIT_EXCEEDED',
      statusCode: 429,
      retryAfterSeconds: Number(retryAfter) || 60,
    })
  }
}

/**
 * 1. Global API Limiter: General rate limit across all /api routes
 * Allows 300 requests per 15-minute window per IP.
 * Skips health check probes automatically.
 */
export const apiLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip: (req) => req.path === '/health' || req.path === '/api/health',
  handler: createRateLimitHandler('Too many requests from this IP. Please try again later.'),
})

/**
 * 2. Auth Limiter: Protects login, registration, and session token generation
 * Stricter limit: 15 attempts per 15-minute window per IP.
 */
export const authLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: createRateLimitHandler('Too many authentication attempts. Please try again after 15 minutes.'),
})

/**
 * 3. Password Reset Limiter: Prevents spamming password reset emails
 * 5 requests per 30-minute window per IP.
 */
export const passwordResetLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 30 * 60 * 1000,
  max: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: createRateLimitHandler('Too many password reset requests. Please wait a while before requesting another link.'),
})

/**
 * 4. Order Creation Limiter: Prevents order spam and automated bot checkouts
 * 20 orders per 10-minute window per IP.
 */
export const orderLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: createRateLimitHandler('Order creation limit reached. Please wait a few moments before placing another order.'),
})

/**
 * 5. Payment Limiter: Protects M-Pesa STK Push endpoint against telco throttling & abuse
 * 5 payment initiations per 5-minute window per IP.
 */
export const paymentLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: createRateLimitHandler('Too many payment initiation requests. Please wait 5 minutes before trying again.'),
})

/**
 * 6. Email Dispatch Limiter: Protects on-demand tracking email dispatch
 * 6 email dispatches per 15-minute window per IP.
 */
export const emailLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 6,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: createRateLimitHandler('Tracking email limit reached. Please check your spam folder or wait a few minutes.'),
})

/**
 * 7. File Upload Limiter: Prevents storage flooding and DoS via image uploads
 * 25 uploads per 15-minute window per IP.
 */
export const uploadLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 25,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: createRateLimitHandler('Upload limit exceeded. Please wait a moment before uploading more files.'),
})

/**
 * 8. Dispute Limiter: Prevents dispute ticket spamming
 * 5 dispute tickets per 15-minute window per IP.
 */
export const disputeLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: createRateLimitHandler('Too many dispute submissions. Please wait before submitting another dispute.'),
})
