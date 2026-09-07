import { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'
import { ApiError } from '../utils/errors'

export function errorHandler(err: any, req: Request, res: Response, _next: NextFunction) {
  const isProduction = process.env.NODE_ENV === 'production'
  const requestId = res.getHeader('X-Request-Id') || 'unknown'

  // Log error details for diagnostics
  if (!isProduction || (err.statusCode && err.statusCode >= 500) || !err.statusCode) {
    console.error(`[fair-server-error] [ReqID: ${requestId}]`, {
      name: err.name,
      message: err.message,
      code: err.code,
      stack: isProduction ? undefined : err.stack,
    })
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
  const statusCode = err.statusCode || err.status || 500
  const message = isProduction && statusCode === 500 ? 'An unexpected server error occurred' : err.message || 'An error occurred'

  return res.status(statusCode).json({
    error: message,
    code: err.code || 'INTERNAL_SERVER_ERROR',
  })
}
