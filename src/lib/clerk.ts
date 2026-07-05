// BKF-14 — Clerk.com auth untuk Cloudflare Workers (tanpa SDK Node).
// Verifikasi session JWT Clerk (RS256) via JWKS + Web Crypto (crypto.subtle).
// Kenapa manual: runtime Workers tak punya Node API; JWKS verify cukup ringkas,
// dan menghindari dependency berat. Truth-Lock: tanpa CLERK_SECRET_KEY → auth
// dinonaktifkan secara eksplisit (stub mode, jujur di /api/v1/auth/config).

import type { Bindings } from '../types'

export interface ClerkClaims {
  sub: string          // clerk user id (user_xxx)
  iss: string          // https://<instance>.clerk.accounts.dev
  exp: number
  nbf?: number
  iat?: number
  sid?: string         // session id
  azp?: string
  email?: string       // hanya ada bila custom claim di-set di Clerk dashboard
  [k: string]: unknown
}

export function clerkIssuer(env: Bindings): string {
  return (env.CLERK_ISSUER || '').replace(/\/$/, '')
}

export function isClerkConfigured(env: Bindings): boolean {
  return Boolean(env.CLERK_SECRET_KEY && clerkIssuer(env))
}

// ── base64url helpers ────────────────────────────────────────────
function b64urlToBytes(s: string): Uint8Array {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (s.length % 4)) % 4)
  const bin = atob(b64)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}
function b64urlToJson<T>(s: string): T | null {
  try {
    return JSON.parse(new TextDecoder().decode(b64urlToBytes(s))) as T
  } catch {
    return null
  }
}

// ── JWKS cache (module-level, hidup selama isolate hangat) ──────
let jwksCache: { issuer: string; keys: JsonWebKey[]; fetchedAt: number } | null = null
const JWKS_TTL_MS = 60 * 60 * 1000 // 1 jam

async function getJwks(issuer: string): Promise<JsonWebKey[]> {
  if (jwksCache && jwksCache.issuer === issuer && Date.now() - jwksCache.fetchedAt < JWKS_TTL_MS) {
    return jwksCache.keys
  }
  const res = await fetch(`${issuer}/.well-known/jwks.json`)
  if (!res.ok) throw new Error(`JWKS fetch gagal: ${res.status}`)
  const body = await res.json<{ keys: JsonWebKey[] }>()
  jwksCache = { issuer, keys: body.keys || [], fetchedAt: Date.now() }
  return jwksCache.keys
}

// ── Verifikasi JWT session Clerk ─────────────────────────────────
// Return claims bila valid; null bila token invalid/expired/salah issuer.
export async function verifyClerkJwt(token: string, env: Bindings): Promise<ClerkClaims | null> {
  const parts = token.split('.')
  if (parts.length !== 3) return null

  const header = b64urlToJson<{ alg: string; kid?: string; typ?: string }>(parts[0])
  const claims = b64urlToJson<ClerkClaims>(parts[1])
  if (!header || !claims) return null
  if (header.alg !== 'RS256') return null

  const issuer = clerkIssuer(env)
  if (!issuer || claims.iss !== issuer) return null

  const nowSec = Math.floor(Date.now() / 1000)
  const skew = 60 // toleransi clock skew 60 dtk
  if (typeof claims.exp !== 'number' || claims.exp + skew < nowSec) return null
  if (typeof claims.nbf === 'number' && claims.nbf - skew > nowSec) return null

  let keys: JsonWebKey[]
  try {
    keys = await getJwks(issuer)
  } catch {
    return null
  }
  const jwk = keys.find((k: any) => !header.kid || k.kid === header.kid) as JsonWebKey | undefined
  if (!jwk) return null

  try {
    const key = await crypto.subtle.importKey(
      'jwk',
      jwk,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['verify']
    )
    const data = new TextEncoder().encode(`${parts[0]}.${parts[1]}`)
    const sig = b64urlToBytes(parts[2])
    const ok = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, sig as unknown as BufferSource, data)
    return ok ? claims : null
  } catch {
    return null
  }
}

// ── Ambil email + nama user dari Clerk Backend API ───────────────
// Dipakai saat login pertama (backfill clerk_user_id → row users by email).
export async function fetchClerkUserProfile(
  clerkUserId: string,
  env: Bindings
): Promise<{ email: string | null; name: string | null }> {
  if (!env.CLERK_SECRET_KEY) return { email: null, name: null }
  const res = await fetch(`https://api.clerk.com/v1/users/${encodeURIComponent(clerkUserId)}`, {
    headers: { Authorization: `Bearer ${env.CLERK_SECRET_KEY}` },
  })
  if (!res.ok) return { email: null, name: null }
  const u = await res.json<any>()
  const primary =
    (u.email_addresses || []).find((e: any) => e.id === u.primary_email_address_id) ||
    (u.email_addresses || [])[0]
  const name = [u.first_name, u.last_name].filter(Boolean).join(' ') || u.username || null
  return { email: primary?.email_address?.toLowerCase() || null, name }
}
