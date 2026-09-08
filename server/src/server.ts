import { app } from './app'
import { initRedis } from './config/redis'
import { logger } from './utils/logger'
import { verifyEmailTransporter } from './services/emailService'

const port = Number(process.env.PORT ?? 4000)

async function startServer() {
  await initRedis()
  await verifyEmailTransporter().catch((e) => logger.warn({ err: e }, '[Email] Transporter startup check failed'))
  const server = app.listen(port, () => {
    logger.info({ port, env: process.env.NODE_ENV || 'development' }, `🚀 [popote-server] listening on port ${port}`)
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

startServer().catch((err) => {
  logger.fatal({ err }, '[popote-server] Failed to start server')
  process.exit(1)
})
