// BKF-14 — Auth middleware (Clerk.com) + tenant access guard.
//
// Kebijakan (sesuai review: "cukup login sebagai X, cuma liat data X"):
//   • Bila CLERK_SECRET_KEY + CLERK_ISSUER di-set → endpoint tenant-scoped WAJIB
//     Bearer token Clerk yang valid. User di-map ke tenant via tabel `users`
//     (email → tenant_id, migration 0007). Role admin = boleh lintas tenant.
//   • Bila Clerk BELUM dikonfigurasi → auth OFF (mode dev terbuka) dan status
//     jujur diumumkan lewat GET /api/v1/auth/config (Truth-Lock, tanpa pura-pura).
//   • DEV_AUTH_BYPASS_EMAIL (hanya .dev.vars lokal) → bypass utk test E2E lokal.
//
// Jalur yang TETAP public: /webhooks/fonnte (inbound WA), landing, solutions,
// proof, outcome intake/catalog (prospek belum punya akun).

import type { Context, Next } from 'hono'
import type { Bindings, AuthUser, TenantContext } from '../types'
import { verifyClerkJwt, fetchClerkUserProfile, isClerkConfigured } from '../lib/clerk'
import { uid, now } from '../lib/d1'

type AuthEnv = { Bindings: Bindings; Variables: { authUser: AuthUser | null; tenant?: TenantContext } }

function adminEmails(env: Bindings): string[] {
  return (env.ADMIN_EMAILS || '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean)
}

async function loadUserByEmail(db: D1Database, email: string): Promise<any | null> {
  return db.prepare(
    `SELECT u.*, t.subdomain AS tenant_subdomain FROM users u
     LEFT JOIN tenants t ON t.id = u.tenant_id WHERE u.email = ? COLLATE NOCASE`
  ).bind(email).first<any>()
}

async function loadUserByClerkId(db: D1Database, clerkId: string): Promise<any | null> {
  return db.prepare(
    `SELECT u.*, t.subdomain AS tenant_subdomain FROM users u
     LEFT JOIN tenants t ON t.id = u.tenant_id WHERE u.clerk_user_id = ?`
  ).bind(clerkId).first<any>()
}

function toAuthUser(row: any): AuthUser {
  return {
    id: row.id,
    clerk_user_id: row.clerk_user_id || null,
    email: row.email,
    name: row.name || null,
    tenant_id: row.tenant_id || null,
    tenant_subdomain: row.tenant_subdomain || null,
    role: row.role || 'owner',
  }
}

// Resolve user dari Bearer token Clerk. Auto-provision row users saat login
// pertama: backfill clerk_user_id ke row email yang sudah di-map operator,
// atau buat row baru (tenant_id NULL → belum boleh akses tenant manapun).
async function resolveAuthUser(c: Context<AuthEnv>): Promise<AuthUser | null> {
  const env = c.env

  // Dev bypass (lokal only — JANGAN set di production)
  if (env.DEV_AUTH_BYPASS_EMAIL) {
    const email = env.DEV_AUTH_BYPASS_EMAIL.toLowerCase()
    let row = await loadUserByEmail(env.DB, email)
    if (!row) {
      const id = uid('usr_')
      const role = adminEmails(env).includes(email) ? 'admin' : 'owner'
      await env.DB.prepare(
        'INSERT INTO users (id,clerk_user_id,email,name,tenant_id,role,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?)'
      ).bind(id, null, email, 'Dev Bypass', null, role, now(), now()).run()
      row = await loadUserByEmail(env.DB, email)
    }
    return row ? toAuthUser(row) : null
  }

  const authz = c.req.header('authorization') || ''
  const token = authz.startsWith('Bearer ') ? authz.slice(7) : null
  if (!token) return null

  const claims = await verifyClerkJwt(token, env)
  if (!claims) return null

  // 1) sudah pernah login → row by clerk_user_id
  let row = await loadUserByClerkId(env.DB, claims.sub)
  if (row) return toAuthUser(row)

  // 2) login pertama → cari by email (custom claim atau Backend API), backfill clerk_user_id
  let email = typeof claims.email === 'string' ? claims.email.toLowerCase() : null
  let name: string | null = null
  if (!email) {
    const prof = await fetchClerkUserProfile(claims.sub, env)
    email = prof.email
    name = prof.name
  }
  if (!email) return null

  row = await loadUserByEmail(env.DB, email)
  if (row) {
    await env.DB.prepare('UPDATE users SET clerk_user_id=?, name=COALESCE(?,name), updated_at=? WHERE id=?')
      .bind(claims.sub, name, now(), row.id).run()
    row.clerk_user_id = claims.sub
    return toAuthUser(row)
  }

  // 3) user baru sama sekali → buat row tanpa tenant (admin bila di ADMIN_EMAILS).
  // Bootstrap: bila ADMIN_EMAILS kosong DAN belum ada admin sama sekali →
  // user pertama yang login otomatis admin (biar bisa map email→tenant via /auth/map).
  const id = uid('usr_')
  let role: string = adminEmails(env).includes(email) ? 'admin' : 'owner'
  if (role !== 'admin' && adminEmails(env).length === 0) {
    const anyAdmin = await env.DB.prepare("SELECT id FROM users WHERE role='admin' LIMIT 1").first<any>()
    if (!anyAdmin) role = 'admin'
  }
  await env.DB.prepare(
    'INSERT INTO users (id,clerk_user_id,email,name,tenant_id,role,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?)'
  ).bind(id, claims.sub, email, name, null, role, now(), now()).run()
  const fresh = await loadUserByClerkId(env.DB, claims.sub)
  return fresh ? toAuthUser(fresh) : null
}

// ── authMiddleware — pasang c.var.authUser; 401 bila Clerk aktif tapi token invalid ──
export async function authMiddleware(c: Context<AuthEnv>, next: Next) {
  const enabled = isClerkConfigured(c.env) || Boolean(c.env.DEV_AUTH_BYPASS_EMAIL)
  if (!enabled) {
    // Clerk belum dikonfigurasi → mode dev terbuka (jujur via /auth/config)
    c.set('authUser', null)
    return next()
  }
  const user = await resolveAuthUser(c)
  if (!user) {
    return c.json({ error: 'unauthorized', message: 'Login diperlukan — sertakan Bearer token Clerk yang valid.' }, 401)
  }
  c.set('authUser', user)
  await next()
}

// ── tenantParamGuard — untuk route yang resolve tenant sendiri via ?tenant= ──
// (retention, subscriptions, simulator WA). Non-admin: WAJIB ?tenant= milik
// sendiri; admin bebas. Auth off → tidak menggerbang (mode dev).
export async function tenantParamGuard(c: Context<AuthEnv>, next: Next) {
  const enabled = isClerkConfigured(c.env) || Boolean(c.env.DEV_AUTH_BYPASS_EMAIL)
  if (!enabled) return next()

  const user = c.get('authUser')
  if (!user) return c.json({ error: 'unauthorized', message: 'Login diperlukan.' }, 401)
  if (user.role === 'admin') return next()

  const q = (c.req.query('tenant') || c.req.header('x-tenant') || '').toLowerCase()
  if (!user.tenant_subdomain) {
    return c.json({ error: 'forbidden', message: `Akun ${user.email} belum di-map ke barbershop manapun — hubungi operator BarberKas.` }, 403)
  }
  if (!q || q !== user.tenant_subdomain) {
    return c.json({ error: 'forbidden', message: `Akun ${user.email} hanya boleh mengakses tenant "${user.tenant_subdomain}".` }, 403)
  }
  await next()
}

// ── requireAdmin — endpoint operator BarberKas (lintas tenant) ──
// BKF-16: gerbang endpoint global (orders list/detail, proof, telemetry
// delivery, onboarding tenant). Auth off → mode dev terbuka (jujur via
// /auth/config). WAJIB dipasang SETELAH authMiddleware.
export async function requireAdmin(c: Context<AuthEnv>, next: Next) {
  const enabled = isClerkConfigured(c.env) || Boolean(c.env.DEV_AUTH_BYPASS_EMAIL)
  if (!enabled) return next() // auth off → dev terbuka

  const user = c.get('authUser')
  if (!user) return c.json({ error: 'unauthorized', message: 'Login diperlukan.' }, 401)
  if (user.role !== 'admin') {
    return c.json({ error: 'forbidden', message: 'Hanya admin (operator BarberKas).' }, 403)
  }
  await next()
}

// ── requireTenantAccess — dipasang SETELAH tenantMiddleware ─────
// admin → bebas lintas tenant; owner/staff → hanya tenant miliknya.
export async function requireTenantAccess(c: Context<AuthEnv>, next: Next) {
  const enabled = isClerkConfigured(c.env) || Boolean(c.env.DEV_AUTH_BYPASS_EMAIL)
  if (!enabled) return next() // auth off → tidak menggerbang (mode dev)

  const user = c.get('authUser')
  const tenant = c.get('tenant')
  if (!user) return c.json({ error: 'unauthorized', message: 'Login diperlukan.' }, 401)
  if (user.role === 'admin') return next()
  if (!tenant || user.tenant_id !== tenant.tenant_id) {
    return c.json({
      error: 'forbidden',
      message: `Akun ${user.email} tidak punya akses ke tenant ini.` +
        (user.tenant_subdomain ? ` Kamu ter-map ke "${user.tenant_subdomain}".` : ' Akun belum di-map ke barbershop manapun — hubungi operator BarberKas.'),
    }, 403)
  }
  await next()
}
