export class ApiError extends Error {
  public readonly statusCode: number
  public readonly code: string
  public readonly details?: any

  constructor(statusCode: number, code: string, message: string, details?: any) {
    super(message)
    Object.setPrototypeOf(this, new.target.prototype)
    this.name = 'ApiError'
    this.statusCode = statusCode
    this.code = code
    this.details = details
    Error.captureStackTrace(this, this.constructor)
  }
}

export class BadRequestError extends ApiError {
  constructor(message: string = 'Bad request', details?: any) {
    super(400, 'BAD_REQUEST', message, details)
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message: string = 'Unauthorized', details?: any) {
    super(401, 'UNAUTHORIZED', message, details)
  }
}

export class ForbiddenError extends ApiError {
  constructor(message: string = 'Forbidden', details?: any) {
    super(403, 'FORBIDDEN', message, details)
  }
}

export class NotFoundError extends ApiError {
  constructor(message: string = 'Resource not found', details?: any) {
    super(404, 'NOT_FOUND', message, details)
  }
}

export class ConflictError extends ApiError {
  constructor(message: string = 'Resource conflict', details?: any) {
    super(409, 'CONFLICT', message, details)
  }
}

export class UnprocessableEntityError extends ApiError {
  constructor(message: string = 'Unprocessable entity', details?: any) {
    super(422, 'UNPROCESSABLE_ENTITY', message, details)
  }
}

export class RateLimitedError extends ApiError {
  constructor(message: string = 'Too many requests. Please try again later.', details?: any) {
    super(429, 'RATE_LIMITED', message, details)
  }
}

export class PaymentError extends ApiError {
  constructor(message: string = 'Payment processing failed', code: string = 'PAYMENT_FAILED', details?: any) {
    super(400, code, message, details)
  }
}
