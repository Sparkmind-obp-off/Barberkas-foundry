-- BarberKas AaaS — R4: Retain & Expand layer (BKF-08)
-- Langganan (Care Plan / AI Staff) + reminder engine + upsell high-ticket.
-- Selaras B5-03 (retain→expand), 03-MONETIZATION (MRR/LTV). Truth-Lock: state nyata di D1.

-- ── subscriptions: langganan aktif per-tenant (sumber MRR) ──────────
CREATE TABLE IF NOT EXISTS subscriptions (
  id TEXT PRIMARY KEY,
  tenant_id TEXT,                           -- boleh null (prospek belum jadi tenant)
  order_id TEXT,                            -- order asal (checkout MoR) bila ada
  sku_slug TEXT NOT NULL,                   -- mis. sub-starter|sub-pro|care-plan|ai-staff-addon|sub-enterprise
  sku_name TEXT NOT NULL,
  tier TEXT NOT NULL DEFAULT 'subscription',
  amount_cents INTEGER NOT NULL,            -- harga/bln (IDR cents) — sumber kebenaran = skus.ts
  currency TEXT NOT NULL DEFAULT 'IDR',
  billing_cycle TEXT NOT NULL DEFAULT 'monthly', -- monthly (default)
  status TEXT NOT NULL DEFAULT 'active',    -- active|past_due|paused|cancelled
  qty INTEGER NOT NULL DEFAULT 1,           -- utk ai-staff-addon (per staff)
  started_at INTEGER NOT NULL,
  current_period_start INTEGER NOT NULL,
  next_charge_at INTEGER NOT NULL,          -- jatuh tempo berikutnya (epoch ms)
  cancelled_at INTEGER,
  cancel_reason TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_subs_tenant ON subscriptions(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_subs_next_charge ON subscriptions(status, next_charge_at);

-- ── reminders: jadwal reminder (renewal/dunning/onboarding/winback) ──
CREATE TABLE IF NOT EXISTS reminders (
  id TEXT PRIMARY KEY,
  tenant_id TEXT,
  subscription_id TEXT,
  kind TEXT NOT NULL,                       -- renewal|dunning|onboarding|winback
  channel TEXT NOT NULL DEFAULT 'whatsapp', -- whatsapp (Fonnte) — kirim nyata terpisah
  due_at INTEGER NOT NULL,                  -- kapan harus dikirim (epoch ms)
  message TEXT NOT NULL,                    -- isi pesan (Bahasa Indonesia, Truth-Lock)
  status TEXT NOT NULL DEFAULT 'scheduled', -- scheduled|sent|skipped|cancelled
  sent_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_reminders_due ON reminders(status, due_at);
CREATE INDEX IF NOT EXISTS idx_reminders_sub ON reminders(subscription_id);

-- ── upsell_events: rekomendasi expand high-ticket + respon ──────────
CREATE TABLE IF NOT EXISTS upsell_events (
  id TEXT PRIMARY KEY,
  tenant_id TEXT,
  subscription_id TEXT,
  from_sku TEXT,                            -- langganan saat ini
  to_sku TEXT NOT NULL,                     -- next-best-action SKU (expand)
  reason TEXT NOT NULL,                     -- alasan rule-based (deterministik)
  delta_cents INTEGER NOT NULL DEFAULT 0,   -- selisih nilai/bln atau nilai high-ticket
  status TEXT NOT NULL DEFAULT 'suggested', -- suggested|accepted|declined|expired
  responded_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_upsell_tenant ON upsell_events(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_upsell_sub ON upsell_events(subscription_id);
