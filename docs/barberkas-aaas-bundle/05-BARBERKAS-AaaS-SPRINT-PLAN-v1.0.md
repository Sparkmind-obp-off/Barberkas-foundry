# 05-BARBERKAS-AaaS-SPRINT-PLAN-v1.0.md

**OWNER**: Reza Estes / Haidar Faras — "Sovereign AI Dev"
**DOCTRINE**: MASTER-ARCHITECT-PROMPT v5.0 + v7.0 + v8.0 OVERRIDE-LOCK
**ALIGNMENT**: SSOT Batch 4 (B4-05 Migration Map) + Batch 5 (B5-05 Pivot Execution) — *upgrade v1.1*
**DATE**: 2026-06-05 · **UPGRADED**: 2026-06-23 (Outcome Foundry alignment)
**STATUS**: CANONICAL · EXECUTE-READY · PUBLIC-SAFE · HARDENED · OUTCOME-FOUNDRY-ALIGNED
**Merge**: v8.0 sprint (D+0→D+30) = pre-Sprint 0. AaaS Sprint 0 starts **D+30** (post-8-paying-merchant).

═══════════════════════════════════════════════════════════════
🔒 HARD CONSTRAINTS (embedded)
═══════════════════════════════════════════════════════════════
1. 100% genspark.ai/ai_developer + Cloudflare Workers/Pages.
2. Niche-first: barbershop UMKM Indonesia.
3. Horizontal-play.
4. D-1 Truth-Lock.
5. MoR Oasis BI Pro Duitku.
6. OVERRIDE-CLOSE-OUT.

═══════════════════════════════════════════════════════════════

## §OF. Outcome Foundry Sprint Alignment (Batch 4/5 — v1.1)

> Sprint 0–6 di bawah **tetap berlaku** sebagai rencana eksekusi BarberKas. Bagian ini menyelaraskan tiap sprint dengan **fase reposition Outcome Foundry** (B4-05 §4: R1 reposition → R2 continuity/jasa → R3 partner/proof → R4 edukasi/skala) dan motion OaaS **land → retain → expand** (B5-03/B5-05).

| Sprint BarberKas | Fase Outcome Foundry | Motion OaaS | Outcome SKU yang di-deliver |
|---|---|---|---|
| Sprint 0 (Foundation) | R1 — reposition permukaan | (pre-land) | Setup engine + Stylist beta = proof |
| Sprint 1 (3 agent MVP) | R1/R2 — vertical + langganan | **land + retain** | "Kasir+Booking LIVE" + AI Staff Pro |
| Sprint 2 (6 agent growth) | R2 — continuity/jasa | **retain** | AI Staff lengkap (Content/Trend/Pricing/Inventory) |
| Sprint 3 (Customer+Capster) | R3 — proof/case study | **retain** | Care Plan + bukti retensi (case study) |
| Sprint 4 (Enterprise) | R3/R4 — high-ticket | **expand** | App Custom chain (DFY) |
| Sprint 5 (Marketplace) | R4 — skala/partner | **expand** | Marketplace + affiliate flywheel |
| Sprint 6 (Quality+Cross-sell) | R4 — edukasi/skala | **expand** | Canon Course + cross-sell ekosistem |

**DoD selaras reposition (B4-05 §7):** tiap sprint "done" hanya bila outcome ter-deliver lulus **DoO** (B5-02 §6) + proof terkirim (B5-04 §3) — ditambahkan ke Definition of Done §11.

---

## §1. Sprint Overview

| Sprint | Duration | Theme | Primary Output | Conditional gate |
|---|---|---|---|---|
| **v8.0 pre-Sprint** | D+0 → D+30 | BarberKas v1 kasir core launch | 8 paying merchant Rp 49K-99K/bln | MUST pass before AaaS |
| **Sprint 0** | D+30 → D+44 (2w) | AaaS foundation — Cloudflare infra + 1 agent skeleton | First merchant try Stylist Curator agent (free) | Infra GO |
| **Sprint 1** | D+44 → D+60 (~2w) | MVP 3 Core Agents (Stylist + Content + Booking) | First paying AaaS Pro merchant Rp 149K | 1 conversion gate |
| **Sprint 2** | D+60 → D+90 (~4w) | Growth — Trend + Pricing + Inventory agents | 8 paying AaaS, MRR Rp 1.5jt+ | 8 paying gate |
| **Sprint 3** | D+90 → D+120 (~4w) | Customer Curator + Capster Performance agents | 15 paying AaaS, MRR Rp 3jt+ | Retention >70% |
| **Sprint 4** | D+120 → D+150 (~4w) | Enterprise tier launch + Multi-tenant Ops agent | 2 Enterprise (chain) merchant Rp 499K | Multi-outlet PMF |
| **Sprint 5** | D+150 → D+180 (~4w) | Marketplace fee + affiliate flywheel | MRR Rp 8jt+, 25+ paying AaaS | Growth flywheel proven |
| **Sprint 6** | D+180 → D+210 (~4w) | Quality + retention + cross-sell ke ekosistem | MRR Rp 12-20jt, churn <5%/bln | Sovereign sustainable |

---

## §2. Sprint 0 (D+30 → D+44) — Foundation

### Goal
Lay the AaaS infrastructure on top of v8.0 Cloudflare-native stack. Ship 1 "preview" agent (Stylist Curator) as free upgrade for existing 8 merchant.

### Pre-flight checklist (Day 1)
- [ ] v8.0 OVERRIDE confirmed: 8 paying merchant achieved (≥MVS tier)
- [ ] Existing `barberkas-aaas` Cloudflare project healthy
- [ ] D1 schema migration plan reviewed
- [ ] Groq API key active, OpenRouter account created
- [ ] Genspark sandbox session ready (`@Sovereign-Architect v8.0 + AaaS-Sprint-0`)

### Deliverables
| # | Item | Owner | Status |
|---|---|---|---|
| S0.1 | D1 schema migration — add `agent_calls`, `wa_messages`, agent tables | Gyss | ⬜ |
| S0.2 | `src/lib/llm.ts` — Groq + OpenRouter abstraction | Gyss | ⬜ |
| S0.3 | `src/agents/_base.ts` + interface | Gyss | ⬜ |
| S0.4 | `src/agents/stylist.ts` — first agent | Gyss | ⬜ |
| S0.5 | Route `POST /api/v1/agents/stylist` | Gyss | ⬜ |
| S0.6 | Dashboard widget "Coba AI Stylist (Beta)" | Gyss | ⬜ |
| S0.7 | WA broadcast to 8 existing merchant — "Beta access AaaS" | Gyss | ⬜ |
| S0.8 | Telemetry: agent_calls table populated, dashboard view | Gyss | ⬜ |
| S0.9 | Truth check: ≥3 of 8 merchant try Stylist within 7 days | Gyss | ⬜ |

### Exit criteria
- ≥3 merchant tried Stylist Curator (free beta)
- Zero LLM cost overrun (verify Groq billing)
- Agent latency p95 <5s
- 1 merchant explicit "ini bagus, kapan keluar fitur lain"

### Truth-Lock checkpoint
**If <3 merchant try Stylist in 7 days** → PAUSE, root-cause why merchant ignore. Maybe Stylist bukan agent paling wanted, swap dengan Content/Booking.

---

## §3. Sprint 1 (D+44 → D+60) — MVP 3 Core Agents

### Goal
Ship 3 agents as bundle. Convert ≥1 of 8 free merchant to Pro tier (Rp 149K/bln).

### Deliverables
| # | Item |
|---|---|
| S1.1 | `src/agents/content.ts` — IG/TT caption + image gen (Workers AI image) |
| S1.2 | `src/agents/booking.ts` — WA NLU intent → booking creation |
| S1.3 | Fonnte webhook v2 with booking intent classify |
| S1.4 | Pricing tier UI (free vs Pro) |
| S1.5 | Duitku checkout flow via Oasis BI Pro for Pro tier |
| S1.6 | Quota tracking (500 calls/bln Pro) + soft-cap notification |
| S1.7 | Onboarding WA sequence (welcome → tutorial → first agent call within 24h) |
| S1.8 | Marketing landing: `barberkas.sparkmind.web.id/v2-agentic` |
| S1.9 | 1 paying merchant Pro tier conversion (target: of existing 8) |
| S1.10 | Brutal honest retro Day 14: what worked, what flopped, what to kill |

### Exit criteria
- ≥1 paying merchant Pro tier
- All 3 agents stable (>95% success rate)
- WA bot conversion rate (intent → booking) >40%

---

## §4. Sprint 2 (D+60 → D+90) — Growth

### Goal
Ship 3 more agents (Trend, Pricing, Inventory). Get to 8 paying AaaS merchant.

### Deliverables
| # | Item |
|---|---|
| S2.1 | `src/agents/trend.ts` — scrape IG/TT + LLM analyze ID hairstyle trends weekly |
| S2.2 | `src/agents/pricing.ts` — service price elasticity recommendation |
| S2.3 | `src/agents/inventory.ts` — pomade/tools stock forecast based on usage history |
| S2.4 | Per-agent dashboard widget (compact view) |
| S2.5 | Cron weekly trend report → WA push to all Pro+ merchant |
| S2.6 | Outbound campaign: existing 8 v8.0 merchant + new lead 30 nya |
| S2.7 | Referral program launch (refer 3 → 1 month free) |
| S2.8 | Founder content: 4 TikTok / IG Reels per minggu (Gyss build-in-public) |

### Exit criteria
- 8 paying AaaS Pro merchant
- MRR Rp 1.5jt+ (8 × Rp 149K + churn buffer)
- Trend Curator weekly report >80% open rate

---

## §5. Sprint 3 (D+90 → D+120) — Customer + Capster

### Goal
Customer retention curator + capster-level analytics. Push retention >70%, expand to 15 paying.

### Deliverables
| # | Item |
|---|---|
| S3.1 | `src/agents/customer.ts` — segment customer (VIP/dormant/risk-churn) + auto re-engage WA |
| S3.2 | `src/agents/capster_perf.ts` — per-capster commission, NPS, coaching tip |
| S3.3 | Customer loyalty tier (bronze/silver/gold based on total_spent) |
| S3.4 | Loyalty WA template (birthday msg, "kangen?" 30d dormant, "thx VIP" >Rp 1jt total) |
| S3.5 | Capster monthly performance review export (PDF via R2) |
| S3.6 | Affiliate launch: 20-30% bulan ke-1 commission |
| S3.7 | Quality audit Sprint 1-2: agent quality drift check |

### Exit criteria
- 15 paying AaaS merchant
- Retention >70% (month-over-month)
- ≥3 capster onboard their own page (capster_id login future)

---

## §6. Sprint 4 (D+120 → D+150) — Enterprise

### Goal
Launch Enterprise tier (Rp 499K/bln). Onboard 2 chain merchant (3-10 outlet).

### Deliverables
| # | Item |
|---|---|
| S4.1 | Multi-outlet data model (parent tenant + sub-tenants under one billing) |
| S4.2 | `src/agents/multi_tenant_ops.ts` — cross-shop benchmark agent |
| S4.3 | Master dashboard untuk chain owner (lihat semua outlet) |
| S4.4 | Priority support workflow (4-hour SLA) — Gyss + adik koordinasi |
| S4.5 | Enterprise onboarding playbook (in-person / Zoom setup) |
| S4.6 | Direct outreach 5-10 chain barbershop di Banyumas / Jateng |

### Exit criteria
- 2 Enterprise (chain) paying Rp 499K+
- 18-20 total paying (Pro+Enterprise combined)
- MRR Rp 3-4jt+

---

## §7. Sprint 5 (D+150 → D+180) — Marketplace Flywheel

### Goal
Activate marketplace booking fee + affiliate compound. MRR Rp 8jt+.

### Deliverables
| # | Item |
|---|---|
| S5.1 | Booking fee infrastructure (1% Pro, 0% Enterprise, 2% trial-converted) |
| S5.2 | Marketplace "discover barbershop near you" page (public, geo-locked) |
| S5.3 | Affiliate dashboard for referrer (commission tracking + WA notify) |
| S5.4 | Bulk WA campaign tool (Pro+ feature) — rate-limited + spam prevention |
| S5.5 | Founder content campaign: launch "BarberKas v2 Agentic" publicly |
| S5.6 | Press / community: capster Indonesia FB group, TikTok founder series |

### Exit criteria
- 25+ paying AaaS merchant total
- MRR Rp 8jt+
- Marketplace processed ≥100 bookings with fee
- Affiliate brought ≥3 paid merchant

---

## §8. Sprint 6 (D+180 → D+210) — Quality + Cross-Sell

### Goal
Sustainability gate. Churn <5%/bln, MRR Rp 12-20jt. Optional cross-sell ke KuratorKas / PaceLokal.

### Deliverables
| # | Item |
|---|---|
| S6.1 | Agent quality dashboard (per-agent satisfaction, drift detection) |
| S6.2 | Churn prediction model (D1 + LLM hybrid scoring) |
| S6.3 | Founder review per Enterprise merchant — quarterly business review (QBR) |
| S6.4 | Cross-sell flow ke KuratorKas (merchant with fashion side biz) |
| S6.5 | Cross-sell flow ke PaceLokal (Banyumas running klub owner) |
| S6.6 | Doctrine audit: which assumption proven wrong, update v1.1 doctrine |
| S6.7 | Sustainability check: Gyss burnout risk, adik co-founder activation |

### Exit criteria
- MRR Rp 12-20jt
- Churn <5%/bln
- ≥1 cross-sell to KuratorKas / PaceLokal
- v1.1 doctrine drafted

---

## §9. Sprint Allocation (Time per Week)

Estimated capacity Gyss: ~20-25 hours/week (capster part-time + dev).

| Activity | % Time |
|---|---|
| Dev (code agent, dashboard, infra) | 40% |
| Sales / outbound (WA + community) | 20% |
| Content (TikTok/IG founder) | 15% |
| Customer support / onboarding | 15% |
| Strategy / doctrine update | 5% |
| Buffer (recovery, learning) | 5% |

**Brutal honest**: Real capacity might be 15h/wk after capster work. Sprints planned with buffer. Stretch goals = nice-to-have only.

---

## §10. Risk Per Sprint (Pre-Mortem)

| Sprint | #1 Risk | Mitigation |
|---|---|---|
| Sprint 0 | Merchant ignore beta agent | Direct WA from Gyss to each merchant, 1-on-1 |
| Sprint 1 | Pro tier conversion 0 | Lower Pro price tactical 50% promo for first 3 |
| Sprint 2 | Trend Curator scrape API blocked | Backup data source (manual upload + LLM enrich) |
| Sprint 3 | Capster Performance feature unwanted | Kill it, replace with whatever capster ASK |
| Sprint 4 | Chain merchant slow to close | Sprint 4 might stretch to 6w |
| Sprint 5 | Marketplace fee perceived greedy | Lower to 0.5% all tier, eat margin |
| Sprint 6 | Gyss burnout | Mandatory 7-day break end of Sprint 4 + 6 |

---

## §11. Definition of Done (Per Sprint)

A sprint is "done" only if:
1. All exit criteria met (binary)
2. Brutal honest retro doc written
3. Doctrine update PR drafted (if needed)
4. Customer support tickets closed <48h
5. Code merged to main + deployed
6. Telemetry dashboard reflects new state
7. **(Outcome Foundry, v1.1)** Outcome yang dirilis lulus **Definition of Outcome / DoO** (01 §OF.4, B5-02 §6) — app live, transaksi/booking pertama tercatat, bukti terkirim (B5-04 §3), Truth-Lock (tidak ada klaim ROI palsu)

---

**END §05 — Sprint Plan**
