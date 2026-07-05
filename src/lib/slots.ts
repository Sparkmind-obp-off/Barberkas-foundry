// Slot engine — cek jadwal kosong per-capster REAL-TIME dari D1.
// Ini pembeda vs auto-reply form kosong: sistem tahu slot mana yang benar-benar
// tersedia (booking pending/confirmed memblokir slot), per-capster, per-tanggal.
// Zona waktu: WIB (UTC+7) — barbershop UMKM Indonesia.

import type { Bindings } from '../types'

const WIB_OFFSET_MS = 7 * 3600 * 1000

export interface Slot {
  at: number            // epoch ms (UTC) awal slot
  label: string         // "09:00"
  capster_id: string
  capster_name: string
}

export interface DaySlots {
  date_label: string    // "Sen, 06 Jul"
  day_start: number
  slots: Slot[]
}

// ── WIB helpers ─────────────────────────────────────────────────────
export function wibDate(ms: number): Date {
  return new Date(ms + WIB_OFFSET_MS) // pakai getUTC* setelah shift
}

export function wibDayStart(ms: number): number {
  const d = wibDate(ms)
  const dayStartWib = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0)
  return dayStartWib - WIB_OFFSET_MS
}

export function fmtWibTime(ms: number): string {
  const d = wibDate(ms)
  return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`
}

const HARI = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']
const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']

export function fmtWibDate(ms: number): string {
  const d = wibDate(ms)
  return `${HARI[d.getUTCDay()]}, ${String(d.getUTCDate()).padStart(2, '0')} ${BULAN[d.getUTCMonth()]}`
}

export function fmtWibFull(ms: number): string {
  return `${fmtWibDate(ms)} ${fmtWibTime(ms)}`
}

// ── Parse intent tanggal dari teks WA (id-ID, rule-based deterministik) ──
// "hari ini" | "besok" | "lusa" | "senin".."minggu" | "tanggal 12" | "12/7"
export function parseDateIntent(msg: string, nowMs: number): number | null {
  const m = msg.toLowerCase()
  const today = wibDayStart(nowMs)
  const DAY = 24 * 3600 * 1000
  if (/\bhari\s*ini\b|\bskrg\b|\bsekarang\b/.test(m)) return today
  if (/\bbesok\b|\bbsk\b/.test(m)) return today + DAY
  if (/\blusa\b/.test(m)) return today + 2 * DAY
  const days: Record<string, number> = { minggu: 0, senin: 1, selasa: 2, rabu: 3, kamis: 4, jumat: 5, "jum'at": 5, sabtu: 6 }
  for (const [name, dow] of Object.entries(days)) {
    if (m.includes(name)) {
      const cur = wibDate(nowMs).getUTCDay()
      let diff = (dow - cur + 7) % 7
      if (diff === 0) diff = 7 // "senin" saat ini hari senin → senin depan
      return today + diff * DAY
    }
  }
  const tgl = m.match(/tanggal\s+(\d{1,2})|(\d{1,2})\s*[\/\-]\s*(\d{1,2})/)
  if (tgl) {
    const d = wibDate(nowMs)
    const dayNum = parseInt(tgl[1] || tgl[2], 10)
    const monNum = tgl[3] ? parseInt(tgl[3], 10) - 1 : d.getUTCMonth()
    if (dayNum >= 1 && dayNum <= 31) {
      let target = Date.UTC(d.getUTCFullYear(), monNum, dayNum) - WIB_OFFSET_MS
      if (target < today) target = Date.UTC(d.getUTCFullYear() + (tgl[3] ? 1 : 0), tgl[3] ? monNum : monNum + 1, dayNum) - WIB_OFFSET_MS
      return target
    }
  }
  return null
}

// Parse jam dari teks: "jam 3 sore", "15.30", "10:00", "jam 10 pagi"
export function parseTimeIntent(msg: string): { hour: number; minute: number } | null {
  const m = msg.toLowerCase()
  const t = m.match(/(?:jam\s*)?(\d{1,2})(?:[.:](\d{2}))?\s*(pagi|siang|sore|malam)?/)
  if (!t) return null
  let hour = parseInt(t[1], 10)
  const minute = t[2] ? parseInt(t[2], 10) : 0
  const period = t[3]
  if (hour > 23 || minute > 59) return null
  if (period === 'sore' || period === 'malam') { if (hour < 12) hour += 12 }
  else if (period === 'siang') { if (hour < 11) hour += 12 }
  // tanpa period & jam kecil (1-8) di konteks barbershop → asumsikan PM bila <9
  else if (!period && hour >= 1 && hour <= 8) hour += 12
  return { hour, minute }
}

// ── Core: slot kosong per-capster untuk 1 hari ─────────────────────
export async function getFreeSlots(
  env: Bindings,
  tenantId: string,
  dayStartMs: number,
  opts: { openHour?: number; closeHour?: number; slotMinutes?: number; capsterId?: string; nowMs?: number } = {}
): Promise<DaySlots> {
  const openHour = opts.openHour ?? 9
  const closeHour = opts.closeHour ?? 21
  const slotMin = opts.slotMinutes ?? 30
  const nowMs = opts.nowMs ?? Date.now()

  // capsters aktif
  const capQ = opts.capsterId
    ? env.DB.prepare('SELECT id,name FROM capsters WHERE tenant_id=? AND active=1 AND id=?').bind(tenantId, opts.capsterId)
    : env.DB.prepare('SELECT id,name FROM capsters WHERE tenant_id=? AND active=1').bind(tenantId)
  const { results: capsters } = await capQ.all<any>()

  // bookings yang memblokir hari itu
  const dayEnd = dayStartMs + 24 * 3600 * 1000
  const { results: booked } = await env.DB.prepare(
    "SELECT capster_id, scheduled_at FROM bookings WHERE tenant_id=? AND scheduled_at>=? AND scheduled_at<? AND status IN ('pending','confirmed')"
  ).bind(tenantId, dayStartMs, dayEnd).all<any>()

  const blockedBy = new Map<string, Set<number>>() // capster_id → set slot start
  const blockedAny = new Set<number>()             // booking tanpa capster memblokir "any" secara longgar? tidak — hanya hitung per-capster
  for (const b of booked || []) {
    const slotStart = Math.floor((b.scheduled_at - dayStartMs) / (slotMin * 60000)) * slotMin * 60000 + dayStartMs
    if (b.capster_id) {
      if (!blockedBy.has(b.capster_id)) blockedBy.set(b.capster_id, new Set())
      blockedBy.get(b.capster_id)!.add(slotStart)
    } else {
      blockedAny.add(slotStart) // booking belum ditugaskan capster → konservatif: blok 1 kapasitas
    }
  }

  const slots: Slot[] = []
  const startMs = dayStartMs + openHour * 3600 * 1000
  const endMs = dayStartMs + closeHour * 3600 * 1000
  let unassignedUsed = new Map<number, number>() // slot → berapa booking tanpa-capster sudah "dibebankan"

  for (let at = startMs; at < endMs; at += slotMin * 60000) {
    if (at <= nowMs) continue // slot lewat/berjalan tidak ditawarkan
    for (const cap of capsters || []) {
      const capBlocked = blockedBy.get(cap.id)?.has(at) ?? false
      if (capBlocked) continue
      // bebankan booking tanpa capster ke capster pertama yang masih kosong di slot itu
      if (blockedAny.has(at)) {
        const used = unassignedUsed.get(at) || 0
        const totalUnassigned = (booked || []).filter((b: any) => !b.capster_id &&
          Math.floor((b.scheduled_at - dayStartMs) / (slotMin * 60000)) * slotMin * 60000 + dayStartMs === at).length
        if (used < totalUnassigned) { unassignedUsed.set(at, used + 1); continue }
      }
      slots.push({ at, label: fmtWibTime(at), capster_id: cap.id, capster_name: cap.name })
    }
  }

  return { date_label: fmtWibDate(dayStartMs), day_start: dayStartMs, slots }
}

// Ringkas slot untuk pesan WA: kelompokkan per jam, tampilkan capster tersedia.
export function summarizeSlotsForWA(day: DaySlots, limit = 8): string {
  if (day.slots.length === 0) return `Waduh, ${day.date_label} sudah penuh semua kak 🙏 Mau coba hari lain?`
  const byTime = new Map<string, string[]>()
  for (const s of day.slots) {
    if (!byTime.has(s.label)) byTime.set(s.label, [])
    byTime.get(s.label)!.push(s.capster_name)
  }
  const lines: string[] = []
  let i = 1
  for (const [label, caps] of byTime) {
    if (i > limit) break
    lines.push(`${i}. ${label} (${caps.join('/')})`)
    i++
  }
  return `Slot kosong ${day.date_label}:\n${lines.join('\n')}\n\nBalas *nomor* slot yang kakak mau ya ✂️`
}
