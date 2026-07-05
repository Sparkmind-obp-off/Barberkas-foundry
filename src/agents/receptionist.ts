// AI Resepsionis v2 (BKF-13) — FSM percakapan WA multi-turn.
// Pembeda vs auto-reply form kosong (riset 4-file):
//   1. Cek slot kosong per-capster REAL-TIME (bukan minta customer isi form manual)
//   2. Konfirmasi otomatis + tulis booking nyata ke D1
//   3. Handle reschedule & batal tanpa admin
//   4. Auto-jadwal reminder H-1 + retensi 3-4 minggu
// Truth-Lock: seluruh alur deterministik rule-based (0 token) — LLM opsional hanya
// untuk pesan yang tidak dikenali intent-nya (fallback sopan, tanpa janji palsu).

import type { Bindings, Tenant } from '../types'
import { uid, now, rupiah } from '../lib/d1'
import {
  getFreeSlots, summarizeSlotsForWA, parseDateIntent, parseTimeIntent,
  wibDayStart, fmtWibFull, fmtWibDate, type DaySlots,
} from '../lib/slots'
import { llm } from '../lib/llm'

const CONV_TTL_MS = 30 * 60 * 1000 // percakapan idle 30 menit → reset

export interface ReceptionistResult {
  reply: string
  state: string
  action: string // greeted|asked_service|asked_date|offered_slots|booked|rescheduled|cancelled|smalltalk|reset
  booking_id?: string
}

interface ConvCtx {
  service_id?: string
  service_name?: string
  price_cents?: number
  date_ms?: number
  slots?: { at: number; capster_id: string; capster_name: string; label: string }[]
  booking_id?: string
  customer_name?: string
}

// ── conversation state I/O ──────────────────────────────────────────
async function loadConv(env: Bindings, tenantId: string, phone: string) {
  const row = await env.DB.prepare('SELECT * FROM wa_conversations WHERE tenant_id=? AND phone=?')
    .bind(tenantId, phone).first<any>()
  if (!row || row.expires_at < now()) return { state: 'idle', ctx: {} as ConvCtx, exists: !!row }
  let ctx: ConvCtx = {}
  try { ctx = JSON.parse(row.context || '{}') } catch { /* noop */ }
  return { state: row.state as string, ctx, exists: true }
}

async function saveConv(env: Bindings, tenantId: string, phone: string, state: string, ctx: ConvCtx, exists: boolean) {
  const t = now()
  if (exists) {
    await env.DB.prepare('UPDATE wa_conversations SET state=?, context=?, expires_at=?, updated_at=? WHERE tenant_id=? AND phone=?')
      .bind(state, JSON.stringify(ctx), t + CONV_TTL_MS, t, tenantId, phone).run()
  } else {
    await env.DB.prepare('INSERT INTO wa_conversations (id,tenant_id,phone,state,context,expires_at,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?)')
      .bind(uid('cv_'), tenantId, phone, state, JSON.stringify(ctx), t + CONV_TTL_MS, t, t).run()
  }
}

// ── intent detection (rule-based, id-ID) ────────────────────────────
type Intent = 'book' | 'reschedule' | 'cancel' | 'menu' | 'greeting' | 'number_pick' | 'unknown'

function detectIntent(msg: string): Intent {
  const m = msg.toLowerCase().trim()
  if (/^\d{1,2}$/.test(m)) return 'number_pick'
  if (/\b(batal|cancel|gajadi|ga\s*jadi|gak\s*jadi|batalkan)\b/.test(m)) return 'cancel'
  if (/\b(ganti|ubah|pindah|reschedule|resched|undur|majuin|mundurin)\b/.test(m)) return 'reschedule'
  if (/\b(booking|book|reservasi|pesan|potong|cukur|daftar|antri|jadwal|slot|kosong|bisa\s*jam|mau\s*jam)\b/.test(m)) return 'book'
  if (/\b(menu|layanan|harga|price|list|treatment|servis|service)\b/.test(m)) return 'menu'
  if (/\b(halo|hallo|hai|hi|assalam|selamat|malam|pagi|siang|sore|min|bro|bang|kak|p{1,3})\b/.test(m) || m.length <= 4) return 'greeting'
  return 'unknown'
}

// ── helpers ─────────────────────────────────────────────────────────
async function listServices(env: Bindings, tenantId: string) {
  const { results } = await env.DB.prepare('SELECT id,name,price_cents,duration_min FROM services WHERE tenant_id=? AND active=1 ORDER BY price_cents ASC')
    .bind(tenantId).all<any>()
  return results || []
}

function servicesMenuText(services: any[], shopName: string): string {
  const lines = services.map((s, i) => `${i + 1}. ${s.name} — ${rupiah(s.price_cents)} (±${s.duration_min}mnt)`)
  return `💈 *${shopName}* — Daftar layanan:\n${lines.join('\n')}\n\nBalas *nomor* layanan yang kakak mau, atau ketik langsung (cth: "cuci potong besok jam 3 sore") ✂️`
}

function matchService(msg: string, services: any[]): any | null {
  const m = msg.toLowerCase()
  // by number
  const num = m.match(/^(\d{1,2})$/)
  if (num) {
    const idx = parseInt(num[1], 10) - 1
    if (idx >= 0 && idx < services.length) return services[idx]
  }
  // by name token overlap
  let best: any = null; let bestScore = 0
  for (const s of services) {
    const tokens = String(s.name).toLowerCase().split(/\s+/)
    const score = tokens.filter((t: string) => t.length > 2 && m.includes(t)).length
    if (score > bestScore) { best = s; bestScore = score }
  }
  return bestScore > 0 ? best : null
}

async function ensureCustomer(env: Bindings, tenantId: string, phone: string, name: string) {
  let cust = await env.DB.prepare('SELECT * FROM customers WHERE tenant_id=? AND phone=?').bind(tenantId, phone).first<any>()
  if (!cust) {
    const cid = uid('cu_')
    await env.DB.prepare('INSERT INTO customers (id,tenant_id,name,phone,visit_count,total_spent_cents,created_at) VALUES (?,?,?,?,0,0,?)')
      .bind(cid, tenantId, name, phone, now()).run()
    cust = { id: cid, name }
  }
  return cust
}

async function scheduleH1Reminder(env: Bindings, tenant: Tenant, bookingId: string, custId: string, phone: string, scheduledAt: number, detail: string) {
  const dueAt = scheduledAt - 24 * 3600 * 1000
  if (dueAt <= now()) return // booking <24 jam → skip H-1
  const msg = `🔔 Reminder dari *${tenant.shop_name}*: besok ${fmtWibFull(scheduledAt)} WIB kakak ada jadwal ${detail}. Ditunggu ya! Kalau mau ganti jadwal, balas "ganti jadwal" ✂️`
  const t = now()
  await env.DB.prepare(
    'INSERT INTO customer_reminders (id,tenant_id,customer_id,booking_id,phone,kind,due_at,message,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)'
  ).bind(uid('cr_'), tenant.id, custId, bookingId, phone, 'h1_booking', dueAt, msg, 'scheduled', t, t).run()
}

async function findActiveBooking(env: Bindings, tenantId: string, phone: string) {
  return await env.DB.prepare(
    `SELECT b.*, c.name AS customer_name FROM bookings b JOIN customers c ON c.id=b.customer_id
     WHERE b.tenant_id=? AND c.phone=? AND b.status IN ('pending','confirmed') AND b.scheduled_at>? ORDER BY b.scheduled_at ASC LIMIT 1`
  ).bind(tenantId, phone, now()).first<any>()
}

// ── main entry ──────────────────────────────────────────────────────
export async function runReceptionist(
  env: Bindings,
  tenant: Tenant,
  phone: string,
  message: string,
  customerName = 'Kak'
): Promise<ReceptionistResult> {
  const { state, ctx, exists } = await loadConv(env, tenant.id, phone)
  const intent = detectIntent(message)
  const services = await listServices(env, tenant.id)
  const openHour = (tenant as any).open_hour ?? 9
  const closeHour = (tenant as any).close_hour ?? 21
  const slotMin = (tenant as any).slot_minutes ?? 30

  const offerSlots = async (dayStart: number, c: ConvCtx): Promise<ReceptionistResult> => {
    const day = await getFreeSlots(env, tenant.id, dayStart, { openHour, closeHour, slotMinutes: slotMin })
    if (day.slots.length === 0) {
      await saveConv(env, tenant.id, phone, 'awaiting_date', c, true)
      return { reply: `Waduh, ${day.date_label} penuh semua kak 🙏 Mau coba tanggal lain? (cth: "besok" / "sabtu")`, state: 'awaiting_date', action: 'offered_slots' }
    }
    // dedupe & keep first 8 unique times (per time keep list of capsters — pick first capster on selection)
    const seen = new Map<string, typeof day.slots[0]>()
    for (const s of day.slots) if (!seen.has(s.label)) seen.set(s.label, s)
    const uniq = [...seen.values()].slice(0, 8)
    c.date_ms = dayStart
    c.slots = uniq
    await saveConv(env, tenant.id, phone, 'awaiting_slot', c, true)
    return { reply: summarizeSlotsForWA({ ...day, slots: uniq }), state: 'awaiting_slot', action: 'offered_slots' }
  }

  const confirmBooking = async (c: ConvCtx, slot: { at: number; capster_id: string; capster_name: string }): Promise<ReceptionistResult> => {
    const cust = await ensureCustomer(env, tenant.id, phone, customerName)
    const svcName = c.service_name || 'Potong'
    const bid = uid('bk_')
    await env.DB.prepare(
      'INSERT INTO bookings (id,tenant_id,customer_id,capster_id,scheduled_at,service_ids,status,source,notes,created_at) VALUES (?,?,?,?,?,?,?,?,?,?)'
    ).bind(bid, tenant.id, cust.id, slot.capster_id, slot.at, JSON.stringify(c.service_id ? [c.service_id] : []), 'confirmed', 'wa', `AI Resepsionis: ${svcName}`, now()).run()
    await scheduleH1Reminder(env, tenant, bid, cust.id, phone, slot.at, `${svcName} dengan ${slot.capster_name}`)
    await saveConv(env, tenant.id, phone, 'idle', {}, true)
    const price = c.price_cents ? ` (${rupiah(c.price_cents)})` : ''
    return {
      reply: `✅ Booking terkonfirmasi!\n\n💈 *${tenant.shop_name}*\n👤 ${cust.name}\n✂️ ${svcName}${price}\n🧑‍🎤 Capster: ${slot.capster_name}\n🗓 ${fmtWibFull(slot.at)} WIB\n\nKami ingatkan lagi H-1 ya. Kalau mau ganti/batal, cukup balas "ganti jadwal" atau "batal". Ditunggu kak! 🙌`,
      state: 'idle', action: 'booked', booking_id: bid,
    }
  }

  // ── global intents (menang atas state) ────────────────────────────
  if (intent === 'cancel' && state !== 'awaiting_cancel_confirm') {
    const bk = await findActiveBooking(env, tenant.id, phone)
    if (!bk) {
      await saveConv(env, tenant.id, phone, 'idle', {}, exists)
      return { reply: `Nggak ada booking aktif atas nomor ini kak 🙏 Mau buat booking baru? Ketik "booking" ya ✂️`, state: 'idle', action: 'reset' }
    }
    await saveConv(env, tenant.id, phone, 'awaiting_cancel_confirm', { booking_id: bk.id }, exists)
    return { reply: `Booking kakak: ${fmtWibFull(bk.scheduled_at)} WIB. Yakin mau *batalkan*? Balas "ya" untuk konfirmasi, atau "ganti jadwal" kalau mau pindah waktu.`, state: 'awaiting_cancel_confirm', action: 'asked_date' }
  }

  if (intent === 'reschedule') {
    const bk = await findActiveBooking(env, tenant.id, phone)
    if (!bk) {
      await saveConv(env, tenant.id, phone, 'awaiting_date', {}, exists)
      return { reply: `Belum ada booking aktif kak — langsung buat baru aja ya 😊 Mau hari apa? (cth: "besok" / "sabtu")`, state: 'awaiting_date', action: 'asked_date' }
    }
    const c: ConvCtx = { booking_id: bk.id, service_name: 'jadwal sebelumnya' }
    const dateMs = parseDateIntent(message, now())
    if (dateMs) return await (async () => {
      const r = await offerSlots(dateMs, c)
      return { ...r, action: 'offered_slots' }
    })()
    await saveConv(env, tenant.id, phone, 'awaiting_date', c, exists)
    return { reply: `Oke, kita pindah jadwal booking ${fmtWibFull(bk.scheduled_at)} WIB. Mau pindah ke hari apa kak? (cth: "besok" / "jumat" / "tanggal 12")`, state: 'awaiting_date', action: 'asked_date' }
  }

  if (intent === 'menu') {
    await saveConv(env, tenant.id, phone, 'awaiting_service', {}, exists)
    return { reply: servicesMenuText(services, tenant.shop_name), state: 'awaiting_service', action: 'asked_service' }
  }

  // ── state machine ─────────────────────────────────────────────────
  switch (state) {
    case 'awaiting_cancel_confirm': {
      if (/^(ya|iya|yes|y|yakin|betul|benar)\b/i.test(message.trim())) {
        const bid = ctx.booking_id
        if (bid) {
          await env.DB.prepare("UPDATE bookings SET status='cancelled' WHERE id=? AND tenant_id=?").bind(bid, tenant.id).run()
          await env.DB.prepare("UPDATE customer_reminders SET status='cancelled', updated_at=? WHERE booking_id=? AND status='scheduled'").bind(now(), bid).run()
        }
        await saveConv(env, tenant.id, phone, 'idle', {}, true)
        return { reply: `Booking dibatalkan ya kak 🙏 Kalau mau booking lagi kapan aja, tinggal chat "booking". Sampai jumpa di ${tenant.shop_name}! ✂️`, state: 'idle', action: 'cancelled' }
      }
      await saveConv(env, tenant.id, phone, 'idle', {}, true)
      return { reply: `Oke, booking *tetap jalan* 👍 Ada lagi yang bisa dibantu kak?`, state: 'idle', action: 'reset' }
    }

    case 'awaiting_service': {
      const svc = matchService(message, services)
      if (!svc) {
        return { reply: `Maaf kak, layanannya belum ketemu 🙏\n\n${servicesMenuText(services, tenant.shop_name)}`, state, action: 'asked_service' }
      }
      const c: ConvCtx = { service_id: svc.id, service_name: svc.name, price_cents: svc.price_cents }
      // pakai tanggal dari pesan ini, atau tanggal yang sudah disebut sebelumnya (ctx.date_ms)
      const dateMs = parseDateIntent(message, now()) ?? ctx.date_ms ?? null
      if (dateMs) return offerSlots(dateMs, c)
      await saveConv(env, tenant.id, phone, 'awaiting_date', c, true)
      return { reply: `Sip, *${svc.name}* (${rupiah(svc.price_cents)}) ✅\nMau hari apa kak? (cth: "hari ini" / "besok" / "sabtu" / "tanggal 12")`, state: 'awaiting_date', action: 'asked_date' }
    }

    case 'awaiting_date': {
      const dateMs = parseDateIntent(message, now())
      if (!dateMs) {
        return { reply: `Hehe belum kebaca tanggalnya kak 🙏 Coba ketik: "hari ini", "besok", "sabtu", atau "tanggal 12" ya.`, state, action: 'asked_date' }
      }
      return offerSlots(dateMs, ctx)
    }

    case 'awaiting_slot': {
      const slots = ctx.slots || []
      // pilih via nomor
      const num = message.trim().match(/^(\d{1,2})$/)
      if (num) {
        const idx = parseInt(num[1], 10) - 1
        if (idx >= 0 && idx < slots.length) {
          // reschedule path: batalkan booking lama dulu
          if (ctx.booking_id) {
            await env.DB.prepare("UPDATE bookings SET status='cancelled' WHERE id=? AND tenant_id=?").bind(ctx.booking_id, tenant.id).run()
            await env.DB.prepare("UPDATE customer_reminders SET status='cancelled', updated_at=? WHERE booking_id=? AND status='scheduled'").bind(now(), ctx.booking_id).run()
            const r = await confirmBooking({ ...ctx, booking_id: undefined }, slots[idx])
            return { ...r, action: 'rescheduled' }
          }
          return confirmBooking(ctx, slots[idx])
        }
      }
      // pilih via jam ("jam 3 sore")
      const tm = parseTimeIntent(message)
      if (tm && ctx.date_ms != null) {
        const targetLabel = `${String(tm.hour).padStart(2, '0')}:${String(tm.minute).padStart(2, '0')}`
        const hit = slots.find((s) => s.label === targetLabel)
        if (hit) {
          if (ctx.booking_id) {
            await env.DB.prepare("UPDATE bookings SET status='cancelled' WHERE id=? AND tenant_id=?").bind(ctx.booking_id, tenant.id).run()
            await env.DB.prepare("UPDATE customer_reminders SET status='cancelled', updated_at=? WHERE booking_id=? AND status='scheduled'").bind(now(), ctx.booking_id).run()
            const r = await confirmBooking({ ...ctx, booking_id: undefined }, hit)
            return { ...r, action: 'rescheduled' }
          }
          return confirmBooking(ctx, hit)
        }
        return { reply: `Jam ${targetLabel} nggak ada di daftar slot kosong kak 🙏 Balas *nomor* dari daftar tadi ya, atau ketik hari lain.`, state, action: 'offered_slots' }
      }
      // ganti hari di tengah jalan
      const dateMs = parseDateIntent(message, now())
      if (dateMs) return offerSlots(dateMs, ctx)
      return { reply: `Balas *nomor* slot-nya ya kak (cth: "2"), atau ketik hari lain kalau mau ganti tanggal 🙏`, state, action: 'offered_slots' }
    }
  }

  // ── idle: entry points ────────────────────────────────────────────
  // Fix intent NL: sebutan nama layanan ("royal shaving tanggal 12") = niat booking,
  // walau regex intent salah baca kata "siang/pagi" sebagai greeting.
  const svcMention = !/^\d{1,2}$/.test(message.trim()) ? matchService(message, services) : null
  if (intent === 'book' || svcMention) {
    const c: ConvCtx = {}
    const svc = matchService(message, services)
    if (svc) { c.service_id = svc.id; c.service_name = svc.name; c.price_cents = svc.price_cents }
    const dateMs = parseDateIntent(message, now())
    if (svc && dateMs) return offerSlots(dateMs, c)
    if (svc) {
      await saveConv(env, tenant.id, phone, 'awaiting_date', c, exists)
      return { reply: `Sip, *${svc.name}* (${rupiah(svc.price_cents)}) ✅\nMau hari apa kak? (cth: "hari ini" / "besok" / "sabtu")`, state: 'awaiting_date', action: 'asked_date' }
    }
    if (dateMs) {
      // tanggal ada tapi layanan belum → default layanan pertama? tidak — tanya layanan, simpan tanggal
      c.date_ms = dateMs
      await saveConv(env, tenant.id, phone, 'awaiting_service', c, exists)
      return { reply: servicesMenuText(services, tenant.shop_name), state: 'awaiting_service', action: 'asked_service' }
    }
    await saveConv(env, tenant.id, phone, 'awaiting_service', c, exists)
    return { reply: servicesMenuText(services, tenant.shop_name), state: 'awaiting_service', action: 'asked_service' }
  }

  if (intent === 'greeting') {
    await saveConv(env, tenant.id, phone, 'idle', {}, exists)
    return {
      reply: `Halo kak! 👋 Selamat datang di *${tenant.shop_name}* 💈\n\nAku asisten booking otomatis. Bisa bantu:\n• *booking* — cek slot kosong & pesan jadwal\n• *menu* — daftar layanan & harga\n• *ganti jadwal* / *batal* — ubah booking\n\nMau potong kapan kak? ✂️`,
      state: 'idle', action: 'greeted',
    }
  }

  // unknown → coba LLM utk balasan sopan (Truth-Lock: tanpa LLM key → fallback template)
  const r = await llm(env, [
    { role: 'system', content: `Kamu resepsionis WhatsApp barbershop "${tenant.shop_name}". Balas 1-2 kalimat bahasa Indonesia santai-sopan. JANGAN janji apa pun soal harga/slot — arahkan customer ketik "booking" untuk cek slot atau "menu" untuk daftar layanan.` },
    { role: 'user', content: message },
  ], { max_tokens: 120 })
  const reply = r.provider === 'rule-based'
    ? `Maaf kak, aku belum paham maksudnya 🙏 Ketik *booking* buat cek slot kosong, atau *menu* buat lihat layanan & harga ya ✂️`
    : r.text
  await saveConv(env, tenant.id, phone, 'idle', {}, exists)
  return { reply, state: 'idle', action: 'smalltalk' }
}
