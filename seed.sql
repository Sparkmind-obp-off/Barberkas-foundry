-- BarberKas AaaS — Seed data (demo tenant "alfacut")
-- Truth-Lock: data demo realistis barbershop UMKM Purwokerto.

-- Demo tenant
INSERT OR IGNORE INTO tenants (id, subdomain, shop_name, owner_phone, owner_email, tier, status, trial_ends_at, delivery_mode, created_at, updated_at)
VALUES ('t_alfacut', 'alfacut', 'Barbershop AlfaCut', '6281234567890', 'owner@alfacut.id', 'pro', 'active', NULL, 'dwy', 1748000000000, 1748000000000);

INSERT OR IGNORE INTO tenants (id, subdomain, shop_name, owner_phone, owner_email, tier, status, trial_ends_at, delivery_mode, created_at, updated_at)
VALUES ('t_scissor7', 'scissor7', 'Scissor7 Barber', '6281298765432', 'hi@scissor7.id', 'starter', 'trial', 1751000000000, 'diy', 1748500000000, 1748500000000);

-- Capsters (alfacut)
INSERT OR IGNORE INTO capsters (id, tenant_id, name, phone, commission_pct, active, created_at) VALUES
  ('c_andre', 't_alfacut', 'Andre', '6281211110001', 50.0, 1, 1748000000000),
  ('c_bayu',  't_alfacut', 'Bayu',  '6281211110002', 45.0, 1, 1748000000000),
  ('c_rizki', 't_alfacut', 'Rizki', '6281211110003', 50.0, 1, 1748000000000);

-- Services (alfacut)
INSERT OR IGNORE INTO services (id, tenant_id, name, price_cents, duration_min, active) VALUES
  ('s_cucipotong', 't_alfacut', 'Cuci Potong',     3500000, 30, 1),
  ('s_pomade',     't_alfacut', 'Pomade Style',     2500000, 20, 1),
  ('s_coloring',   't_alfacut', 'Hair Coloring',   12000000, 90, 1),
  ('s_kidscut',    't_alfacut', 'Kids Cut',         2500000, 25, 1),
  ('s_shaving',    't_alfacut', 'Royal Shaving',    4000000, 30, 1);

-- Customers (alfacut)
INSERT OR IGNORE INTO customers (id, tenant_id, name, phone, preferred_capster_id, last_visit_at, total_spent_cents, visit_count, notes, created_at) VALUES
  ('cu_dimas',  't_alfacut', 'Dimas Pratama', '6281333330001', 'c_andre', 1749600000000, 21000000, 6, 'Suka fade low, pakai pomade matte', 1745000000000),
  ('cu_galih',  't_alfacut', 'Galih Saputra', '6281333330002', 'c_bayu',  1749000000000, 12000000, 3, 'Coloring tiap 2 bulan', 1745500000000),
  ('cu_rendi',  't_alfacut', 'Rendi W',       '6281333330003', NULL,      1748800000000,  7000000, 2, 'Walk-in, belum loyal', 1748000000000),
  ('cu_yoga',   't_alfacut', 'Yoga Adi',      '6281333330004', 'c_andre', 1749700000000, 35000000, 9, 'VIP, langganan shaving', 1744000000000);

-- Transactions (alfacut) — recent
INSERT OR IGNORE INTO transactions (id, tenant_id, customer_id, capster_id, service_ids, total_cents, payment_method, status, created_at) VALUES
  ('tx_001', 't_alfacut', 'cu_dimas', 'c_andre', '["s_cucipotong","s_pomade"]', 6000000, 'qris', 'completed', 1749600000000),
  ('tx_002', 't_alfacut', 'cu_galih', 'c_bayu',  '["s_coloring"]',              12000000, 'transfer', 'completed', 1749000000000),
  ('tx_003', 't_alfacut', 'cu_rendi', 'c_rizki', '["s_cucipotong"]',             3500000, 'cash', 'completed', 1748800000000),
  ('tx_004', 't_alfacut', 'cu_yoga',  'c_andre', '["s_shaving","s_cucipotong"]', 7500000, 'qris', 'completed', 1749700000000),
  ('tx_005', 't_alfacut', 'cu_dimas', 'c_andre', '["s_cucipotong"]',             3500000, 'cash', 'completed', 1749680000000);

-- Bookings (alfacut)
INSERT OR IGNORE INTO bookings (id, tenant_id, customer_id, capster_id, scheduled_at, service_ids, status, source, created_at) VALUES
  ('bk_001', 't_alfacut', 'cu_dimas', 'c_andre', 1749900000000, '["s_cucipotong"]', 'confirmed', 'wa', 1749850000000),
  ('bk_002', 't_alfacut', 'cu_galih', 'c_bayu',  1749950000000, '["s_coloring"]',   'pending',   'wa', 1749860000000),
  ('bk_003', 't_alfacut', 'cu_yoga',  'c_andre', 1750010000000, '["s_shaving"]',    'confirmed', 'walkin', 1749870000000);

-- Agent calls log (alfacut) — proof of outcome
INSERT OR IGNORE INTO agent_calls (id, tenant_id, agent_type, input_summary, output_summary, cost_cents, duration_ms, status, created_at) VALUES
  ('ag_001', 't_alfacut', 'booking', 'WA: "bro bisa potong jam 3 sore?"', 'Booking dibuat untuk Dimas jam 15:00', 10, 1200, 'success', 1749850000000),
  ('ag_002', 't_alfacut', 'content', 'IG caption promo weekend', 'Caption + 8 hashtag dibuat', 50, 2100, 'success', 1749600000000),
  ('ag_003', 't_alfacut', 'stylist', 'Rekomendasi cut untuk Yoga', 'Pompadour fade + matte pomade', 20, 1500, 'success', 1749700000000);
