import pino from 'pino'
import pinoHttp from 'pino-http'
import { randomUUID } from 'crypto'

const isProduction = process.env.NODE_ENV === 'production'
const logLevel = process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug')

export const logger = pino({
  name: 'popote-server',
  level: logLevel,
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'body.password',
      'body.confirmPassword',
      'body.token',
      'body.refreshToken',
      'body.secret',
      'body.pin',
      'body.cardNumber',
      'body.cvv',
      'password',
      'token',
      'secret',
    ],
    censor: '[REDACTED]',
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level: (label) => ({ level: label }),
  },
})

export const httpLogger = pinoHttp({
  logger,
  genReqId: (req, res) => {
    const existing = req.headers['x-request-id'] as string
    if (existing) return existing
    const id = randomUUID()
    res.setHeader('X-Request-Id', id)
    return id
  },
  customLogLevel: (_req, res, err) => {
    if (res.statusCode >= 500 || err) return 'error'
    if (res.statusCode >= 400) return 'warn'
    return 'info'
  },
  customSuccessMessage: (req, res, responseTime) => {
    return `[HTTP] ${req.method} ${req.url} -> ${res.statusCode} (${responseTime}ms)`
  },
  customErrorMessage: (req, res, err) => {
    return `[HTTP ERROR] ${req.method} ${req.url} -> ${res.statusCode} - ${err.message}`
  },
  autoLogging: {
    ignore: (req) => req.url === '/health',
  },
  redact: [
    'req.headers.authorization',
    'req.headers.cookie',
    'req.body.password',
    'req.body.cardNumber',
    'req.body.pin',
  ],
})
