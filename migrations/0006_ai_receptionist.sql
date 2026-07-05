-- BarberKas AaaS — 0006: AI Resepsionis v2 (BKF-13)
-- Pivot value (riset 4-file): bukan jual "website", tapi AI agent booking yang
-- lebih pintar dari auto-reply form kosong — cek slot kosong per-capster real-time,
-- percakapan multi-turn, reschedule/batal tanpa admin, reminder H-1 + retensi 3-4 minggu.

-- ── Jam operasional & granularitas slot per-tenant ──────────────────
ALTER TABLE tenants ADD COLUMN open_hour INTEGER NOT NULL DEFAULT 9;    -- buka (jam lokal WIB)
ALTER TABLE tenants ADD COLUMN close_hour INTEGER NOT NULL DEFAULT 21;  -- tutup
ALTER TABLE tenants ADD COLUMN slot_minutes INTEGER NOT NULL DEFAULT 30; -- durasi 1 slot
ALTER TABLE tenants ADD COLUMN retention_days INTEGER NOT NULL DEFAULT 25; -- hari sejak kunjungan terakhir → WA "waktunya potong lagi"

-- ── State percakapan WA multi-turn (FSM) per (tenant, phone) ────────
CREATE TABLE IF NOT EXISTS wa_conversations (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  phone TEXT NOT NULL,                     -- 62…
  state TEXT NOT NULL DEFAULT 'idle',      -- idle|awaiting_service|awaiting_date|awaiting_slot|awaiting_cancel_confirm|awaiting_reslot
  context TEXT,                            -- JSON: {service_id,date_ms,slots:[…],booking_id,…}
  expires_at INTEGER NOT NULL,             -- percakapan kadaluarsa (default 30 menit idle)
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(tenant_id, phone),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);
CREATE INDEX IF NOT EXISTS idx_waconv_tenant_phone ON wa_conversations(tenant_id, phone);

-- ── Reminder customer (beda dari reminders langganan SaaS di 0004) ──
-- kind: h1_booking  → H-1 sebelum jadwal booking
--       retention   → 3-4 minggu sejak kunjungan terakhir, ajak balik
CREATE TABLE IF NOT EXISTS customer_reminders (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  customer_id TEXT,
  booking_id TEXT,
  phone TEXT NOT NULL,
  kind TEXT NOT NULL,                      -- h1_booking|retention
  due_at INTEGER NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled',-- scheduled|sent|stub|failed|cancelled
  fonnte_id TEXT,
  sent_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);
CREATE INDEX IF NOT EXISTS idx_custrem_due ON customer_reminders(status, due_at);
CREATE INDEX IF NOT EXISTS idx_custrem_tenant ON customer_reminders(tenant_id, kind, status);
CREATE INDEX IF NOT EXISTS idx_custrem_booking ON customer_reminders(booking_id);
