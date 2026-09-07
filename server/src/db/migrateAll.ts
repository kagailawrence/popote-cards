import fs from 'fs'
import path from 'path'
import { pool } from '../config/db'
import { seed47Counties } from './seed47Counties'

export async function runMigrations() {
  console.log('[Migrations] Connecting to database...')
  const client = await pool.connect()

  try {
    // 1. Create migrations tracking table
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `)

    // 2. Discover migration files
    const migrationsDir = path.resolve(__dirname, '../../db/migrations')
    const files = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort()

    console.log(`[Migrations] Found ${files.length} migration files in ${migrationsDir}`)

    for (const file of files) {
      const migrationCheck = await client.query(
        'SELECT version FROM schema_migrations WHERE version = $1',
        [file]
      )

      if (migrationCheck.rows.length === 0) {
        console.log(`[Migrations] Applying ${file}...`)
        const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8')

        await client.query('BEGIN')
        try {
          await client.query(sql)
          await client.query('INSERT INTO schema_migrations (version) VALUES ($1)', [file])
          await client.query('COMMIT')
          console.log(`[Migrations] Successfully applied ${file}`)
        } catch (err) {
          await client.query('ROLLBACK')
          console.error(`[Migrations] Failed to apply ${file}:`, err)
          throw err
        }
      } else {
        console.log(`[Migrations] Skipping already applied: ${file}`)
      }
    }

    // 3. Check and apply seed.sql if needed
    const seedFile = path.resolve(__dirname, '../../db/seed.sql')
    if (fs.existsSync(seedFile)) {
      console.log('[Migrations] Applying base seed data...')
      const seedSql = fs.readFileSync(seedFile, 'utf-8')
      await client.query(seedSql)
      console.log('[Migrations] Base seed applied successfully.')
    }

    // 4. Seed all 47 counties & regional hubs
    console.log('[Migrations] Seeding counties & hubs...')
    await seed47Counties()
    console.log('[Migrations] All database migrations and seedings completed successfully!')
  } finally {
    client.release()
  }
}

if (require.main === module) {
  runMigrations()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[Migrations] Unhandled error:', err)
      process.exit(1)
    })
}
