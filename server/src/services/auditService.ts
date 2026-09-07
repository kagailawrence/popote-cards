import { query } from '../config/db'
import { Request } from 'express'

export interface AuditLogPayload {
  userId?: string | null
  userEmail?: string | null
  role?: string
  action: string
  entityType: string
  entityId?: string | null
  oldValues?: any
  newValues?: any
  req?: Request
}

export async function logAuditEvent(payload: AuditLogPayload): Promise<void> {
  try {
    let ipAddress: string | null = null
    let userAgent: string | null = null

    if (payload.req) {
      ipAddress = (payload.req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || payload.req.socket.remoteAddress || null
      userAgent = (payload.req.headers['user-agent'] as string) || null
    }

    await query(
      `INSERT INTO audit_logs 
        (user_id, user_email, role, action, entity_type, entity_id, old_values, new_values, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        payload.userId || null,
        payload.userEmail || null,
        payload.role || 'anonymous',
        payload.action,
        payload.entityType,
        payload.entityId || null,
        payload.oldValues ? JSON.stringify(payload.oldValues) : null,
        payload.newValues ? JSON.stringify(payload.newValues) : null,
        ipAddress,
        userAgent,
      ]
    )
  } catch (err: any) {
    // Audit logging should never crash the primary request path, but should warn
    console.error('[AuditService] Failed to record audit log:', err.message)
  }
}
