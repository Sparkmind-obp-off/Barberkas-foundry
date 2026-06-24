// Merchant-of-Record (MoR) — Oasis BI Pro, rel uang via Duitku Pop (Lapis 3, B5-02).
// Truth-Lock: bila DUITKU_MERCHANT_CODE/KEY tersedia → createInvoice NYATA (Pop JS).
//             bila tidak → STUB jujur (sandbox-pay) tanpa transfer uang nyata.

import type { Bindings } from '../types'
import { duitkuConfig, createInvoice } from './duitku'

export interface MoRChargeResult {
  ref: string                       // mor_ref (Duitku reference atau OBP-<order>)
  provider: string
  mode: 'live' | 'sandbox-stub'
  payment_url: string | null
  pop_reference: string | null      // Duitku reference utk Pop JS checkout.process()
  pop_js: string | null             // URL duitku.js (sesuai env) bila live
  status: 'pending' | 'paid'
  disclosure: string
  fee_cents: number
  net_cents: number
  error?: string
}

const DISCLOSURE =
  'Pembayaran diproses oleh Oasis BI Pro selaku Merchant-of-Record (MoR) via Duitku (QRIS/VA/e-wallet). ' +
  'BarberKas adalah merek di bawah SparkMind Sovereign Ecosystem.'

// Tarif MoR baseline: 2.5% + Rp 1.000 (03-MONETIZATION §5/§12). cents = rupiah*100.
export function morFee(amountCents: number): number {
  return Math.round(amountCents * 0.025) + 100000 // Rp 1.000 = 100.000 cents
}

export interface MoRChargeArgs {
  amount_cents: number
  sku_slug: string
  sku_name: string
  billing: string
  order_id: string
  email?: string
  phone?: string
  shop_name?: string
  base_url: string                  // origin app (utk callback/return URL)
}

export async function morCharge(env: Bindings, args: MoRChargeArgs): Promise<MoRChargeResult> {
  const fee = morFee(args.amount_cents)
  const net = args.amount_cents - fee
  const cfg = duitkuConfig(env)

  // ── LIVE path: Duitku Pop createInvoice (uang nyata di sandbox/prod Duitku) ──
  if (cfg) {
    const inv = await createInvoice(cfg, {
      merchantOrderId: args.order_id,
      paymentAmount: Math.round(args.amount_cents / 100), // cents → rupiah integer
      productDetails: `BarberKas — ${args.sku_name}`,
      email: args.email || 'billing@barberkas.sparkmind.web.id',
      phoneNumber: args.phone || '',
      customerVaName: (args.shop_name || 'BarberKas Customer').slice(0, 20),
      callbackUrl: `${args.base_url}/api/v1/outcome/duitku/callback`,
      returnUrl: `${args.base_url}/api/v1/outcome/duitku/return`,
      expiryPeriod: 60,
    })

    if (!inv.ok) {
      // Truth-Lock: jangan pura-pura sukses. Laporkan error apa adanya.
      return {
        ref: 'OBP-' + args.order_id,
        provider: `oasis-bi-pro/duitku (${cfg.env})`,
        mode: 'live',
        payment_url: null,
        pop_reference: null,
        pop_js: cfg.popJs,
        status: 'pending',
        disclosure: DISCLOSURE,
        fee_cents: fee,
        net_cents: net,
        error: inv.error || 'createInvoice gagal',
      }
    }

    return {
      ref: inv.reference!,
      provider: `oasis-bi-pro/duitku (${cfg.env})`,
      mode: 'live',
      payment_url: inv.paymentUrl || null,
      pop_reference: inv.reference || null,
      pop_js: cfg.popJs,
      status: 'pending',
      disclosure: DISCLOSURE,
      fee_cents: fee,
      net_cents: net,
    }
  }

  // ── SANDBOX STUB (default, tanpa kredensial) — jujur: tidak ada uang nyata ──
  return {
    ref: 'OBP-' + args.order_id,
    provider: 'oasis-bi-pro (stub)',
    mode: 'sandbox-stub',
    payment_url: null,
    pop_reference: null,
    pop_js: null,
    status: 'pending',
    disclosure: DISCLOSURE + ' [MODE SANDBOX — tidak ada pembayaran nyata.]',
    fee_cents: fee,
    net_cents: net,
  }
}

export { DISCLOSURE }
