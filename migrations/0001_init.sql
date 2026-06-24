-- BarberKas AaaS — Canonical D1 Schema (Master Architect §3)
-- Multi-tenant: every table carries tenant_id for row-level isolation.

-- Tenants
CREATE TABLE IF NOT EXISTS tenants (
  id TEXT PRIMARY KEY,                    -- UUID
  subdomain TEXT UNIQUE NOT NULL,         -- e.g., "alfacut"
  shop_name TEXT NOT NULL,
  owner_phone TEXT NOT NULL,
  owner_email TEXT,
  tier TEXT NOT NULL DEFAULT 'free',      -- free|starter|pro|enterprise
  status TEXT NOT NULL DEFAULT 'trial',   -- trial|active|suspended|churned
  trial_ends_at INTEGER,
  -- Outcome Foundry telemetry (B5-04 §6)
  outcome_proof_url TEXT,
  tto_days INTEGER,
  delivery_mode TEXT,                     -- diy|dwy|dfy
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Capsters (barber profile per shop)
CREATE TABLE IF NOT EXISTS capsters (
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
CREATE TABLE IF NOT EXISTS services (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  price_cents INTEGER NOT NULL,
  duration_min INTEGER DEFAULT 30,
  active INTEGER DEFAULT 1,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Customers
CREATE TABLE IF NOT EXISTS customers (
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
  created_at INTEGER NOT NULL,
  UNIQUE(tenant_id, phone),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Transactions
CREATE TABLE IF NOT EXISTS transactions (
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
CREATE TABLE IF NOT EXISTS bookings (
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
CREATE TABLE IF NOT EXISTS agent_calls (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  agent_type TEXT NOT NULL,               -- stylist|content|trend|...
  input_summary TEXT,
  output_summary TEXT,
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
CREATE TABLE IF NOT EXISTS wa_messages (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  direction TEXT NOT NULL,                -- in|out
  phone TEXT NOT NULL,
  body TEXT,
  agent_type TEXT,
  status TEXT,
  fonnte_id TEXT,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Billing
CREATE TABLE IF NOT EXISTS invoices (
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
CREATE INDEX IF NOT EXISTS idx_transactions_tenant_date ON transactions(tenant_id, created_at);
CREATE INDEX IF NOT EXISTS idx_bookings_tenant_scheduled ON bookings(tenant_id, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_customers_tenant_phone ON customers(tenant_id, phone);
CREATE INDEX IF NOT EXISTS idx_agent_calls_tenant_date ON agent_calls(tenant_id, created_at);
CREATE INDEX IF NOT EXISTS idx_services_tenant ON services(tenant_id);
CREATE INDEX IF NOT EXISTS idx_capsters_tenant ON capsters(tenant_id);
