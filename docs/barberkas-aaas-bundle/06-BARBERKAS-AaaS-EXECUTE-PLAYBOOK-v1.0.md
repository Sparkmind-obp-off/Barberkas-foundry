# 06-BARBERKAS-AaaS-EXECUTE-PLAYBOOK-v1.0.md

**OWNER**: Reza Estes / Haidar Faras — "Sovereign AI Dev"
**DOCTRINE**: MASTER-ARCHITECT-PROMPT v5.0 + v7.0 + v8.0 OVERRIDE-LOCK
**ALIGNMENT**: SSOT Batch 5 (B5-04 Delivery Engine — pipeline, DoO, proof) — *upgrade v1.1*
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

## §1. Tujuan Doc Ini
Playbook **operasional harian** — script + checklist + SOP. Bukan strategi. **Apa yang ditekan, apa yang dijalan**.

> **v1.1 — Outcome Foundry**: SOP onboarding & delivery di doc ini sekarang dipetakan ke **pipeline kanonik F0–F7** (B5-04). Setiap order BarberKas wajib lewat **gate DoO** sebelum ditandai "selesai". Lihat §OF.

---

## §OF. Outcome Delivery SOP (Batch 5 / B5-04 — v1.1)

> Onboarding SOP §7 di bawah = *operasional capster*. Bagian ini menambah **gate kualitas outcome** yang wajib dilewati sebelum order ditutup.

### OF.1 Pemetaan onboarding → pipeline F0–F7

| Fase B5-04 | SOP BarberKas (doc ini) | Bukti yang dihasilkan |
|---|---|---|
| F0 Intake | §7 Hour 0-1 (self-signup) | tiket merchant |
| F1 Scope | pilih tier/plan (03 §OF.1) | DoO + harga |
| F2 Pay | §10 Billing (Duitku/OBP) | brand_ledger + faktur |
| F3 Assemble | provision tenant + agent | tenant aktif |
| F4 Deploy | subdomain live | URL `<tenant>...` |
| F5 Proof | §7 Hour 1-24 (1st transaction) | transaksi/booking pertama |
| F6 Onboard | §7 Day 1-7 activation | Care Plan/AI Staff aktif |
| F7 Retain | §7 Day 14+ + check-in | laporan bulanan |

### OF.2 Gate Definition of Outcome (jalankan sebelum tandai "selesai")

Turunan `verify-rubric` (B5-04 §4). Order **tidak boleh** ditutup bila ada gate gagal:

- [ ] **Fungsi** — `<tenant>.barberkas.sparkmind.web.id` live & alur kasir/booking jalan.
- [ ] **Bahasa** — UI & copy Bahasa Indonesia, konteks capster.
- [ ] **Truth-Lock** — tidak ada klaim ROI palsu di onboarding/marketing.
- [ ] **MoR** — pembayaran tercatat di brand_ledger Oasis BI Pro + faktur terkirim.
- [ ] **Proof** — bukti dikirim ke merchant (URL + screenshot transaksi pertama).
- [ ] **Onboard** — (langganan) handoff WA dilakukan (§7 Day 1-7).

> Order gagal gate → **kembali ke F3/F4 (revisi)**, bukan ditutup. Truth-Lock di atas kecepatan.

### OF.3 Proof-of-outcome sebagai aset GTM

Setiap merchant yang lulus DoO = kandidat **case study** (anonim bila perlu) + galeri before/after → dipakai di landing `/v2-agentic` & solusi. *Trust & proof = diferensiator outcome economy* (B5-01).

---

## §2. Day-0 Setup Playbook (D+30, Sprint 0 Day 1)

### Step 1: Akun & Kredensial (≤ 2 jam)
```bash
# Buka genspark.ai/ai_developer, create new project "BarberKas-AaaS"
# Sandbox auto-spin (Node 20, wrangler, npm, git, curl)
# Di sandbox terminal:

npx wrangler login            # browser opens, complete OAuth

npx wrangler whoami           # verify

# GitHub repo (existing v8.0 repo or new)
git clone https://github.com/sovereign-dev/barberkas-aaas
cd barberkas-aaas
```

### Step 2: Infra Provisioning (≤ 1 jam)
```bash
# D1 database AaaS
npx wrangler d1 create barberkas-aaas-prod
npx wrangler d1 create barberkas-aaas-staging

# KV
npx wrangler kv:namespace create "KV"
npx wrangler kv:namespace create "KV" --preview

# R2 bucket
npx wrangler r2 bucket create barberkas-media

# Queues
npx wrangler queues create barberkas-agent-jobs
```

### Step 3: Secrets (≤ 30 menit)
```bash
npx wrangler secret put GROQ_API_KEY
npx wrangler secret put OPENROUTER_API_KEY
npx wrangler secret put FONNTE_TOKEN
npx wrangler secret put DUITKU_MERCHANT_KEY    # via Oasis BI Pro
npx wrangler secret put JWT_SECRET             # generate: openssl rand -hex 32
```

### Step 4: Schema Migration (≤ 30 menit)
```bash
npx wrangler d1 migrations create barberkas-aaas-prod 0001_aaas_tables
# Edit migrations/0001_aaas_tables.sql (paste from §3 of MASTER-ARCHITECT doc)
npx wrangler d1 migrations apply barberkas-aaas-prod
```

### Step 5: Deploy Skeleton (≤ 30 menit)
```bash
npm install
npm run build
npx wrangler deploy
# Verify: curl https://barberkas-aaas.<account>.workers.dev/health
```

**Total Day-0 ≤ 4.5 jam**. Sisanya hari = stylist agent code skeleton.

---

## §3. Daily Cadence (Sprint Aktif)

### Morning (1.5 jam)
```
07:00-07:15  Check Cloudflare dashboard (errors, billing, usage)
07:15-07:30  Check WA inbound queue (customer issue, merchant ping)
07:30-08:30  Deep work block #1 — current sprint priority item
```

### Capster shift (4-6 jam)
- BarberKas v1 user (Gyss sendiri pakai own product = dogfood)
- Catat semua friction / bug encountered
- Talk to customer barbershop tentang AI tools curious-ness

### Afternoon (1.5 jam)
```
17:00-17:30  Reply WA support tickets (4-hour SLA)
17:30-18:30  Deep work block #2 — code / content / outreach
```

### Evening (45 menit)
```
20:00-20:30  Content for TikTok/IG (1 reel / 1 post)
20:30-20:45  Sprint tracker update (daily checklist tick)
```

**Total daily**: ~4 jam dev + capster work full. Sustainable.

---

## §4. Weekly Cadence

| Day | Activity |
|---|---|
| Senin | Sprint planning refresh (15 menit). Set 3 deliverable for the week. |
| Selasa-Kamis | Execute mode. Deep work. Minimal meetings. |
| Jumat | Founder content creation day (TikTok/IG produce). Customer 1-on-1. |
| Sabtu | Sprint review + retro (1 jam). Brutal honest. |
| Minggu | Rest. Optional reading / strategy reflection. |

---

## §5. Customer Support SOP

### Tier 1: WA Auto-reply
- Acknowledgment within 1 minute (via Fonnte auto)
- Triage classify (bug / feature request / question / billing) via NLU

### Tier 2: Founder/team WA
- Bug: response <4 jam, fix <24 jam (severity dependent)
- Feature request: response <4 jam, "noted will consider Sprint X"
- Question: response <4 jam dengan tutorial / video link
- Billing: response <2 jam (revenue-critical)

### Tier 3: Escalation
- Hanya untuk: data loss, payment failed, security incident
- Direct WhatsApp Gyss personal (jangan public-broadcast)
- Resolve <4 jam regardless time of day

---

## §6. Outbound Sales Script (WA)

### Cold WA template (use sparingly — < 5 outbound/day)
```
Halo [Nama], saya Gyss, capster + dev dari Purwokerto.

Lihat barbershop [Nama Shop] aktif di IG, keren produknya. 
Boleh share gak, untuk catat transaksi + reminder customer pakai apa? 
Saya bikin BarberKas, kasir digital + AI yang khusus barbershop, 
mungkin bisa bantu hemat waktu. Boleh kirim demo 2 menit?
```

**Rule**:
- Personalisasi minimal 1 sentence (shop name + observation)
- No price up-front
- Ask permission before pitch
- Max 3 follow-up if no reply, then drop

### Warm Pitch (after demo interest)
```
Oke makasih udah lihat demo. Pricing simpel:
- Free 14 hari (no card)
- Pro Rp 149K/bln — 3 AI agent (Stylist, Content, Booking)
- Cancel anytime

Mau coba? Aku setup-in sekarang via WA aja, 10 menit.
```

---

## §7. Onboarding SOP (New Merchant)

### Hour 0-1: Account creation
- Self-signup via `barberkas.sparkmind.web.id/signup`
- Subdomain auto-create: `<merchant_slug>.barberkas.sparkmind.web.id`
- Welcome WA: "Akun siap! Coba login & tambah 1 capster + 1 service."

### Hour 1-24: First transaction
- Tutorial WA bot guide step-by-step
- Reward: setelah 1st transaction, push notif "Selamat! Coba AI Stylist gratis."
- Founder personal WA if no transaction in 24h: "Ada kendala? Bantu setup?"

### Day 1-7: Activation
- Daily WA tip: 1 fitur baru per hari (drip)
- Target: 5+ transaction in week 1
- Activation criteria: 5 trx + 1 agent call + 1 WA broadcast = ACTIVATED

### Day 7-14: Conversion
- Trial reminder D+10, D+12, D+14
- Show "Trial ends in X day. Upgrade Pro untuk lanjut + unlock 3 AI agent."
- Direct checkout link (Duitku via pay.oasis-bi-pro.web.id)

### Day 14+: Paying
- Welcome to Pro WA
- 30-day check-in: "ROI report kamu bulan ini..."
- Quarterly check-in dari founder

---

## §8. Agent Quality Audit SOP (Monthly)

For each agent:
1. **Sample 20 calls** from last 30 days
2. **Manual evaluate**: relevant? accurate? actionable? safe?
3. **Score 1-5** per dimension
4. **Drift detection**: vs last month, score drop >0.5 = investigate
5. **Action**:
   - Score <3.5: PAUSE agent for new merchant, investigate
   - Score 3.5-4: improve prompt
   - Score >4: ship "v1.x" prompt upgrade

**Brutal honest log**: write 1 paragraph WHY score that way, share to merchant if asked. Transparency = moat.

---

## §9. Incident Response

### Severity levels
| Sev | Definition | Response time | Resolution target |
|---|---|---|---|
| **P0** | Full outage, payment broken, data loss | 5 min | 1 hour |
| **P1** | Agent down, WA broken, merchant cannot transact | 15 min | 4 hour |
| **P2** | Single feature down, dashboard slow | 1 hour | 24 hour |
| **P3** | Minor bug, cosmetic | 24 hour | 7 days |

### P0 Runbook
1. Acknowledge in #incidents (Slack / personal alert)
2. Status page update (`barberkas.sparkmind.web.id/status`)
3. WA broadcast affected merchant (template ready)
4. Root cause + fix
5. Post-mortem doc within 48 hours (D-1 honesty)
6. Credit affected merchant if downtime >1 hour

---

## §10. Billing Operations

### Monthly billing cycle
- Day 1 of period: invoice generated
- Day 1: WA reminder "tagihan bulan ini, klik bayar"
- Day 3, 7, 10: reminder if unpaid
- Day 14: suspension WA "akun dipause, kalau bayar reaktif"
- Day 21: churn flag (status = churned)
- Day 30: data archive (retain 90 days for re-activation window)

### Failed payment handling
- Duitku webhook returns fail → log + WA notify merchant
- Auto-retry 24h, 72h
- After 2 retry fail → manual outreach Gyss

### Refund SOP
- 14-day no-questions: 100% refund Pro tier
- Pro-rata if annual: refund unused months minus 1 month
- Performance refund: 1 month credit if agent quality dispute valid

---

## §11. Tooling Stack (Free / Cheap)

| Tool | Purpose | Cost |
|---|---|---|
| Genspark AI Dev | Primary IDE + AI coding | $0 (current plan) |
| Cloudflare | Infra | $5/mo Workers Paid |
| GitHub | Code | Free private repo |
| Fonnte | WA API | Rp 25-100K/mo |
| Duitku via Oasis BI Pro | Payment | 2.5% + Rp 1K/txn |
| Groq | LLM | ~Rp 50/call avg |
| OpenRouter | LLM fallback | Pay-as-go |
| Cloudflare Email Routing | Email alert | Free |
| Sentry-free or Workers Analytics | Error / event | Free tier |
| Notion / Markdown files | Doctrine | Free |

**Total fixed monthly**: ~Rp 200K (Cloudflare + Fonnte + buffer LLM). Variable per merchant.

---

## §12. Founder Self-Care (Doctrine)

**Burnout = single biggest risk to sovereign play.**

### Daily
- Sleep ≥ 7 hours mandatory
- 1 hour offline (no WA, no laptop) before bed
- Walk / movement minimum 30 menit

### Weekly
- 1 full day offline (Minggu)
- 1 hobby session (non-tech, non-barber)

### Per Sprint
- 1 mandatory mini-break (3 hari) end of Sprint 4 + 6
- Self-review: am I excited or dreading work? Honest.

### Quarterly
- Health check
- Financial audit (personal + business)
- Doctrine review

**If burnout signal (>2 weeks low energy)**:
- Pause new feature
- Maintenance mode only
- Talk to adik / co-founder candidate
- Consider hiring junior helper (Rp 1-2jt/bln remote)

---

## §13. Communications Discipline

### What to share publicly (TikTok / IG / Twitter)
- ✅ Build-in-public progress
- ✅ Lessons learned (failures OK)
- ✅ Tech architecture (no secrets)
- ✅ Founder authenticity (capster + dev life)

### What NOT to share
- ❌ Specific MRR numbers (only ranges OK)
- ❌ Customer names without permission
- ❌ Internal doctrine details (sovereign moat)
- ❌ Bug exploits / security incidents (responsible disclosure only)

---

## §14. Decision Log Discipline

Every major decision logged in `decisions/YYYY-MM-DD-decision-name.md`:
```markdown
# Decision: <title>
Date: YYYY-MM-DD
Context: <2-3 lines>
Options considered: <bullet>
Decision: <chosen>
Why: <2-3 lines>
Trade-off accepted: <honest>
Revisit trigger: <when>
```

**Goal**: 6 bulan kemudian Gyss bisa baca log, ngerti why decision, dan adjust without losing context.

---

**END §06 — Execute Playbook**
