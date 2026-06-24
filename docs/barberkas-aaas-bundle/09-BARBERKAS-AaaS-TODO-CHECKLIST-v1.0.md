# 09-BARBERKAS-AaaS-TODO-CHECKLIST-v1.0.md

**OWNER**: Reza Estes / Haidar Faras — "Sovereign AI Dev"
**DOCTRINE**: MASTER-ARCHITECT-PROMPT v5.0 + v7.0 + v8.0 OVERRIDE-LOCK
**ALIGNMENT**: SSOT Batch 4/5 (Outcome Foundry — reposition R1–R4, DoO) — *upgrade v1.1*
**DATE**: 2026-06-05 · **UPGRADED**: 2026-06-23 (Outcome Foundry alignment)
**STATUS**: CANONICAL · EXECUTE-READY · PUBLIC-SAFE · HARDENED · OUTCOME-FOUNDRY-ALIGNED

═══════════════════════════════════════════════════════════════
🔒 HARD CONSTRAINTS (embedded)
═══════════════════════════════════════════════════════════════
1. 100% genspark.ai/ai_developer + Cloudflare Workers/Pages.
2. Niche-first.
3. Horizontal-play.
4. D-1 Truth-Lock.
5. MoR Oasis BI Pro Duitku.
6. OVERRIDE-CLOSE-OUT.

═══════════════════════════════════════════════════════════════

## §0OF. Outcome Foundry Reposition Checklist (Batch 4/5 — v1.1)

> Epik tambahan agar BarberKas selaras reposition Outcome Foundry (B4-05 §4 R1–R4). Disisipkan **di atas** backlog Sprint lama.

### R1 — Reposition permukaan (land copy)
- ⬜ Re-copy landing `/v2-agentic` ke bahasa **outcome** (lulus tes 10 detik) — 08 §OF.1
- ⬜ Halaman `/solutions` BarberKas (outcome SKU: Kasir+Booking, AI Staff, Care Plan)
- ⬜ Pisahkan jalur developer/partner (skill mesin = proof, bukan headline)
- ⬜ Tier card = DIY / Setup / Langganan / DFY (bukan hanya Free/Pro/Enterprise) — 03 §OF.1

### R2 — Continuity & jasa (retain)
- ⬜ SKU langganan: Care Plan + AI Staff (CS/Marketing/Admin) di engine checkout MoR
- ⬜ Halaman Done-for-You (chain App Custom / AI Company) + intake (HITL gate)
- ⬜ Telemetry: kolom `outcome_proof_url`, `tto_days`, `delivery_mode` (04 §OF.3)

### R3 — Proof & partner
- ⬜ Gate **DoO** diimplementasi sebelum order ditutup (06 §OF.2)
- ⬜ 2–3 case study beachhead barbershop (proof-led) → galeri before/after
- ⬜ Proof block di landing & dashboard (08 §OF.2)

### R4 — Edukasi & skala
- ⬜ Canon Course "Kelola Barbershop + AI" (tripwire edukasi) landing + checkout
- ⬜ SEO lokal per-area (Purwokerto/Banyumas/Jateng) ke pesan outcome
- ⬜ KPI delivery: TTO median + % order lulus DoO percobaan pertama (dashboard)

---

## §1. Master Checklist Overview

Total checklist items: ~210 (+ ~13 item Outcome Foundry reposition di §0OF)
Format: ✅ done, ⏳ in-progress, ⬜ todo, ❌ blocked.

---

## §2. v8.0 Pre-Sprint (D+0 → D+30) — Already Locked

(See `BARBERKAS-EXECUTE-MASTER-PROMPT-v8.0.md` BK-SPRINT-TRACKER.md)

Gate: ≥ 3 paying barbershop (MVS) to proceed Sprint 0 AaaS.

---

## §3. Sprint 0 (D+30 → D+44) — Foundation

### Cloudflare & Genspark Setup
- ⬜ Genspark sandbox session "BarberKas-AaaS-Sprint-0" opened
- ⬜ Cloudflare account verified (sparkmind.web.id zone active)
- ⬜ Wrangler login working in Genspark
- ⬜ Existing v8.0 repo branched: `feat/aaas-sprint-0`

### Infra Provisioning
- ⬜ D1 database `barberkas-aaas-prod` created
- ⬜ D1 database `barberkas-aaas-staging` created
- ⬜ R2 bucket `barberkas-media` created (existing or new)
- ⬜ KV namespace bound
- ⬜ Queue `barberkas-agent-jobs` created
- ⬜ Workers AI binding (for image gen later) — optional Sprint 0

### Secrets
- ⬜ `GROQ_API_KEY` set
- ⬜ `OPENROUTER_API_KEY` set
- ⬜ `FONNTE_TOKEN` set (carry from v8.0)
- ⬜ `DUITKU_MERCHANT_KEY` set (via Oasis BI Pro MoR)
- ⬜ `JWT_SECRET` set

### Schema
- ⬜ Migration `0001_aaas_tables.sql` written (tables: agent_calls, wa_messages, customers extended)
- ⬜ Migration applied to staging
- ⬜ Migration applied to prod (after smoke test)

### Code
- ⬜ `src/lib/llm.ts` — Groq + OpenRouter abstraction
- ⬜ `src/middleware/tenant.ts` extended for AaaS quota
- ⬜ `src/middleware/quota.ts` — agent call quota enforcement
- ⬜ `src/agents/_base.ts` — Agent interface
- ⬜ `src/agents/stylist.ts` — first agent implementation
- ⬜ Route `POST /api/v1/agents/stylist`
- ⬜ Dashboard widget "Coba AI Stylist (Beta)"
- ⬜ Telemetry logging to `agent_calls`

### Testing
- ⬜ Unit test: Stylist agent happy path
- ⬜ Unit test: tenant context isolation
- ⬜ Integration test: full call → log → response cycle
- ⬜ Latency test p95 < 5s

### Launch (Sprint 0 end)
- ⬜ Deploy to prod
- ⬜ WA broadcast to 8 paying merchant: "Beta access AI Stylist"
- ⬜ 3+ merchants tried in 7 days
- ⬜ 0 critical bug in 14 days
- ⬜ Sprint 0 retro doc written

---

## §4. Sprint 1 (D+44 → D+60) — MVP 3 Agents

### Code
- ⬜ `src/agents/content.ts` — IG/TT caption + image gen
- ⬜ `src/agents/booking.ts` — WA NLU + booking flow
- ⬜ Fonnte webhook v2 — pass message to Booking Curator
- ⬜ Image gen via Workers AI integrated
- ⬜ Quota soft-cap notification logic

### UI
- ⬜ Pricing tier page (free vs Pro Rp 149K)
- ⬜ Duitku checkout flow (redirect to pay.oasis-bi-pro.web.id)
- ⬜ Post-payment success page
- ⬜ Agent gallery UI with 3 agents visible
- ⬜ Onboarding WA sequence (Day 0-14 drip)

### Launch
- ⬜ Public landing `barberkas.sparkmind.web.id/v2-agentic` deployed
- ⬜ ≥ 1 paying merchant Pro tier (Rp 149K)
- ⬜ ≥ 90% agent call success rate
- ⬜ Sprint 1 retro doc written

---

## §5. Sprint 2 (D+60 → D+90) — Growth

### Code
- ⬜ `src/agents/trend.ts` — IG/TT scrape + LLM analyze
- ⬜ `src/agents/pricing.ts` — elasticity recommendation
- ⬜ `src/agents/inventory.ts` — stock forecast
- ⬜ Cron weekly Trend report broadcast
- ⬜ Per-agent dashboard widget compact view

### Marketing
- ⬜ Outbound list 30 barbershop (Banyumas + Jateng tier-2)
- ⬜ TikTok founder series episode 1-8 (2/week)
- ⬜ IG Reels 4/week
- ⬜ Capster community FB / Telegram engagement plan
- ⬜ Affiliate program landing page + dashboard

### Launch
- ⬜ ≥ 8 paying AaaS merchant
- ⬜ MRR ≥ Rp 1.5jt
- ⬜ Trend Curator open rate ≥ 70%
- ⬜ Sprint 2 retro doc written

---

## §6. Sprint 3 (D+90 → D+120) — Customer + Capster

### Code
- ⬜ `src/agents/customer.ts` — segment + re-engage
- ⬜ `src/agents/capster_perf.ts` — per-barber analytics
- ⬜ Loyalty tier (bronze/silver/gold) — D1 schema + UI
- ⬜ Auto WA template: birthday, dormant, VIP thanks
- ⬜ PDF capster monthly review export (R2)

### Quality
- ⬜ First monthly agent quality audit (Sprint 1-2 agents)
- ⬜ Customer satisfaction survey post-call
- ⬜ Drift detection alert if score drop >0.5

### Launch
- ⬜ ≥ 15 paying AaaS merchant
- ⬜ Retention ≥ 70% month-over-month
- ⬜ ≥ 3 capster onboard ke own page
- ⬜ Sprint 3 retro doc written

---

## §7. Sprint 4 (D+120 → D+150) — Enterprise

### Code
- ⬜ Multi-outlet data model (parent_tenant_id)
- ⬜ `src/agents/multi_tenant_ops.ts` — cross-shop benchmark
- ⬜ Master chain dashboard
- ⬜ Priority support workflow (4-hour SLA tooling)

### Sales
- ⬜ Enterprise pricing page
- ⬜ Enterprise onboarding deck (PDF, 5 slides)
- ⬜ Direct outreach 5-10 chain barbershop Banyumas/Jateng
- ⬜ 2 Enterprise discovery call

### Launch
- ⬜ ≥ 2 Enterprise merchant Rp 499K+/bln
- ⬜ ≥ 20 paying total
- ⬜ MRR Rp 3-4jt+
- ⬜ Sprint 4 retro doc written

### Founder rest
- ⬜ MANDATORY 3-day break end of Sprint 4

---

## §8. Sprint 5 (D+150 → D+180) — Marketplace Flywheel

### Code
- ⬜ Booking fee infrastructure (1% Pro, 0% Enterprise)
- ⬜ Marketplace discover page (geo-locked)
- ⬜ Affiliate dashboard
- ⬜ Bulk WA campaign tool (rate-limited)

### Marketing
- ⬜ Public launch campaign "BarberKas v2 Agentic"
- ⬜ Founder TikTok / IG launch reel
- ⬜ Press release to capster Indonesia FB group
- ⬜ Optional: paid ad test Rp 500K budget

### Launch
- ⬜ ≥ 25 paying AaaS merchant
- ⬜ MRR Rp 8jt+
- ⬜ ≥ 100 bookings via marketplace with fee
- ⬜ ≥ 3 affiliate-referred paid merchant
- ⬜ Sprint 5 retro doc written

---

## §9. Sprint 6 (D+180 → D+210) — Quality + Cross-Sell

### Code
- ⬜ Agent quality dashboard (per-agent satisfaction score)
- ⬜ Churn prediction hybrid model
- ⬜ Cross-sell flow ke KuratorKas (eligible merchants)
- ⬜ Cross-sell flow ke PaceLokal (Banyumas-aware)

### Strategy
- ⬜ Quarterly business review for Enterprise merchant
- ⬜ Doctrine audit — what proven wrong, draft v1.1
- ⬜ Sustainability self-check (burnout, cash, focus)
- ⬜ Adik co-founder activation status

### Launch
- ⬜ MRR Rp 12-20jt
- ⬜ Churn <5%/month
- ⬜ ≥ 1 cross-sell to sister brand
- ⬜ Sprint 6 retro doc + doctrine v1.1 draft
- ⬜ MANDATORY 7-day break end of Sprint 6

---

## §10. Cross-Cutting Ongoing Items

### Weekly
- ⬜ Sprint tracker daily check-ins
- ⬜ Customer support tickets <48h closure
- ⬜ Brutal honest retro Saturday
- ⬜ Content creation (TikTok/IG)

### Monthly
- ⬜ Agent quality audit (20-call sample per agent)
- ⬜ Financial review (revenue, COGS, runway)
- ⬜ Doctrine living-doc update

### Quarterly
- ⬜ Health check (founder physical + mental)
- ⬜ Strategy review (am I on the right path?)
- ⬜ Doctrine major audit
- ⬜ Investor / strategic angel consideration (only if needed)

---

## §11. Risk Register (Live)

| ID | Risk | Owner | Mitigation | Status |
|---|---|---|---|---|
| R-01 | Fonnte WA device ban | Gyss | Wablas integration Sprint 1 | ⬜ |
| R-02 | Groq pricing jump 10x | Gyss | OpenRouter fallback Sprint 0 | ⬜ |
| R-03 | Solo founder bus factor | Gyss | Adik co-founder activation Sprint 2 | ⬜ |
| R-04 | Niche too small (<1.500 addressable) | Gyss | Expand barbershop tier-3 city | ⬜ |
| R-05 | MoR Duitku revoke | Gyss | Backup Midtrans/Xendit Sprint 1 | ⬜ |
| R-06 | Capster ignore beta agents | Gyss | Direct 1-on-1 outreach + tweaks | ⬜ |
| R-07 | LLM cost overrun >Rp 200K/merchant | Gyss | Soft cap + multi-LLM Sprint 0 | ⬜ |
| R-08 | Burnout signal | Gyss | Mandatory breaks Sprint 4 + 6 | ⬜ |

---

## §12. Definition of Done — Bundle Level

This bundle (BARBERKAS-AaaS-MASTER-BUNDLE-v1.0) is DONE only when:
- ⬜ All 11 .md generated, reviewed, frozen
- ⬜ MANIFEST.md + README.md complete
- ⬜ build_html.py functional
- ⬜ HTML compiled bundle generated (steel-blue dark theme)
- ⬜ ZIP archive packaged
- ⬜ File-wrapper URLs distributed to Gyss
- ⬜ Genspark sandbox session log archived

---

**END §09 — TODO Checklist**
