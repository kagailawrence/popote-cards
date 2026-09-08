import { redis } from '../config/redis'
import { logger } from './logger'

/**
 * Safe Redis Cache-Aside Helper
 * Gracefully degrades if Redis is unavailable, avoiding application downtime.
 */

export async function getCache<T>(key: string): Promise<T | null> {
  try {
    if (redis.status !== 'ready' && redis.status !== 'connect') {
      return null
    }
    const data = await redis.get(key)
    if (!data) return null
    return JSON.parse(data) as T
  } catch (err: any) {
    logger.warn({ key, err: err.message }, '[Cache] Failed to get cache key')
    return null
  }
}

export async function setCache<T>(key: string, value: T, ttlSeconds = 3600): Promise<void> {
  try {
    if (redis.status !== 'ready' && redis.status !== 'connect') {
      return
    }
    const serialized = JSON.stringify(value)
    if (ttlSeconds > 0) {
      await redis.set(key, serialized, 'EX', ttlSeconds)
    } else {
      await redis.set(key, serialized)
    }
  } catch (err: any) {
    logger.warn({ key, err: err.message }, '[Cache] Failed to set cache key')
  }
}

export async function getOrSetCache<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>
): Promise<T> {
  const cached = await getCache<T>(key)
  if (cached !== null && cached !== undefined) {
    return cached
  }

  const freshData = await fetcher()
  if (freshData !== null && freshData !== undefined) {
    // Asynchronously populate cache so response is fast
    setCache(key, freshData, ttlSeconds).catch(() => {})
  }
  return freshData
}

export async function invalidateCache(...keys: string[]): Promise<void> {
  try {
    if ((redis.status !== 'ready' && redis.status !== 'connect') || keys.length === 0) {
      return
    }
    await redis.del(...keys)
  } catch (err: any) {
    logger.warn({ keys, err: err.message }, '[Cache] Failed to delete cache keys')
  }
}

/**
 * Scan and delete all keys matching a given pattern (e.g. "catalog:designs:*")
 * Non-blocking cursor-based scanning
 */
export async function invalidateCachePattern(pattern: string): Promise<void> {
  try {
    if (redis.status !== 'ready' && redis.status !== 'connect') {
      return
    }

    let cursor = '0'
    do {
      const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100)
      cursor = nextCursor
      if (keys.length > 0) {
        await redis.del(...keys)
      }
    } while (cursor !== '0')
  } catch (err: any) {
    logger.warn({ pattern, err: err.message }, '[Cache] Failed to invalidate cache pattern')
  }
}
