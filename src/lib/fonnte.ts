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
}

// Normalisasi nomor ke format internasional Indonesia (62…) tanpa + / spasi.
export function normalizePhone(raw: string): string {
  let p = (raw || '').replace(/[^0-9]/g, '')
  if (p.startsWith('0')) p = '62' + p.slice(1)
  else if (p.startsWith('620')) p = '62' + p.slice(3)
  else if (!p.startsWith('62')) p = '62' + p
  return p
}

// Kirim pesan WA via Fonnte.
export async function fonnteSend(
  env: Bindings,
  target: string,
  message: string
): Promise<FonnteSendResult> {
  const token = env.FONNTE_TOKEN
  const phone = normalizePhone(target)

  if (!token) {
    return { ok: false, mode: 'stub', detail: 'FONNTE_TOKEN belum di-set — pesan tidak dikirim (Truth-Lock).' }
  }

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
    if (r.ok && (j.status === true || j.status === 'true' || j.detail)) {
      return { ok: true, mode: 'live', id: Array.isArray(j.id) ? j.id[0] : j.id, detail: j.detail }
    }
    return { ok: false, mode: 'live', error: j.reason || j.detail || `HTTP ${r.status}` }
  } catch (e: any) {
    return { ok: false, mode: 'live', error: 'fetch_failed: ' + (e?.message || String(e)) }
  }
}

// Parse payload webhook Fonnte (incoming message). Fonnte kirim x-www-form-urlencoded
// atau JSON dengan field: sender, message, name, (device).
export interface FonnteIncoming {
  sender: string
  message: string
  name?: string
  device?: string
}

export function parseFonnteWebhook(body: Record<string, any>): FonnteIncoming | null {
  const sender = String(body.sender || body.pengirim || body.from || '').trim()
  const message = String(body.message || body.pesan || body.text || '').trim()
  if (!sender) return null
  return {
    sender: normalizePhone(sender),
    message,
    name: body.name ? String(body.name) : undefined,
    device: body.device ? String(body.device) : undefined,
  }
}
