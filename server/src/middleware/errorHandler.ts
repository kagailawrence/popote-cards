import { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'
import { ApiError } from '../utils/errors'
import { logger } from '../utils/logger'

export function errorHandler(err: any, req: Request, res: Response, _next: NextFunction) {
  const isProduction = process.env.NODE_ENV === 'production'
  const requestId = res.getHeader('X-Request-Id') || req.headers['x-request-id'] || 'unknown'

  // Log error details with structured context
  const statusCode = err.statusCode || (err instanceof ZodError ? 400 : 500)
  const logData = {
    requestId,
    method: req.method,
    url: req.url,
    statusCode,
    name: err.name,
    message: err.message,
    code: err.code,
    stack: isProduction && statusCode < 500 ? undefined : err.stack,
  }

  if (statusCode >= 500) {
    logger.error(logData, `[Server Error] ${req.method} ${req.url} - ${err.message}`)
  } else if (!isProduction) {
    logger.warn(logData, `[Client Error] ${req.method} ${req.url} (${statusCode}) - ${err.message}`)
  }

  // 1. Custom ApiError instance
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      error: err.message,
      code: err.code,
      details: err.details,
    })
  }

  // 2. Zod Validation Errors
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Invalid request input parameters',
      code: 'VALIDATION_ERROR',
      details: err.issues.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    })
  }

  // 3. PostgreSQL Database Errors
  if (err && typeof err === 'object' && err.code) {
    // Unique Constraint Violation
    if (err.code === '23505') {
      return res.status(409).json({
        error: 'A record with these details already exists',
        code: 'DUPLICATE_RESOURCE',
        details: isProduction ? undefined : err.detail,
      })
    }
    // Foreign Key Violation
    if (err.code === '23503') {
      return res.status(400).json({
        error: 'Referenced related record does not exist',
        code: 'REFERENTIAL_INTEGRITY_ERROR',
        details: isProduction ? undefined : err.detail,
      })
    }
    // Invalid Text Representation (e.g. malformed UUID)
    if (err.code === '22P02') {
      return res.status(400).json({
        error: 'Invalid ID or data format provided',
        code: 'INVALID_DATA_FORMAT',
      })
    }
  }

  // 4. Multer File Upload Errors
  if (err && err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'Uploaded file size exceeds maximum permitted limit',
        code: 'FILE_TOO_LARGE',
      })
    }
    return res.status(400).json({
      error: err.message || 'File upload error',
      code: 'FILE_UPLOAD_ERROR',
    })
  }

  // 5. Default Fallback Internal Server Error
  const fallbackStatus = statusCode || err.status || 500
  const message = isProduction && fallbackStatus === 500 ? 'An unexpected server error occurred' : err.message || 'An error occurred'

  return res.status(fallbackStatus).json({
    error: message,
    code: err.code || 'INTERNAL_SERVER_ERROR',
  })
}
