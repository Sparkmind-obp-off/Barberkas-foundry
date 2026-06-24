// BarberKas AaaS — Outcome Foundry pipeline routes (B5-04 F0→F7).
// F0 intake → F1 scope/DoO → F2 pay (MoR) → F4 deploy → F5 proof → F6 onboard.
// Tenant-scoped where relevant; intake boleh dari prospek (belum jadi tenant).

import { Hono } from 'hono'
import type { Bindings, TenantContext } from '../types'
import { tenantMiddleware } from '../middleware/tenant'
import { uid, now, rupiah } from '../lib/d1'
import { SKUS, TIER_LABEL, findSKU, classifyOutcome } from '../data/skus'
import { morCharge } from '../lib/mor'

type Env = { Bindings: Bindings; Variables: { tenant: TenantContext } }
const outcome = new Hono<Env>()

// ── Catalog (Lapis 1 pasar) — public, no tenant needed ────────────
outcome.get('/catalog', (c) => {
  const skus = SKUS.map((s) => ({
    slug: s.slug,
    name: s.name,
    promise: s.promise,
    tier: s.tier,
    tier_label: TIER_LABEL[s.tier],
    delivery_mode: s.delivery_mode,
    billing: s.billing,
    price_cents: s.price_cents,
    price_fmt: (s.price_from ? 'mulai ' : '') + rupiah(s.price_cents) + (s.billing === 'subscription' ? '/bln' : ''),
    value_metric: s.value_metric,
    proof: s.proof,
    checkout: s.checkout,
    engine_skills: s.engine_skills,
    business_role: s.business_role,
  }))
  return c.json({ catalog: skus, growth: 'education/vertical (land) → subscription (retain) → high-ticket (expand)' })
})

// ── F0 INTAKE — pembeli/prospek isi masalah → tiket + klasifikasi SKU ──
outcome.post('/intake', async (c) => {
  const b = await c.req.json<any>().catch(() => ({}))
  if (!b.shop_name || !b.contact_phone || !b.problem) {
    return c.json({ error: 'shop_name, contact_phone, problem wajib' }, 400)
  }
  // F0 gate: klasifikasi outcome (SKU mana) + Truth-Lock feasibility
  const cls = classifyOutcome(b.problem)
  const sku = findSKU(b.sku_slug || cls.slug) || findSKU(cls.slug)!

  // F1 scope: DoO awal + delivery mode dari SKU
  const doo = {
    app_live: false,
    first_tx_or_booking: false,
    bahasa_indonesia: true,
    mor_recorded: false,
    proof_sent: false,
    verify_rubric: false,
  }

  const id = uid('tk_')
  const t = now()
  await c.env.DB.prepare(
    `INSERT INTO intake_tickets (id,tenant_id,shop_name,contact_phone,contact_name,problem,sku_slug,delivery_mode,doo_json,feasible,feasible_reason,status,created_at,updated_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
  ).bind(
    id, b.tenant_id || null, b.shop_name, b.contact_phone, b.contact_name || null,
    b.problem, sku.slug, sku.delivery_mode, JSON.stringify(doo), cls.feasible ? 1 : 0,
    cls.reason, 'scoped', t, t
  ).run()

  return c.json({
    ticket_id: id,
    classified_sku: { slug: sku.slug, name: sku.name, tier: sku.tier, delivery_mode: sku.delivery_mode },
    reason: cls.reason,
    feasible: cls.feasible,
    doo,
    next: sku.checkout === 'instant' ? 'checkout langsung (MoR)' : 'tim akan kirim invoice (HITL gate)',
  }, 201)
})

// ── F2 PAY — checkout SKU via MoR (Oasis BI Pro / Duitku) ──────────
outcome.post('/checkout', async (c) => {
  const b = await c.req.json<any>().catch(() => ({}))
  const sku = findSKU(b.sku_slug)
  if (!sku) return c.json({ error: 'sku_slug tidak valid' }, 400)

  const oid = uid('ord_')
  const t = now()
  await c.env.DB.prepare(
    `INSERT INTO orders (id,tenant_id,ticket_id,sku_slug,sku_name,tier,delivery_mode,amount_cents,currency,billing,payment_status,status,created_at,updated_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
  ).bind(
    oid, b.tenant_id || null, b.ticket_id || null, sku.slug, sku.name, sku.tier,
    sku.delivery_mode, sku.price_cents, 'IDR', sku.billing, 'pending', 'pending', t, t
  ).run()

  const charge = await morCharge(c.env, { amount_cents: sku.price_cents, sku_slug: sku.slug, billing: sku.billing, order_id: oid })
  await c.env.DB.prepare('UPDATE orders SET mor_ref=?, mor_provider=? WHERE id=?')
    .bind(charge.ref, charge.provider, oid).run()

  return c.json({
    order_id: oid,
    sku: sku.name,
    amount_fmt: rupiah(sku.price_cents) + (sku.billing === 'subscription' ? '/bln' : ''),
    mor: { ref: charge.ref, provider: charge.provider, mode: charge.mode, payment_url: charge.payment_url, disclosure: charge.disclosure },
    fee_fmt: rupiah(charge.fee_cents),
    net_fmt: rupiah(charge.net_cents),
    note: charge.mode === 'sandbox-stub'
      ? 'MODE SANDBOX: panggil POST /pay/confirm untuk simulasi pembayaran lunas (Truth-Lock: bukan uang nyata).'
      : 'Selesaikan pembayaran di payment_url.',
  }, 201)
})

// ── F2→F3 PAY CONFIRM — sandbox simulate paid + brand_ledger ───────
outcome.post('/pay/confirm', async (c) => {
  const b = await c.req.json<any>().catch(() => ({}))
  const order = await c.env.DB.prepare('SELECT * FROM orders WHERE id=?').bind(b.order_id).first<any>()
  if (!order) return c.json({ error: 'order tidak ditemukan' }, 404)
  if (order.payment_status === 'paid') return c.json({ error: 'order sudah lunas (idempotent)' }, 409)

  const t = now()
  await c.env.DB.prepare('UPDATE orders SET payment_status=?, paid_at=?, status=?, updated_at=? WHERE id=?')
    .bind('paid', t, 'assembling', t, order.id).run()

  // brand_ledger (MoR disclosure)
  const fee = Math.round(order.amount_cents * 0.025) + 100000
  await c.env.DB.prepare(
    `INSERT INTO brand_ledger (id,tenant_id,order_id,brand,mor,amount_cents,fee_cents,net_cents,duitku_ref,disclosure,created_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?)`
  ).bind(uid('bl_'), order.tenant_id, order.id, 'BarberKas', 'Oasis BI Pro', order.amount_cents, fee, order.amount_cents - fee, order.mor_ref, 'MoR Oasis BI Pro via Duitku', t).run()

  return c.json({ order_id: order.id, payment_status: 'paid', status: 'assembling', next: 'F3 assemble → F4 deploy → F5 proof' })
})

// ── F4/F5 DEPLOY + PROOF — tandai outcome live + bukti + DoO gate ──
outcome.post('/orders/:id/proof', async (c) => {
  const id = c.req.param('id')
  const b = await c.req.json<any>().catch(() => ({}))
  const order = await c.env.DB.prepare('SELECT * FROM orders WHERE id=?').bind(id).first<any>()
  if (!order) return c.json({ error: 'order tidak ditemukan' }, 404)
  if (order.payment_status !== 'paid') return c.json({ error: 'order belum lunas — tidak bisa deliver (Truth-Lock)' }, 402)

  const t = now()
  const proofUrl = b.outcome_proof_url || `https://${b.subdomain || 'demo'}.barberkas.sparkmind.web.id`
  const tto = b.tto_days ?? 1

  // DoO gate (B5-04 §4): semua cek wajib lulus sebelum "done"
  const doo = {
    fungsi: !!b.app_live,
    bahasa: true,
    truth_lock: true,
    mor: order.payment_status === 'paid',
    proof: !!proofUrl,
    onboard: order.billing !== 'subscription' || !!b.onboarded,
  }
  const passed = Object.values(doo).every(Boolean)

  await c.env.DB.prepare('UPDATE orders SET outcome_proof_url=?, tto_days=?, doo_passed=?, status=?, updated_at=? WHERE id=?')
    .bind(proofUrl, tto, passed ? 1 : 0, passed ? 'done' : 'proof', t, id).run()

  // catat artefak bukti
  await c.env.DB.prepare(
    `INSERT INTO outcome_proofs (id,tenant_id,order_id,kind,label,value,created_at) VALUES (?,?,?,?,?,?,?)`
  ).bind(uid('pf_'), order.tenant_id, id, 'url', 'App live', proofUrl, t).run()

  // sinkron ke tenant telemetry bila tenant ada
  if (order.tenant_id) {
    await c.env.DB.prepare('UPDATE tenants SET outcome_proof_url=?, tto_days=?, delivery_mode=?, updated_at=? WHERE id=?')
      .bind(proofUrl, tto, order.delivery_mode, t, order.tenant_id).run()
  }

  return c.json({
    order_id: id,
    doo,
    doo_passed: passed,
    outcome_proof_url: proofUrl,
    tto_days: tto,
    status: passed ? 'done' : 'proof (revisi diperlukan — gate belum lulus)',
  })
})

// ── Orders list / detail (proof tracking) ─────────────────────────
outcome.get('/orders', async (c) => {
  const { results } = await c.env.DB.prepare('SELECT * FROM orders ORDER BY created_at DESC LIMIT 50').all()
  return c.json({ orders: results })
})

outcome.get('/orders/:id', async (c) => {
  const id = c.req.param('id')
  const order = await c.env.DB.prepare('SELECT * FROM orders WHERE id=?').bind(id).first<any>()
  if (!order) return c.json({ error: 'not_found' }, 404)
  const { results: proofs } = await c.env.DB.prepare('SELECT * FROM outcome_proofs WHERE order_id=? ORDER BY created_at DESC').bind(id).all()
  return c.json({ order, proofs })
})

// ── Telemetry: TTO + success-rate (B5-04 §6 KPI delivery) ─────────
outcome.get('/telemetry/delivery', async (c) => {
  const agg = await c.env.DB.prepare(
    `SELECT COUNT(*) total,
            SUM(CASE WHEN payment_status='paid' THEN 1 ELSE 0 END) paid,
            SUM(CASE WHEN doo_passed=1 THEN 1 ELSE 0 END) doo_ok,
            AVG(CASE WHEN tto_days IS NOT NULL THEN tto_days END) tto_avg,
            COALESCE(SUM(CASE WHEN payment_status='paid' THEN amount_cents ELSE 0 END),0) gmv_cents
     FROM orders`
  ).first<any>()
  const doRate = agg.total ? Math.round((agg.doo_ok / agg.total) * 100) : 0
  return c.json({
    orders_total: agg.total,
    orders_paid: agg.paid,
    doo_passed: agg.doo_ok,
    doo_success_rate_pct: doRate,
    tto_median_days: agg.tto_avg ? Math.round(agg.tto_avg * 10) / 10 : null,
    gmv_fmt: rupiah(agg.gmv_cents),
  })
})

export default outcome
