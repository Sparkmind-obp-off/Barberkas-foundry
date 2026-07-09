-- BarberKas AaaS — 0010: Observability outbound WA (BKF-21)
-- Root cause "kenapa WA tidak terbalas" selama ini TIDAK terlihat karena
-- error dari Fonnte tidak pernah disimpan — wa_messages cuma punya status
-- 'failed' tanpa alasan. Dua kolom baru:
--   error          TEXT    — reason penolakan Fonnte / error fetch (NULL bila sukses)
--   sanitize_level INTEGER — level sanitasi yang terpakai saat kirim (0/1/2, BKF-20)
ALTER TABLE wa_messages ADD COLUMN error TEXT;
ALTER TABLE wa_messages ADD COLUMN sanitize_level INTEGER;
