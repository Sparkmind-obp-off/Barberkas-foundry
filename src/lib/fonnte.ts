// Fonnte — WhatsApp gateway (kirim & terima pesan WA real).
// Booking Curator pakai ini untuk auto-reply customer di WhatsApp.
// Truth-Lock: tanpa FONNTE_TOKEN → fungsi kirim mengembalikan {ok:false, mode:'stub'}
//             (tidak ada WA nyata terkirim, dilaporkan jujur).
//
// Docs: https://docs.fonnte.com/  (POST https://api.fonnte.com/send, header Authorization: <token>)

import type { Bindings } from '../types'

const FONNTE_SEND_URL = 'https://api.fonnte.com/send'

export interface FonnteSendResult {
  ok: boolean
  mode: 'live' | 'stub'
  id?: string
  detail?: string
  error?: string
  // BKF-20: level sanitasi yang akhirnya berhasil terkirim
  // 0 = format asli, 1 = soft-sanitized, 2 = plain-text fallback
  sanitize_level?: SanitizeLevel
}

// Normalisasi nomor ke format internasional Indonesia (62…) tanpa + / spasi.
export function normalizePhone(raw: string): string {
  let p = (raw || '').replace(/[^0-9]/g, '')
  if (p.startsWith('0')) p = '62' + p.slice(1)
  else if (p.startsWith('620')) p = '62' + p.slice(3)
  else if (!p.startsWith('62')) p = '62' + p
  return p
}

// Satu percobaan kirim mentah ke API Fonnte (tanpa retry).
async function fonnteSendRaw(token: string, phone: string, message: string): Promise<FonnteSendResult> {
  try {
    const form = new URLSearchParams()
    form.set('target', phone)
    form.set('message', message)
    form.set('countryCode', '62')

    const r = await fetch(FONNTE_SEND_URL, {
      method: 'POST',
      headers: {
        Authorization: token,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: form.toString(),
    })
    const j = (await r.json().catch(() => ({}))) as any
    // Fonnte kadang balas HTTP 200 tapi status:false + reason — cek dua-duanya.
    const rejected = j.status === false || j.status === 'false'
    if (r.ok && !rejected && (j.status === true || j.status === 'true' || j.detail)) {
      return { ok: true, mode: 'live', id: Array.isArray(j.id) ? j.id[0] : j.id, detail: j.detail }
    }
    return { ok: false, mode: 'live', error: j.reason || j.detail || `HTTP ${r.status}` }
  } catch (e: any) {
    return { ok: false, mode: 'live', error: 'fetch_failed: ' + (e?.message || String(e)) }
  }
}

// Kirim pesan WA via Fonnte — dengan retry-with-fallback untuk paket FREE (BKF-20):
// attempt#1 pesan asli → jika ditolak "invalid message request on free package",
// attempt#2 versi soft-sanitized (L1) → masih ditolak, attempt#3 plain-text (L2).
// Hasilnya: bot tetap membalas customer di paket free — degradasi format, bukan gagal total.
// startLevel > 0 dipakai saat pre-sanitize aktif (env FONNTE_FREE_SANITIZE, T3).
export async function fonnteSend(
  env: Bindings,
  target: string,
  message: string,
  startLevel: SanitizeLevel = 0
): Promise<FonnteSendResult> {
  const token = env.FONNTE_TOKEN
  const phone = normalizePhone(target)

  if (!token) {
    return { ok: false, mode: 'stub', detail: 'FONNTE_TOKEN belum di-set — pesan tidak dikirim (Truth-Lock).' }
  }

  let last: FonnteSendResult = { ok: false, mode: 'live', error: 'not_attempted' }
  let prevText: string | null = null
  for (let lvl = startLevel; lvl <= 2; lvl++) {
    const text = freePackageSanitize(message, lvl as SanitizeLevel)
    // skip level yang tidak mengubah teks (mis. pesan tanpa emoji/bullet) — hemat kuota
    if (prevText !== null && text === prevText) continue
    prevText = text
    last = await fonnteSendRaw(token, phone, text)
    last.sanitize_level = lvl as SanitizeLevel
    if (last.ok) return last
    // hanya retry bila penolakan khas free-package; error lain (token salah,
    // device disconnect, dsb) tidak akan sembuh dengan sanitasi → stop.
    if (!isFreePackageReject(last.error)) return last
  }
  return last
}

// Parse payload webhook Fonnte (incoming message). Fonnte kirim x-www-form-urlencoded
// atau JSON dengan field: sender, message, name, (device).
export interface FonnteIncoming {
  sender: string
  message: string
  name?: string
  device?: string   // nomor WA device PENERIMA (62…) — kunci mapping tenant (BKF-19)
  inboxid?: string  // ID pesan di inbox Fonnte — kunci idempotency (retry-safe)
  timestamp?: string
}

export function parseFonnteWebhook(body: Record<string, any>): FonnteIncoming | null {
  const sender = String(body.sender || body.pengirim || body.from || '').trim()
  const message = String(body.message || body.pesan || body.text || '').trim()
  if (!sender) return null
  return {
    sender: normalizePhone(sender),
    message,
    name: body.name ? String(body.name) : undefined,
    device: body.device ? normalizePhone(String(body.device)) : undefined,
    inboxid: body.inboxid != null ? String(body.inboxid) : undefined,
    timestamp: body.timestamp != null ? String(body.timestamp) : undefined,
  }
}

// ── Free-package sanitizer (BKF-20) ─────────────────────────────
// Fonnte paket FREE menolak pesan yang terdeteksi "template-like"
// (reason: "invalid message request on free package") — pemicu umum:
// bullet •, struktur list padat, formatting berat. Sanitizer ini
// mendegradasi FORMAT saja, isi pesan tetap utuh.
//
// Level 1 (soft) — aman untuk semua pesan:
//   • → -, ├/└/│ → -, em/en-dash — – → -, collapse >2 newline jadi 2,
//   trim spasi ekor tiap baris.
// Level 2 (hard) — last resort bila level 1 masih ditolak:
//   level 1 + strip marker *bold* / _italic_ / ~strike~ / ```mono```
//   (teks di dalamnya dipertahankan), hapus emoji/pictograph,
//   collapse newline ganda jadi 1 (bentuk paragraf polos).
export type SanitizeLevel = 0 | 1 | 2

export function freePackageSanitize(message: string, level: SanitizeLevel): string {
  if (level === 0) return message
  let m = message
  // Level 1 — degradasi struktur "template-like"
  m = m
    .replace(/[•▪◦●]/g, '-')
    .replace(/[├└│┌┐┘]/g, '-')
    .replace(/[—–]/g, '-')
    .split('\n').map((l) => l.replace(/\s+$/g, '')).join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
  if (level === 1) return m
  // Level 2 — plain text total
  m = m
    // strip marker formatting WA, pertahankan isinya: *x* _x_ ~x~ ```x```
    .replace(/```([\s\S]*?)```/g, '$1')
    .replace(/\*([^*\n]+)\*/g, '$1')
    .replace(/_([^_\n]+)_/g, '$1')
    .replace(/~([^~\n]+)~/g, '$1')
    // hapus emoji & pictograph (surrogate-pair ranges + simbol umum)
    .replace(/[\u{1F300}-\u{1FAFF}\u{1F000}-\u{1F02F}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{200D}]/gu, '')
    // rapikan sisa spasi ganda akibat emoji hilang
    .split('\n').map((l) => l.replace(/ {2,}/g, ' ').replace(/\s+$/g, '')).join('\n')
    // paragraf polos: newline ganda → tunggal
    .replace(/\n{2,}/g, '\n')
    .trim()
  return m
}

// Deteksi penolakan khas paket free Fonnte (pesan "template-like" diblokir).
export function isFreePackageReject(error?: string): boolean {
  if (!error) return false
  const e = error.toLowerCase()
  return e.includes('invalid message request') || (e.includes('free package') && e.includes('invalid'))
}

// Constant-time string compare (hindari timing attack pada shared secret webhook).
export function timingSafeEqual(a: string, b: string): boolean {
  const ea = new TextEncoder().encode(a)
  const eb = new TextEncoder().encode(b)
  if (ea.length !== eb.length) return false
  let diff = 0
  for (let i = 0; i < ea.length; i++) diff |= ea[i] ^ eb[i]
  return diff === 0
}
