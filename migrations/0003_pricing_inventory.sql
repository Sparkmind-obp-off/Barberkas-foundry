-- 0003 — Pricing & Inventory Curator support (Agent #4 & #5, Sprint Plan §S2)

-- Produk/stok yang dikelola Inventory Curator (pomade, tools, dll)
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT,                          -- pomade|tools|consumable|retail
  stock_qty INTEGER NOT NULL DEFAULT 0,
  reorder_point INTEGER NOT NULL DEFAULT 5,
  unit_cost_cents INTEGER NOT NULL DEFAULT 0,
  retail_price_cents INTEGER NOT NULL DEFAULT 0,
  avg_daily_usage REAL NOT NULL DEFAULT 0,
  active INTEGER DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);
CREATE INDEX IF NOT EXISTS idx_products_tenant ON products(tenant_id);

-- Rekomendasi harga yang diusulkan Pricing Curator (audit + adopsi)
CREATE TABLE IF NOT EXISTS pricing_suggestions (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  service_id TEXT,
  current_price_cents INTEGER NOT NULL,
  suggested_price_cents INTEGER NOT NULL,
  rationale TEXT,
  elasticity_note TEXT,
  status TEXT DEFAULT 'proposed',         -- proposed|adopted|rejected
  created_at INTEGER NOT NULL,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);
CREATE INDEX IF NOT EXISTS idx_pricing_tenant ON pricing_suggestions(tenant_id);

-- Faktur/receipt PDF artefak (disimpan di R2; baris ini = metadata + key)
CREATE TABLE IF NOT EXISTS receipts (
  id TEXT PRIMARY KEY,
  tenant_id TEXT,
  order_id TEXT,
  r2_key TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_receipts_order ON receipts(order_id);
