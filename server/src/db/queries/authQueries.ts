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

export interface CustomerUser {
  id: string
  phone: string
  email: string | null
  full_name: string | null
  password_hash: string | null
  is_active: boolean
  created_at: Date
  updated_at: Date
}

export interface PasswordResetRecord {
  id: string
  email: string
  token_hash: string
  user_type: 'customer' | 'admin'
  expires_at: Date
  used: boolean
  created_at: Date
}

export async function findAdminByEmail(email: string): Promise<AdminUser | null> {
  return queryOne<AdminUser>(
    `SELECT id, email, password_hash, role, failed_login_attempts, locked_until, created_at, updated_at
     FROM admins WHERE LOWER(email) = LOWER($1)`,
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

// -------------------------------------------------------------
// Customer Account Queries
// -------------------------------------------------------------
export async function findCustomerByEmail(email: string): Promise<CustomerUser | null> {
  return queryOne<CustomerUser>(
    `SELECT id, phone, email, full_name, password_hash, is_active, created_at, updated_at
     FROM customers WHERE LOWER(email) = LOWER($1)`,
    [email]
  )
}

export async function findCustomerByPhone(phone: string): Promise<CustomerUser | null> {
  return queryOne<CustomerUser>(
    `SELECT id, phone, email, full_name, password_hash, is_active, created_at, updated_at
     FROM customers WHERE phone = $1`,
    [phone]
  )
}

export async function findCustomerById(id: string): Promise<CustomerUser | null> {
  return queryOne<CustomerUser>(
    `SELECT id, phone, email, full_name, password_hash, is_active, created_at, updated_at
     FROM customers WHERE id = $1`,
    [id]
  )
}

export async function createOrUpdateCustomerAccount(params: {
  phone: string
  email: string
  fullName: string
  passwordHash: string
}): Promise<CustomerUser> {
  const existingByPhone = await findCustomerByPhone(params.phone)
  if (existingByPhone) {
    return (await queryOne<CustomerUser>(
      `UPDATE customers
       SET email = $1, full_name = $2, password_hash = $3, updated_at = now()
       WHERE id = $4
       RETURNING id, phone, email, full_name, password_hash, is_active, created_at, updated_at`,
      [params.email, params.fullName, params.passwordHash, existingByPhone.id]
    ))!
  }

  const existingByEmail = await findCustomerByEmail(params.email)
  if (existingByEmail) {
    return (await queryOne<CustomerUser>(
      `UPDATE customers
       SET phone = $1, full_name = $2, password_hash = $3, updated_at = now()
       WHERE id = $4
       RETURNING id, phone, email, full_name, password_hash, is_active, created_at, updated_at`,
      [params.phone, params.fullName, params.passwordHash, existingByEmail.id]
    ))!
  }

  return (await queryOne<CustomerUser>(
    `INSERT INTO customers (phone, email, full_name, password_hash)
     VALUES ($1, $2, $3, $4)
     RETURNING id, phone, email, full_name, password_hash, is_active, created_at, updated_at`,
    [params.phone, params.email, params.fullName, params.passwordHash]
  ))!
}

export async function updateAdminPassword(adminId: string, passwordHash: string): Promise<void> {
  await query(
    `UPDATE admins
     SET password_hash = $1, failed_login_attempts = 0, locked_until = NULL, updated_at = now()
     WHERE id = $2`,
    [passwordHash, adminId]
  )
}

export async function updateCustomerPassword(customerId: string, passwordHash: string): Promise<void> {
  await query(
    `UPDATE customers
     SET password_hash = $1, updated_at = now()
     WHERE id = $2`,
    [passwordHash, customerId]
  )
}

// -------------------------------------------------------------
// Password Reset Token Queries
// -------------------------------------------------------------
export async function savePasswordResetToken(
  email: string,
  tokenHash: string,
  userType: 'customer' | 'admin',
  expiresAt: Date
): Promise<void> {
  // Invalidate any previous unused tokens for this email
  await query(
    `UPDATE password_reset_tokens
     SET used = true
     WHERE LOWER(email) = LOWER($1) AND used = false`,
    [email]
  )

  await query(
    `INSERT INTO password_reset_tokens (email, token_hash, user_type, expires_at)
     VALUES ($1, $2, $3, $4)`,
    [email.toLowerCase(), tokenHash, userType, expiresAt]
  )
}

export async function findValidPasswordResetToken(tokenHash: string): Promise<PasswordResetRecord | null> {
  return queryOne<PasswordResetRecord>(
    `SELECT id, email, token_hash, user_type, expires_at, used, created_at
     FROM password_reset_tokens
     WHERE token_hash = $1 AND used = false AND expires_at > now()`,
    [tokenHash]
  )
}

export async function markPasswordResetTokenUsed(tokenHash: string): Promise<void> {
  await query(
    `UPDATE password_reset_tokens
     SET used = true
     WHERE token_hash = $1`,
    [tokenHash]
  )
}
