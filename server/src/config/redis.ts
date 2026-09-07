import Redis from 'ioredis'

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
  // Silent log to prevent crashing if Redis is offline during local dev
  console.warn('[Redis] Connection notice:', err.message)
})

export async function initRedis() {
  try {
    await redis.connect()
  } catch (err: any) {
    console.warn('[Redis] Skipped redis connection:', err.message)
  }
}
