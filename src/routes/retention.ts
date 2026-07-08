// Retensi & Reminder Customer (BKF-13) — mesin repeat-booking.
// Riset 4-file: barbershop hidup dari repeat customer (potong tiap 3-4 minggu),
// tapi hampir tak ada yang punya sistem ingetin pelanggan balik. Ini dia.
//
// Endpoint:
//   GET  /reminders          — daftar customer_reminders (filter kind/status/tenant)
//   POST /retention/scan     — scan customers idle >= retention_days → buat reminder retensi (idempotent)
//   POST /run-due            — kirim reminder jatuh tempo via Fonnte (Truth-Lock: tanpa token → status 'stub')
//   GET  /telemetry          — angka retensi: due, sent, scheduled, customer idle
//
// Truth-Lock: pengiriman WA nyata hanya bila FONNTE_TOKEN di-set; tanpa token,
// reminder ditandai 'stub' (jujur, tidak pura-pura terkirim).

import { Hono } from 'hono'
import type { Bindings, TenantContext, AuthUser } from '../types'
import { uid, now } from '../lib/d1'
import { fonnteSend } from '../lib/fonnte'
import { fmtWibFull } from '../lib/slots'
import { isClerkConfigured } from '../lib/clerk'
import { logSecurityEvent } from '../lib/audit'

type Env = { Bindings: Bindings; Variables: { tenant: TenantContext; authUser: AuthUser | null } }
const retention = new Hono<Env>()

const DAY = 86_400_000

function tenantIdOf(c: any): string | null {
  return c.req.query('tenant_id') || c.req.header('x-tenant-id') || null
}

// BKF-18 (audit WRITE): utk user login non-admin, tenant SELALU dipaksa dari
// sesi server (users.tenant_id) — param ?tenant=/?tenant_id=/header dari client
// TIDAK dipercaya. tenantParamGuard sudah menolak ?tenant= yang mismatch, tapi
// jalur ?tenant_id=/x-tenant-id lama tidak tercakup guard → ditutup di sini.
async function resolveTenantRow(c: any): Promise<any | null> {
  const enabled = isClerkConfigured(c.env) || Boolean(c.env.DEV_AUTH_BYPASS_EMAIL)
  const user = c.get('authUser') as AuthUser | null
  if (enabled && user && user.role !== 'admin') {
    // non-admin → kunci ke tenant sesi, apa pun isi query/header client.
    if (!user.tenant_id) return null
    const own = await c.env.DB.prepare('SELECT * FROM tenants WHERE id=?').bind(user.tenant_id).first()
    // deteksi & catat percobaan menyisipkan tenant lain via tenant_id/header lama
    const reqTid = tenantIdOf(c)
    if (own && reqTid && reqTid !== (own as any).id) {
      await logSecurityEvent(c.env, {
        user, requested_tenant: reqTid, actual_tenant: (own as any).subdomain,
        endpoint: new URL(c.req.url).pathname, method: c.req.method,
        action: 'forced_to_session', reason: 'retention: ?tenant_id= client != tenant sesi → dipaksa ke tenant sesi',
      })
    }
    return own
  }
  // admin / auth off (dev) → boleh pilih tenant via param (jalur lama)
  const sub = c.req.query('tenant') || c.req.header('x-tenant')
  if (sub) {
    const row = await c.env.DB.prepare('SELECT * FROM tenants WHERE subdomain=?').bind(sub).first()
    if (row) return row
  }
  const tid = tenantIdOf(c)
  if (tid) {
    const row = await c.env.DB.prepare('SELECT * FROM tenants WHERE id=?').bind(tid).first()
    if (row) return row
  }
  return null
}

// ── GET /reminders — daftar reminder customer ───────────────────────
retention.get('/reminders', async (c) => {
  const kind = c.req.query('kind')     // h1_booking|retention
  const status = c.req.query('status') // scheduled|sent|stub|failed|cancelled
  const tenant = await resolveTenantRow(c)

  let sql = 'SELECT * FROM customer_reminders WHERE 1=1'
  const binds: any[] = []
  if (tenant) { sql += ' AND tenant_id=?'; binds.push(tenant.id) }
  if (kind) { sql += ' AND kind=?'; binds.push(kind) }
  if (status) { sql += ' AND status=?'; binds.push(status) }
  sql += ' ORDER BY due_at ASC LIMIT 200'

  const { results } = await c.env.DB.prepare(sql).bind(...binds).all<any>()
  const t = now()
  const due_now = (results || []).filter((r) => r.status === 'scheduled' && r.due_at <= t).length
  return c.json({ reminders: results || [], due_now })
})

// ── POST /retention/scan — buat reminder retensi utk customer idle ──
// Idempotent: 1 reminder retensi 'scheduled' aktif per customer.
retention.post('/retention/scan', async (c) => {
  const t = now()
  const tenant = await resolveTenantRow(c)

  // tenants target (1 tenant bila di-scope, semua bila global cron)
  const { results: tenants } = tenant
    ? { results: [tenant] }
    : await c.env.DB.prepare('SELECT * FROM tenants').all<any>()

  let created = 0
  const detail: any[] = []

  for (const tn of tenants || []) {
    const retDays = (tn as any).retention_days ?? 25
    const cutoff = t - retDays * DAY

    // customer idle: last_visit_at ada & lebih tua dari cutoff, punya phone,
    // belum punya reminder retensi 'scheduled', dan tidak punya booking aktif ke depan.
    const { results: idle } = await c.env.DB.prepare(
      `SELECT cu.* FROM customers cu
       WHERE cu.tenant_id=? AND cu.phone IS NOT NULL AND cu.phone!=''
         AND cu.last_visit_at IS NOT NULL AND cu.last_visit_at<=?
         AND NOT EXISTS (SELECT 1 FROM customer_reminders r WHERE r.tenant_id=cu.tenant_id AND r.customer_id=cu.id AND r.kind='retention' AND r.status='scheduled')
         AND NOT EXISTS (SELECT 1 FROM bookings b WHERE b.tenant_id=cu.tenant_id AND b.customer_id=cu.id AND b.status IN ('pending','confirmed') AND b.scheduled_at>?)
       LIMIT 100`
    ).bind(tn.id, cutoff, t).all<any>()

    for (const cu of idle || []) {
      const weeks = Math.max(3, Math.round((t - cu.last_visit_at) / (7 * DAY)))
      const msg = `Halo kak ${cu.name}! 👋 Sudah ±${weeks} minggu sejak potong terakhir di *${tn.shop_name}* ✂️ Rambutnya pasti sudah mulai panjang nih 😄 Mau booking lagi? Balas *booking* aja, nanti aku carikan slot kosongnya. Ditunggu ya! 💈`
      await c.env.DB.prepare(
        'INSERT INTO customer_reminders (id,tenant_id,customer_id,booking_id,phone,kind,due_at,message,status,created_at,updated_at) VALUES (?,?,?,NULL,?,?,?,?,?,?,?)'
      ).bind(uid('cr_'), tn.id, cu.id, cu.phone, 'retention', t, msg, 'scheduled', t, t).run()
      created++
      detail.push({ tenant: tn.subdomain, customer: cu.name, idle_days: Math.round((t - cu.last_visit_at) / DAY) })
    }
  }

  return c.json({ ok: true, created, detail })
})

// ── POST /run-due — kirim reminder jatuh tempo via Fonnte ───────────
// Dipanggil manual dari dashboard, atau via cron eksternal (cron-job.org / CF Cron Trigger).
retention.post('/run-due', async (c) => {
  const t = now()
  const tenant = await resolveTenantRow(c)

  let sql = "SELECT * FROM customer_reminders WHERE status='scheduled' AND due_at<=?"
  const binds: any[] = [t]
  if (tenant) { sql += ' AND tenant_id=?'; binds.push(tenant.id) }
  sql += ' ORDER BY due_at ASC LIMIT 50'

  const { results: due } = await c.env.DB.prepare(sql).bind(...binds).all<any>()
  let sent = 0, stub = 0, failed = 0
  const report: any[] = []

  for (const r of due || []) {
    // guard: reminder H-1 utk booking yang sudah dibatalkan → cancel
    if (r.kind === 'h1_booking' && r.booking_id) {
      const bk = await c.env.DB.prepare('SELECT status FROM bookings WHERE id=?').bind(r.booking_id).first<any>()
      if (!bk || bk.status === 'cancelled' || bk.status === 'noshow') {
        await c.env.DB.prepare("UPDATE customer_reminders SET status='cancelled', updated_at=? WHERE id=?").bind(t, r.id).run()
        report.push({ id: r.id, kind: r.kind, result: 'cancelled (booking tidak aktif)' })
        continue
      }
    }

    const res = await fonnteSend(c.env, r.phone, r.message)
    const st = res.ok ? 'sent' : res.mode === 'stub' ? 'stub' : 'failed'
    if (st === 'sent') sent++; else if (st === 'stub') stub++; else failed++

    await c.env.DB.prepare('UPDATE customer_reminders SET status=?, fonnte_id=?, sent_at=?, updated_at=? WHERE id=?')
      .bind(st, res.id || null, st === 'failed' ? null : t, t, r.id).run()

    // log ke wa_messages agar tampil di WA log dashboard
    await c.env.DB.prepare(
      'INSERT INTO wa_messages (id,tenant_id,direction,phone,body,agent_type,status,fonnte_id,created_at) VALUES (?,?,?,?,?,?,?,?,?)'
    ).bind(uid('wa_'), r.tenant_id, 'out', r.phone, r.message, r.kind === 'retention' ? 'retention' : 'reminder', st, res.id || null, t).run()

    report.push({ id: r.id, kind: r.kind, phone: r.phone, result: st, error: res.error || null })
  }

  return c.json({
    ok: true,
    processed: (due || []).length,
    sent, stub, failed,
    note: stub > 0 ? 'FONNTE_TOKEN belum di-set → reminder ditandai stub (Truth-Lock, tidak pura-pura terkirim).' : undefined,
    report,
  })
})

// ── GET /telemetry — angka retensi & reminder ───────────────────────
retention.get('/telemetry', async (c) => {
  const t = now()
  const tenant = await resolveTenantRow(c)
  const tid = tenant?.id

  const q = (sql: string, ...extra: any[]) =>
    tid
      ? c.env.DB.prepare(sql + ' AND tenant_id=?').bind(...extra, tid).first<any>()
      : c.env.DB.prepare(sql).bind(...extra).first<any>()

  const scheduled = await q("SELECT COUNT(*) n FROM customer_reminders WHERE status='scheduled'")
  const dueNow = await q("SELECT COUNT(*) n FROM customer_reminders WHERE status='scheduled' AND due_at<=?", t)
  const sentTotal = await q("SELECT COUNT(*) n FROM customer_reminders WHERE status IN ('sent','stub')")
  const h1 = await q("SELECT COUNT(*) n FROM customer_reminders WHERE kind='h1_booking' AND status='scheduled'")
  const ret = await q("SELECT COUNT(*) n FROM customer_reminders WHERE kind='retention' AND status='scheduled'")

  const retDays = (tenant as any)?.retention_days ?? 25
  const cutoff = t - retDays * DAY
  const idle = tid
    ? await c.env.DB.prepare(
        "SELECT COUNT(*) n FROM customers WHERE tenant_id=? AND last_visit_at IS NOT NULL AND last_visit_at<=?"
      ).bind(tid, cutoff).first<any>()
    : await c.env.DB.prepare(
        'SELECT COUNT(*) n FROM customers WHERE last_visit_at IS NOT NULL AND last_visit_at<=?'
      ).bind(cutoff).first<any>()

  return c.json({
    tenant: tenant?.subdomain || null,
    retention_days: retDays,
    reminders_scheduled: scheduled?.n || 0,
    reminders_due_now: dueNow?.n || 0,
    reminders_sent_total: sentTotal?.n || 0,
    h1_scheduled: h1?.n || 0,
    retention_scheduled: ret?.n || 0,
    customers_idle: idle?.n || 0,
    now_wib: fmtWibFull(t),
  })
})

export default retention
