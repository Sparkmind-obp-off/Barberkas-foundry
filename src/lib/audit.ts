// BKF-18 — Security audit logger (Tugas 2).
// Catat setiap request yang DITOLAK (403) atau DIPAKSA ke tenant sesi
// (client kirim tenant lain di body/param → server override).
// Fire-safe: kegagalan logging TIDAK boleh mematahkan request utama.

import type { Bindings, AuthUser } from '../types'
import { uid, now } from './d1'

export type AuditAction = 'denied_403' | 'forced_to_session' | 'denied_401'

export interface AuditEvent {
  user?: AuthUser | null
  requested_tenant?: string | null // tenant yang diminta client
  actual_tenant?: string | null    // tenant yang seharusnya (sesi server)
  endpoint: string
  method: string
  action: AuditAction
  reason: string
}

export async function logSecurityEvent(env: Bindings, ev: AuditEvent): Promise<void> {
  try {
    await env.DB.prepare(
      `INSERT INTO security_audit_log
         (id,user_id,user_email,user_role,requested_tenant,actual_tenant,endpoint,method,action,reason,created_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`
    ).bind(
      uid('sec_'),
      ev.user?.id || null,
      ev.user?.email || null,
      ev.user?.role || null,
      ev.requested_tenant || null,
      ev.actual_tenant || null,
      ev.endpoint,
      ev.method,
      ev.action,
      ev.reason,
      now()
    ).run()
  } catch (e) {
    // tabel belum ada / DB error → jangan patahkan request; jujur di console
    console.log('[security-audit] gagal tulis log:', String(e))
  }
}
