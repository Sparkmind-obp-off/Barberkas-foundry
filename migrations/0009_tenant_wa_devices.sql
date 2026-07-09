-- BarberKas AaaS — 0009: Mapping device Fonnte → tenant (BKF-19 Tugas 2)
-- Keamanan: webhook publik HARUS menentukan tenant dari NOMOR DEVICE PENERIMA
-- (dikontrol kita via dashboard Fonnte), BUKAN dari data yang dikirim pengirim
-- pesan (bisa dipalsukan). SATU nomor WA device = SATU tenant, tidak ambigu.

CREATE TABLE IF NOT EXISTS tenant_wa_devices (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  device_phone TEXT NOT NULL UNIQUE,   -- nomor WA device Fonnte, normalisasi 62… (UNIQUE = 1 device 1 tenant)
  label TEXT,                          -- catatan bebas ("device demo pertama", dsb)
  active INTEGER NOT NULL DEFAULT 1,   -- 0 = nonaktif → webhook dari device ini ditolak
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);
CREATE INDEX IF NOT EXISTS idx_wadev_tenant ON tenant_wa_devices(tenant_id);

-- ── Idempotency webhook (Fonnte bisa retry → jangan proses pesan sama 2x) ──
-- event_key: inboxid Fonnte bila ada, else hash(device|sender|message|timestamp).
-- UNIQUE constraint = INSERT kedua gagal → request retry dijawab OK tanpa proses ulang.
CREATE TABLE IF NOT EXISTS wa_webhook_events (
  event_key TEXT PRIMARY KEY,
  tenant_id TEXT,
  device_phone TEXT,
  sender TEXT,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_waevt_created ON wa_webhook_events(created_at);

-- ── Seed: device demo pertama → tenant cutoclock ──────────────────────
-- Nomor device Fonnte terhubung: 081558098096 → 6281558098096 (konfirmasi owner sesi BKF-19).
INSERT OR IGNORE INTO tenant_wa_devices (id, tenant_id, device_phone, label, active, created_at, updated_at)
VALUES ('wadev_coc_01', 't_cutoclock', '6281558098096', 'Device Fonnte demo pertama (BKF-19)', 1,
        strftime('%s','now')*1000, strftime('%s','now')*1000);
