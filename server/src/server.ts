import { app } from './app'
import { initRedis } from './config/redis'
import { logger } from './utils/logger'
import { verifyEmailTransporter } from './services/emailService'

const port = Number(process.env.PORT ?? 4000)

function startServer() {
  // Bind HTTP listener immediately so health checks pass without delay
  const server = app.listen(port, () => {
    logger.info({ port, env: process.env.NODE_ENV || 'development' }, `🚀 [popote-server] listening on port ${port}`)
  })

  // Asynchronously initialize Redis and verify email transporter in non-blocking manner
  Promise.allSettled([
    initRedis().catch((err) => logger.warn({ err }, '[Redis] Startup initialization notice')),
    verifyEmailTransporter().catch((err) => logger.warn({ err }, '[Email] Transporter startup check notice')),
  ]).then(() => {
    logger.info('[popote-server] Background subsystems initialized')
  })

  const shutdown = (signal: string) => {
    logger.info({ signal }, `Received ${signal}, shutting down gracefully...`)
    server.close(() => {
      logger.info('Server closed.')
      process.exit(0)
    })
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'))
  process.on('SIGINT', () => shutdown('SIGINT'))
}

startServer()
