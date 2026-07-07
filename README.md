# BarberKas AaaS — v2 Agentic

**Outcome SKU**: *"Kasir + Booking Jasa Lokal yang LIVE"* di dalam SparkMind Outcome Foundry.
**Owner**: Reza Estes / Haidar Faras — Sovereign AI Dev (Capster + Full-Stack, Purwokerto)
**Doctrine**: MASTER-ARCHITECT-PROMPT v5.0 + v7.0 + v8.0 OVERRIDE-LOCK · D-1 Truth-Lock
**Bundle**: `BARBERKAS-AaaS-MASTER-BUNDLE-v1.0` (rev 1.1, Outcome-Foundry-aligned)

## 🌐 Production (LIVE)
- **Production URL**: https://barberkas-aaas.pages.dev
- **Dashboard PWA**: https://barberkas-aaas.pages.dev/app
- **GitHub**: https://github.com/Sparkmind-obp-off/Barberkas-foundry
- **Platform**: Cloudflare Pages + D1 (`barberkas-production`, id `4ee30be7-2506-4a11-be1b-1537536067a2`)
- **Payment**: Duitku Pop **LIVE** (production, merchant `D20919`) — MoR Oasis BI Pro
- **Deploy**: CF BYOK (akun `sparkmind.support@gmail.com`)

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
- **Tenant switcher** (Cut O'Clock — lead real / AlfaCut demo / Scissor7 demo) + deep-link `?tenant=`.
- **Tenant real pertama (BKF-12)**: **Cut O'Clock Barbershop Semarang** (`cutoclock`, tier pro/trial) — 4 capster real (Ardi, Pras, Nanda, AL), 9 layanan real dari riset publik (IG @cutoclock.id, kumparan, linktr.ee); harga estimasi, TANPA transaksi fiktif. Link personal owner: `https://barberkas-foundry.biz.id/app?tenant=cutoclock`.

## ✅ Outcome Foundry Layer (Batch 5: B5-02/03/04)
- **Pipeline F0→F7**: intake → scope/DoO → pay (MoR) → assemble → deploy → proof → onboard.
- **SKU catalog** (Lapis 1 pasar): single source of truth harga di `src/data/skus.ts` — tangga *education/vertical (land) → subscription (retain) → high-ticket (expand)*.
- **DoO gate** (Definition of Outcome): order tidak `done` sebelum semua cek lulus (fungsi/bahasa/truth-lock/mor/proof/onboard).
- **Proof-of-Outcome**: artefak bukti (URL app live) tercatat + telemetry TTO & DoO success-rate.

## 🧭 Foundry-Master Layer (OS sesi-kerja — `docs/ssot/foundry-master/`)
Lapisan **PROSES** (tambah, jangan hancurkan) agar setiap sesi build konsisten & anti-drift:
- **FM-01 Master-Architect-Prompt** — prompt induk boot agent (peran + 6 hard-constraint + urutan wajib + gate HITL).
- **FM-02 Master-Handoff** — template serah-terima antar-sesi (selesai/belum/blocker/next-step).
- **FM-03 Master-Sprint-Kas** — sprint credit-aware (anggaran kas-kredit + kas-bisnis + exit-gate).
- **FM-04 Resume-Boot** + `resume_boot.py` (**v4**) — resume keadaan repo dalam 1 perintah (zero-dep, read-only, Truth-Lock).
  - `--boot` (1-baris master prompt) · `--preflight` (gate readiness) · `--health` (ping prod) · `--close-out` (scaffold handoff) · `--list-backups` / `--restore-from`.
  - **v4 baru:** `--deploy-gate` — kebijakan deploy CF BYOK (wajib vs opsional) + langkah siap-tempel. Menjawab: deploy **tidak wajib per-session**; hanya saat owner izinkan (GATE HITL), bukan karena kredit/token.
- **Skill** `sovereign-barberkas-foundry-context-injection` — inject FM-01..04 + SSOT relevan + status repo ke konteks agent.
- Boot cepat: `python3 docs/ssot/foundry-master/resume_boot.py` → ringkasan git + handoff terakhir + peta SSOT.

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
| GET | `/` | Landing page (outcome-led) — **(R3/BKF-04)** menautkan ke `/solutions` di nav + hero + CTA final |
| GET | `/app` | Dashboard PWA |
| GET | `/health` | Health check |
| GET | `/solutions` | **(R3)** Index solusi per-vertikal (barbershop/salon/klinik/laundry/cafe) |
| GET | `/solutions/:slug` | **(R3)** Halaman solusi per-vertikal: intake form + kalkulator harga + objection FAQ |
| GET | `/case-study` | **(R2)** Index bukti hasil (proof-led): telemetry agregat live + daftar case-study |
| GET | `/proof/:slug` | **(R2)** Detail case-study: metrik before/after + bukti, badge jujur pilot vs ilustrasi |
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
| GET | `/api/v1/outcome/price-estimate` | **(R3)** Kalkulator harga transparan `?base_slug&ai_staff_count&care_plan` (public, deterministik) |
| GET | `/api/v1/outcome/proofs` | **(R2)** Daftar case-study publik `?vertical` (read-only, status pilot/illustration) |
| POST | `/api/v1/outcome/intake` | F0 intake `{shop_name, contact_phone, problem}` → klasifikasi SKU |
| POST | `/api/v1/outcome/checkout` | F2 buat order `{sku_slug, tenant_id?, email?, phone?}` → Duitku reference |
| POST | `/api/v1/outcome/pay/confirm` | Simulasi lunas (STUB only; 403 bila Duitku live) |
| POST | `/api/v1/outcome/duitku/callback` | Webhook Duitku (form-urlencoded, signature-verified) |
| GET | `/api/v1/outcome/duitku/return` | Halaman redirect customer setelah bayar |
| GET | `/api/v1/outcome/orders` | List order — **(BKF-16) admin only** |
| GET | `/api/v1/outcome/orders/:id` | Detail order — **(BKF-16) admin only** |
| GET | `/api/v1/outcome/orders/:id/status` | Status order (polling Pop JS) — public capability URL (uid acak) |
| POST | `/api/v1/outcome/orders/:id/proof` | F5 proof + DoO gate `{app_live, subdomain, tto_days, onboarded}` — **(BKF-16) admin only** |
| GET | `/api/v1/outcome/telemetry/delivery` | KPI delivery (GMV, DoO%, TTO median) — **(BKF-16) admin only** |
| GET | `/api/v1/subscriptions/plans` | **(R4)** Daftar SKU langganan (retain) untuk subscribe |
| POST | `/api/v1/subscriptions/subscribe` | **(R4)** Aktifkan langganan `{sku_slug, qty?, tenant_id?}` → auto-jadwal reminder onboarding+renewal |
| GET | `/api/v1/subscriptions?tenant=` | **(R4)** List langganan + MRR ringkas |
| POST | `/api/v1/subscriptions/:id/cancel` | **(R4)** Churn `{reason?}` → batalkan reminder + jadwal winback (H+7) |
| GET | `/api/v1/subscriptions/reminders` | **(R4)** Daftar reminder (`?status=`) + jumlah due |
| POST | `/api/v1/subscriptions/reminders/run` | **(R4)** Engine: tandai reminder jatuh tempo "sent" (kirim WA via Fonnte terpisah) |
| GET | `/api/v1/subscriptions/upsell?tenant=` | **(R4)** Rekomendasi upsell high-ticket (ladder retain→expand, deterministik) |
| POST | `/api/v1/subscriptions/upsell/:id/respond` | **(R4)** Catat `{decision: accepted\|declined}` → next-best-action |
| GET | `/api/v1/subscriptions/telemetry` | **(R4)** MRR/ARR, active, churn-rate, upsell-accept-rate, reminders due |
| GET | `/api/v1/auth/config` | **(BKF-14)** Public: status auth Clerk + publishable key (frontend init) |
| GET | `/api/v1/auth/me` | **(BKF-14)** User login saat ini + tenant mapping (Bearer token Clerk) |
| POST | `/api/v1/auth/map` | **(BKF-14)** Admin only: map `{email, tenant, role}` → tenant |
| GET | `/api/v1/auth/users` | **(BKF-14)** Admin only: daftar user + mapping |
| POST | `/api/v1/auth/tenants` | **(BKF-16)** Admin only: **self-service tenant onboarding** `{subdomain, shop_name, owner_phone, owner_email?, capsters[]?, tier?, trial_days?}` → tenant + layanan default + capster + map owner (idempotent 409) |
| GET | `/api/v1/auth/tenants` | **(BKF-16)** Admin only: daftar tenant + agregat (users/services/capsters/tx) |

> Semua endpoint `/api/v1/*` tenant-scoped **dan digerbang auth Clerk (BKF-14)** — sertakan `Authorization: Bearer <session JWT Clerk>`. Owner hanya boleh akses tenant miliknya; admin lintas tenant. Endpoint `outcome/catalog`, `outcome/intake`, `outcome/duitku/*`, `/webhooks/fonnte`, landing/solutions/proof tetap public.

## 🔐 Auth — Clerk.com (BKF-14 · **PRODUCTION mode BKF-15**)
- **Model**: "login sebagai X → cuma lihat data X" — 1 user (email) → 1 tenant, role `owner|staff|admin` (admin = operator BarberKas, lintas tenant).
- **Verifikasi JWT**: session token Clerk (RS256) diverifikasi di edge via JWKS + Web Crypto (`src/lib/clerk.ts`) — tanpa SDK Node, JWKS di-cache 1 jam per isolate.
- **Instance Clerk**: **PRODUCTION** `https://clerk.barberkas-foundry.biz.id` (pk_live/sk_live, BKF-15) — sebelumnya dev `unified-sawfly-46.clerk.accounts.dev` (pk_test). Frontend memuat Clerk JS dari CDN instance (host di-decode dari publishable key → otomatis `clerk.barberkas-foundry.biz.id`), mount widget SignIn di overlay `/app`.
- **Gerbang backend**: `/api/v1/*` (kecuali `/auth/config`, outcome public), `/api/v1/subscriptions/*`, `/api/v1/retention/*`, `/webhooks/simulate|wa-log|conversations`, **(BKF-16)** `/webhooks/fonnte/test-send` (kirim WA nyata — tak boleh anonim). `/webhooks/fonnte` (inbound WA) tetap public.
- **(BKF-16) Admin-gate global**: `outcome/orders` (list+detail), `orders/:id/proof`, `telemetry/delivery`, `auth/tenants` → `requireAdmin`. Capability URL `orders/:id/status` & `orders/:id/receipt` tetap public (uid acak dipegang pembeli).
- **(BKF-16) Tenant-scope subscriptions DITEGAKKAN**: non-admin selalu di-scope ke tenant miliknya (helper `scope()` — body/query `tenant_id` tenant lain diabaikan) + ownership check per-row (`cancel`, `upsell respond` → 403 jujur bila bukan miliknya).
- **Auto-provision**: login pertama → row `users` dibuat/backfill `clerk_user_id`; bootstrap: bila belum ada admin & `ADMIN_EMAILS` kosong → user pertama otomatis admin.
- **Truth-Lock**: tanpa `CLERK_SECRET_KEY`+`CLERK_ISSUER` → auth OFF (mode dev terbuka) dan diumumkan jujur via `/api/v1/auth/config`. `DEV_AUTH_BYPASS_EMAIL` hanya untuk `.dev.vars` lokal (JANGAN di prod).
- **Onboarding owner**: operator login (admin) → `POST /api/v1/auth/map {"email":"owner@toko.com","tenant":"cutoclock","role":"owner"}` → owner login Google/OTP via Clerk → langsung ter-scope ke tokonya. Sertakan header `x-tenant: alfacut` (atau `?tenant=`) di dev. Endpoint `outcome/catalog`, `outcome/intake`, `outcome/duitku/*` public-safe.
- **(BKF-17) Audit server-side gating — BUG 1 FIXED**: (a) `/auth/map` & `/auth/users` refactor dari cek admin inline → middleware `requireAdmin` tunggal (role dari D1 via Clerk JWT terverifikasi server, bukan dari client); (b) **mount-order fix kritis** di `src/index.tsx` — catch-all `/api/v1` (pasang `authMiddleware` via `use('*')`) dulunya ter-mount SEBELUM `/api/v1/outcome` → endpoint funnel public (catalog/config/proofs/intake/price-estimate) balas 401 ke prospek anonim saat Clerk live. Fix: mount `auth → outcome → subscriptions → retention → api` (catch-all TERAKHIR). Terverifikasi empiris lokal (matrix ANON=401 / non-admin=403 / admin=200) **dan production** (12 endpoint protected → 401 anon; 9 endpoint public → 200).

## 🗄️ Data Architecture
- **Storage**: Cloudflare **D1** (SQLite) — local mode untuk dev.
- **Tabel** (canonical §3): `tenants`, `capsters`, `services`, `customers`, `transactions`, `bookings`, `agent_calls`, `wa_messages`, `invoices`. **Auth (0007)**: `users` (clerk_user_id, email→tenant_id, role).
- **Outcome Foundry** (0002): `intake_tickets`, `orders`, `outcome_proofs`, `brand_ledger`. **Pricing** (0003): `products`, `pricing_suggestions`, `receipts`.
- **R4 Retain & Expand** (0004): `subscriptions` (MRR/next_charge), `reminders` (renewal/dunning/onboarding/winback), `upsell_events` (ladder retain→expand + accept-rate).
- **Isolasi**: setiap tabel ber-`tenant_id`; middleware row-level filter wajib.
- **Telemetry Outcome Foundry**: `tenants.outcome_proof_url`, `tto_days`, `delivery_mode` (B5-04 §6).
- **Harga** disimpan `price_cents` (integer cents Rupiah).

## 🚀 Deployment
- **Platform**: Cloudflare Pages + Workers (Hono v4 + Vite + TypeScript).
- **Status produksi**: ✅ LIVE di https://barberkas-aaas.pages.dev (CF Pages + D1 remote)
- **Status sandbox**: ✅ LIVE (PM2 + `wrangler pages dev` :3000)
- **Tech Stack**: Hono · TypeScript · D1 · Vanilla JS PWA · Steel-Blue CSS design system
- **MoR**: Oasis BI Pro via **Duitku Pop LIVE** (createInvoice + Pop JS + callback) — merchant `D20919`
- **Secrets prod (terpasang)**: `DUITKU_MERCHANT_CODE`, `DUITKU_MERCHANT_KEY`, `DUITKU_ENV=production`, `JWT_SECRET`, **`GROQ_API_KEY`**, **`OPENROUTER_API_KEY`**, **`FONNTE_TOKEN`** (BKF-10), **`CLERK_SECRET_KEY`** (sk_live), **`CLERK_PUBLISHABLE_KEY`** (pk_live), **`CLERK_ISSUER`** (`https://clerk.barberkas-foundry.biz.id`) (BKF-14→15 production)
- **AI Staff = LLM-powered LIVE**: agent Stylist/Content/Booking kini balas via **Groq** (`llama-3.3-70b-versatile`) di production — bukan rule-based lagi. Fallback OpenRouter → rule-based tetap aktif (Truth-Lock).
- **Callback URL (daftarkan di portal Duitku)**: `https://barberkas-aaas.pages.dev/api/v1/outcome/duitku/callback`
- **Return URL**: `https://barberkas-aaas.pages.dev/api/v1/outcome/duitku/return`
- **Last Updated**: 2026-07-05 (BKF-16: **Tambal lubang auth + self-service tenant onboarding** — admin-gate `outcome/orders|:id|:id/proof|telemetry/delivery` + gerbang `/webhooks/fonnte/test-send`; subscriptions tenant-scope ditegakkan (scope() + ownership 403); `POST/GET /api/v1/auth/tenants` = onboarding tenant 1-request (tenant + 5 layanan default + capsters + map owner email, validasi subdomain + reserved + idempotent 409); frontend `oapi`/`aapi` bawa Bearer token + tab **Admin** di dashboard (form onboarding + daftar tenant). Test lokal: auth off → terbuka jujur; dev-bypass owner → 403 di semua endpoint admin, subs tenant lain 403, body-injection `tenant_id` ter-scope, capability URL tetap public.)
- **Prev**: 2026-07-05 (BKF-15: **Clerk upgrade ke PRODUCTION mode** — pk_test/sk_test diganti pk_live/sk_live, issuer `https://clerk.barberkas-foundry.biz.id` (custom domain, JWKS live kid `ins_3G5kfQ7J…`, sk_live tervalidasi via Clerk Backend API 200). Secrets prod di-rotate via CF BYOK + redeploy. Bukti prod: `/api/v1/auth/config` → `enabled:true` + `pk_live_…` + issuer production, tanpa token → **401**, token palsu → **401**, simulator WA → **401**, landing/`/app`/`/webhooks/fonnte` tetap public — juga terverifikasi di custom domain `barberkas-foundry.biz.id`.)
- **Prev**: 2026-07-05 (BKF-14: **Auth Clerk.com LIVE di production** — migration `0007` (users) di D1 prod + secrets Clerk + deploy CF BYOK. Bukti prod: `/api/v1/auth/config` → `enabled:true`, `/api/v1/dashboard?tenant=cutoclock` tanpa token → **401**, simulator WA tanpa token → **401**, landing & `/webhooks/fonnte` tetap public. Fix bug branding: simulator strict `?tenant=` — tak ada lagi fallback diam-diam ke tenant lain.)
- **Prev**: 2026-07-05 (BKF-12: **Tenant real Cut O'Clock Semarang LIVE** — migration `0005` di D1 prod + deploy CF BYOK. Bukti: `GET /api/v1/dashboard` `x-tenant: cutoclock` → `"Cut O'Clock Barbershop"` di prod. Deep-link `/app?tenant=cutoclock` aktif.)
- **Prev**: 2026-06-26 (BKF-10: **AI Staff LLM-powered LIVE** — set secrets `GROQ_API_KEY`/`OPENROUTER_API_KEY`/`FONNTE_TOKEN` di prod via CF BYOK + redeploy. Bukti: agent Stylist balas `"mode":"groq"` di https://barberkas-aaas.pages.dev. 46 modul, `_worker.js` 114.08 kB)

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
1. ✅ ~~Set secret `GROQ_API_KEY` (+`OPENROUTER_API_KEY`) → agent jadi LLM-powered.~~ (BKF-10: DONE — Groq live di prod)
2. Provision D1 production: `wrangler d1 create barberkas-production` → update `wrangler.jsonc`.
3. Integrasi Fonnte webhook `/webhooks/fonnte` untuk Booking Curator real WA.
4. Tambah agent #4 (Pricing/Inventory) sesuai Sprint Plan.
5. Payment flow Duitku via MoR Oasis BI Pro + faktur PDF ke R2.

## 📖 User Guide (Demo)
1. Buka `/` untuk landing, klik **Buka Dashboard Demo**.
2. Dari `/`, klik **Solusi per Industri** → `/solutions` (pilih vertikal: barbershop/salon/klinik/laundry/cafe) → intake + kalkulator harga + objection FAQ.
3. Di `/app`, gunakan tab bawah: **Home** (ringkasan + proof), **Transaksi** (catat baru), **AI** (panggil agent), **Customer**, **Booking**.
4. Ganti tenant via dropdown kanan-atas (Cut O'Clock / AlfaCut demo / Scissor7 demo), atau langsung buka `/app?tenant=cutoclock`.
5. Tab **AI** → klik tile agent live (Stylist/Content/Booking) untuk lihat output nyata.

---
*SparkMind Sovereign Ecosystem · Cloudflare-native · D-1 Truth-Lock.*
