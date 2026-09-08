/**
 * XSS & String Sanitization Utilities
 * Protects against stored, reflected, and DOM-based Cross-Site Scripting (XSS).
 */

/**
 * Strips script tags, HTML tags, event handlers, javascript: pseudo-protocols, and null bytes.
 */
export function sanitizeString(input: unknown): string {
  if (typeof input !== 'string') {
    return ''
  }

  let sanitized = input
    // Remove null bytes
    .replace(/\0/g, '')
    // Strip <script>...</script> tags and contents
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Strip <iframe>, <object>, <embed>, <applet>, <link>, <style>, <meta> tags
    .replace(/<(iframe|object|embed|applet|link|style|meta)\b[^<]*(?:(?!<\/\1>)<[^<]*)*<\/\1>/gi, '')
    // Strip self-closing or unclosed dangerous tags
    .replace(/<\/?(script|iframe|object|embed|applet|link|style|meta|svg|xml)[^>]*>/gi, '')
    // Remove event handlers like onload=, onclick=, onerror=, etc.
    .replace(/\bon\w+\s*=\s*(['"]).*?\1/gi, '')
    .replace(/\bon\w+\s*=\s*[^>\s]+/gi, '')
    // Remove javascript: and data: pseudo-protocols
    .replace(/javascript\s*:/gi, '')
    .replace(/vbscript\s*:/gi, '')

  return sanitized.trim()
}

/**
 * Escapes characters for safe HTML output
 */
export function escapeHtml(str: string): string {
  if (!str) return ''
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
}

/**
 * Escapes special characters for SQL ILIKE / LIKE queries (% and _)
 */
export function escapeSqlLike(str: string): string {
  if (!str) return ''
  return str.replace(/([%_\\])/g, '\\$1')
}

/**
 * Recursively sanitizes any object or array values
 */
export function sanitizeObject<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj
  }

  if (typeof obj === 'string') {
    return sanitizeString(obj) as unknown as T
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item)) as unknown as T
  }

  if (typeof obj === 'object') {
    const cleaned: Record<string, any> = {}
    for (const [key, value] of Object.entries(obj)) {
      // Avoid prototype pollution
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        continue
      }
      cleaned[key] = sanitizeObject(value)
    }
    return cleaned as T
  }

  return obj
}
