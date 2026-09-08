import { Request, Response, NextFunction } from 'express'
import { sanitizeObject } from '../utils/sanitize'

/**
 * Global XSS Sanitization Middleware
 * Automatically cleans incoming request body, query parameters, and URL parameters.
 */
export function xssSanitizer(req: Request, _res: Response, next: NextFunction) {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body)
  }

  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeObject(req.query)
  }

  if (req.params && typeof req.params === 'object') {
    req.params = sanitizeObject(req.params)
  }

  next()
}
