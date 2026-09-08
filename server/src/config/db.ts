import 'dotenv/config'
import { Pool, PoolConfig } from 'pg'
import { logger } from '../utils/logger'

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/popote_cards'

const config: PoolConfig = {
  connectionString,
  max: Number(process.env.DB_POOL_MAX ?? 20),
  idleTimeoutMillis: Number(process.env.DB_IDLE_TIMEOUT_MS ?? 30000),
  connectionTimeoutMillis: Number(process.env.DB_CONN_TIMEOUT_MS ?? 5000),
}

export const pool = new Pool(config)

pool.on('error', (err) => {
  logger.error({ err }, '[pg-pool] Unexpected error on idle client')
})

export async function query<T = any>(text: string, params?: any[]): Promise<T[]> {
  const res = await pool.query(text, params)
  return res.rows
}

export async function queryOne<T = any>(text: string, params?: any[]): Promise<T | null> {
  const rows = await query<T>(text, params)
  return rows[0] ?? null
}
