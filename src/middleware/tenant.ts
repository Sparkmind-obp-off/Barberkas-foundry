// Tenant resolution middleware.
// Resolves tenant from subdomain (<tenant>.barberkas.sparkmind.web.id)
// or, in dev/sandbox, from ?tenant= query / x-tenant header / cookie.
// Falls back to demo tenant "alfacut" so the app is explorable locally.

import type { Context, Next } from 'hono'
import type { Bindings, Tenant, TenantContext } from '../types'

const DEMO_SUBDOMAIN = 'alfacut'

function extractSubdomain(c: Context): string {
  // 1) explicit override (dev + tenant switcher)
  const q = c.req.query('tenant')
  if (q) return q
  const h = c.req.header('x-tenant')
  if (h) return h

  // 2) subdomain parsing
  const host = (c.req.header('host') || '').split(':')[0]
  // pattern: <tenant>.barberkas.sparkmind.web.id
  const m = host.match(/^([a-z0-9-]+)\.barberkas\./i)
  if (m) return m[1].toLowerCase()

  // 3) local/dev fallback
  return DEMO_SUBDOMAIN
}

export async function tenantMiddleware(
  c: Context<{ Bindings: Bindings; Variables: { tenant: TenantContext } }>,
  next: Next
) {
  const subdomain = extractSubdomain(c)
  const row = await c.env.DB.prepare(
    'SELECT * FROM tenants WHERE subdomain = ?'
  )
    .bind(subdomain)
    .first<Tenant>()

  if (!row) {
    return c.json(
      { error: 'tenant_not_found', message: `Barbershop "${subdomain}" belum terdaftar.` },
      404
    )
  }

  c.set('tenant', {
    tenant_id: row.id,
    subdomain: row.subdomain,
    tier: row.tier,
    shop_name: row.shop_name,
    request_id: crypto.randomUUID(),
  })

  await next()
}
