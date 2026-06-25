# Inject-Snippet — Siap-Tempel untuk Boot Sesi Baru
## skill: sovereign-barberkas-foundry-context-injection · reference

> Salin salah satu snippet di bawah ke **pesan pertama** sesi baru. Snippet A = manual cepat;
> Snippet B = otomatis via script (disarankan).

---

## Snippet A — Boot manual (tanpa terminal)

```text
@Sovereign-Architect v8.0 — BARBERKAS-FOUNDRY
Aktifkan skill: sovereign-barberkas-foundry-context-injection.
1. Muat & patuhi: docs/ssot/foundry-master/FM-01-MASTER-ARCHITECT-PROMPT-DOC.md (§2 prompt induk).
2. Baca handoff terbaru di docs/ssot/foundry-master/handoffs/ → ambil NEXT STEP.
3. Patuh 6 hard-constraint + urutan wajib (Truth-Lock → resume → sprint-kas → execute → verify → handoff).
4. GATE HITL: payment/legal/secret/domain/harga = minta izin owner.
MISI SESI: {{tulis misi konkret}}
Mulai dari langkah 1 (Truth-Lock). Brutal honest.
```

---

## Snippet B — Boot otomatis (disarankan, via terminal)

```text
@Sovereign-Architect v8.0 — BARBERKAS-FOUNDRY
Aktifkan skill: sovereign-barberkas-foundry-context-injection.

Langkah 0 (jalankan dulu, lalu suntik output ke konteks):
  cd <root repo Barberkas-foundry>
  python3 docs/ssot/foundry-master/resume_boot.py --json

Lalu:
1. Patuhi FM-01 §2 (prompt induk) + 6 hard-constraint.
2. Gunakan output resume (git, handoff terakhir, peta SSOT, status produk) sebagai kebenaran.
3. Ikuti urutan wajib; tulis SPRINT-KAS (FM-03) sebelum eksekusi.
4. GATE HITL: payment/legal/secret/domain/harga = izin owner.
MISI SESI: {{tulis misi konkret}}
```

---

## Snippet C — Re-inject saat agent drift

```text
STOP — re-align doctrine.
Aktifkan ulang: sovereign-barberkas-foundry-context-injection.
Kamu mulai keluar jalur (jual "bahan/skill" / jargon / klaim tanpa bukti).
Patuhi kembali FM-01 §PERAN: rakit OUTCOME, bukan jual bahan.
Tegakkan Truth-Lock: verifikasi sebelum klaim apa pun.
Lanjutkan misi terakhir dari handoff terbaru.
```

---

## Catatan

- Ganti `{{...}}` dengan konteks nyata.
- Snippet ini **public-safe** (tidak memuat secret).
- Bila Python/terminal tak tersedia → pakai Snippet A + fallback markdown di FM-04 §5.
