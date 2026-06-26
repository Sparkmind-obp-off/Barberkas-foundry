// BarberKas AaaS — Outcome Foundry pipeline routes (B5-04 F0→F7).
// F0 intake → F1 scope/DoO → F2 pay (MoR) → F4 deploy → F5 proof → F6 onboard.
// Tenant-scoped where relevant; intake boleh dari prospek (belum jadi tenant).

import { Hono } from 'hono'
import type { Bindings, TenantContext } from '../types'
import { tenantMiddleware } from '../middleware/tenant'
import { uid, now, rupiah } from '../lib/d1'
import { SKUS, TIER_LABEL, findSKU, classifyOutcome } from '../data/skus'
import { estimatePrice } from '../data/verticals'
import { CASES } from '../data/cases'
import { morCharge, morFee, DISCLOSURE } from '../lib/mor'
import { duitkuConfig, verifyCallback } from '../lib/duitku'
import { generateReceiptPDF } from '../lib/pdf'

type Env = { Bindings: Bindings; Variables: { tenant: TenantContext } }
const outcome = new Hono<Env>()

// ── Config — beri tahu frontend apakah Duitku Pop live + URL JS ───
outcome.get('/config', (c) => {
  const cfg = duitkuConfig(c.env)
  return c.json({
    payment: cfg
      ? { provider: 'duitku-pop', mode: cfg.env, live: true, pop_js: cfg.popJs }
      : { provider: 'stub', mode: 'sandbox-stub', live: false, pop_js: null },
    mor: 'Oasis BI Pro',
  })
})

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

// ── R3 Kalkulator harga (deterministik, public) — sumber kebenaran harga = skus.ts ──
outcome.get('/price-estimate', (c) => {
  const base_slug = c.req.query('base_slug') || ''
  const ai_staff_count = parseInt(c.req.query('ai_staff_count') || '0', 10) || 0
  const care_plan = ['1', 'true', 'yes'].includes((c.req.query('care_plan') || '').toLowerCase())
  const est = estimatePrice({ base_slug, ai_staff_count, care_plan })
  return c.json(est, est.ok ? 200 : 400)
})

// ── R2 Case-study publik (proof-led, read-only) — Truth-Lock: status pilot|illustration ──
outcome.get('/proofs', (c) => {
  const vertical = c.req.query('vertical') || ''
  const list = (vertical ? CASES.filter((x) => x.vertical_slug === vertical) : CASES).map((x) => ({
    slug: x.slug,
    vertical_slug: x.vertical_slug,
    business: x.business,
    location: x.location,
    status: x.status, // pilot | illustration (jujur)
    headline: x.headline,
    delivery_mode: x.delivery_mode,
    tto_days: x.tto_days,
    sku_slug: x.sku_slug,
  }))
  return c.json({ proofs: list, note: 'status=pilot → bukti pilot nyata; status=illustration → skenario representatif (bukan klaim terverifikasi).' })
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

  // base_url untuk callback/return (origin request)
  const url = new URL(c.req.url)
  const baseUrl = `${url.protocol}//${url.host}`

  const charge = await morCharge(c.env, {
    amount_cents: sku.price_cents,
    sku_slug: sku.slug,
    sku_name: sku.name,
    billing: sku.billing,
    order_id: oid,
    email: b.email,
    phone: b.phone || b.contact_phone,
    shop_name: b.shop_name,
    base_url: baseUrl,
  })

  await c.env.DB.prepare('UPDATE orders SET mor_ref=?, mor_provider=?, status=? WHERE id=?')
    .bind(charge.ref, charge.provider, charge.error ? 'pending' : 'awaiting_payment', oid).run()

  return c.json({
    order_id: oid,
    sku: sku.name,
    amount_fmt: rupiah(sku.price_cents) + (sku.billing === 'subscription' ? '/bln' : ''),
    mor: {
      ref: charge.ref,
      provider: charge.provider,
      mode: charge.mode,
      payment_url: charge.payment_url,
      pop_reference: charge.pop_reference,   // utk Duitku Pop JS checkout.process()
      pop_js: charge.pop_js,
      disclosure: charge.disclosure,
    },
    fee_fmt: rupiah(charge.fee_cents),
    net_fmt: rupiah(charge.net_cents),
    error: charge.error || null,
    note: charge.error
      ? `Gagal membuat invoice Duitku: ${charge.error}`
      : charge.mode === 'sandbox-stub'
        ? 'MODE STUB: panggil POST /pay/confirm untuk simulasi lunas (Truth-Lock: bukan uang nyata).'
        : 'Duitku Pop aktif: gunakan pop_reference + pop_js (checkout.process) atau buka payment_url.',
  }, 201)
})

// ── shared: tandai order lunas + catat brand_ledger (idempotent) ───
async function markOrderPaid(c: any, order: any, source: string): Promise<boolean> {
  if (order.payment_status === 'paid') return false // idempotent
  const t = now()
  await c.env.DB.prepare('UPDATE orders SET payment_status=?, paid_at=?, status=?, updated_at=? WHERE id=?')
    .bind('paid', t, 'assembling', t, order.id).run()

  const fee = morFee(order.amount_cents)
  await c.env.DB.prepare(
    `INSERT INTO brand_ledger (id,tenant_id,order_id,brand,mor,amount_cents,fee_cents,net_cents,duitku_ref,disclosure,created_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?)`
  ).bind(uid('bl_'), order.tenant_id, order.id, 'BarberKas', 'Oasis BI Pro', order.amount_cents, fee, order.amount_cents - fee, order.mor_ref, `MoR Oasis BI Pro via Duitku [${source}]`, t).run()
  return true
}

// ── F2→F3 PAY CONFIRM — STUB-ONLY simulate paid (Truth-Lock guard) ─
// Hanya boleh dipakai bila MoR mode = stub (tanpa kredensial Duitku).
// Bila Duitku live aktif, pembayaran nyata HARUS lewat /duitku/callback.
outcome.post('/pay/confirm', async (c) => {
  const b = await c.req.json<any>().catch(() => ({}))
  const cfg = duitkuConfig(c.env)
  if (cfg) {
    return c.json({
      error: 'Duitku LIVE aktif — simulasi /pay/confirm dinonaktifkan. Selesaikan pembayaran via Pop (callback otomatis).',
      hint: 'gunakan pop_reference (checkout.process) atau payment_url dari /checkout',
    }, 403)
  }
  const order = await c.env.DB.prepare('SELECT * FROM orders WHERE id=?').bind(b.order_id).first<any>()
  if (!order) return c.json({ error: 'order tidak ditemukan' }, 404)
  if (order.payment_status === 'paid') return c.json({ error: 'order sudah lunas (idempotent)' }, 409)

  await markOrderPaid(c, order, 'stub')
  return c.json({ order_id: order.id, payment_status: 'paid', status: 'assembling', next: 'F3 assemble → F4 deploy → F5 proof' })
})

// ── DUITKU CALLBACK (webhook) — server-to-server, sumber kebenaran lunas ──
// Method POST x-www-form-urlencoded; verifikasi signature; idempotent.
outcome.post('/duitku/callback', async (c) => {
  const cfg = duitkuConfig(c.env)
  if (!cfg) return c.text('duitku not configured', 503)

  const form = await c.req.parseBody()
  const merchantCode = String(form.merchantCode || '')
  const amount = String(form.amount || '')
  const merchantOrderId = String(form.merchantOrderId || '')
  const resultCode = String(form.resultCode || '')
  const reference = String(form.reference || '')
  const signature = String(form.signature || '')

  const valid = await verifyCallback(cfg, { merchantCode, amount, merchantOrderId, signature })
  if (!valid) {
    console.log('[duitku/callback] BAD SIGNATURE', { merchantOrderId, reference })
    return c.text('Bad Signature', 400)
  }

  const order = await c.env.DB.prepare('SELECT * FROM orders WHERE id=?').bind(merchantOrderId).first<any>()
  if (!order) {
    console.log('[duitku/callback] order not found', merchantOrderId)
    return c.text('order not found', 404)
  }

  // simpan duitku reference bila berubah
  if (reference && order.mor_ref !== reference) {
    await c.env.DB.prepare('UPDATE orders SET mor_ref=? WHERE id=?').bind(reference, order.id).run()
    order.mor_ref = reference
  }

  if (resultCode === '00') {
    await markOrderPaid(c, order, 'duitku-callback')
    console.log('[duitku/callback] PAID', merchantOrderId, reference)
  } else {
    if (order.payment_status !== 'paid') {
      await c.env.DB.prepare('UPDATE orders SET payment_status=?, updated_at=? WHERE id=?')
        .bind('failed', now(), order.id).run()
    }
    console.log('[duitku/callback] FAILED resultCode=' + resultCode, merchantOrderId)
  }
  // Duitku hanya butuh HTTP 200
  return c.text('OK', 200)
})

// ── DUITKU RETURN URL — redirect customer setelah bayar/cancel ─────
outcome.get('/duitku/return', (c) => {
  const merchantOrderId = c.req.query('merchantOrderId') || ''
  const resultCode = c.req.query('resultCode') || ''
  const reference = c.req.query('reference') || ''
  const ok = resultCode === '00'
  return c.html(`<!DOCTYPE html><html lang="id"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Status Pembayaran — BarberKas</title>
<style>body{font-family:system-ui,sans-serif;background:#0A0F1A;color:#E8EEF7;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}
.card{background:#121A2A;border:1px solid #1F2C42;border-radius:16px;padding:32px;max-width:420px;text-align:center}
.ico{font-size:56px}.t{font-size:22px;font-weight:700;margin:12px 0}.s{color:#8FA3BF;font-size:14px;line-height:1.5}
a{display:inline-block;margin-top:20px;background:#3B82F6;color:#fff;text-decoration:none;padding:12px 24px;border-radius:10px;font-weight:600}</style>
</head><body><div class="card">
<div class="ico">${ok ? '✅' : '⏳'}</div>
<div class="t">${ok ? 'Pembayaran Berhasil' : 'Pembayaran Belum Selesai'}</div>
<p class="s">${ok ? 'Terima kasih! Outcome kamu sedang dirakit (F3→F5). Bukti akan dikirim.' : 'Transaksi belum lunas / dibatalkan. Kamu bisa coba lagi dari dashboard.'}<br><br>
Order: <strong>${merchantOrderId}</strong>${reference ? `<br>Ref Duitku: ${reference}` : ''}</p>
<a href="/app">← Kembali ke Dashboard</a>
</div></body></html>`)
})

// ── Order status (polling utk Pop JS frontend) ────────────────────
outcome.get('/orders/:id/status', async (c) => {
  const order = await c.env.DB.prepare('SELECT id,payment_status,status,doo_passed,outcome_proof_url FROM orders WHERE id=?')
    .bind(c.req.param('id')).first<any>()
  if (!order) return c.json({ error: 'not_found' }, 404)
  return c.json(order)
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

// ── F2.5 FAKTUR PDF — generate receipt → simpan R2 → serve PDF ─────
// GET → unduh PDF. Truth-Lock: faktur hanya untuk order lunas.
outcome.get('/orders/:id/receipt', async (c) => {
  const id = c.req.param('id')
  const order = await c.env.DB.prepare('SELECT * FROM orders WHERE id=?').bind(id).first<any>()
  if (!order) return c.json({ error: 'order tidak ditemukan' }, 404)
  if (order.payment_status !== 'paid') {
    return c.json({ error: 'faktur hanya tersedia untuk order LUNAS (Truth-Lock)' }, 402)
  }

  const fee = morFee(order.amount_cents)
  const net = order.amount_cents - fee
  const pdf = generateReceiptPDF({
    title: 'FAKTUR / RECEIPT',
    brand: 'BarberKas — SparkMind Sovereign',
    order_id: order.id,
    date_str: new Date(order.paid_at || order.created_at).toLocaleString('id-ID'),
    shop_name: order.sku_name,
    lines: [
      { label: 'Produk (SKU)', value: order.sku_name },
      { label: 'Tier', value: String(order.tier).toUpperCase() },
      { label: 'Billing', value: order.billing },
      { label: 'Ref Pembayaran', value: order.mor_ref || '-' },
      { label: 'Biaya MoR', value: rupiah(fee) },
      { label: 'Net Merchant', value: rupiah(net) },
    ],
    total_str: rupiah(order.amount_cents),
    footer: DISCLOSURE,
  })

  // simpan ke R2 bila binding tersedia (idempotent by key)
  const r2key = `receipts/${order.id}.pdf`
  if (c.env.R2) {
    try {
      await c.env.R2.put(r2key, pdf, { httpMetadata: { contentType: 'application/pdf' } })
      const exists = await c.env.DB.prepare('SELECT id FROM receipts WHERE order_id=?').bind(order.id).first<any>()
      if (!exists) {
        await c.env.DB.prepare(
          'INSERT INTO receipts (id,tenant_id,order_id,r2_key,amount_cents,created_at) VALUES (?,?,?,?,?,?)'
        ).bind(uid('rc_'), order.tenant_id, order.id, r2key, order.amount_cents, now()).run()
      }
    } catch (e) {
      console.log('[receipt] R2 put failed (serve inline anyway):', String(e))
    }
  }

  return new Response(pdf, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="faktur-${order.id}.pdf"`,
    },
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
