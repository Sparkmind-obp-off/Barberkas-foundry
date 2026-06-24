# 04-BARBERKAS-AaaS-MASTER-ARCHITECT-v1.0.md

**OWNER**: Reza Estes / Haidar Faras — "Sovereign AI Dev"
**DOCTRINE**: MASTER-ARCHITECT-PROMPT v5.0 + v7.0 + v8.0 OVERRIDE-LOCK (D-1 Truth-Lock — MAXIMUM BRUTAL HONEST)
**ALIGNMENT**: SSOT Batch 5 (Outcome Foundry — B5-02 Concept, B5-04 Delivery Engine) — *upgrade v1.1*
**DATE**: 2026-06-05 · **UPGRADED**: 2026-06-23 (Outcome Foundry alignment)
**STATUS**: CANONICAL · EXECUTE-READY · PUBLIC-SAFE · HARDENED · OUTCOME-FOUNDRY-ALIGNED

═══════════════════════════════════════════════════════════════
🔒 HARD CONSTRAINTS (embedded)
═══════════════════════════════════════════════════════════════
1. 100% genspark.ai/ai_developer + Cloudflare Workers/Pages only. ZERO local dev. ZERO external IDE. ZERO infra lain (AWS/GCP/Azure FORBIDDEN).
2. Niche-first: barbershop UMKM Indonesia.
3. Horizontal-play (blueprint replicable).
4. D-1 Truth-Lock.
5. MoR = Oasis BI Pro Duitku.
6. OVERRIDE-CLOSE-OUT.

═══════════════════════════════════════════════════════════════

## §OF. Outcome Foundry Architecture Alignment (Batch 5 — v1.1)

> Arsitektur teknis di bawah **tidak berubah** (stack, MoR, multi-tenant = tetap). Bagian ini memetakan arsitektur BarberKas ke **anatomi Outcome Foundry 3-lapis** (B5-02) + **pipeline delivery F0–F7** (B5-04), agar BarberKas konsisten sebagai "mesin yang menghasilkan outcome".

### OF.1 9 Curator agents = mesin Lapis 2 (mapping ke skill/squad Foundry)

> Skill = *komponen mesin*; outcome = *hasil yang dirakit*. (Selaras B4-05 §2 + B5-02 §4.)

| # | Curator Agent (BarberKas) | Skill/Squad mesin (Outcome Foundry) | Kontribusi ke outcome |
|---|---|---|---|
| 1 | Stylist | `squad-product` + context-injection | rekomendasi cut → up-sell |
| 2 | Content | `squad-marketing` + `cmo` + gtm-engineering | mesin konten/promo |
| 3 | Booking | `squad-sales-cs` + claw-actuation (WA NLU) | CS auto → booking masuk |
| 4 | Trend | `cmo` + computer-browser-use (scrape) | insight tren |
| 5 | Pricing | `squad-opsfinance` + `cfo` | elastisitas harga |
| 6 | Inventory | `squad-opsfinance` + workflow-ops | forecast stok |
| 7 | Customer | `squad-sales-cs` + hermes-memory | CRM + loyalty |
| 8 | Capster Perf | `coo` + verify-rubric | analitik per-barber |
| 9 | Multi-Tenant Ops | `orchestrator` + `coo` | benchmark cross-shop |

Infra perakit (Lapis 2): `fullstack-cycle`, `cf-byok-deploy`, `orchestration-patterns`, `credit-aware`, `zero-trust`.

### OF.2 Pipeline delivery BarberKas (turunan B5-04 F0–F7)

```
F0 INTAKE   Owner daftar di /signup → tiket (vertikal=barbershop).
F1 SCOPE    DoO + plan (DIY template / DWY setup / DFY chain) + harga.
F2 PAY      Checkout MoR (Duitku QRIS/VA) → brand_ledger. one-time auto; chain→invoice.
F3 ASSEMBLE Provision tenant + seed schema (§3) + aktifkan agent tier.
F4 DEPLOY   <tenant>.barberkas.sparkmind.web.id LIVE. Gate: verify-rubric.
F5 PROOF    Kirim bukti: URL live + transaksi/booking pertama + faktur.
F6 ONBOARD  (langganan) handoff WA (06 §7): tutorial + Care Plan/AI Staff aktif.
F7 RETAIN   AI Staff jalan: konten, booking, laporan bulanan.
```

### OF.3 Telemetry tambahan untuk membuktikan outcome (B5-04 §6, roadmap)

Tambah ke skema D1 (lihat §3) — kanonik roadmap, opsional Sprint 0:
```sql
-- Proof-of-outcome & Time-to-Outcome (selaras B5-04 §6)
ALTER TABLE tenants ADD COLUMN outcome_proof_url TEXT;   -- URL bukti app live
ALTER TABLE tenants ADD COLUMN tto_days INTEGER;          -- time-to-outcome (hari)
ALTER TABLE tenants ADD COLUMN delivery_mode TEXT;        -- diy|dwy|dfy
```
KPI delivery: **TTO median** (target: hari, bukan bulan), **% order lulus DoO percobaan pertama**, refund-rate, retensi langganan.

---

## §1. Tech Stack Overview (Cloudflare-Native)

```
┌──────────────────────────────────────────────────────────────────────┐
│           BARBERKAS AaaS — CLOUDFLARE EDGE STACK v2.0                 │
└──────────────────────────────────────────────────────────────────────┘

CLIENT (PWA, no native app)
  └─ <tenant>.barberkas.sparkmind.web.id (multi-tenant subdomain)
       │
       ▼
CLOUDFLARE EDGE (global, <50ms latency Indonesia)
  ├─ DNS: Cloudflare (sparkmind.web.id zone)
  ├─ SSL: Universal SSL + Advanced Cert (wildcard *.barberkas.sparkmind.web.id)
  ├─ WAF + Bot Protection: Free tier
  ├─ Cache: KV for hot config
  │
  ├─ ROUTING LAYER
  │   └─ Workers (router.barberkas.sparkmind.web.id)
  │       ├─ Extract tenant from subdomain
  │       ├─ Inject tenant context
  │       └─ Route to service Workers
  │
  ├─ APP LAYER (Workers + Pages)
  │   ├─ Web app: Hono v4 + Vite + TypeScript + Tailwind
  │   ├─ API: Hono routes /api/v1/*
  │   └─ Agent dispatcher: /api/v1/agents/*
  │
  ├─ DATA LAYER
  │   ├─ D1 SQLite (per-tenant schema isolation via tenant_id)
  │   ├─ KV: session + tenant config cache
  │   ├─ R2: media (cuts photo, receipts archive, agent outputs)
  │   └─ Durable Objects: per-tenant real-time state (booking lock)
  │
  ├─ ASYNC LAYER
  │   ├─ Queues: agent jobs, WA broadcast, billing
  │   ├─ Cron Triggers: daily report, billing, retention reminder
  │   └─ Workflows (Cloudflare Workflows beta): multi-step agent orchestration
  │
  ├─ INTEGRATION LAYER
  │   ├─ Fonnte (WA API) — primary
  │   ├─ Wablas (WA API) — fallback
  │   ├─ Duitku PG — payment via Oasis BI Pro MoR
  │   ├─ Groq (LLM llama-3.3-70b) — primary
  │   ├─ OpenRouter — multi-LLM abstraction fallback
  │   └─ Cloudflare AI (Workers AI) — image gen + embeddings
  │
  └─ OBSERVABILITY
      ├─ Workers Analytics Engine — custom events
      ├─ Logpush → R2 — long-term archive
      └─ Cloudflare Email Routing — alerts
```

---

## §2. Multi-Tenant Architecture

### 2.1 Subdomain Pattern (LOCKED)

```
<tenant>.barberkas.sparkmind.web.id

Example:
  alfacut.barberkas.sparkmind.web.id   → tenant "alfacut"
  scissor7.barberkas.sparkmind.web.id  → tenant "scissor7"
```

### 2.2 Tenant Isolation Strategy

| Layer | Isolation Method |
|---|---|
| Subdomain | Cloudflare wildcard cert *.barberkas.sparkmind.web.id |
| Routing | Worker extracts subdomain, validates against tenants table |
| Data D1 | All tables have `tenant_id` foreign key, row-level filter middleware |
| Storage R2 | Per-tenant prefix: `r2://barberkas-media/{tenant_id}/...` |
| Cache KV | Per-tenant namespace key: `tenant:{tenant_id}:...` |
| LLM session | Per-tenant context window, no cross-tenant leak |

### 2.3 Tenant Lifecycle

```
SIGNUP → TRIAL (14d) → PAID → ACTIVE → SUSPENDED → DELETED
                     ↘ CHURNED → REACTIVATE WINDOW (30d) → ARCHIVED
```

Each transition = D1 row update + KV cache invalidation + WA notification to merchant.

---

## §3. Database Schema (D1) — Core Tables

```sql
-- Tenants
CREATE TABLE tenants (
  id TEXT PRIMARY KEY,                    -- UUID
  subdomain TEXT UNIQUE NOT NULL,         -- e.g., "alfacut"
  shop_name TEXT NOT NULL,
  owner_phone TEXT NOT NULL,
  owner_email TEXT,
  tier TEXT NOT NULL DEFAULT 'free',      -- free|starter|pro|enterprise
  status TEXT NOT NULL DEFAULT 'trial',   -- trial|active|suspended|churned
  trial_ends_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Capsters (barber profile per shop)
CREATE TABLE capsters (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  commission_pct REAL DEFAULT 50.0,
  active INTEGER DEFAULT 1,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Services (menu)
CREATE TABLE services (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,                     -- "Cuci-Potong", "Pomade Style"
  price_cents INTEGER NOT NULL,
  duration_min INTEGER DEFAULT 30,
  active INTEGER DEFAULT 1,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Customers
CREATE TABLE customers (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  birthdate TEXT,
  preferred_capster_id TEXT,
  last_visit_at INTEGER,
  total_spent_cents INTEGER DEFAULT 0,
  visit_count INTEGER DEFAULT 0,
  notes TEXT,                             -- agent-curated insights
  UNIQUE(tenant_id, phone),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Transactions
CREATE TABLE transactions (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  customer_id TEXT,
  capster_id TEXT NOT NULL,
  service_ids TEXT NOT NULL,              -- JSON array
  total_cents INTEGER NOT NULL,
  payment_method TEXT NOT NULL,           -- cash|qris|transfer
  status TEXT DEFAULT 'completed',
  notes TEXT,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Bookings (appointment)
CREATE TABLE bookings (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  customer_id TEXT NOT NULL,
  capster_id TEXT,
  scheduled_at INTEGER NOT NULL,
  service_ids TEXT NOT NULL,              -- JSON
  status TEXT DEFAULT 'pending',          -- pending|confirmed|done|cancelled|noshow
  source TEXT,                            -- wa|walkin|google_maps
  notes TEXT,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Agent calls (audit + billing)
CREATE TABLE agent_calls (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  agent_type TEXT NOT NULL,               -- stylist|content|trend|...
  input_tokens INTEGER,
  output_tokens INTEGER,
  cost_cents INTEGER,
  duration_ms INTEGER,
  status TEXT,                            -- success|fail|timeout
  user_initiated INTEGER DEFAULT 1,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- WA messages (log + rate limit)
CREATE TABLE wa_messages (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  direction TEXT NOT NULL,                -- in|out
  phone TEXT NOT NULL,
  body TEXT,
  agent_type TEXT,                        -- which agent generated this (if any)
  status TEXT,                            -- sent|delivered|read|failed
  fonnte_id TEXT,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Billing
CREATE TABLE invoices (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  period_start INTEGER NOT NULL,
  period_end INTEGER NOT NULL,
  amount_cents INTEGER NOT NULL,
  status TEXT DEFAULT 'pending',          -- pending|paid|failed|cancelled
  duitku_ref TEXT,
  paid_at INTEGER,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Indexes (essentials)
CREATE INDEX idx_transactions_tenant_date ON transactions(tenant_id, created_at);
CREATE INDEX idx_bookings_tenant_scheduled ON bookings(tenant_id, scheduled_at);
CREATE INDEX idx_customers_tenant_phone ON customers(tenant_id, phone);
CREATE INDEX idx_agent_calls_tenant_date ON agent_calls(tenant_id, created_at);
```

---

## §4. The 9 Curator Agents — System Design

```
┌──────────────────────────────────────────────────────────────────┐
│                  AGENT DISPATCHER (Hono router)                    │
└──────────────────────────────────────────────────────────────────┘
                       POST /api/v1/agents/:type
                                  │
              ┌───────────────────┼───────────────────┐
              │                   │                   │
              ▼                   ▼                   ▼
┌────────────────┐  ┌────────────────┐  ┌─────────────────────┐
│ 1. STYLIST     │  │ 2. CONTENT     │  │ 3. TREND            │
│  Cut style rec │  │  IG/TT caption │  │  Hairstyle trends   │
│  per customer  │  │  + image gen   │  │  ID/global          │
└────────────────┘  └────────────────┘  └─────────────────────┘

┌────────────────┐  ┌────────────────┐  ┌─────────────────────┐
│ 4. PRICING     │  │ 5. BOOKING     │  │ 6. INVENTORY        │
│  Dynamic price │  │  WA+Gojek+walk │  │  Pomade/tools stock │
│  elasticity    │  │  in sync       │  │  forecast           │
└────────────────┘  └────────────────┘  └─────────────────────┘

┌────────────────┐  ┌────────────────────┐  ┌──────────────────┐
│ 7. CUSTOMER    │  │ 8. CAPSTER PERF.   │  │ 9. MULTI-TENANT  │
│  WA CRM +      │  │  Per-barber        │  │  Cross-shop      │
│  loyalty       │  │  analytics         │  │  benchmark       │
└────────────────┘  └────────────────────┘  └──────────────────┘
```

### Agent Interface (TypeScript)

```typescript
interface Agent<Input, Output> {
  type: AgentType;
  tier_required: 'free' | 'starter' | 'pro' | 'enterprise';
  call(ctx: TenantContext, input: Input): Promise<Output>;
  cost_cents_estimate(input: Input): number;
  validate_quota(ctx: TenantContext): Promise<boolean>;
}

interface TenantContext {
  tenant_id: string;
  tier: string;
  capster_id?: string;
  customer_id?: string;
  request_id: string;
}
```

### Per-Agent Spec (Summary)

| # | Agent | Input | Output | LLM call? | Avg Rp/call |
|---|---|---|---|---|---|
| 1 | Stylist | `{customer_id, recent_cuts, occasion}` | `{cut_name, style_desc, image_url}` | Yes + image | 200 |
| 2 | Content | `{platform, theme, shop_voice}` | `{caption, hashtags, image_url}` | Yes + image | 500 |
| 3 | Trend | `{period, region}` | `{trends: [{name, popularity, sample_img}]}` | Yes + scrape | 300 |
| 4 | Pricing | `{service_id, history, target_margin}` | `{suggested_price, elasticity_note}` | Yes | 250 |
| 5 | Booking | `{wa_message, intent}` | `{booking_id, confirmation_msg}` | Yes (NLU) | 100 |
| 6 | Inventory | `{current_stock, usage_history}` | `{reorder_list, days_until_stockout}` | Yes | 200 |
| 7 | Customer | `{customer_id, action}` | `{segment, loyalty_msg, next_best_action}` | Yes | 250 |
| 8 | Capster Perf | `{capster_id, period}` | `{metrics, ranking, coaching_tip}` | Yes | 300 |
| 9 | Multi-tenant | `{tenant_ids[], metric}` | `{benchmark_report, percentile}` | Yes | 500 |

---

## §5. Worker Structure (Code Skeleton)

```
~/projects/barberkas-aaas/
├── wrangler.toml
├── package.json
├── src/
│   ├── index.ts                  # Main worker entry (Hono app)
│   ├── middleware/
│   │   ├── tenant.ts             # Extract + validate tenant from subdomain
│   │   ├── auth.ts               # JWT verify
│   │   ├── quota.ts              # Per-tenant quota check
│   │   └── ratelimit.ts          # Per-tenant rate limit (KV-backed)
│   ├── routes/
│   │   ├── public.ts             # Landing, signup, marketing
│   │   ├── app.ts                # PWA shell
│   │   ├── api_v1.ts             # API routes
│   │   ├── webhooks.ts           # Fonnte, Duitku, etc
│   │   └── admin.ts              # SparkMind admin (super-tenant)
│   ├── agents/
│   │   ├── _base.ts              # Agent base class
│   │   ├── stylist.ts
│   │   ├── content.ts
│   │   ├── trend.ts
│   │   ├── pricing.ts
│   │   ├── booking.ts
│   │   ├── inventory.ts
│   │   ├── customer.ts
│   │   ├── capster_perf.ts
│   │   └── multi_tenant_ops.ts
│   ├── lib/
│   │   ├── llm.ts                # Groq + OpenRouter abstraction
│   │   ├── wa.ts                 # Fonnte + Wablas abstraction
│   │   ├── pg.ts                 # Duitku via Oasis BI Pro MoR
│   │   ├── d1.ts                 # D1 query helpers
│   │   └── analytics.ts          # Workers Analytics Engine
│   └── types/
│       └── index.ts
├── migrations/
│   └── 0001_init.sql
└── public/                       # Static PWA assets
    └── index.html
```

### wrangler.toml (canonical)

```toml
name = "barberkas-aaas"
main = "src/index.ts"
compatibility_date = "2026-06-01"

[[d1_databases]]
binding = "DB"
database_name = "barberkas-prod"
database_id = "<from-cloudflare-dashboard>"

[[kv_namespaces]]
binding = "KV"
id = "<kv-id>"

[[r2_buckets]]
binding = "MEDIA"
bucket_name = "barberkas-media"

[[queues.producers]]
binding = "AGENT_QUEUE"
queue = "barberkas-agent-jobs"

[[queues.consumers]]
queue = "barberkas-agent-jobs"
max_batch_size = 10
max_batch_timeout = 30

[triggers]
crons = ["0 1 * * *", "0 3 * * 0"]  # daily 01:00 UTC, weekly Sun 03:00 UTC

[vars]
ENVIRONMENT = "production"

# Secrets via `wrangler secret put`:
#  GROQ_API_KEY
#  OPENROUTER_API_KEY
#  FONNTE_TOKEN
#  WABLAS_TOKEN
#  DUITKU_MERCHANT_KEY (via Oasis BI Pro)
#  JWT_SECRET
```

---

## §6. Request Lifecycle (Agent Call Example)

```
1. Customer's WA → Fonnte webhook → POST /webhooks/fonnte
2. Worker extracts: from_phone, body, tenant_id (via Fonnte device → tenant map)
3. Middleware: validate tenant, check tier, check quota
4. Route to Booking Curator agent
5. Agent.call(ctx, {body, from_phone}):
   a. NLU classify intent (Groq llama-3.3-70b)
   b. If "book" intent → query D1 services + check capster avail
   c. Create booking row
   d. Compose confirmation message
6. Send confirmation via Fonnte (queued for delivery)
7. Log agent_call row (audit + billing)
8. Update analytics counter
9. Return 200 to Fonnte webhook (within 30s SLA)
```

Latency budget: <3s p95 untuk agent call. <500ms p95 untuk web app non-agent route.

---

## §7. Multi-LLM Abstraction (Critical for Cost + Resilience)

```typescript
// src/lib/llm.ts
type LLMProvider = 'groq' | 'openrouter' | 'workers_ai';

interface LLMCall {
  provider?: LLMProvider;   // optional override
  model?: string;
  messages: ChatMessage[];
  max_tokens?: number;
  temperature?: number;
}

async function llm(call: LLMCall, ctx: TenantContext): Promise<LLMResponse> {
  const provider = call.provider ?? selectProvider(ctx, call);
  // 1. Try primary
  // 2. On fail (rate limit, 5xx) → fallback chain
  //    Groq → OpenRouter → Workers AI
  // 3. Log cost + latency to agent_calls
  // ...
}
```

**Why**: Groq affordable now (Rp 50/call avg) but single vendor risk. OpenRouter as universal fallback. Workers AI for image / embeddings native edge.

---

## §8. Payment Flow (Duitku via Oasis BI Pro MoR)

```
Merchant signup → Trial (14d)
                ↓
Day 14: invoice generated → push WA reminder
                ↓
Merchant click "Bayar" → redirect to pay.oasis-bi-pro.web.id?invoice_id=...
                ↓
Duitku PG (QRIS / VA / E-wallet / Credit Card)
                ↓
Webhook callback → Worker → mark invoice paid → activate tier
                ↓
Receipt PDF generated → R2 → WA send link
```

**Critical**: Webhook idempotency via `duitku_ref` unique constraint. Replay-safe.

---

## §9. Security Posture

| Vector | Mitigation |
|---|---|
| Tenant cross-contamination | Row-level filter middleware (mandatory) + per-tenant KV namespace + R2 prefix |
| Auth | JWT (HS256) signed by Worker secret, 24h expiry, refresh via WA OTP |
| SQL injection | Drizzle ORM / parameterized queries only |
| WA hijack | Fonnte device fingerprint + signed webhook payload verification |
| Duitku replay | `duitku_ref` unique + signature verify |
| Agent prompt injection | System prompt sandboxed, user input sanitized, output filter regex |
| Rate limit abuse | Per-tenant + per-IP via KV counters |
| Secret leak | Secrets in `wrangler secret`, never in code, audited weekly |

---

## §10. Observability

- **Workers Analytics Engine**: custom events (agent_call, booking, transaction, churn signal)
- **Logpush → R2**: 30-day archive
- **Cloudflare Email Routing**: incident alerts (>1% error rate, >5s p95 latency)
- **Per-tenant dashboard**: real-time merchant view (PWA)
- **SparkMind admin**: cross-tenant ops dashboard (revenue, churn, agent quality)

---

## §11. Migration / Rollback Strategy

- **D1 migrations**: numbered SQL files, applied via `wrangler d1 migrations apply`
- **Worker deploys**: blue-green via Cloudflare versioning
- **Schema changes**: backward-compatible 2 versions minimum
- **Tenant data export**: on-demand JSON dump to R2, customer-accessible

**Disaster recovery**:
- D1 → daily R2 backup
- R2 → cross-region replication (Cloudflare)
- KV → ephemeral (rebuildable from D1)
- Code → GitHub `sovereign-dev/barberkas-aaas` private

---

## §12. Performance Targets

| Metric | Target | Brutal honest |
|---|---|---|
| TTFB (Indonesia) | <100ms | Cloudflare edge already handles |
| LCP | <1.5s | PWA + image lazy load |
| Agent call latency p95 | <3s | Groq dependent |
| WA → reply latency p95 | <8s | Fonnte queue + processing |
| Uptime | 99.9% | Cloudflare SLA |
| Multi-tenant scale | 500 tenant on D1 free tier | Confirmed via tests |

---

## §13. Tech Debt Acknowledged Upfront

1. **D1 free tier 5GB limit** — hit at ~500 tenant. Migration to paid D1 ($0.75/GB) or sharded multi-D1 needed by D+180.
2. **Cloudflare Workflows beta** — risk of API change. Fallback = Queues + manual orchestration.
3. **Fonnte = unofficial** — single point of WA failure. Wablas integration Sprint 1.
4. **Groq single LLM vendor** — OpenRouter Sprint 0 wajib.
5. **No native mobile app** — kalau PWA install rate <30%, revisit Sprint 3.

---

**END §04 — Master Architect**
