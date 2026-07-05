// BarberKas AaaS — R4: Retain & Expand layer (BKF-08).
// Langganan (Care Plan / AI Staff) + reminder engine + upsell high-ticket.
// Truth-Lock: state nyata di D1; reminder & upsell = rule-based deterministik (0 token).
// Selaras B5-03 (retain→expand), skus.ts = sumber kebenaran harga.

import { Hono } from 'hono'
import type { Bindings, TenantContext, AuthUser } from '../types'
import { uid, now, rupiah } from '../lib/d1'
import { SKUS, findSKU } from '../data/skus'
import { isClerkConfigured } from '../lib/clerk'

type Env = { Bindings: Bindings; Variables: { tenant: TenantContext; authUser: AuthUser | null } }
const subs = new Hono<Env>()

const DAY = 86_400_000 // ms/hari
const MONTH = 30 * DAY

// resolve tenant_id opsional (query/header) tanpa memaksa middleware — langganan boleh lintas-prospek.
function tenantId(c: any): string | null {
  return c.req.query('tenant') || c.req.header('x-tenant') || null
}

// ── BKF-16: scope tenant yang DITEGAKKAN (bukan sekadar dipercaya dari query) ──
// tenantParamGuard (index.tsx) sudah memastikan non-admin → ?tenant= == miliknya.
// Helper ini melengkapi: (a) non-admin SELALU di-scope ke tenant miliknya sendiri,
// apa pun isi body/query; (b) verifikasi ownership row per-id. Auth off → dev terbuka.
function scope(c: any): { tid: string | null; enforced: boolean } {
  const enabled = isClerkConfigured(c.env) || Boolean(c.env.DEV_AUTH_BYPASS_EMAIL)
  const user = c.get('authUser') as AuthUser | null
  if (enabled && user && user.role !== 'admin') {
    // non-admin: kunci ke subdomain miliknya (tenant_id di tabel subscriptions = subdomain)
    return { tid: user.tenant_subdomain, enforced: true }
  }
  return { tid: tenantId(c), enforced: false }
}

// ownership check row langganan/upsell utk non-admin (403 jujur bila bukan miliknya)
function ownsRow(sc: { tid: string | null; enforced: boolean }, rowTenantId: string | null): boolean {
  if (!sc.enforced) return true
  return Boolean(rowTenantId && sc.tid && rowTenantId === sc.tid)
}

// Upsell ladder (expand path kanonik B5-03): retain → expand high-ticket.
// next-best-action deterministik berdasar SKU langganan saat ini.
const UPSELL_LADDER: Record<string, { to: string; reason: string }> = {
  'sub-starter': { to: 'sub-pro', reason: 'Sudah catat transaksi rapi → aktifkan 3 AI Staff (resepsionis+marketing+insight) untuk retensi & omzet.' },
  'care-plan': { to: 'sub-pro', reason: 'App terjaga (Care Plan) → tambah 3 AI Staff agar app aktif menjual, bukan sekadar jalan.' },
  'sub-pro': { to: 'ai-staff-addon', reason: '3 AI Staff produktif → tambah staf AI (CS/Marketing/Admin) sesuai beban shop.' },
  'ai-staff-addon': { to: 'sub-enterprise', reason: 'Sudah scaling staf AI → naik Enterprise: 9 agent + analitik multi-outlet.' },
  'sub-enterprise': { to: 'app-custom-chain', reason: 'Multi-outlet aktif → App Custom / AI Company in a Box (high-ticket DFY).' },
}

// ── Plans: SKU langganan saja (retain), untuk dropdown subscribe ────
subs.get('/plans', (c) => {
  const plans = SKUS.filter((s) => s.billing === 'subscription').map((s) => ({
    slug: s.slug,
    name: s.name,
    promise: s.promise,
    price_cents: s.price_cents,
    price_fmt: (s.price_from ? 'mulai ' : '') + rupiah(s.price_cents) + '/bln',
    value_metric: s.value_metric,
    proof: s.proof,
    business_role: s.business_role,
  }))
  return c.json({ plans })
})

// ── POST /subscribe — aktifkan langganan dari SKU subscription ──────
subs.post('/subscribe', async (c) => {
  const b = await c.req.json<any>().catch(() => ({}))
  const sku = findSKU(b.sku_slug)
  if (!sku) return c.json({ error: 'sku_slug tidak valid' }, 400)
  if (sku.billing !== 'subscription') return c.json({ error: 'SKU ini bukan langganan (gunakan /checkout one-time)' }, 400)

  const t = now()
  const qty = Math.max(1, parseInt(b.qty || '1', 10) || 1)
  const id = uid('sub_')
  // BKF-16: non-admin TIDAK bisa menanam langganan atas nama tenant lain via body
  const sc = scope(c)
  const tid = sc.enforced ? sc.tid : (b.tenant_id || tenantId(c))
  const nextCharge = t + MONTH

  await c.env.DB.prepare(
    `INSERT INTO subscriptions (id,tenant_id,order_id,sku_slug,sku_name,tier,amount_cents,currency,billing_cycle,status,qty,started_at,current_period_start,next_charge_at,created_at,updated_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
  ).bind(
    id, tid, b.order_id || null, sku.slug, sku.name, sku.tier,
    sku.price_cents, 'IDR', 'monthly', 'active', qty, t, t, nextCharge, t, t
  ).run()

  // Auto-jadwal reminder onboarding (H+0) + renewal (H-3 sebelum next_charge).
  await c.env.DB.prepare(
    `INSERT INTO reminders (id,tenant_id,subscription_id,kind,channel,due_at,message,status,created_at,updated_at)
     VALUES (?,?,?,?,?,?,?,?,?,?)`
  ).bind(uid('rm_'), tid, id, 'onboarding', 'whatsapp', t,
    `Selamat datang di ${sku.name}! Langgananmu aktif. Balas pesan ini bila butuh bantuan setup.`,
    'scheduled', t, t).run()
  await c.env.DB.prepare(
    `INSERT INTO reminders (id,tenant_id,subscription_id,kind,channel,due_at,message,status,created_at,updated_at)
     VALUES (?,?,?,?,?,?,?,?,?,?)`
  ).bind(uid('rm_'), tid, id, 'renewal', 'whatsapp', nextCharge - 3 * DAY,
    `Pengingat: langganan ${sku.name} (${rupiah(sku.price_cents)}/bln) jatuh tempo dalam 3 hari. Pastikan saldo/metode bayar siap.`,
    'scheduled', t, t).run()

  return c.json({
    subscription_id: id,
    sku: sku.name,
    amount_fmt: rupiah(sku.price_cents * qty) + '/bln',
    status: 'active',
    next_charge_at: nextCharge,
    reminders_scheduled: ['onboarding', 'renewal (H-3)'],
  }, 201)
})

// ── GET / — daftar langganan (+ MRR ringkas) ───────────────────────
subs.get('/', async (c) => {
  const { tid } = scope(c)
  const q = tid
    ? c.env.DB.prepare('SELECT * FROM subscriptions WHERE tenant_id=? ORDER BY created_at DESC').bind(tid)
    : c.env.DB.prepare('SELECT * FROM subscriptions ORDER BY created_at DESC LIMIT 50')
  const { results } = await q.all<any>()
  const mrr = (results || [])
    .filter((s) => s.status === 'active')
    .reduce((sum, s) => sum + s.amount_cents * (s.qty || 1), 0)
  return c.json({
    subscriptions: (results || []).map((s) => ({
      ...s,
      amount_fmt: rupiah(s.amount_cents * (s.qty || 1)) + '/bln',
    })),
    mrr_cents: mrr,
    mrr_fmt: rupiah(mrr) + '/bln',
  })
})

// ── POST /:id/cancel — churn (Truth-Lock: catat alasan) ────────────
subs.post('/:id/cancel', async (c) => {
  const id = c.req.param('id')
  const b = await c.req.json<any>().catch(() => ({}))
  const sub = await c.env.DB.prepare('SELECT * FROM subscriptions WHERE id=?').bind(id).first<any>()
  if (!sub) return c.json({ error: 'subscription tidak ditemukan' }, 404)
  // BKF-16: ownership — non-admin hanya boleh cancel langganan tenant miliknya
  const sc = scope(c)
  if (!ownsRow(sc, sub.tenant_id)) {
    return c.json({ error: 'forbidden', message: 'Langganan ini bukan milik tenant-mu.' }, 403)
  }
  if (sub.status === 'cancelled') return c.json({ error: 'sudah cancelled (idempotent)' }, 409)

  const t = now()
  await c.env.DB.prepare('UPDATE subscriptions SET status=?, cancelled_at=?, cancel_reason=?, updated_at=? WHERE id=?')
    .bind('cancelled', t, b.reason || 'tidak disebutkan', t, id).run()

  // batalkan reminder terjadwal + buat winback (H+7).
  await c.env.DB.prepare("UPDATE reminders SET status='cancelled', updated_at=? WHERE subscription_id=? AND status='scheduled'")
    .bind(t, id).run()
  await c.env.DB.prepare(
    `INSERT INTO reminders (id,tenant_id,subscription_id,kind,channel,due_at,message,status,created_at,updated_at)
     VALUES (?,?,?,?,?,?,?,?,?,?)`
  ).bind(uid('rm_'), sub.tenant_id, id, 'winback', 'whatsapp', t + 7 * DAY,
    `Kami simpan datamu. Aktifkan lagi ${sub.sku_name} kapan saja — barbershop-mu tetap siap jalan.`,
    'scheduled', t, t).run()

  return c.json({ subscription_id: id, status: 'cancelled', winback_scheduled: true })
})

// ── GET /reminders — daftar reminder (filter status/due) ───────────
subs.get('/reminders', async (c) => {
  const status = c.req.query('status')
  // BKF-16: scope reminder per-tenant (non-admin tidak lihat reminder tenant lain)
  const { tid } = scope(c)
  let sql = 'SELECT * FROM reminders WHERE 1=1'
  const binds: any[] = []
  if (tid) { sql += ' AND tenant_id=?'; binds.push(tid) }
  if (status) { sql += ' AND status=?'; binds.push(status) }
  sql += ' ORDER BY due_at ASC LIMIT 100'
  const { results } = await c.env.DB.prepare(sql).bind(...binds).all<any>()
  const t = now()
  const due_now = (results || []).filter((r) => r.status === 'scheduled' && r.due_at <= t).length
  return c.json({ reminders: results || [], due_now })
})

// ── POST /reminders/run — engine: tandai reminder jatuh tempo "sent" ─
// Deterministik. Pengiriman WA nyata via Fonnte dilakukan terpisah (lib/fonnte).
subs.post('/reminders/run', async (c) => {
  const t = now()
  // BKF-16: non-admin hanya memproses reminder tenant miliknya sendiri
  const { tid } = scope(c)
  const { results } = await (tid
    ? c.env.DB.prepare("SELECT * FROM reminders WHERE status='scheduled' AND due_at<=? AND tenant_id=? ORDER BY due_at ASC LIMIT 100").bind(t, tid)
    : c.env.DB.prepare("SELECT * FROM reminders WHERE status='scheduled' AND due_at<=? ORDER BY due_at ASC LIMIT 100").bind(t)
  ).all<any>()
  let sent = 0
  for (const r of results || []) {
    await c.env.DB.prepare('UPDATE reminders SET status=?, sent_at=?, updated_at=? WHERE id=?')
      .bind('sent', t, t, r.id).run()
    sent++
  }
  return c.json({ processed: sent, note: 'reminder due ditandai sent (pengiriman WA nyata via Fonnte terpisah — Truth-Lock).' })
})

// ── GET /upsell — rekomendasi expand high-ticket (next-best-action) ─
// Berbasis langganan aktif → ladder deterministik. Idempotent: tidak duplikat suggested.
subs.get('/upsell', async (c) => {
  const { tid } = scope(c)
  const q = tid
    ? c.env.DB.prepare("SELECT * FROM subscriptions WHERE tenant_id=? AND status='active' ORDER BY amount_cents DESC").bind(tid)
    : c.env.DB.prepare("SELECT * FROM subscriptions WHERE status='active' ORDER BY amount_cents DESC LIMIT 50")
  const { results: active } = await q.all<any>()

  const suggestions: any[] = []
  for (const s of active || []) {
    const step = UPSELL_LADDER[s.sku_slug]
    if (!step) continue
    const toSku = findSKU(step.to)
    if (!toSku) continue
    const delta = Math.max(0, toSku.price_cents - s.amount_cents)
    // idempotent: cek apakah sudah ada suggested utk pasangan ini
    const existing = await c.env.DB.prepare(
      "SELECT id FROM upsell_events WHERE subscription_id=? AND to_sku=? AND status='suggested'"
    ).bind(s.id, toSku.slug).first<any>()
    let upid = existing?.id
    if (!existing) {
      upid = uid('up_')
      const t = now()
      await c.env.DB.prepare(
        `INSERT INTO upsell_events (id,tenant_id,subscription_id,from_sku,to_sku,reason,delta_cents,status,created_at,updated_at)
         VALUES (?,?,?,?,?,?,?,?,?,?)`
      ).bind(upid, s.tenant_id, s.id, s.sku_slug, toSku.slug, step.reason, delta, 'suggested', t, t).run()
    }
    suggestions.push({
      upsell_id: upid,
      subscription_id: s.id,
      from_sku: s.sku_slug,
      to_sku: toSku.slug,
      to_name: toSku.name,
      reason: step.reason,
      delta_fmt: (toSku.price_from ? 'mulai ' : '') + rupiah(toSku.price_cents) + (toSku.billing === 'subscription' ? '/bln' : ''),
      tier: toSku.tier,
    })
  }
  return c.json({ upsell: suggestions, note: 'next-best-action deterministik (ladder retain→expand). Truth-Lock: bukan klaim, hanya rekomendasi.' })
})

// ── POST /upsell/:id/respond — catat accept/decline (expand telemetry) ─
subs.post('/upsell/:id/respond', async (c) => {
  const id = c.req.param('id')
  const b = await c.req.json<any>().catch(() => ({}))
  const decision = (b.decision || '').toLowerCase()
  if (!['accepted', 'declined'].includes(decision)) {
    return c.json({ error: "decision wajib 'accepted' atau 'declined'" }, 400)
  }
  const ev = await c.env.DB.prepare('SELECT * FROM upsell_events WHERE id=?').bind(id).first<any>()
  if (!ev) return c.json({ error: 'upsell event tidak ditemukan' }, 404)
  // BKF-16: ownership — non-admin hanya boleh respond upsell tenant miliknya
  const sc = scope(c)
  if (!ownsRow(sc, ev.tenant_id)) {
    return c.json({ error: 'forbidden', message: 'Upsell event ini bukan milik tenant-mu.' }, 403)
  }

  const t = now()
  await c.env.DB.prepare('UPDATE upsell_events SET status=?, responded_at=?, updated_at=? WHERE id=?')
    .bind(decision, t, t, id).run()

  // bila accepted → arahkan ke checkout (one-time high-ticket = intake; subscription = /subscribe).
  const toSku = findSKU(ev.to_sku)
  const next = decision === 'accepted'
    ? (toSku?.billing === 'subscription'
        ? { action: 'subscribe', sku_slug: ev.to_sku }
        : { action: toSku?.checkout === 'intake' ? 'intake' : 'checkout', sku_slug: ev.to_sku })
    : null
  return c.json({ upsell_id: id, decision, next })
})

// ── GET /telemetry — MRR, active, churn, upsell-accept, reminders due ─
subs.get('/telemetry', async (c) => {
  // BKF-16: telemetry di-scope per-tenant utk non-admin (tanpa scope → angka global, admin/dev only)
  const { tid } = scope(c)
  const W = tid ? ' WHERE tenant_id=?' : ''
  const sAgg = await (tid
    ? c.env.DB.prepare(`SELECT COUNT(*) total, SUM(CASE WHEN status='active' THEN 1 ELSE 0 END) active, SUM(CASE WHEN status='cancelled' THEN 1 ELSE 0 END) cancelled, COALESCE(SUM(CASE WHEN status='active' THEN amount_cents*qty ELSE 0 END),0) mrr_cents FROM subscriptions${W}`).bind(tid)
    : c.env.DB.prepare(`SELECT COUNT(*) total, SUM(CASE WHEN status='active' THEN 1 ELSE 0 END) active, SUM(CASE WHEN status='cancelled' THEN 1 ELSE 0 END) cancelled, COALESCE(SUM(CASE WHEN status='active' THEN amount_cents*qty ELSE 0 END),0) mrr_cents FROM subscriptions`)
  ).first<any>()
  const uAgg = await (tid
    ? c.env.DB.prepare(`SELECT COUNT(*) total, SUM(CASE WHEN status='accepted' THEN 1 ELSE 0 END) accepted, SUM(CASE WHEN status='declined' THEN 1 ELSE 0 END) declined FROM upsell_events${W}`).bind(tid)
    : c.env.DB.prepare(`SELECT COUNT(*) total, SUM(CASE WHEN status='accepted' THEN 1 ELSE 0 END) accepted, SUM(CASE WHEN status='declined' THEN 1 ELSE 0 END) declined FROM upsell_events`)
  ).first<any>()
  const t = now()
  const rDue = await (tid
    ? c.env.DB.prepare("SELECT COUNT(*) due FROM reminders WHERE status='scheduled' AND due_at<=? AND tenant_id=?").bind(t, tid)
    : c.env.DB.prepare("SELECT COUNT(*) due FROM reminders WHERE status='scheduled' AND due_at<=?").bind(t)
  ).first<any>()

  const total = sAgg.total || 0
  const churnRate = total ? Math.round((sAgg.cancelled / total) * 100) : 0
  const upResponded = (uAgg.accepted || 0) + (uAgg.declined || 0)
  const acceptRate = upResponded ? Math.round((uAgg.accepted / upResponded) * 100) : 0

  return c.json({
    subscriptions_total: total,
    subscriptions_active: sAgg.active || 0,
    subscriptions_cancelled: sAgg.cancelled || 0,
    churn_rate_pct: churnRate,
    mrr_cents: sAgg.mrr_cents || 0,
    mrr_fmt: rupiah(sAgg.mrr_cents || 0) + '/bln',
    arr_fmt: rupiah((sAgg.mrr_cents || 0) * 12) + '/thn',
    upsell_total: uAgg.total || 0,
    upsell_accepted: uAgg.accepted || 0,
    upsell_accept_rate_pct: acceptRate,
    reminders_due: rDue.due || 0,
  })
})

export default subs
