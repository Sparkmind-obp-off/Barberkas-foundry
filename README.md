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

> Semua endpoint `/api/v1/*` tenant-scoped. Sertakan header `x-tenant: alfacut` (atau `?tenant=`) di dev.

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
- **MoR**: Oasis BI Pro (Duitku) — locked (integrasi payment = roadmap Sprint 1+)
- **Last Updated**: 2026-06-23

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
- Payment flow Duitku live + webhook idempotency.
- Auth JWT + WA OTP.
- R2 media (foto cut, arsip struk), Queues, Cron, Workers Analytics.

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
