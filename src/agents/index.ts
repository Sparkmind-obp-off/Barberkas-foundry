// Agent dispatcher — 9 Curator agents (Lapis 2 "mesin").
// Sprint 0-1 ships 3 core agents live (Stylist, Content, Booking);
// remaining 6 are registered with honest "coming soon" status (Truth-Lock).

import type { Bindings, TenantContext, AgentType, AgentResult } from '../types'
import { llm } from '../lib/llm'
import { uid, now, parseIds, rupiah } from '../lib/d1'

export interface AgentMeta {
  type: AgentType
  name: string
  icon: string
  one_liner: string
  tier_required: 'free' | 'starter' | 'pro' | 'enterprise'
  live: boolean
  ai_staff: string // Outcome Foundry packaging
}

export const AGENT_REGISTRY: AgentMeta[] = [
  { type: 'stylist', name: 'Stylist Curator', icon: '✂️', one_liner: 'Rekomendasi cut style dari history customer', tier_required: 'pro', live: true, ai_staff: 'Insight Stylist' },
  { type: 'content', name: 'Content Curator', icon: '📸', one_liner: 'Caption IG/TikTok + hashtag siap posting', tier_required: 'starter', live: true, ai_staff: 'AI Staff — Marketing' },
  { type: 'booking', name: 'Booking Curator', icon: '📅', one_liner: 'Balas WA customer → booking otomatis masuk', tier_required: 'starter', live: true, ai_staff: 'AI Staff — Resepsionis' },
  { type: 'trend', name: 'Trend Curator', icon: '🔥', one_liner: 'Tren hairstyle ID & global', tier_required: 'pro', live: false, ai_staff: 'AI Staff — Marketing' },
  { type: 'pricing', name: 'Pricing Curator', icon: '💰', one_liner: 'Saran harga dinamis & elastisitas', tier_required: 'pro', live: false, ai_staff: 'AI Staff — Admin/Ops' },
  { type: 'inventory', name: 'Inventory Curator', icon: '📦', one_liner: 'Forecast stok pomade/tools', tier_required: 'pro', live: false, ai_staff: 'AI Staff — Admin/Ops' },
  { type: 'customer', name: 'Customer Curator', icon: '🤝', one_liner: 'CRM + loyalty + re-engage', tier_required: 'pro', live: false, ai_staff: 'AI Staff — CRM' },
  { type: 'capster_perf', name: 'Capster Perf. Curator', icon: '📊', one_liner: 'Analitik performa per-barber', tier_required: 'pro', live: false, ai_staff: 'AI Staff — Admin/Ops' },
  { type: 'multi_tenant', name: 'Multi-Tenant Ops', icon: '🏢', one_liner: 'Benchmark cross-shop (chain)', tier_required: 'enterprise', live: false, ai_staff: 'Cross-shop Ops' },
]

// ── Core agent implementations ────────────────────────────────

async function runStylist(env: Bindings, ctx: TenantContext, input: any): Promise<Record<string, unknown>> {
  const customerId = input.customer_id as string | undefined
  let history = 'belum ada history'
  let custName = 'customer'
  if (customerId) {
    const cu = await env.DB.prepare('SELECT * FROM customers WHERE id=? AND tenant_id=?')
      .bind(customerId, ctx.tenant_id).first<any>()
    if (cu) { history = cu.notes || 'belum ada catatan'; custName = cu.name }
  }
  const occasion = (input.occasion as string) || 'daily'

  const r = await llm(env, [
    { role: 'system', content: 'Kamu Stylist Curator barbershop Indonesia. Jawab singkat, gaya capster. Bahasa Indonesia.' },
    { role: 'user', content: `Customer: ${custName}. Catatan: ${history}. Acara: ${occasion}. Rekomendasikan 1 cut style + produk + alasan singkat.` },
  ], { max_tokens: 200 })

  if (r.provider === 'rule-based') {
    return {
      cut_name: occasion === 'wedding' ? 'Side Part Classic' : 'Low Fade + Textured Top',
      style_desc: `Untuk ${custName}: ${occasion === 'wedding' ? 'rapi formal, gunakan pomade glossy' : 'fade low + tekstur atas, pakai pomade matte biar natural'}.`,
      product: occasion === 'wedding' ? 'Pomade glossy strong-hold' : 'Pomade matte medium-hold',
      mode: 'rule-based (LLM key belum di-set)',
    }
  }
  return { recommendation: r.text, mode: r.provider }
}

async function runContent(env: Bindings, ctx: TenantContext, input: any): Promise<Record<string, unknown>> {
  const platform = (input.platform as string) || 'instagram'
  const theme = (input.theme as string) || 'promo weekend'

  const r = await llm(env, [
    { role: 'system', content: `Kamu Content Curator barbershop "${ctx.shop_name}". Buat caption ${platform} bahasa Indonesia, gaya capster, plus 8 hashtag.` },
    { role: 'user', content: `Tema: ${theme}. Buat 1 caption menarik + 8 hashtag relevan barbershop lokal.` },
  ], { max_tokens: 280 })

  if (r.provider === 'rule-based') {
    return {
      caption: `✂️ ${theme.toUpperCase()} di ${ctx.shop_name}!\nWaktunya tampil fresh bro. Booking sekarang, jangan sampai antri panjang. 💈`,
      hashtags: ['#barbershop', '#barberindonesia', '#fadehaircut', '#pomade', '#capster', '#barbershoplokal', '#grooming', `#${ctx.subdomain}`],
      platform,
      mode: 'rule-based (LLM key belum di-set)',
    }
  }
  return { content: r.text, platform, mode: r.provider }
}

async function runBooking(env: Bindings, ctx: TenantContext, input: any): Promise<Record<string, unknown>> {
  // NLU-lite: parse a WA-style message, create a pending booking.
  const msg = (input.wa_message as string) || (input.message as string) || ''
  const phone = (input.from_phone as string) || input.phone || '6280000000000'
  const custName = (input.customer_name as string) || 'Customer WA'

  // find or create customer
  let cust = await env.DB.prepare('SELECT * FROM customers WHERE tenant_id=? AND phone=?')
    .bind(ctx.tenant_id, phone).first<any>()
  if (!cust) {
    const cid = uid('cu_')
    await env.DB.prepare('INSERT INTO customers (id,tenant_id,name,phone,visit_count,total_spent_cents,created_at) VALUES (?,?,?,?,0,0,?)')
      .bind(cid, ctx.tenant_id, custName, phone, now()).run()
    cust = { id: cid, name: custName }
  }

  // naive time intent — default +1 day
  const scheduled = now() + 24 * 3600 * 1000
  const svc = await env.DB.prepare('SELECT id FROM services WHERE tenant_id=? AND active=1 LIMIT 1')
    .bind(ctx.tenant_id).first<any>()
  const serviceIds = svc ? [svc.id] : []

  const bid = uid('bk_')
  await env.DB.prepare('INSERT INTO bookings (id,tenant_id,customer_id,scheduled_at,service_ids,status,source,notes,created_at) VALUES (?,?,?,?,?,?,?,?,?)')
    .bind(bid, ctx.tenant_id, cust.id, scheduled, JSON.stringify(serviceIds), 'pending', 'wa', msg, now()).run()

  const confirmation = `🔱 ${ctx.shop_name}\nHalo Kak ${cust.name}, booking-mu sudah masuk (status: menunggu konfirmasi). Kami balas secepatnya ya ✂️`

  return {
    booking_id: bid,
    customer: cust.name,
    status: 'pending',
    confirmation_msg: confirmation,
    parsed_message: msg,
  }
}

// ── Dispatcher ────────────────────────────────────────────────

export async function dispatchAgent(
  env: Bindings,
  ctx: TenantContext,
  type: AgentType,
  input: any
): Promise<AgentResult> {
  const t0 = Date.now()
  const meta = AGENT_REGISTRY.find((a) => a.type === type)
  if (!meta) throw new Error('unknown_agent')

  let output: Record<string, unknown>
  let status: 'success' | 'fail' = 'success'

  try {
    if (!meta.live) {
      output = {
        coming_soon: true,
        message: `${meta.name} sedang dalam roadmap (intro bertahap sampai Sprint 6). Truth-Lock: belum live, jangan overpromise.`,
      }
    } else if (type === 'stylist') output = await runStylist(env, ctx, input)
    else if (type === 'content') output = await runContent(env, ctx, input)
    else if (type === 'booking') output = await runBooking(env, ctx, input)
    else output = { error: 'not_implemented' }
  } catch (e: any) {
    status = 'fail'
    output = { error: String(e?.message || e) }
  }

  const duration = Date.now() - t0
  const cost = meta.live && status === 'success' ? 20 : 0

  // audit + billing log
  await env.DB.prepare(
    'INSERT INTO agent_calls (id,tenant_id,agent_type,input_summary,output_summary,cost_cents,duration_ms,status,created_at) VALUES (?,?,?,?,?,?,?,?,?)'
  )
    .bind(uid('ag_'), ctx.tenant_id, type, JSON.stringify(input).slice(0, 200), JSON.stringify(output).slice(0, 200), cost, duration, status, now())
    .run()

  return { agent_type: type, output, cost_cents: cost, duration_ms: duration, status }
}
