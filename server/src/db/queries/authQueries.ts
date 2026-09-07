import { queryOne, query } from '../../config/db'

export interface AdminUser {
  id: string
  email: string
  password_hash: string
  role: string
  failed_login_attempts: number
  locked_until: Date | null
  created_at: Date
  updated_at: Date
}

export async function findAdminByEmail(email: string): Promise<AdminUser | null> {
  return queryOne<AdminUser>(
    `SELECT id, email, password_hash, role, failed_login_attempts, locked_until, created_at, updated_at
     FROM admins WHERE email = $1`,
    [email]
  )
}

export async function findAdminById(id: string): Promise<AdminUser | null> {
  return queryOne<AdminUser>(
    `SELECT id, email, password_hash, role, failed_login_attempts, locked_until, created_at, updated_at
     FROM admins WHERE id = $1`,
    [id]
  )
}

export async function recordFailedLogin(id: string, currentAttempts: number): Promise<void> {
  const newCount = currentAttempts + 1
  const lockUntil = newCount >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null
  await query(
    `UPDATE admins
     SET failed_login_attempts = $1, locked_until = $2, updated_at = now()
     WHERE id = $3`,
    [newCount, lockUntil, id]
  )
}

export async function resetFailedLogins(id: string): Promise<void> {
  await query(
    `UPDATE admins
     SET failed_login_attempts = 0, locked_until = NULL, updated_at = now()
     WHERE id = $1`,
    [id]
  )
}

export async function saveRefreshToken(adminId: string, tokenHash: string, expiresAt: Date): Promise<void> {
  await query(
    `INSERT INTO refresh_tokens (admin_id, token_hash, expires_at)
     VALUES ($1, $2, $3)`,
    [adminId, tokenHash, expiresAt]
  )
}

export async function findRefreshToken(tokenHash: string): Promise<{ id: string; admin_id: string; revoked: boolean; expires_at: Date } | null> {
  return queryOne(
    `SELECT id, admin_id, token_hash, expires_at, revoked
     FROM refresh_tokens
     WHERE token_hash = $1`,
    [tokenHash]
  )
}

export async function revokeRefreshToken(tokenHash: string): Promise<void> {
  await query(
    `UPDATE refresh_tokens SET revoked = true WHERE token_hash = $1`,
    [tokenHash]
  )
}
