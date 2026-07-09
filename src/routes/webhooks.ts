// BarberKas AaaS — Inbound webhooks (Fonnte WA).
// /webhooks/fonnte : AI Resepsionis v2 (BKF-13) — FSM multi-turn:
//   cek slot kosong per-capster real-time → konfirmasi booking otomatis →
//   reschedule/batal tanpa admin → auto-jadwal reminder H-1.
// Truth-Lock: balasan WA nyata hanya terkirim bila FONNTE_TOKEN set (else stub).
//
// Tenant resolution:
//   /webhooks/fonnte (BKF-19): HANYA via tenant_wa_devices (device penerima → tenant),
//     + verifikasi ?secret= + idempotency inboxid. TANPA fallback.
//   Endpoint dashboard (simulate/wa-log/…): resolveTenant strict ?tenant= (BKF-18).

import { Hono } from 'hono'
import type { Bindings, Tenant } from '../types'
import { uid, now } from '../lib/d1'
import { parseFonnteWebhook, fonnteSend, normalizePhone, timingSafeEqual } from '../lib/fonnte'
import { runReceptionist } from '../agents/receptionist'
import { isClerkConfigured } from '../lib/clerk'
import { logSecurityEvent } from '../lib/audit'

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
  // BKF-18 (audit WRITE): fallback "tenant pertama" HANYA di mode dev (auth off).
  // Di production (Clerk aktif), payload webhook yang tenant-nya tak teridentifikasi
  // TIDAK boleh diam-diam nulis customer/booking ke tenant #1 → 404 jujur + audit log.
  if (isClerkConfigured(c.env)) {
    await logSecurityEvent(c.env, {
      user: null, requested_tenant: q || deviceOrQuery || null, actual_tenant: null,
      endpoint: new URL(c.req.url).pathname, method: c.req.method,
      action: 'denied_403', reason: 'webhook fonnte: tenant tak teridentifikasi — fallback tenant pertama DIBLOKIR (production)',
    })
    return null
  }
  // dev fallback — tenant pertama (hanya jalur Fonnte device, bukan simulator, auth off)
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

  // log pesan keluar — BKF-21: simpan juga error Fonnte + sanitize_level supaya
  // kegagalan outbound TERLIHAT alasannya di DB (bukan cuma status 'failed' buta)
  await c.env.DB.prepare(
    'INSERT INTO wa_messages (id,tenant_id,direction,phone,body,agent_type,status,fonnte_id,error,sanitize_level,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)'
  ).bind(uid('wa_'), tenant.id, 'out', phone, result.reply, 'receptionist',
    simulate ? 'simulated' : sent.ok ? 'sent' : sent.mode === 'stub' ? 'stub' : 'failed',
    (sent as any).id || null, (sent as any).error || (sent as any).detail || null,
    (sent as any).sanitize_level ?? null, now()).run()

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
// BKF-19: hardened public surface —
// 1) Verifikasi shared secret ?secret= (Fonnte tak punya HMAC — secret di URL
//    webhook adalah praktik standar; constant-time compare, gagal → 403+audit).
// 2) Tenant HANYA dari tenant_wa_devices via nomor device PENERIMA (payload
//    field `device` = nomor WA milik kita, dikontrol via dashboard Fonnte) —
//    device tak terdaftar → 404+audit, TANPA fallback (pelajaran Bug 2/BKF-18).
// 3) Idempotency: inboxid Fonnte (else hash payload) → UNIQUE di
//    wa_webhook_events; retry Fonnte tidak memproses FSM 2x (anti booking dobel).
// 4) FSM: reuse handleIncoming → runReceptionist — fungsi yang SAMA dengan simulator.
async function eventKeyFromPayload(inc: { device?: string; sender: string; message: string; inboxid?: string; timestamp?: string }): Promise<string> {
  if (inc.inboxid) return `inbox:${inc.inboxid}`
  const raw = `${inc.device || ''}|${inc.sender}|${inc.message}|${inc.timestamp || ''}`
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw))
  return 'hash:' + [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

webhooks.post('/fonnte', async (c) => {
  const endpoint = '/webhooks/fonnte'

  // (1) verifikasi shared secret — wajib bila FONNTE_WEBHOOK_SECRET di-set.
  // Tanpa secret ter-set: hanya boleh lolos di mode dev (Clerk off); di
  // production tanpa secret → tolak (fail-closed, jangan buka surface polos).
  const cfgSecret = c.env.FONNTE_WEBHOOK_SECRET
  const gotSecret = c.req.query('secret') || ''
  if (cfgSecret) {
    if (!timingSafeEqual(gotSecret, cfgSecret)) {
      await logSecurityEvent(c.env, {
        user: null, requested_tenant: null, actual_tenant: null,
        endpoint, method: 'POST', action: 'denied_403',
        reason: 'webhook fonnte: secret salah/kosong — kemungkinan fake webhook',
      })
      return c.json({ ok: false, error: 'unauthorized' }, 403)
    }
  } else if (isClerkConfigured(c.env)) {
    await logSecurityEvent(c.env, {
      user: null, requested_tenant: null, actual_tenant: null,
      endpoint, method: 'POST', action: 'denied_403',
      reason: 'webhook fonnte: FONNTE_WEBHOOK_SECRET belum di-set di production — fail-closed',
    })
    return c.json({ ok: false, error: 'webhook belum dikonfigurasi' }, 403)
  }

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

  // (2) tenant dari device PENERIMA — satu-satunya jalur, tanpa fallback.
  if (!incoming.device) {
    await logSecurityEvent(c.env, {
      user: null, requested_tenant: null, actual_tenant: null,
      endpoint, method: 'POST', action: 'denied_403',
      reason: `webhook fonnte: payload tanpa field device (sender=${incoming.sender})`,
    })
    return c.json({ ok: false, error: 'device tidak ada di payload' }, 400)
  }
  const dev = await c.env.DB.prepare(
    'SELECT t.* FROM tenant_wa_devices d JOIN tenants t ON t.id=d.tenant_id WHERE d.device_phone=? AND d.active=1'
  ).bind(incoming.device).first<any>()
  if (!dev) {
    await logSecurityEvent(c.env, {
      user: null, requested_tenant: incoming.device, actual_tenant: null,
      endpoint, method: 'POST', action: 'denied_403',
      reason: `webhook fonnte: device ${incoming.device} tidak terdaftar/nonaktif di tenant_wa_devices — ditolak tanpa fallback`,
    })
    return c.json({ ok: false, error: 'device tidak terdaftar' }, 404)
  }
  const tenant = dev as Tenant

  // (3) idempotency — INSERT event_key UNIQUE; duplikat → 200 OK tanpa proses
  // ulang (200 supaya Fonnte berhenti retry; FSM & booking tidak jalan 2x).
  const eventKey = await eventKeyFromPayload(incoming)
  try {
    await c.env.DB.prepare(
      'INSERT INTO wa_webhook_events (event_key,tenant_id,device_phone,sender,created_at) VALUES (?,?,?,?,?)'
    ).bind(eventKey, tenant.id, incoming.device, incoming.sender, now()).run()
  } catch {
    return c.json({ ok: true, duplicate: true, detail: 'event sudah diproses sebelumnya (retry Fonnte di-skip)' })
  }

  // (4) FSM yang sama dengan simulator + balas via Fonnte send API
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
// BKF-18: wajib resolve tenant valid (strict) + pesan keluar DICATAT ke
// wa_messages tenant ybs — supaya kiriman manual punya jejak audit, tidak
// "lepas" tanpa tenant. Gerbang auth+tenantParamGuard sudah dipasang di index.
webhooks.post('/fonnte/test-send', async (c) => {
  const b = await c.req.json<any>().catch(() => ({}))
  if (!b.target || !b.message) return c.json({ error: 'target & message wajib' }, 400)
  const tenant = await resolveTenant(c, undefined, true)
  if (!tenant) return c.json({ ok: false, error: 'tenant tidak ditemukan — sertakan ?tenant=<subdomain> yang valid' }, 404)
  const sent = await fonnteSend(c.env, b.target, b.message)
  await c.env.DB.prepare(
    'INSERT INTO wa_messages (id,tenant_id,direction,phone,body,agent_type,status,fonnte_id,error,sanitize_level,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)'
  ).bind(uid('wa_'), tenant.id, 'out', normalizePhone(String(b.target)), String(b.message), 'manual',
    sent.ok ? 'sent' : (sent as any).mode === 'stub' ? 'stub' : 'failed', (sent as any).id || null,
    (sent as any).error || null, (sent as any).sanitize_level ?? null, now()).run()
  return c.json({ ...sent, tenant: tenant.subdomain })
})

export default webhooks
