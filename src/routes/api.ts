// BarberKas AaaS — API v1 routes. All tenant-scoped.
import { Hono } from 'hono'
import type { Bindings, TenantContext, AuthUser } from '../types'
import { tenantMiddleware } from '../middleware/tenant'
import { authMiddleware, requireTenantAccess } from '../middleware/auth'
import { uid, now, parseIds, rupiah } from '../lib/d1'
import { AGENT_REGISTRY, dispatchAgent } from '../agents'

type Env = { Bindings: Bindings; Variables: { tenant: TenantContext; authUser: AuthUser | null } }

const api = new Hono<Env>()
// BKF-14 — urutan penting: auth (siapa kamu) → tenant (toko mana) → guard (boleh?)
api.use('*', authMiddleware as any)
api.use('*', tenantMiddleware)
api.use('*', requireTenantAccess as any)

// ── Tenant context / DoO status ───────────────────────────────
api.get('/me', (c) => {
  const t = c.get('tenant')
  return c.json({ tenant: t })
})

// Dashboard summary — proof-of-outcome numbers
api.get('/dashboard', async (c) => {
  const t = c.get('tenant')
  const tid = t.tenant_id
  const dayStart = now() - 24 * 3600 * 1000

  const txToday = await c.env.DB.prepare(
    'SELECT COUNT(*) n, COALESCE(SUM(total_cents),0) sum FROM transactions WHERE tenant_id=? AND created_at>=?'
  ).bind(tid, dayStart).first<any>()
  const txAll = await c.env.DB.prepare(
    'SELECT COUNT(*) n, COALESCE(SUM(total_cents),0) sum FROM transactions WHERE tenant_id=?'
  ).bind(tid).first<any>()
  const bookingsPending = await c.env.DB.prepare(
    "SELECT COUNT(*) n FROM bookings WHERE tenant_id=? AND status IN ('pending','confirmed')"
  ).bind(tid).first<any>()
  const custCount = await c.env.DB.prepare('SELECT COUNT(*) n FROM customers WHERE tenant_id=?').bind(tid).first<any>()
  const agentCalls = await c.env.DB.prepare('SELECT COUNT(*) n FROM agent_calls WHERE tenant_id=?').bind(tid).first<any>()

  return c.json({
    shop_name: t.shop_name,
    tier: t.tier,
    today: { tx_count: txToday.n, revenue_cents: txToday.sum, revenue_fmt: rupiah(txToday.sum) },
    total: { tx_count: txAll.n, revenue_cents: txAll.sum, revenue_fmt: rupiah(txAll.sum) },
    bookings_open: bookingsPending.n,
    customers: custCount.n,
    agent_calls: agentCalls.n,
  })
})

// ── Services ──────────────────────────────────────────────────
api.get('/services', async (c) => {
  const t = c.get('tenant')
  const { results } = await c.env.DB.prepare('SELECT * FROM services WHERE tenant_id=? AND active=1').bind(t.tenant_id).all()
  return c.json({ services: results })
})

// ── Capsters ──────────────────────────────────────────────────
api.get('/capsters', async (c) => {
  const t = c.get('tenant')
  const { results } = await c.env.DB.prepare('SELECT * FROM capsters WHERE tenant_id=? AND active=1').bind(t.tenant_id).all()
  return c.json({ capsters: results })
})

// ── Customers ─────────────────────────────────────────────────
api.get('/customers', async (c) => {
  const t = c.get('tenant')
  const { results } = await c.env.DB.prepare('SELECT * FROM customers WHERE tenant_id=? ORDER BY last_visit_at DESC').bind(t.tenant_id).all()
  return c.json({ customers: results })
})

// ── Transactions ──────────────────────────────────────────────
api.get('/transactions', async (c) => {
  const t = c.get('tenant')
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM transactions WHERE tenant_id=? ORDER BY created_at DESC LIMIT 50'
  ).bind(t.tenant_id).all()
  return c.json({ transactions: results })
})

api.post('/transactions', async (c) => {
  const t = c.get('tenant')
  const body = await c.req.json<any>()
  const serviceIds: string[] = body.service_ids || []
  if (!body.capster_id || serviceIds.length === 0) {
    return c.json({ error: 'capster_id & service_ids wajib' }, 400)
  }
  // BKF-18 (audit WRITE): referensi lintas tenant di body TIDAK boleh lolos.
  // capster_id WAJIB milik tenant sesi — kalau tidak → 400 jujur (bukan nanam
  // transaksi yang menunjuk capster tenant lain).
  const cap = await c.env.DB.prepare('SELECT id FROM capsters WHERE id=? AND tenant_id=?')
    .bind(body.capster_id, t.tenant_id).first()
  if (!cap) return c.json({ error: 'capster_id tidak ditemukan di barbershop ini' }, 400)
  // customer_id (opsional) juga wajib milik tenant sesi bila diisi.
  if (body.customer_id) {
    const cust = await c.env.DB.prepare('SELECT id FROM customers WHERE id=? AND tenant_id=?')
      .bind(body.customer_id, t.tenant_id).first()
    if (!cust) return c.json({ error: 'customer_id tidak ditemukan di barbershop ini' }, 400)
  }
  // compute total from services (query sudah di-scope tenant_id)
  const placeholders = serviceIds.map(() => '?').join(',')
  const { results } = await c.env.DB.prepare(
    `SELECT id, price_cents FROM services WHERE tenant_id=? AND id IN (${placeholders})`
  ).bind(t.tenant_id, ...serviceIds).all<any>()
  // service_ids yang bukan milik tenant → tidak ketemu → tolak jujur (jangan diam-diam total 0)
  if (!results || results.length !== serviceIds.length) {
    return c.json({ error: 'ada service_id yang tidak ditemukan di barbershop ini' }, 400)
  }
  const total = results.reduce((s: number, r: any) => s + r.price_cents, 0)

  const id = uid('tx_')
  await c.env.DB.prepare(
    'INSERT INTO transactions (id,tenant_id,customer_id,capster_id,service_ids,total_cents,payment_method,status,created_at) VALUES (?,?,?,?,?,?,?,?,?)'
  ).bind(id, t.tenant_id, body.customer_id || null, body.capster_id, JSON.stringify(serviceIds), total, body.payment_method || 'cash', 'completed', now()).run()

  // update customer aggregates
  if (body.customer_id) {
    await c.env.DB.prepare(
      'UPDATE customers SET total_spent_cents=total_spent_cents+?, visit_count=visit_count+1, last_visit_at=? WHERE id=? AND tenant_id=?'
    ).bind(total, now(), body.customer_id, t.tenant_id).run()
  }

  return c.json({ id, total_cents: total, total_fmt: rupiah(total), status: 'completed' }, 201)
})

// ── Bookings ──────────────────────────────────────────────────
api.get('/bookings', async (c) => {
  const t = c.get('tenant')
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM bookings WHERE tenant_id=? ORDER BY scheduled_at ASC LIMIT 50'
  ).bind(t.tenant_id).all()
  return c.json({ bookings: results })
})

api.post('/bookings/:id/status', async (c) => {
  const t = c.get('tenant')
  const id = c.req.param('id')
  const { status } = await c.req.json<any>()
  const allowed = ['pending', 'confirmed', 'done', 'cancelled', 'noshow']
  if (!allowed.includes(status)) return c.json({ error: 'status tidak valid' }, 400)
  // BKF-18: UPDATE sudah di-scope tenant_id (booking tenant lain = no-op) —
  // cek changes supaya respon jujur 404, bukan pura-pura sukses.
  const res = await c.env.DB.prepare('UPDATE bookings SET status=? WHERE id=? AND tenant_id=?').bind(status, id, t.tenant_id).run()
  if (!res.meta || res.meta.changes === 0) {
    return c.json({ error: 'booking tidak ditemukan di barbershop ini' }, 404)
  }
  return c.json({ id, status })
})

// ── Agents ────────────────────────────────────────────────────
api.get('/agents', (c) => {
  const t = c.get('tenant')
  // mark availability vs tier
  const order = ['free', 'starter', 'pro', 'enterprise']
  const tierIdx = order.indexOf(t.tier)
  const agents = AGENT_REGISTRY.map((a) => ({
    ...a,
    available: a.live && order.indexOf(a.tier_required) <= tierIdx,
  }))
  return c.json({ agents, tier: t.tier })
})

api.post('/agents/:type', async (c) => {
  const t = c.get('tenant')
  const type = c.req.param('type') as any
  // BKF-18: validasi agent type di gerbang — 400 jujur, bukan 500 dari throw.
  // (Jalur WRITE agents (runBooking: customers+bookings) sudah di-scope
  // ctx.tenant_id dari sesi — diaudit aman, referensi lintas tenant tak mungkin.)
  if (!AGENT_REGISTRY.some((a) => a.type === type)) {
    return c.json({ error: 'agent type tidak dikenal' }, 400)
  }
  let input: any = {}
  try { input = await c.req.json() } catch { /* allow empty */ }
  const result = await dispatchAgent(c.env, t, type, input)
  return c.json(result)
})

// recent agent activity (proof feed)
api.get('/agent-calls', async (c) => {
  const t = c.get('tenant')
  const { results } = await c.env.DB.prepare(
    'SELECT id,agent_type,input_summary,output_summary,status,cost_cents,duration_ms,created_at FROM agent_calls WHERE tenant_id=? ORDER BY created_at DESC LIMIT 20'
  ).bind(t.tenant_id).all()
  return c.json({ calls: results })
})

export default api
