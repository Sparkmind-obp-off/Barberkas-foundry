-- BarberKas — Tenant real: Cut O'Clock Barbershop Semarang (lead pertama, BKF-12)
-- Sumber data (riset publik, Truth-Lock):
--   IG @cutoclock.id — "Premium Barbershop", Daily 9AM-9PM (last order 8.30PM), EST. 2023
--   Alamat: Jl. Telagamas Raya No.B10, Panggung Lor, Semarang Utara (linktr.ee/cutoclock.id)
--   Telp: 0815-4894-6625 (kumparan.com rekomendasi barbershop Semarang, Jan 2025)
--   Capster (kredit di post IG/TikTok resmi): Ardi, Pras, Nanda, AL
--   Layanan (kumparan): men/kids haircut, hair tattoo, beard trim, shaving,
--     basic & highlight coloring, perm, hair spa.
-- Harga = ESTIMASI wajar (patokan promo grand opening 40K, 2023) — dikonfirmasi owner saat onboarding.
-- TANPA transaksi/customer fiktif: dashboard mulai bersih, owner catat transaksi pertama sendiri.

-- Tenant (tier pro, status trial 14 hari — full feature explorable)
INSERT OR IGNORE INTO tenants (id, subdomain, shop_name, owner_phone, owner_email, tier, status, trial_ends_at, delivery_mode, created_at, updated_at)
VALUES ('t_cutoclock', 'cutoclock', 'Cut O''Clock Barbershop', '6281548946625', NULL, 'pro', 'trial', 1784419200000, 'dwy', 1783209600000, 1783209600000);

-- Capsters (nama real dari kredit post resmi; phone menyusul saat onboarding)
INSERT OR IGNORE INTO capsters (id, tenant_id, name, phone, commission_pct, active, created_at) VALUES
  ('c_coc_ardi',  't_cutoclock', 'Ardi',  NULL, 50.0, 1, 1783209600000),
  ('c_coc_pras',  't_cutoclock', 'Pras',  NULL, 50.0, 1, 1783209600000),
  ('c_coc_nanda', 't_cutoclock', 'Nanda', NULL, 50.0, 1, 1783209600000),
  ('c_coc_al',    't_cutoclock', 'AL',    NULL, 50.0, 1, 1783209600000);

-- Services (menu real, harga estimasi — price_cents = Rp x 100)
INSERT OR IGNORE INTO services (id, tenant_id, name, price_cents, duration_min, active) VALUES
  ('s_coc_haircut',   't_cutoclock', 'Men Haircut',                  5000000,  45, 1),
  ('s_coc_kids',      't_cutoclock', 'Kids Haircut',                 4000000,  30, 1),
  ('s_coc_beard',     't_cutoclock', 'Beard Trimming',               2500000,  15, 1),
  ('s_coc_shaving',   't_cutoclock', 'Shaving',                      3000000,  20, 1),
  ('s_coc_tattoo',    't_cutoclock', 'Hair Tattoo',                  2000000,  15, 1),
  ('s_coc_coloring',  't_cutoclock', 'Basic Hair Coloring',         15000000,  90, 1),
  ('s_coc_highlight', 't_cutoclock', 'Highlight / Fashion Coloring',25000000, 120, 1),
  ('s_coc_perm',      't_cutoclock', 'Perm',                        25000000, 120, 1),
  ('s_coc_hairspa',   't_cutoclock', 'Hair Spa',                     7500000,  45, 1);
