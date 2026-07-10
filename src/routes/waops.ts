// WA Ops — monitoring AI Resepsionis (BKF-22). READ-ONLY.
// Tab observability untuk data wa_messages yang SUDAH ada — tidak mengubah
// FSM/webhook/fonnteSend/retry/sanitize sedikit pun (semua proven jalan).
//
// Endpoint:
//   GET /api/v1/wa-ops            — ringkasan 24 jam + daftar pesan terbaru (tenant-scoped)
//   GET /api/v1/wa-ops?breakdown=1 — (admin only) + breakdown kesehatan per-tenant
//
// Tenant isolation (BKF-17/18 — pola sama dengan retention.ts):
//   non-admin → SELALU dikunci ke tenant sesi (users.tenant_id), param client tak dipercaya.
//   admin / auth-off (dev) → boleh pilih tenant via ?tenant=<subdomain>.
// Gerbang authMiddleware + tenantParamGuard dipasang di index.tsx.

import { Hono } from 'hono'
import type { Bindings, TenantContext, AuthUser } from '../types'
import { now } from '../lib/d1'
import { isClerkConfigured } from '../lib/clerk'
import { logSecurityEvent } from '../lib/audit'

type Env = { Bindings: Bindings; Variables: { tenant: TenantContext; authUser: AuthUser | null } }
const waops = new Hono<Env>()

const DAY = 86_400_000
const BODY_SNIPPET = 160 // potongan isi pesan — cukup utk monitoring, hemat payload

// Pola resolveTenantRow retention.ts (BKF-18): non-admin dipaksa ke tenant sesi.
async function resolveTenantRow(c: any): Promise<any | null> {
  const enabled = isClerkConfigured(c.env) || Boolean(c.env.DEV_AUTH_BYPASS_EMAIL)
  const user = c.get('authUser') as AuthUser | null
  if (enabled && user && user.role !== 'admin') {
    if (!user.tenant_id) return null
    const own = await c.env.DB.prepare('SELECT * FROM tenants WHERE id=?').bind(user.tenant_id).first()
    const reqTid = c.req.query('tenant_id') || c.req.header('x-tenant-id') || null
    if (own && reqTid && reqTid !== (own as any).id) {
      await logSecurityEvent(c.env, {
        user, requested_tenant: reqTid, actual_tenant: (own as any).subdomain,
        endpoint: new URL(c.req.url).pathname, method: c.req.method,
        action: 'forced_to_session', reason: 'wa-ops: ?tenant_id= client != tenant sesi → dipaksa ke tenant sesi',
      })
    }
    return own
  }
  // admin / auth off (dev) → pilih tenant via ?tenant=/x-tenant
  const sub = c.req.query('tenant') || c.req.header('x-tenant')
  if (sub) {
    const row = await c.env.DB.prepare('SELECT * FROM tenants WHERE subdomain=?').bind(sub).first()
    if (row) return row
  }
  return null
}

function isAdminOrDev(c: any): boolean {
  const enabled = isClerkConfigured(c.env) || Boolean(c.env.DEV_AUTH_BYPASS_EMAIL)
  if (!enabled) return true // dev auth-off → terbuka (jujur, sama seperti requireAdmin)
  const user = c.get('authUser') as AuthUser | null
  return Boolean(user && user.role === 'admin')
}

// success rate outbound REAL: sent / (sent+failed). 'stub' & 'simulated' bukan
// percobaan kirim nyata → tidak dihitung penyebut (biar angka jujur, tidak
// tercemar mode dev/simulator).
function rate(sent: number, failed: number): number | null {
  const denom = sent + failed
  return denom === 0 ? null : Math.round((sent / denom) * 1000) / 10
}

// ── GET / — ringkasan + daftar pesan terbaru ────────────────────────
waops.get('/', async (c) => {
  const t = now()
  const since24 = t - DAY
  const tenant = await resolveTenantRow(c)
  if (!tenant) return c.json({ ok: false, error: 'tenant tidak ditemukan — sertakan ?tenant=<subdomain> yang valid' }, 404)

  const limit = Math.min(100, Math.max(1, parseInt(c.req.query('limit') || '30', 10) || 30))

  // 1) daftar pesan terbaru (potongan body — read-only, tenant-scoped)
  const { results: rows } = await c.env.DB.prepare(
    `SELECT id, direction, phone, substr(COALESCE(body,''),1,${BODY_SNIPPET + 1}) AS body,
            agent_type, status, error, sanitize_level, created_at
     FROM wa_messages WHERE tenant_id=? ORDER BY created_at DESC LIMIT ?`
  ).bind(tenant.id, limit).all<any>()

  const messages = (rows || []).map((m) => ({
    ...m,
    body: m.body && m.body.length > BODY_SNIPPET ? m.body.slice(0, BODY_SNIPPET) + '…' : m.body,
  }))

  // 2) agregat 24 jam terakhir (satu query GROUP BY — murah di D1)
  const { results: agg } = await c.env.DB.prepare(
    `SELECT direction, status, COUNT(*) AS n FROM wa_messages
     WHERE tenant_id=? AND created_at>=? GROUP BY direction, status`
  ).bind(tenant.id, since24).all<any>()

  let total24 = 0, in24 = 0, out24 = 0, sent = 0, failed = 0, stub = 0, simulated = 0
  for (const r of agg || []) {
    total24 += r.n
    if (r.direction === 'in') in24 += r.n
    else {
      out24 += r.n
      if (r.status === 'sent') sent += r.n
      else if (r.status === 'failed') failed += r.n
      else if (r.status === 'stub') stub += r.n
      else if (r.status === 'simulated') simulated += r.n
    }
  }

  const body: any = {
    ok: true,
    tenant: tenant.subdomain,
    shop_name: tenant.shop_name,
    summary_24h: {
      total: total24, in: in24, out: out24,
      sent, failed, stub, simulated,
      success_rate: rate(sent, failed), // null = belum ada percobaan kirim nyata
    },
    messages,
  }

  // 3) (admin only) breakdown per-tenant — pantau kesehatan lintas tenant sekaligus
  if (c.req.query('breakdown') === '1') {
    if (!isAdminOrDev(c)) {
      return c.json({ ...body, breakdown: null, breakdown_error: 'Hanya admin (operator BarberKas).' })
    }
    const { results: bd } = await c.env.DB.prepare(
      `SELECT tn.subdomain, tn.shop_name,
              COUNT(w.id) AS total_24h,
              SUM(CASE WHEN w.direction='out' AND w.status='sent'   THEN 1 ELSE 0 END) AS sent,
              SUM(CASE WHEN w.direction='out' AND w.status='failed' THEN 1 ELSE 0 END) AS failed,
              SUM(CASE WHEN w.direction='out' AND w.status='stub'   THEN 1 ELSE 0 END) AS stub,
              MAX(w.created_at) AS last_message_at
       FROM tenants tn
       LEFT JOIN wa_messages w ON w.tenant_id=tn.id AND w.created_at>=?
       GROUP BY tn.id ORDER BY total_24h DESC`
    ).bind(since24).all<any>()
    body.breakdown = (bd || []).map((r) => ({
      ...r,
      success_rate: rate(r.sent || 0, r.failed || 0),
    }))
  }

  return c.json(body)
})

export default waops
