// Duitku Pop — REAL payment gateway integration (Lapis 3 rel uang, B5-02).
// MoR: Oasis BI Pro. Provider rel: Duitku Pop (createInvoice + Pop JS + callback).
// Truth-Lock: tanpa DUITKU_MERCHANT_CODE/KEY, fallback ke stub jujur (sandbox-pay).
//
// Docs: https://docs.duitku.com/pop/en/
//   createInvoice signature = HMAC_SHA256(merchantCode + timestamp, apiKey)  (hex)
//   callback     signature = HMAC_SHA256(merchantCode + amount + merchantOrderId, apiKey) (hex)

import type { Bindings } from '../types'

// ── Endpoints ─────────────────────────────────────────────────────
const DUITKU_HOST = {
  sandbox: 'https://api-sandbox.duitku.com',
  production: 'https://api-prod.duitku.com',
}
export const DUITKU_POP_JS = {
  sandbox: 'https://app-sandbox.duitku.com/lib/js/duitku.js',
  production: 'https://app-prod.duitku.com/lib/js/duitku.js',
}

export type DuitkuEnv = 'sandbox' | 'production'

export interface DuitkuConfig {
  merchantCode: string
  apiKey: string
  env: DuitkuEnv
  popJs: string
}

// Resolve config from secrets. Default env = sandbox (Truth-Lock: aman).
export function duitkuConfig(env: Bindings): DuitkuConfig | null {
  const merchantCode = env.DUITKU_MERCHANT_CODE
  const apiKey = env.DUITKU_MERCHANT_KEY
  if (!merchantCode || !apiKey) return null
  const mode: DuitkuEnv = env.DUITKU_ENV === 'production' ? 'production' : 'sandbox'
  return { merchantCode, apiKey, env: mode, popJs: DUITKU_POP_JS[mode] }
}

// ── HMAC SHA256 (Web Crypto — Cloudflare Workers compatible) ───────
async function hmacSha256Hex(message: string, secret: string): Promise<string> {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message))
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

// createInvoice signature: HMAC_SHA256(merchantCode + timestamp, apiKey)
export function createInvoiceSignature(merchantCode: string, timestamp: string, apiKey: string) {
  return hmacSha256Hex(merchantCode + timestamp, apiKey)
}

// callback signature: HMAC_SHA256(merchantCode + amount + merchantOrderId, apiKey)
export function callbackSignature(merchantCode: string, amount: string, merchantOrderId: string, apiKey: string) {
  return hmacSha256Hex(merchantCode + amount + merchantOrderId, apiKey)
}

// ── createInvoice (Pop backend) ───────────────────────────────────
export interface CreateInvoiceArgs {
  merchantOrderId: string          // = order id kita (unik)
  paymentAmount: number            // RUPIAH (bukan cents) — Duitku pakai integer rupiah
  productDetails: string
  email: string
  phoneNumber?: string
  customerVaName?: string
  callbackUrl: string
  returnUrl: string
  expiryPeriod?: number            // menit (default 60)
  itemDetails?: { name: string; price: number; quantity: number }[]
}

export interface CreateInvoiceResult {
  ok: boolean
  reference?: string
  paymentUrl?: string
  merchantCode?: string
  statusCode?: string
  statusMessage?: string
  raw?: unknown
  error?: string
}

export async function createInvoice(cfg: DuitkuConfig, args: CreateInvoiceArgs): Promise<CreateInvoiceResult> {
  const timestamp = String(Date.now())
  const signature = await createInvoiceSignature(cfg.merchantCode, timestamp, cfg.apiKey)

  const body = {
    paymentAmount: Math.round(args.paymentAmount),
    merchantOrderId: args.merchantOrderId,
    productDetails: args.productDetails,
    additionalParam: '',
    merchantUserInfo: '',
    paymentMethod: '',
    customerVaName: args.customerVaName || 'BarberKas Customer',
    email: args.email,
    phoneNumber: args.phoneNumber || '',
    itemDetails: args.itemDetails || [
      { name: args.productDetails.slice(0, 50), price: Math.round(args.paymentAmount), quantity: 1 },
    ],
    callbackUrl: args.callbackUrl,
    returnUrl: args.returnUrl,
    expiryPeriod: args.expiryPeriod ?? 60,
  }

  try {
    const res = await fetch(`${DUITKU_HOST[cfg.env]}/api/merchant/createInvoice`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-duitku-timestamp': timestamp,
        'x-duitku-signature': signature,
        'x-duitku-merchantcode': cfg.merchantCode,
      },
      body: JSON.stringify(body),
    })
    const text = await res.text()
    let json: any
    try { json = JSON.parse(text) } catch { json = { raw: text } }

    if (res.status !== 200 || json?.statusCode !== '00') {
      return { ok: false, error: json?.statusMessage || json?.Message || `HTTP ${res.status}: ${text.slice(0, 200)}`, raw: json, statusCode: json?.statusCode }
    }
    return {
      ok: true,
      reference: json.reference,
      paymentUrl: json.paymentUrl,
      merchantCode: json.merchantCode,
      statusCode: json.statusCode,
      statusMessage: json.statusMessage,
      raw: json,
    }
  } catch (e: any) {
    return { ok: false, error: 'fetch_failed: ' + (e?.message || String(e)) }
  }
}

// ── Verify callback signature (timing-safe-ish compare) ────────────
export async function verifyCallback(
  cfg: DuitkuConfig,
  fields: { merchantCode: string; amount: string; merchantOrderId: string; signature: string }
): Promise<boolean> {
  if (!fields.merchantCode || !fields.amount || !fields.merchantOrderId || !fields.signature) return false
  const calc = await callbackSignature(fields.merchantCode, fields.amount, fields.merchantOrderId, cfg.apiKey)
  // constant-time-ish compare
  if (calc.length !== fields.signature.length) return false
  let diff = 0
  for (let i = 0; i < calc.length; i++) diff |= calc.charCodeAt(i) ^ fields.signature.charCodeAt(i)
  return diff === 0
}
