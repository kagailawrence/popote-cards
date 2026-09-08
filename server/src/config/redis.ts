import Redis from 'ioredis'
import { logger } from '../utils/logger'

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'

export const redis = new Redis(redisUrl, {
  lazyConnect: true,
  maxRetriesPerRequest: 1,
  retryStrategy(times) {
    if (times > 3) return null // Stop retrying if Redis is not running locally
    return Math.min(times * 100, 2000)
  },
})

redis.on('error', (err) => {
  logger.warn({ err: err.message }, '[Redis] Connection notice')
})

export async function initRedis() {
  try {
    await redis.connect()
    logger.info('[Redis] Connected successfully')
  } catch (err: any) {
    logger.warn({ err: err.message }, '[Redis] Skipped redis connection')
  }
}
