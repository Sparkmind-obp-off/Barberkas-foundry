-- BarberKas AaaS — Outcome Foundry layer (SSOT Batch 5: B5-02 §6 DoO, B5-03 pricing, B5-04 pipeline F0-F7)
-- "Tambah, jangan hancurkan" (B4-05 §1): tabel baru di atas skema kasir/booking yang sudah ada.

-- F0/F1 INTAKE → SCOPE: tiket masuk + klasifikasi outcome SKU + Truth-Lock feasibility.
CREATE TABLE IF NOT EXISTS intake_tickets (
  id TEXT PRIMARY KEY,
  tenant_id TEXT,                          -- NULL bila prospek baru (belum jadi tenant)
  shop_name TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  contact_name TEXT,
  problem TEXT NOT NULL,                    -- masalah bisnis (input pembeli)
  sku_slug TEXT,                            -- hasil klasifikasi outcome (F0 gate)
  delivery_mode TEXT,                       -- diy|dwy|dfy (F1 scope)
  doo_json TEXT,                            -- Definition of Outcome (checklist, F1)
  feasible INTEGER DEFAULT 1,               -- Truth-Lock: bisa di-deliver?
  feasible_reason TEXT,
  status TEXT NOT NULL DEFAULT 'intake',    -- intake|scoped|paid|assembling|deployed|proof|onboarded|done|rejected
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- F2 PAY → F5 PROOF: order = unit outcome yang dibayar + dilacak sampai DoO terpenuhi.
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  tenant_id TEXT,
  ticket_id TEXT,
  sku_slug TEXT NOT NULL,
  sku_name TEXT NOT NULL,
  tier TEXT NOT NULL,                       -- education|vertical|subscription|high-ticket
  delivery_mode TEXT NOT NULL,              -- diy|dwy|dfy
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'IDR',
  billing TEXT NOT NULL DEFAULT 'one_time', -- one_time|subscription
  -- MoR (Oasis BI Pro / Duitku) — Lapis 3 rel uang
  mor_provider TEXT DEFAULT 'oasis-bi-pro',
  mor_ref TEXT,                             -- duitku reference
  payment_status TEXT NOT NULL DEFAULT 'pending', -- pending|paid|failed|refunded
  paid_at INTEGER,
  -- Proof-of-Outcome (B5-04 §3)
  outcome_proof_url TEXT,
  tto_days INTEGER,                         -- Time-to-Outcome (hari)
  doo_passed INTEGER DEFAULT 0,             -- DoO gate lulus?
  status TEXT NOT NULL DEFAULT 'pending',   -- pending|assembling|deployed|proof|done|cancelled
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Proof-of-Outcome artefak (B5-04 §3) — bukti = produk.
CREATE TABLE IF NOT EXISTS outcome_proofs (
  id TEXT PRIMARY KEY,
  tenant_id TEXT,
  order_id TEXT,
  kind TEXT NOT NULL,                       -- url|screenshot|metric|acceptance|invoice
  label TEXT NOT NULL,
  value TEXT NOT NULL,                      -- URL / angka / catatan
  created_at INTEGER NOT NULL
);

-- brand_ledger (MoR disclosure / Lapis 3) — catat tiap pembayaran lewat MoR.
CREATE TABLE IF NOT EXISTS brand_ledger (
  id TEXT PRIMARY KEY,
  tenant_id TEXT,
  order_id TEXT,
  brand TEXT NOT NULL DEFAULT 'BarberKas',
  mor TEXT NOT NULL DEFAULT 'Oasis BI Pro',
  amount_cents INTEGER NOT NULL,
  fee_cents INTEGER DEFAULT 0,
  net_cents INTEGER DEFAULT 0,
  duitku_ref TEXT,
  disclosure TEXT,                          -- teks disclosure MoR
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_intake_status ON intake_tickets(status, created_at);
CREATE INDEX IF NOT EXISTS idx_orders_tenant ON orders(tenant_id, created_at);
CREATE INDEX IF NOT EXISTS idx_orders_payment ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_proofs_order ON outcome_proofs(order_id);
CREATE INDEX IF NOT EXISTS idx_ledger_tenant ON brand_ledger(tenant_id, created_at);
