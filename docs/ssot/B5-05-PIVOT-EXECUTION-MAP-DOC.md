# B5-05 · PIVOT-EXECUTION-MAP-DOC — Status Kode, Gap Tertutup, Roadmap
## SparkMind · SSOT Batch 5 · Eksekusi pivot ke Outcome Foundry

> v1.0 · 2026-06-20 · Fokus: apa yang **sudah live di kode**, gap apa yang **sudah ditutup**
> oleh pivot ini, dan roadmap R1–R5 selanjutnya. Truth-Lock: status diverifikasi dari kode nyata.

---

## 1. Status kode SAAT INI (terverifikasi — build hijau)

> Diverifikasi: `npm run build` → `dist/_worker.js` (74 modules, ~147 kB) ✓.

| Area | Status | Bukti (file/route) |
|---|---|---|
| Data layer outcome | ✅ LIVE | `src/data/solutions.ts` — 9 SKU, 4 tier, plan DIY/DWY/DFY |
| Views outcome | ✅ LIVE | `src/views/solutions.tsx` — `OutcomeHome`, `SolutionsCatalog`, `SolutionDetail` |
| Landing publik = outcome | ✅ LIVE | route `/` → `OutcomeHome` |
| Katalog solusi | ✅ LIVE | route `/solutions`, `/solutions/:slug` |
| Jalur developer (proof) | ✅ LIVE | route `/developers` (katalog skill), `/foundry` |
| Engine checkout MoR menerima SKU solusi | ✅ LIVE | `CHECKOUT_PRODUCTS = {...OFFER_AS_PRODUCT, ...SOLUTION_AS_PRODUCT}` |
| SEO/OG outcome-language | ✅ LIVE | `src/renderer.tsx` (meta description/OG/Twitter) |
| Redirect kompatibilitas | ✅ LIVE | `/catalog` → `/developers` |
| Pembayaran MoR (Duitku) | ✅ LIVE (Batch 1) | `/api/checkout`, `/webhook/duitku`, brand_ledger |

> **Kesimpulan:** pivot **kode** (Batch 4 R1) sudah dieksekusi & build hijau. Yang kurang
> sebelumnya: **commit + push + doc kanonik** → ditutup oleh Batch 5 ini.

---

## 2. Gap yang DITUTUP oleh Batch 5

| # | Gap (sebelum) | Penutup (Batch 5) |
|---|---|---|
| G-OAAS-1 | Pivot diputuskan (B4) tapi **belum tervalidasi pasar** | B5-01 riset OaaS/RaaS/SaS 2025–2026 + angka |
| G-OAAS-2 | "Outcome Foundry" masih slogan, **belum sistem kanonik** | B5-02 definisi sistem 3-lapis + 7 prinsip + DoO |
| G-OAAS-3 | Model uang outcome **belum dirumuskan** (risiko pure-outcome) | B5-03 model hibrida + value-metric + unit-economics |
| G-OAAS-4 | **Cara deliver & proof** outcome belum kanonik | B5-04 pipeline F0–F7 + SLA + proof-of-outcome |
| G-OAAS-5 | Kode pivot **belum commit/push & belum terdokumentasi** | B5-05 (ini) + commit & push GitHub |
| G-OAAS-6 | SSOT 06/07/08 masih framing niche | Ditandai supersede → diarahkan ke B4/B5 (B5-06) |

---

## 3. Roadmap eksekusi R1–R5 (credit-aware, ter-gate HITL)

| Sprint | Tujuan | Output | Status |
|---|---|---|---|
| **R1** | Pivot kode: solutions + routes + landing | `/solutions`, `/developers`, OutcomeHome | ✅ DONE (live) |
| **R2** | Proof & telemetry | kolom `outcome_proof`/`tto_days`/`delivery_mode`, halaman case-study | ✅ DONE (BKF-20260626-06) — halaman case-study publik `/case-study` (index + telemetry agregat LIVE dari `/telemetry/delivery`) + `/proof/:slug` (detail before/after, badge **pilot vs ilustrasi** Truth-Lock) + API publik `GET /api/v1/outcome/proofs`. SSOT `src/data/cases.ts` (3 case: 1 pilot barbershop + 2 ilustrasi salon/laundry, tanpa testimoni palsu). Dijahit ke landing (nav "Bukti" → `/case-study` + CTA section proof). Build hijau (45 mod, 103.7 kB), curl + browser (0 console err) verified. **BKF-07: DEPLOYED ke production** (CF BYOK → `barberkas-aaas`, deploy `6fc0ba55`) — `/case-study`, `/proof/:slug`, `/api/v1/outcome/proofs` semua 200 LIVE (curl-verified); `/solutions`+`/health` regression 200. R2 **publik & live**. |
| **R3** | Konversi mainstream | intake form per-vertikal, kalkulator harga, objection FAQ | ✅ DONE (BKF-20260626-03/04) — `/solutions` + `/solutions/:slug` (5 vertikal: barbershop/salon/klinik/laundry/cafe) + kalkulator `GET /api/v1/outcome/price-estimate` + intake form + objection FAQ. **BKF-04:** dijahit ke landing (CTA `/solutions` di nav + hero + CTA final, 3 entry point) → R3 sekarang **dapat ditemukan** pengunjung. Build hijau (43 mod, 91.9 kB), curl+browser (0 console err) verified. **BKF-05: DEPLOYED ke production** (CF BYOK → `barberkas-aaas` + custom domain `barberkas-foundry.sparkmind-obp.biz.id`) — `/`, `/solutions`, `/solutions/:slug`, `price-estimate` semua 200 LIVE (curl-verified). R3 **publik & live**. |
| **R4** | Retensi & expand | dashboard langganan (Care Plan/AI Staff), reminder, upsell high-ticket | ✅ DONE (BKF-20260626-08) — migration `0004_subscriptions.sql` (`subscriptions`/`reminders`/`upsell_events`) + route `src/routes/subscriptions.ts` (`/plans`, `/subscribe` [auto-jadwal reminder onboarding+renewal H-3], `/` list+MRR, `/:id/cancel` [batalkan reminder + winback H+7], `/reminders` + `/reminders/run` engine deterministik, `/upsell` ladder retain→expand [Starter→Pro→AI Staff→Enterprise→Chain], `/upsell/:id/respond`, `/telemetry` MRR/ARR/churn/upsell-accept). Frontend: tab **Langganan** di dashboard (`💳`) — telemetry cards, kartu langganan aktif, panel upsell next-best-action, reminder + tombol "Proses jatuh tempo", modal subscribe. Harga = sumber kebenaran `skus.ts` (Truth-Lock). Reminder/upsell = rule-based (0 token). Build hijau (47 mod, 114.08 kB), curl 12 route 200 + browser (0 console err) verified. **Deploy CF BYOK = opsional (GATE HITL)** — LIVE di sandbox + push origin/main. |
| **R5** | Hybrid metered/outcome-bonus | metering AI Staff + kontrak outcome (hanya bila measurement matang) | ⬜ (gated) |

> Setiap sprint = 1 micro-sprint (B2-04), credit-aware, dengan gate HITL untuk payment/legal/harga.

---

## 4. Definition of Done — Pivot Outcome Foundry (Batch 5)

- [x] Riset OaaS/RaaS/SaS kanonik (B5-01) dengan sumber & angka.
- [x] Konsep sistem "Outcome Foundry" kanonik (B5-02): 3 lapis, 7 prinsip, DoO.
- [x] Model bisnis OaaS hibrida (B5-03): pricing, value-metric, unit-economics, guarantee.
- [x] Delivery engine + proof-of-outcome (B5-04): pipeline, SLA, gate kualitas.
- [x] Eksekusi map + gap closure (B5-05, ini).
- [x] Sintesis lintas batch (B5-06).
- [x] Kode pivot live & build hijau (terverifikasi).
- [ ] SSOT index + README diperbarui menunjuk Batch 5.
- [ ] Commit + push ke `Sovereign-Agent-Foundry` (origin main).

---

## 5. Risiko & mitigasi (ringkas)

| Risiko | Mitigasi |
|---|---|
| Over-promise outcome (atribusi) | Hibrida deterministik + DoO + guarantee terbatas (B5-03 §5) |
| Sales cycle high-ticket panjang | Tangga DIY→Setup→DFY (entry cepat) |
| Pembeli mainstream bingung jargon | Lapis 1 murni manfaat; jargon hanya di `/developers` |
| Delivery tak konsisten | verify-rubric gate + DoO (B5-04 §4) |
| Klaim palsu | Truth-Lock di setiap gate |

> Lanjut: sintesis menyeluruh + apa yang masih open → **B5-06**.
