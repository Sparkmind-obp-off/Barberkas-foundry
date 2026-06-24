# BarberKas AaaS — v2 Agentic

**Outcome SKU**: *"Kasir + Booking Jasa Lokal yang LIVE"* di dalam SparkMind Outcome Foundry.
**Owner**: Reza Estes / Haidar Faras — Sovereign AI Dev (Capster + Full-Stack, Purwokerto)
**Doctrine**: MASTER-ARCHITECT-PROMPT v5.0 + v7.0 + v8.0 OVERRIDE-LOCK · D-1 Truth-Lock
**Bundle**: `BARBERKAS-AaaS-MASTER-BUNDLE-v1.0` (rev 1.1, Outcome-Foundry-aligned)

## Project Overview
- **Goal**: Layer Agent-as-a-Service di atas kasir digital barbershop UMKM Indonesia — bukan POS biasa, tapi *AI sales-team-in-a-box untuk capster*.
- **Niche-first**: barbershop UMKM Purwokerto → Banyumas → Jateng → Indonesia.
- **Framing Outcome Foundry**: 9 Curator agents = *mesin (Lapis 2)*; yang dijual = *outcome* ("Kasir+Booking LIVE" + "AI Staff").

## ✅ Completed Features (Sprint 0)
- **Multi-tenant** kasir + booking app (resolusi tenant via subdomain `<tenant>.barberkas.sparkmind.web.id`, atau `?tenant=` / `x-tenant` header di dev).
- **Kasir Core (Layer 1)**: catat transaksi, hitung total otomatis, agregasi customer (total spent, visit count).
- **Booking (Layer 2)**: list booking, konfirmasi status.
- **AI Staff / Agent Dispatcher (Layer 3)** — 3 agent LIVE + 6 roadmap (Truth-Lock, no overpromise):
  - ✂️ **Insight Stylist** (Stylist Curator) — rekomendasi cut dari history customer.
  - 📸 **AI Staff — Marketing** (Content Curator) — caption IG/TikTok + hashtag.
  - 📅 **AI Staff — Resepsionis** (Booking Curator) — parse WA → booking masuk (tulis D1 nyata).
- **Dashboard PWA** mobile-first, steel-blue Sovereign design system, bottom nav 5-item.
- **Landing page** outcome-led + proof-led (Design System §OF).
- **Multi-LLM abstraction** (Groq → OpenRouter → rule-based fallback). Tanpa API key, agent jalan rule-based berlabel jujur.
- **Tenant switcher demo** (AlfaCut Pro / Scissor7 Trial).

## ✅ Outcome Foundry Layer (Batch 5: B5-02/03/04)
- **Pipeline F0→F7**: intake → scope/DoO → pay (MoR) → assemble → deploy → proof → onboard.
- **SKU catalog** (Lapis 1 pasar): single source of truth harga di `src/data/skus.ts` — tangga *education/vertical (land) → subscription (retain) → high-ticket (expand)*.
- **DoO gate** (Definition of Outcome): order tidak `done` sebelum semua cek lulus (fungsi/bahasa/truth-lock/mor/proof/onboard).
- **Proof-of-Outcome**: artefak bukti (URL app live) tercatat + telemetry TTO & DoO success-rate.

## 💳 Duitku Pop — Payment Gateway LIVE (MoR Oasis BI Pro)
- **Real integration** via Duitku Pop `createInvoice` + Pop JS + callback webhook (bukan stub lagi).
- **Signature** HMAC-SHA256 (Web Crypto, Workers-native): `createInvoice = HMAC(merchantCode+timestamp, apiKey)`, `callback = HMAC(merchantCode+amount+merchantOrderId, apiKey)`.
- **Truth-Lock**: tanpa `DUITKU_MERCHANT_CODE/KEY` → fallback stub jujur (`/pay/confirm`). Dengan kredensial → uang nyata, simulasi dinonaktifkan.
- **Frontend**: tombol *Bayar (Duitku)* memuat Pop JS env-specific & memanggil `checkout.process(reference)`; fallback redirect ke `paymentUrl`.
- **Callback** server-to-server (signature-verified, idempotent) = sumber kebenaran status lunas.
- **Env**: `DUITKU_ENV=production` (merchant `D20919`) atau `sandbox`.

## 🔌 Functional Entry URIs
| Method | Path | Deskripsi |
|---|---|---|
| GET | `/` | Landing page (outcome-led) |
| GET | `/app` | Dashboard PWA |
| GET | `/health` | Health check |
| GET | `/api/v1/me` | Tenant context |
| GET | `/api/v1/dashboard` | Ringkasan omzet/transaksi/booking/customer |
| GET | `/api/v1/services` | Daftar layanan |
| GET | `/api/v1/capsters` | Daftar capster |
| GET | `/api/v1/customers` | Daftar customer |
| GET | `/api/v1/transactions` | List transaksi |
| POST | `/api/v1/transactions` | Catat transaksi `{capster_id, service_ids[], customer_id?, payment_method}` |
| GET | `/api/v1/bookings` | List booking |
| POST | `/api/v1/bookings/:id/status` | Ubah status `{status}` |
| GET | `/api/v1/agents` | Daftar 9 agent + ketersediaan per tier |
| POST | `/api/v1/agents/:type` | Panggil agent (`stylist`/`content`/`booking` live) |
| GET | `/api/v1/agent-calls` | Feed proof aktivitas AI |
| GET | `/api/v1/outcome/config` | Status payment (Duitku live? + pop_js URL) |
| GET | `/api/v1/outcome/catalog` | Katalog SKU outcome (public) |
| POST | `/api/v1/outcome/intake` | F0 intake `{shop_name, contact_phone, problem}` → klasifikasi SKU |
| POST | `/api/v1/outcome/checkout` | F2 buat order `{sku_slug, tenant_id?, email?, phone?}` → Duitku reference |
| POST | `/api/v1/outcome/pay/confirm` | Simulasi lunas (STUB only; 403 bila Duitku live) |
| POST | `/api/v1/outcome/duitku/callback` | Webhook Duitku (form-urlencoded, signature-verified) |
| GET | `/api/v1/outcome/duitku/return` | Halaman redirect customer setelah bayar |
| GET | `/api/v1/outcome/orders` | List order |
| GET | `/api/v1/outcome/orders/:id/status` | Status order (polling Pop JS) |
| POST | `/api/v1/outcome/orders/:id/proof` | F5 proof + DoO gate `{app_live, subdomain, tto_days, onboarded}` |
| GET | `/api/v1/outcome/telemetry/delivery` | KPI delivery (GMV, DoO%, TTO median) |

> Semua endpoint `/api/v1/*` tenant-scoped. Sertakan header `x-tenant: alfacut` (atau `?tenant=`) di dev. Endpoint `outcome/catalog`, `outcome/intake`, `outcome/duitku/*` public-safe.

## 🗄️ Data Architecture
- **Storage**: Cloudflare **D1** (SQLite) — local mode untuk dev.
- **Tabel** (canonical §3): `tenants`, `capsters`, `services`, `customers`, `transactions`, `bookings`, `agent_calls`, `wa_messages`, `invoices`.
- **Isolasi**: setiap tabel ber-`tenant_id`; middleware row-level filter wajib.
- **Telemetry Outcome Foundry**: `tenants.outcome_proof_url`, `tto_days`, `delivery_mode` (B5-04 §6).
- **Harga** disimpan `price_cents` (integer cents Rupiah).

## 🚀 Deployment
- **Platform**: Cloudflare Pages + Workers (Hono v4 + Vite + TypeScript).
- **Status sandbox**: ✅ LIVE (PM2 + `wrangler pages dev` :3000)
- **Tech Stack**: Hono · TypeScript · D1 · Vanilla JS PWA · Steel-Blue CSS design system
- **MoR**: Oasis BI Pro via **Duitku Pop LIVE** (createInvoice + Pop JS + callback) — merchant `D20919`
- **Secrets prod**: `DUITKU_MERCHANT_CODE`, `DUITKU_MERCHANT_KEY`, `DUITKU_ENV` (via `wrangler pages secret put`)
- **Last Updated**: 2026-06-24

### Perintah Dev
```bash
npm run build                 # build ke dist/
npm run db:migrate:local      # apply migrations ke D1 lokal
npm run db:seed               # seed data demo
pm2 start ecosystem.config.cjs
curl http://localhost:3000/health
```

## ❌ Belum Diimplementasi (roadmap, jujur)
- 6 agent sisa (Trend, Pricing, Inventory, Customer, Capster Perf, Multi-Tenant Ops).
- Integrasi WA nyata (Fonnte/Wablas) — saat ini booking via API simulasi.
- Recurring billing subscription (Duitku tokenization) — saat ini per-invoice.
- Auth JWT + WA OTP.
- R2 media (foto cut, arsip struk), Queues, Cron, Workers Analytics.

## 💳 Setup Duitku (Production)
```bash
# 1. Set secrets di Cloudflare Pages (produksi)
npx wrangler pages secret put DUITKU_MERCHANT_CODE --project-name barberkas-aaas   # D20919
npx wrangler pages secret put DUITKU_MERCHANT_KEY --project-name barberkas-aaas    # API key
npx wrangler pages secret put DUITKU_ENV --project-name barberkas-aaas             # production

# 2. Daftarkan Callback URL di portal Duitku (per project):
#    https://<domain>/api/v1/outcome/duitku/callback
#    Return URL: https://<domain>/api/v1/outcome/duitku/return
```
> Local dev: isi `.dev.vars` (gitignored) dari `.dev.vars.example`.

## 🧭 Recommended Next Steps
1. Set secret `GROQ_API_KEY` (+`OPENROUTER_API_KEY`) → agent jadi LLM-powered.
2. Provision D1 production: `wrangler d1 create barberkas-production` → update `wrangler.jsonc`.
3. Integrasi Fonnte webhook `/webhooks/fonnte` untuk Booking Curator real WA.
4. Tambah agent #4 (Pricing/Inventory) sesuai Sprint Plan.
5. Payment flow Duitku via MoR Oasis BI Pro + faktur PDF ke R2.

## 📖 User Guide (Demo)
1. Buka `/` untuk landing, klik **Buka Dashboard Demo**.
2. Di `/app`, gunakan tab bawah: **Home** (ringkasan + proof), **Transaksi** (catat baru), **AI** (panggil agent), **Customer**, **Booking**.
3. Ganti tenant via dropdown kanan-atas (AlfaCut Pro / Scissor7 Trial).
4. Tab **AI** → klik tile agent live (Stylist/Content/Booking) untuk lihat output nyata.

---
*SparkMind Sovereign Ecosystem · Cloudflare-native · D-1 Truth-Lock.*
