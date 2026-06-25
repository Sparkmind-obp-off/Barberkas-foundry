// BarberKas AaaS — Inbound webhooks (Fonnte WA).
// /webhooks/fonnte : Booking Curator REAL — terima WA customer → buat booking →
// balas otomatis via Fonnte. Truth-Lock: balasan hanya terkirim bila FONNTE_TOKEN set.
//
// Tenant resolution (webhook tak punya subdomain):
//   1) ?tenant=<subdomain>  (set di URL webhook Fonnte per-device)
//   2) body.device  → cocokkan tenants.owner_phone
//   3) fallback tenant demo pertama (dev only)

import { Hono } from 'hono'
import type { Bindings, Tenant, TenantContext } from '../types'
import { uid, now } from '../lib/d1'
import { parseFonnteWebhook, fonnteSend, normalizePhone } from '../lib/fonnte'
import { dispatchAgent } from '../agents'

const webhooks = new Hono<{ Bindings: Bindings }>()

async function resolveTenant(c: any, deviceOrQuery?: string): Promise<Tenant | null> {
  const q = c.req.query('tenant')
  if (q) {
    const row = await c.env.DB.prepare('SELECT * FROM tenants WHERE subdomain=?').bind(q).first<Tenant>()
    if (row) return row
  }
  if (deviceOrQuery) {
    const phone = normalizePhone(deviceOrQuery)
    const row = await c.env.DB.prepare('SELECT * FROM tenants WHERE owner_phone=?').bind(phone).first<Tenant>()
    if (row) return row
  }
  // dev fallback — tenant pertama
  return await c.env.DB.prepare('SELECT * FROM tenants ORDER BY created_at ASC LIMIT 1').first<Tenant>()
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

  // log pesan masuk
  await c.env.DB.prepare(
    'INSERT INTO wa_messages (id,tenant_id,direction,phone,body,agent_type,status,fonnte_id,created_at) VALUES (?,?,?,?,?,?,?,?,?)'
  ).bind(uid('wa_'), tenant.id, 'in', incoming.sender, incoming.message, 'booking', 'received', null, now()).run()

  const ctx: TenantContext = {
    tenant_id: tenant.id,
    subdomain: tenant.subdomain,
    tier: tenant.tier,
    shop_name: tenant.shop_name,
    request_id: crypto.randomUUID(),
  }

  // Booking Curator: parse WA → buat booking pending
  const result = await dispatchAgent(c.env, ctx, 'booking', {
    wa_message: incoming.message,
    from_phone: incoming.sender,
    customer_name: incoming.name || 'Customer WA',
  })

  const reply = String((result.output as any)?.confirmation_msg
    || `Halo! Pesanmu sudah kami terima di ${tenant.shop_name}. Kami balas secepatnya ya ✂️`)

  // balas otomatis via Fonnte (Truth-Lock: live hanya bila token set)
  const sent = await fonnteSend(c.env, incoming.sender, reply)

  // log pesan keluar
  await c.env.DB.prepare(
    'INSERT INTO wa_messages (id,tenant_id,direction,phone,body,agent_type,status,fonnte_id,created_at) VALUES (?,?,?,?,?,?,?,?,?)'
  ).bind(uid('wa_'), tenant.id, 'out', incoming.sender, reply, 'booking', sent.ok ? 'sent' : (sent.mode === 'stub' ? 'stub' : 'failed'), sent.id || null, now()).run()

  return c.json({
    ok: true,
    tenant: tenant.subdomain,
    booking: result.output,
    reply_sent: sent.ok,
    reply_mode: sent.mode,
    reply_error: sent.error || null,
  })
})

// ── Test helper: kirim WA manual (tenant-scoped via ?tenant=) ───
webhooks.post('/fonnte/test-send', async (c) => {
  const b = await c.req.json<any>().catch(() => ({}))
  if (!b.target || !b.message) return c.json({ error: 'target & message wajib' }, 400)
  const sent = await fonnteSend(c.env, b.target, b.message)
  return c.json(sent)
})

export default webhooks
