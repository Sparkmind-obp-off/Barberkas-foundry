// BarberKas AaaS — Inbound webhooks (Fonnte WA).
// /webhooks/fonnte : AI Resepsionis v2 (BKF-13) — FSM multi-turn:
//   cek slot kosong per-capster real-time → konfirmasi booking otomatis →
//   reschedule/batal tanpa admin → auto-jadwal reminder H-1.
// Truth-Lock: balasan WA nyata hanya terkirim bila FONNTE_TOKEN set (else stub).
//
// Tenant resolution (webhook tak punya subdomain):
//   1) ?tenant=<subdomain>  (set di URL webhook Fonnte per-device)
//   2) body.device  → cocokkan tenants.owner_phone
//   3) fallback tenant demo pertama (dev only)

import { Hono } from 'hono'
import type { Bindings, Tenant } from '../types'
import { uid, now } from '../lib/d1'
import { parseFonnteWebhook, fonnteSend, normalizePhone } from '../lib/fonnte'
import { runReceptionist } from '../agents/receptionist'

const webhooks = new Hono<{ Bindings: Bindings }>()

// strict=true (simulator/dashboard): ?tenant= WAJIB valid — TIDAK ada fallback diam-diam.
// Fix bug branding: dropdown "Cut O'Clock" tapi bot balas "AlfaCut" terjadi karena
// fallback ke tenant pertama saat query tenant hilang/salah. Sekarang → 404 jujur.
async function resolveTenant(c: any, deviceOrQuery?: string, strict = false): Promise<Tenant | null> {
  const q = c.req.query('tenant')
  if (q) {
    const row = await c.env.DB.prepare('SELECT * FROM tenants WHERE subdomain=?').bind(q).first<Tenant>()
    if (row) return row
    if (strict) return null // tenant diminta tapi tidak ada → jangan fallback ke toko lain
  }
  if (strict) return null // simulator wajib eksplisit sebutkan tenant
  if (deviceOrQuery) {
    const phone = normalizePhone(deviceOrQuery)
    const row = await c.env.DB.prepare('SELECT * FROM tenants WHERE owner_phone=?').bind(phone).first<Tenant>()
    if (row) return row
  }
  // dev fallback — tenant pertama (hanya jalur Fonnte device, bukan simulator)
  return await c.env.DB.prepare('SELECT * FROM tenants ORDER BY created_at ASC LIMIT 1').first<Tenant>()
}

// core handler: 1 pesan WA masuk → FSM → balasan (+ kirim Fonnte bila !simulate)
async function handleIncoming(c: any, tenant: Tenant, phone: string, message: string, name: string, simulate: boolean) {
  const t0 = Date.now()

  // log pesan masuk
  await c.env.DB.prepare(
    'INSERT INTO wa_messages (id,tenant_id,direction,phone,body,agent_type,status,fonnte_id,created_at) VALUES (?,?,?,?,?,?,?,?,?)'
  ).bind(uid('wa_'), tenant.id, 'in', phone, message, 'receptionist', 'received', null, now()).run()

  // AI Resepsionis v2 — FSM multi-turn
  const result = await runReceptionist(c.env, tenant, phone, message, name)

  // balas via Fonnte (skip saat simulasi dashboard)
  const sent = simulate
    ? { ok: false, mode: 'stub' as const, detail: 'simulate=1 — tidak kirim WA nyata' }
    : await fonnteSend(c.env, phone, result.reply)

  // log pesan keluar
  await c.env.DB.prepare(
    'INSERT INTO wa_messages (id,tenant_id,direction,phone,body,agent_type,status,fonnte_id,created_at) VALUES (?,?,?,?,?,?,?,?,?)'
  ).bind(uid('wa_'), tenant.id, 'out', phone, result.reply, 'receptionist',
    simulate ? 'simulated' : sent.ok ? 'sent' : sent.mode === 'stub' ? 'stub' : 'failed',
    (sent as any).id || null, now()).run()

  return {
    ok: true,
    tenant: tenant.subdomain,
    reply: result.reply,
    state: result.state,
    action: result.action,
    booking_id: result.booking_id || null,
    reply_sent: sent.ok,
    reply_mode: simulate ? 'simulated' : sent.mode,
    reply_error: (sent as any).error || null,
    duration_ms: Date.now() - t0,
  }
}

// ── Fonnte incoming WA webhook ──────────────────────────────────
webhooks.post('/fonnte', async (c) => {
  // Fonnte bisa kirim form-urlencoded atau JSON
  let body: Record<string, any> = {}
  try {
    const ct = c.req.header('content-type') || ''
    if (ct.includes('application/json')) body = await c.req.json()
    else body = (await c.req.parseBody()) as Record<string, any>
  } catch {
    body = {}
  }

  const incoming = parseFonnteWebhook(body)
  if (!incoming) return c.json({ ok: false, error: 'payload tidak dikenali' }, 400)

  const tenant = await resolveTenant(c, incoming.device)
  if (!tenant) return c.json({ ok: false, error: 'tenant tidak ditemukan' }, 404)

  const out = await handleIncoming(c, tenant, incoming.sender, incoming.message, incoming.name || 'Customer WA', false)
  return c.json(out)
})

// ── Simulator WA (dashboard) — jalankan FSM tanpa kirim WA nyata ─
// POST /webhooks/simulate  { phone, message, name?, tenant? }
webhooks.post('/simulate', async (c) => {
  const b = await c.req.json<any>().catch(() => ({}))
  if (!b.phone || !b.message) return c.json({ ok: false, error: 'phone & message wajib' }, 400)
  const tenant = await resolveTenant(c, undefined, true)
  if (!tenant) return c.json({ ok: false, error: 'tenant tidak ditemukan — sertakan ?tenant=<subdomain> yang valid' }, 404)
  const phone = normalizePhone(String(b.phone))
  const out = await handleIncoming(c, tenant, phone, String(b.message), String(b.name || 'Simulasi'), true)
  return c.json({ ...out, shop_name: tenant.shop_name })
})

// ── WA log — riwayat percakapan (dashboard) ─────────────────────
// GET /webhooks/wa-log?tenant=alfacut&phone=628…&limit=50
webhooks.get('/wa-log', async (c) => {
  const tenant = await resolveTenant(c, undefined, true)
  if (!tenant) return c.json({ ok: false, error: 'tenant tidak ditemukan — sertakan ?tenant=<subdomain> yang valid' }, 404)
  const phone = c.req.query('phone')
  const limit = Math.min(200, parseInt(c.req.query('limit') || '50', 10) || 50)

  const q = phone
    ? c.env.DB.prepare('SELECT * FROM wa_messages WHERE tenant_id=? AND phone=? ORDER BY created_at DESC LIMIT ?')
        .bind(tenant.id, normalizePhone(phone), limit)
    : c.env.DB.prepare('SELECT * FROM wa_messages WHERE tenant_id=? ORDER BY created_at DESC LIMIT ?')
        .bind(tenant.id, limit)
  const { results } = await q.all<any>()
  return c.json({ tenant: tenant.subdomain, messages: (results || []).reverse() })
})

// ── State percakapan aktif (debug/dashboard) ────────────────────
webhooks.get('/conversations', async (c) => {
  const tenant = await resolveTenant(c, undefined, true)
  if (!tenant) return c.json({ ok: false, error: 'tenant tidak ditemukan — sertakan ?tenant=<subdomain> yang valid' }, 404)
  const { results } = await c.env.DB.prepare(
    'SELECT phone,state,context,expires_at,updated_at FROM wa_conversations WHERE tenant_id=? ORDER BY updated_at DESC LIMIT 50'
  ).bind(tenant.id).all<any>()
  return c.json({ tenant: tenant.subdomain, conversations: results || [] })
})

// ── Test helper: kirim WA manual (tenant-scoped via ?tenant=) ───
webhooks.post('/fonnte/test-send', async (c) => {
  const b = await c.req.json<any>().catch(() => ({}))
  if (!b.target || !b.message) return c.json({ error: 'target & message wajib' }, 400)
  const sent = await fonnteSend(c.env, b.target, b.message)
  return c.json(sent)
})

export default webhooks
