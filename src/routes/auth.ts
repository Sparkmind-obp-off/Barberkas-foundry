// BKF-14 — Auth routes (Clerk.com).
//   GET  /api/v1/auth/config  — public: status auth + publishable key (frontend init Clerk JS)
//   GET  /api/v1/auth/me      — user login saat ini + tenant mapping
//   POST /api/v1/auth/map     — (admin only) map email → tenant (operator BarberKas)
//   GET  /api/v1/auth/users   — (admin only) daftar user + mapping
// BKF-16 — Self-service tenant onboarding (tanpa SQL migration manual):
//   POST /api/v1/auth/tenants — (admin only) buat tenant baru + seed layanan default + map owner
//   GET  /api/v1/auth/tenants — (admin only) daftar tenant + owner mapping

import { Hono } from 'hono'
import type { Bindings, AuthUser } from '../types'
import { isClerkConfigured, clerkIssuer } from '../lib/clerk'
import { authMiddleware, requireAdmin } from '../middleware/auth'
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
// BUGFIX (BKF-17 audit server-side gating): dulu cek admin inline (duplikat logika,
// rawan drift/kelupaan di endpoint baru). Sekarang SEMUA endpoint admin lewat
// middleware requireAdmin yang sama → satu sumber kebenaran. Role diambil dari
// DB via Clerk JWT terverifikasi server (bukan dari data kiriman client).
auth.use('/map', authMiddleware, requireAdmin)
auth.post('/map', async (c) => {
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

auth.use('/users', authMiddleware, requireAdmin)
auth.get('/users', async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT u.id, u.email, u.name, u.role, u.clerk_user_id, t.subdomain AS tenant, t.shop_name
     FROM users u LEFT JOIN tenants t ON t.id=u.tenant_id ORDER BY u.created_at ASC LIMIT 200`
  ).all<any>()
  return c.json({ users: results || [] })
})

// ── BKF-16: Self-service tenant onboarding (admin only) ───────────────
// Mengganti pola lama "tiap customer baru = tulis migration SQL manual".
// 1 request → tenant + layanan default + capster + mapping owner email. Idempotent
// by subdomain (409 bila sudah ada). Truth-Lock: tanpa data transaksi fiktif.

const SUBDOMAIN_RE = /^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/
const RESERVED = new Set(['www', 'api', 'app', 'admin', 'dashboard', 'static', 'webhooks', 'auth'])

const DEFAULT_SERVICES: Array<{ name: string; price_cents: number; duration_min: number }> = [
  { name: 'Men Haircut', price_cents: 4000000, duration_min: 45 },
  { name: 'Kids Haircut', price_cents: 3000000, duration_min: 30 },
  { name: 'Beard Trimming', price_cents: 2000000, duration_min: 15 },
  { name: 'Shaving', price_cents: 2500000, duration_min: 20 },
  { name: 'Hair Wash + Cut', price_cents: 5000000, duration_min: 60 },
]

auth.use('/tenants', authMiddleware, requireAdmin)

auth.post('/tenants', async (c) => {
  const b = await c.req.json<any>().catch(() => ({}))
  const subdomain = String(b.subdomain || '').trim().toLowerCase()
  const shopName = String(b.shop_name || '').trim()
  const ownerPhone = String(b.owner_phone || '').trim().replace(/[^0-9]/g, '')
  const ownerEmail = String(b.owner_email || '').trim().toLowerCase() || null
  const tier = ['free', 'starter', 'pro', 'enterprise'].includes(b.tier) ? b.tier : 'starter'

  if (!subdomain || !shopName || !ownerPhone) {
    return c.json({ error: 'subdomain, shop_name, owner_phone wajib' }, 400)
  }
  if (!SUBDOMAIN_RE.test(subdomain) || RESERVED.has(subdomain)) {
    return c.json({ error: `subdomain "${subdomain}" tidak valid — huruf kecil/angka/dash, 3-30 char, bukan kata reserved.` }, 400)
  }

  const dup = await c.env.DB.prepare('SELECT id FROM tenants WHERE subdomain=?').bind(subdomain).first<any>()
  if (dup) return c.json({ error: `tenant "${subdomain}" sudah ada (idempotent — tidak menimpa).` }, 409)

  const t = now()
  const tenantId = 't_' + subdomain
  const trialDays = Math.max(0, parseInt(b.trial_days ?? '14', 10) || 14)
  const trialEnds = trialDays > 0 ? t + trialDays * 86_400_000 : null

  await c.env.DB.prepare(
    `INSERT INTO tenants (id,subdomain,shop_name,owner_phone,owner_email,tier,status,trial_ends_at,delivery_mode,created_at,updated_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?)`
  ).bind(tenantId, subdomain, shopName, ownerPhone, ownerEmail, tier, trialDays > 0 ? 'trial' : 'active', trialEnds, b.delivery_mode || 'dwy', t, t).run()

  // Seed layanan default (owner bisa edit belakangan) — skip bila b.seed_services===false
  let servicesSeeded = 0
  if (b.seed_services !== false) {
    for (const s of DEFAULT_SERVICES) {
      await c.env.DB.prepare(
        'INSERT INTO services (id,tenant_id,name,price_cents,duration_min,active) VALUES (?,?,?,?,?,1)'
      ).bind(uid('s_'), tenantId, s.name, s.price_cents, s.duration_min).run()
      servicesSeeded++
    }
  }

  // Capsters awal (opsional: array nama)
  let capstersSeeded = 0
  const capsters: string[] = Array.isArray(b.capsters) ? b.capsters.filter((x: any) => typeof x === 'string' && x.trim()) : []
  for (const name of capsters.slice(0, 10)) {
    await c.env.DB.prepare(
      'INSERT INTO capsters (id,tenant_id,name,phone,commission_pct,active,created_at) VALUES (?,?,?,NULL,50.0,1,?)'
    ).bind(uid('c_'), tenantId, name.trim(), t).run()
    capstersSeeded++
  }

  // Map owner email → tenant (biar owner langsung bisa login Google & masuk dashboard-nya)
  let ownerMapped = false
  if (ownerEmail) {
    const existing = await c.env.DB.prepare('SELECT id FROM users WHERE email=? COLLATE NOCASE').bind(ownerEmail).first<any>()
    if (existing) {
      await c.env.DB.prepare('UPDATE users SET tenant_id=?, role=?, updated_at=? WHERE id=?')
        .bind(tenantId, 'owner', t, existing.id).run()
    } else {
      await c.env.DB.prepare(
        'INSERT INTO users (id,clerk_user_id,email,name,tenant_id,role,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?)'
      ).bind(uid('usr_'), null, ownerEmail, null, tenantId, 'owner', t, t).run()
    }
    ownerMapped = true
  }

  return c.json({
    ok: true,
    tenant: { id: tenantId, subdomain, shop_name: shopName, tier, status: trialDays > 0 ? 'trial' : 'active', trial_ends_at: trialEnds },
    services_seeded: servicesSeeded,
    capsters_seeded: capstersSeeded,
    owner_mapped: ownerMapped ? ownerEmail : null,
    dashboard_url: `/app?tenant=${subdomain}`,
    next: ownerMapped
      ? `Owner login Google dengan ${ownerEmail} → otomatis terkunci ke tenant "${subdomain}".`
      : 'Map owner email via POST /api/v1/auth/map agar owner bisa login.',
  }, 201)
})

auth.get('/tenants', async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT t.id, t.subdomain, t.shop_name, t.owner_phone, t.owner_email, t.tier, t.status, t.trial_ends_at, t.created_at,
            (SELECT COUNT(*) FROM users u WHERE u.tenant_id=t.id) AS users_mapped,
            (SELECT COUNT(*) FROM services s WHERE s.tenant_id=t.id AND s.active=1) AS services,
            (SELECT COUNT(*) FROM capsters cp WHERE cp.tenant_id=t.id AND cp.active=1) AS capsters,
            (SELECT COUNT(*) FROM transactions tx WHERE tx.tenant_id=t.id) AS transactions
     FROM tenants t ORDER BY t.created_at ASC LIMIT 200`
  ).all<any>()
  return c.json({ tenants: results || [] })
})

export default auth
