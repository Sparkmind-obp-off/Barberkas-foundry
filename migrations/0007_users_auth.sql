-- BKF-14 — Auth Clerk.com: tabel users → tenant mapping.
-- Sesuai review: "cukup login sebagai X, cuma liat data X" — tanpa sistem role rumit.
-- 1 user (email Google/email OTP via Clerk) → 1 tenant (barbershop).
-- role: owner|staff|admin (admin = operator BarberKas, boleh lintas tenant).

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  clerk_user_id TEXT UNIQUE,               -- sub dari session JWT Clerk (diisi/backfill saat login pertama)
  email TEXT UNIQUE NOT NULL COLLATE NOCASE,
  name TEXT,
  tenant_id TEXT REFERENCES tenants(id),   -- NULL = belum di-map ke barbershop manapun
  role TEXT NOT NULL DEFAULT 'owner',      -- owner|staff|admin
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_tenant ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_clerk ON users(clerk_user_id);
