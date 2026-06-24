// Merchant-of-Record (MoR) — Oasis BI Pro / Duitku (Lapis 3 rel uang, B5-02).
// Truth-Lock: tanpa DUITKU_MERCHANT_KEY, ini STUB jujur (sandbox-pay) — bukan pembayaran nyata.
// Integrasi Duitku QRIS/VA live + webhook idempotency = roadmap Sprint 1+.

import type { Bindings } from '../types'

export interface MoRChargeResult {
  ref: string
  provider: string
  mode: 'live' | 'sandbox-stub'
  payment_url: string | null
  status: 'pending' | 'paid'
  disclosure: string
  fee_cents: number
  net_cents: number
}

const DISCLOSURE =
  'Pembayaran diproses oleh Oasis BI Pro selaku Merchant-of-Record (MoR) via Duitku (QRIS/VA). ' +
  'BarberKas adalah merek di bawah SparkMind Sovereign Ecosystem.'

// Tarif Duitku baseline: 2.5% + Rp 1.000 (03-MONETIZATION §5 / §12).
function morFee(amountCents: number): number {
  return Math.round(amountCents * 0.025) + 100000 // Rp 1.000 = 100.000 cents
}

export async function morCharge(
  env: Bindings,
  args: { amount_cents: number; sku_slug: string; billing: string; order_id: string }
): Promise<MoRChargeResult> {
  const fee = morFee(args.amount_cents)
  const net = args.amount_cents - fee
  const ref = 'OBP-' + args.order_id

  // LIVE path (roadmap): bila merchant key tersedia, panggil Duitku createInvoice.
  if (env.DUITKU_MERCHANT_KEY) {
    // Truth-Lock: kerangka live belum diaktifkan tanpa endpoint resmi & webhook.
    // Kembalikan pending dengan payment_url placeholder agar tidak overpromise.
    return {
      ref,
      provider: 'oasis-bi-pro/duitku',
      mode: 'live',
      payment_url: `https://pay.oasis-bi-pro.web.id/checkout/${ref}`,
      status: 'pending',
      disclosure: DISCLOSURE,
      fee_cents: fee,
      net_cents: net,
    }
  }

  // SANDBOX STUB (default) — jujur: tidak ada transfer uang nyata.
  return {
    ref,
    provider: 'oasis-bi-pro (stub)',
    mode: 'sandbox-stub',
    payment_url: null,
    status: 'pending',
    disclosure: DISCLOSURE + ' [MODE SANDBOX — tidak ada pembayaran nyata.]',
    fee_cents: fee,
    net_cents: net,
  }
}

export { DISCLOSURE }
