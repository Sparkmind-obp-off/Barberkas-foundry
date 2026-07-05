// BKF-14 — Auth routes (Clerk.com).
//   GET  /api/v1/auth/config — public: status auth + publishable key (frontend init Clerk JS)
//   GET  /api/v1/auth/me     — user login saat ini + tenant mapping
//   POST /api/v1/auth/map    — (admin only) map email → tenant (operator BarberKas)
//   GET  /api/v1/auth/users  — (admin only) daftar user + mapping

import { Hono } from 'hono'
import type { Bindings, AuthUser } from '../types'
import { isClerkConfigured, clerkIssuer } from '../lib/clerk'
import { authMiddleware } from '../middleware/auth'
import { uid, now } from '../lib/d1'

type Env = { Bindings: Bindings; Variables: { authUser: AuthUser | null } }
const auth = new Hono<Env>()

// public — frontend perlu tahu: auth aktif? publishable key apa?
auth.get('/config', (c) => {
  const enabled = isClerkConfigured(c.env)
  return c.json({
    enabled,
    dev_bypass: Boolean(c.env.DEV_AUTH_BYPASS_EMAIL),
    publishable_key: c.env.CLERK_PUBLISHABLE_KEY || null,
    issuer: enabled ? clerkIssuer(c.env) : null,
    note: enabled
      ? 'Auth Clerk AKTIF — endpoint tenant-scoped butuh Bearer token.'
      : 'Auth Clerk BELUM dikonfigurasi — mode dev terbuka (set CLERK_SECRET_KEY + CLERK_ISSUER + CLERK_PUBLISHABLE_KEY).',
  })
})

auth.use('/me', authMiddleware)
auth.get('/me', (c) => {
  const u = c.get('authUser')
  if (!u) return c.json({ authenticated: false, note: 'Auth belum aktif (Clerk belum dikonfigurasi).' })
  return c.json({ authenticated: true, user: u })
})

// admin-only helpers — operator BarberKas map email → tenant
auth.use('/map', authMiddleware)
auth.post('/map', async (c) => {
  const u = c.get('authUser')
  if (isClerkConfigured(c.env) || c.env.DEV_AUTH_BYPASS_EMAIL) {
    if (!u || u.role !== 'admin') return c.json({ error: 'forbidden', message: 'Hanya admin (operator BarberKas).' }, 403)
  }
  const b = await c.req.json<any>().catch(() => ({}))
  const email = String(b.email || '').trim().toLowerCase()
  const tenantSub = String(b.tenant || '').trim().toLowerCase()
  const role = ['owner', 'staff', 'admin'].includes(b.role) ? b.role : 'owner'
  if (!email || !tenantSub) return c.json({ error: 'email & tenant wajib' }, 400)

  const tenant = await c.env.DB.prepare('SELECT id, subdomain, shop_name FROM tenants WHERE subdomain=?').bind(tenantSub).first<any>()
  if (!tenant) return c.json({ error: `tenant "${tenantSub}" tidak ditemukan` }, 404)

  const existing = await c.env.DB.prepare('SELECT id FROM users WHERE email=? COLLATE NOCASE').bind(email).first<any>()
  if (existing) {
    await c.env.DB.prepare('UPDATE users SET tenant_id=?, role=?, updated_at=? WHERE id=?')
      .bind(tenant.id, role, now(), existing.id).run()
  } else {
    await c.env.DB.prepare(
      'INSERT INTO users (id,clerk_user_id,email,name,tenant_id,role,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?)'
    ).bind(uid('usr_'), null, email, null, tenant.id, role, now(), now()).run()
  }
  return c.json({ ok: true, email, tenant: tenant.subdomain, shop_name: tenant.shop_name, role })
})

auth.use('/users', authMiddleware)
auth.get('/users', async (c) => {
  const u = c.get('authUser')
  if (isClerkConfigured(c.env) || c.env.DEV_AUTH_BYPASS_EMAIL) {
    if (!u || u.role !== 'admin') return c.json({ error: 'forbidden', message: 'Hanya admin.' }, 403)
  }
  const { results } = await c.env.DB.prepare(
    `SELECT u.id, u.email, u.name, u.role, u.clerk_user_id, t.subdomain AS tenant, t.shop_name
     FROM users u LEFT JOIN tenants t ON t.id=u.tenant_id ORDER BY u.created_at ASC LIMIT 200`
  ).all<any>()
  return c.json({ users: results || [] })
})

export default auth
