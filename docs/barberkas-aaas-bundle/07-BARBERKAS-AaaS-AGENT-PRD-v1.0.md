# 07-BARBERKAS-AaaS-AGENT-PRD-v1.0.md

**OWNER**: Reza Estes / Haidar Faras — "Sovereign AI Dev"
**DOCTRINE**: MASTER-ARCHITECT-PROMPT v5.0 + v7.0 + v8.0 OVERRIDE-LOCK
**ALIGNMENT**: SSOT Batch 5 (Outcome Foundry — agent = mesin, "AI Staff" = outcome langganan) — *upgrade v1.1*
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

## §OF. Outcome Foundry Framing — "Agent = Mesin, AI Staff = Outcome" (Batch 5 — v1.1)

> **Pergeseran framing kanonik**: 9 Curator agent di bawah adalah **mesin (Lapis 2)**, bukan objek jual. Yang dijual ke pasar = **outcome berkelanjutan** yang dirakit dari agent → dikemas sebagai **"AI Staff" (langganan)** dan kontribusi ke **outcome vertical "Kasir+Booking LIVE"** (B5-02/B5-03).

| Outcome yang dijual (Lapis 1) | Agent mesin (Lapis 2) | Tier OaaS | Value-metric deterministik |
|---|---|---|---|
| **AI Staff — Resepsionis** | Booking Curator | subscription | tiket WA dibalas + booking masuk |
| **AI Staff — Marketing** | Content + Trend Curator | subscription | N konten terjadwal + post terbit |
| **AI Staff — Admin/Ops** | Pricing + Inventory + Capster Perf | subscription | laporan + reorder alert + analitik |
| **AI Staff — CRM** | Customer Curator | subscription | segmentasi + re-engage terkirim |
| **Insight Stylist** (fitur outcome vertical) | Stylist Curator | vertical/Pro | rekomendasi cut dipakai capster |
| **Cross-shop Ops** (high-ticket chain) | Multi-Tenant Ops | high-ticket | benchmark report per outlet |

**Kontrak kualitas (DoO) per AI Staff**: fungsi **berjalan tiap bulan** (output terbukti) — BUKAN jaminan revenue customer (B5-03 §5). Truth-Lock di §12.

> Setiap spec agent di bawah **tetap berlaku** sebagai blueprint mesin. Tabel ini hanya menambah *cara mengemas & menjualnya sebagai outcome*. *Tambah, jangan hancurkan.*

---

## §0. Overview — 9 Agents = "9 Curator as One"

| # | Agent | One-Liner | Tier Available | Sprint Intro |
|---|---|---|---|---|
| 1 | **Stylist Curator** | Cut style recommendation per customer history + occasion | Free(preview)/Pro/Ent | Sprint 0 |
| 2 | **Content Curator** | Auto IG/TikTok caption + image per shop voice | Pro/Ent | Sprint 1 |
| 3 | **Booking Curator** | WA NLU intent → booking + reminder + reschedule | Pro/Ent | Sprint 1 |
| 4 | **Trend Curator** | Indonesia hairstyle trends scraping + insight | Pro(view)/Ent(deep) | Sprint 2 |
| 5 | **Pricing Curator** | Dynamic pricing per service based on elasticity | Pro/Ent | Sprint 2 |
| 6 | **Inventory Curator** | Pomade/tools stock forecast + reorder alert | Pro/Ent | Sprint 2 |
| 7 | **Customer Curator** | Segment + loyalty + auto re-engage WA | Pro/Ent | Sprint 3 |
| 8 | **Capster Performance Curator** | Per-barber metrics + commission + coaching | Pro(basic)/Ent(deep) | Sprint 3 |
| 9 | **Multi-Tenant Ops Curator** | Cross-shop benchmark (chain only) | Enterprise only | Sprint 4 |

---

## §1. AGENT 1 — Stylist Curator

### Purpose
Recommend cut/style untuk customer datang berdasarkan history, occasion, dan preferensi capster shop tersebut.

### Inputs
```typescript
{
  customer_id: string;        // optional, null for walk-in
  occasion?: 'work'|'wedding'|'casual'|'sport'|'kondangan';
  hair_type?: 'straight'|'wavy'|'curly'|'coarse';
  face_shape?: 'oval'|'round'|'square'|'long';
  budget_cents?: number;      // optional
  capster_id?: string;        // skilled preferred
}
```

### Outputs
```typescript
{
  recommendations: Array<{
    cut_name: string;          // e.g., "Mid Fade with Texture"
    description: string;       // 2-3 sentence
    duration_min: number;
    price_estimate_cents: number;
    inspiration_img_url: string;  // R2-stored generated img
    why: string;               // reasoning untuk capster
  }>;
  notes_for_capster?: string;
}
```

### LLM Prompt (System)
```
You are a master Indonesian barbershop curator. Recommend 3 modern, locally-relevant
hairstyles for a customer based on the input. Use Indonesian hairstyle naming where
common (e.g., "Comma Hair", "Two-Block", "French Crop"). Always include reasoning
the capster can use to up-sell or educate. Avoid trends >2 years old.
Output JSON only, no markdown.
```

### Pricing/quota
- Pro tier: 200 calls/bln included, then Rp 200/call
- Free preview: 5 calls total trial

### Safety
- No facial recognition / no biometric
- No "judging" the customer's looks
- Always offer alternatives, never single answer

---

## §2. AGENT 2 — Content Curator

### Purpose
Generate IG / TikTok caption + image untuk shop posting konten konsisten (3-5 post/week).

### Inputs
```typescript
{
  platform: 'instagram'|'tiktok'|'whatsapp_status';
  theme: 'showcase_cut'|'before_after'|'promo'|'capster_intro'|'tips_hair';
  shop_voice?: 'fun'|'professional'|'gen-z'|'classic';
  product_name?: string;
  custom_brief?: string;
}
```

### Outputs
```typescript
{
  caption: string;              // ID, with emoji + hashtags
  hashtags: string[];
  image_brief: string;          // for human capster to capture
  image_generated_url?: string; // optional AI img via Workers AI
  call_to_action: string;       // e.g., "Booking via WA klik bio"
  best_post_time?: string;      // ID timezone
}
```

### LLM Prompt
```
You are a Gen-Z-savvy Indonesian barbershop content writer. Write engaging,
not-corporate captions in Bahasa Indonesia (mix English natural if shop_voice is
gen-z). Always end with clear CTA. Use 5-8 hashtags mix branded + niche.
Keep caption <150 words. Authentic, no marketing-speak.
```

### Pricing/quota
- Pro tier: 100 calls/bln, then Rp 500/call (incl image gen)

### Safety
- No customer face without consent
- No competitor mention
- No medical claim (hair growth, etc)

---

## §3. AGENT 3 — Booking Curator

### Purpose
WA-native booking. Customer text "mau potong sabtu jam 3" → agent classify, check capster avail, confirm, set reminder.

### Inputs (from Fonnte webhook)
```typescript
{
  from_phone: string;
  message_body: string;
  tenant_id: string;
}
```

### Outputs
```typescript
{
  intent: 'book'|'cancel'|'reschedule'|'info'|'other';
  booking_id?: string;
  reply_message: string;      // ke customer via WA
  capster_assigned?: string;
  scheduled_at?: number;      // unix ts
  confidence: number;         // 0-1
}
```

### LLM Prompt
```
You are a friendly Indonesian barbershop receptionist. Parse customer WA messages
for booking intent. Extract: service requested, date/time, capster preference.
Be polite "Kak" / "Bro" appropriate. Confirm before final. If ambiguous, ask
1 clarifying question only. If time conflict, offer 2 alternatives.
```

### Pricing/quota
- Pro tier: unlimited intent classify, but external WA quota counts (Fonnte)
- Cost per call: Rp 100

### Safety
- Confirmation step required (no auto-book without "iya" from customer)
- No booking >30 days ahead (anti-spam)
- Capster commission visible to capster, not to customer

---

## §4. AGENT 4 — Trend Curator

### Purpose
Weekly Indonesia hairstyle trend report. Source: IG / TikTok scrape + LLM analyze.

### Inputs (auto-triggered weekly cron)
```typescript
{
  region: 'banyumas'|'jateng'|'jakarta'|'national';
  period: 'weekly'|'monthly';
}
```

### Outputs
```typescript
{
  top_trends: Array<{
    name: string;
    description: string;
    popularity_score: number;   // 0-100
    sample_image_urls: string[];
    target_demo: string;        // e.g., "pria 18-25 urban"
  }>;
  rising: string[];             // hashtag/keyword rising
  declining: string[];          // fading trends
  shop_action_tip: string;      // "Try ___ this week"
}
```

### Data sources
- IG hashtag scrape (#hairstylepria, #barbershopindonesia, etc) via lightweight scraper
- TikTok trending audio + hairstyle tag scrape
- LLM aggregate + dedupe + rank

### Pricing/quota
- Pro: weekly report 1/bln free, then Rp 300/call
- Enterprise: weekly auto-push WA + deep analytics

### Safety
- No copyright violation (link to source IG/TT, no re-upload)
- No fake "trending" (must have ≥X impression baseline)

---

## §5. AGENT 5 — Pricing Curator

### Purpose
Suggest optimal price per service based on historical elasticity, competitor (optional), and shop margin target.

### Inputs
```typescript
{
  service_id: string;
  current_price_cents: number;
  target_margin_pct?: number;
  competitor_price_cents?: number;   // optional, from web scrape
}
```

### Outputs
```typescript
{
  suggested_price_cents: number;
  elasticity_note: string;        // "Past 6mo: +10% price → -5% volume (net +5% revenue)"
  confidence: number;
  recommended_test: 'A/B'|'gradual'|'one-shot';
}
```

### Pricing/quota
- Pro: 20 calls/bln, then Rp 250/call

### Safety
- Conservative bias (avoid >15% price jump in one go)
- Confidence threshold (don't recommend if <0.6)

---

## §6. AGENT 6 — Inventory Curator

### Purpose
Pomade, gel, towel stock forecast. Alert reorder before stockout.

### Inputs
```typescript
{
  item_id: string;
  current_stock: number;
  usage_history_days?: number;     // default 30
}
```

### Outputs
```typescript
{
  days_until_stockout: number;
  recommended_reorder_qty: number;
  reorder_by_date: string;
  cost_estimate_cents: number;
}
```

### Pricing/quota
- Pro: 50 calls/bln, then Rp 200/call

### Safety
- Conservative reorder (avoid over-stock waste)
- Cost transparency (show calculation)

---

## §7. AGENT 7 — Customer Curator

### Purpose
Segment customer (VIP, regular, dormant, at-risk-churn). Auto compose re-engagement WA.

### Inputs
```typescript
{
  customer_id: string;
  action: 'segment'|'re-engage'|'birthday'|'loyalty_check';
}
```

### Outputs
```typescript
{
  segment: 'vip'|'regular'|'occasional'|'dormant'|'at-risk';
  loyalty_tier: 'bronze'|'silver'|'gold';
  next_best_action: string;       // e.g., "Send 'kangen?' WA"
  wa_template?: string;           // auto-composed
  suggested_offer?: {
    discount_pct?: number;
    free_addon?: string;
  };
}
```

### Pricing/quota
- Pro: 100 calls/bln, then Rp 250/call

### Safety
- No discount spam (max 1 offer/customer/month)
- Opt-out respected
- No "fake urgency" tactics

---

## §8. AGENT 8 — Capster Performance Curator

### Purpose
Per-barber analytics: revenue, NPS, repeat customer rate, coaching tip.

### Inputs
```typescript
{
  capster_id: string;
  period: 'week'|'month'|'quarter';
}
```

### Outputs
```typescript
{
  metrics: {
    total_revenue_cents: number;
    customer_count: number;
    repeat_rate_pct: number;
    avg_ticket_cents: number;
    nps?: number;
  };
  ranking_in_shop?: number;
  coaching_tip: string;        // "Coba up-sell pomade premium ke regular"
  trend: 'improving'|'stable'|'declining';
}
```

### Pricing/quota
- Pro: 10 calls/bln basic, then Rp 300/call
- Enterprise: unlimited with deep NPS integration

### Safety
- Capster privacy: only owner sees other capster comparison
- No public ranking (avoid toxic competition)
- Constructive coaching tone, not blaming

---

## §9. AGENT 9 — Multi-Tenant Ops Curator (Enterprise only)

### Purpose
Untuk chain (3+ outlet). Cross-shop benchmark, identify best practice.

### Inputs
```typescript
{
  parent_tenant_id: string;
  metric: 'revenue'|'retention'|'capster_perf'|'inventory_turnover';
  period: 'month'|'quarter';
}
```

### Outputs
```typescript
{
  benchmark_report: {
    your_avg: number;
    industry_avg?: number;       // if data anonymized OK
    best_outlet: string;
    worst_outlet: string;
    percentile: number;
  };
  best_practice_learnings: string[];
  cross_pollination_tip: string;
}
```

### Pricing/quota
- Enterprise only: 10 calls/bln, then Rp 500/call

### Safety
- Anonymized aggregation only
- Single chain owner sees own data
- Industry benchmark opt-in (merchant must agree)

---

## §10. Agent Common Specs

### Latency targets
| Agent | p95 |
|---|---|
| Booking (NLU-only) | <1.5s |
| Stylist, Customer, Capster Perf | <3s |
| Content (with image gen) | <8s |
| Trend (scrape+aggregate) | <30s (async, queued) |
| Multi-Tenant Ops | <10s |

### Quality monitoring
- Each agent has self-rating prompt at end: "Was this response useful? (1-5)"
- Auto-survey merchant 7 days after call
- Drift detection: if avg score drops >0.5 vs last month → audit

### Failure modes
- LLM timeout → fallback OpenRouter
- LLM cost spike → soft-cap notify
- Inappropriate output → safety filter regex block + retry

---

## §11. Agent Versioning

- Each agent prompt versioned: `v1.0`, `v1.1`...
- Canary deploy: 10% traffic new version → measure quality → rollout
- Rollback within <5 min if quality drop

### Version log example
```
stylist v1.0 - initial, 2026-07-15
stylist v1.1 - added "occasion" awareness, 2026-08-02
stylist v1.2 - reduce hallucination cut names, 2026-09-10
```

---

## §12. Brutal Honest Reality

1. **9 agent ambitious untuk solo dev**. Sprint 0-2 (Stylist + Content + Booking + Trend + Pricing + Inventory = 6 agent) sudah massive. Customer / Capster Perf / Multi-Tenant Sprint 3-4.

2. **LLM cost will be the #1 variable**. Track per-agent cost/call religiously. If any agent >Rp 500/call avg, deep optimize prompt + model selection.

3. **Quality > Quantity**. Better ship 3 agent excellent than 9 agent mediocre. Ruthless cut features that score <3.5 quality.

4. **Capster ownership crucial**. Each agent must answer "how does this make MY job easier?" If indirect benefit → de-prioritize.

5. **Privacy non-negotiable**. Customer data per-shop locked. No cross-tenant leak. Audit weekly.

---

**END §07 — Agent PRD**
