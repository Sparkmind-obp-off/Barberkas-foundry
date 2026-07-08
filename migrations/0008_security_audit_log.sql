-- BKF-18 — Security audit log: catat setiap request yang DITOLAK/DIPAKSA
-- karena mismatch tenant (percobaan akses/tulis lintas tenant).
-- Tidak ada UI — cek manual via: wrangler d1 execute ... "SELECT * FROM security_audit_log"

CREATE TABLE IF NOT EXISTS security_audit_log (
  id TEXT PRIMARY KEY,
  user_id TEXT,              -- users.id (NULL bila anonim)
  user_email TEXT,           -- email user login (NULL bila anonim)
  user_role TEXT,            -- owner|staff|admin|NULL
  requested_tenant TEXT,     -- tenant yang DIMINTA client (query/header/body)
  actual_tenant TEXT,        -- tenant yang SEHARUSNYA (dari sesi server)
  endpoint TEXT NOT NULL,    -- path yang diakses
  method TEXT NOT NULL,      -- GET|POST|...
  action TEXT NOT NULL,      -- denied_403 | forced_to_session | denied_401
  reason TEXT NOT NULL,      -- penjelasan singkat
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sec_audit_created ON security_audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_sec_audit_email ON security_audit_log(user_email);
