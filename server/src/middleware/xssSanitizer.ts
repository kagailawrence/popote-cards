import { Request, Response, NextFunction } from 'express'
import { sanitizeObject } from '../utils/sanitize'

/**
 * Global XSS Sanitization Middleware
 * Safely cleans incoming request body, query parameters, and URL parameters without violating Express 5 getter constraints.
 */
export function xssSanitizer(req: Request, _res: Response, next: NextFunction) {
  if (req.body && typeof req.body === 'object') {
    try {
      req.body = sanitizeObject(req.body)
    } catch {
      for (const key of Object.keys(req.body)) {
        req.body[key] = sanitizeObject(req.body[key])
      }
    }
  }

  if (req.query && typeof req.query === 'object') {
    for (const key of Object.keys(req.query)) {
      try {
        (req.query as any)[key] = sanitizeObject((req.query as any)[key])
      } catch {
        // Ignore read-only properties
      }
    }
  }

  if (req.params && typeof req.params === 'object') {
    for (const key of Object.keys(req.params)) {
      try {
        req.params[key] = sanitizeObject(req.params[key])
      } catch {
        // Ignore read-only properties
      }
    }
  }

  next()
}
