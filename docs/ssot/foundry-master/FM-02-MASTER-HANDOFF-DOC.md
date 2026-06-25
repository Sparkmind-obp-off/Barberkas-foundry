# FM-02 · MASTER-HANDOFF — Serah-Terima Antar-Sesi (Per-Session)
## SparkMind · BarberKas-Foundry · SSOT Foundry-Master

> v1.0 · 2026-06-25 · Fokus: **template & aturan handoff** agar konteks, status, & blocker
> tidak pernah hilang antar-sesi build. Akhir sesi → tulis handoff; awal sesi → baca handoff.
> **Sumber kanonik:** `docs/ssot/foundry-master/FM-02-MASTER-HANDOFF-DOC.md`
> **Lokasi file handoff aktual:** `docs/ssot/foundry-master/handoffs/HANDOFF-<session-id>.md`

═══════════════════════════════════════════════════════════════
🔒 HARD CONSTRAINTS (embedded — sama 6 constraint, lihat FM-01)
═══════════════════════════════════════════════════════════════
1. 100% genspark.ai/ai_developer + Cloudflare Workers/Pages. 2. Niche-first.
3. Horizontal-play. 4. D-1 Truth-Lock. 5. MoR Oasis BI Pro Duitku LIVE. 6. OVERRIDE-CLOSE-OUT.
═══════════════════════════════════════════════════════════════

---

## 1. Prinsip handoff

1. **Tertulis, bukan ingatan.** Setiap sesi yang menyentuh kode/doc WAJIB diakhiri 1 file handoff.
2. **Truth-Lock.** Isi handoff = status nyata (diverifikasi dari `git`, build, route) — bukan klaim.
3. **Self-contained.** Sesi berikutnya cukup baca 1 handoff terbaru + jalankan resume_boot.py.
4. **Singkat & terstruktur.** Maksimal ~1 layar; detail panjang → tunjuk commit/file.
5. **Blocker eksplisit.** Apa yang menghambat & siapa yang harus bertindak (owner vs agent).

---

## 2. Konvensi penamaan & lokasi

```
docs/ssot/foundry-master/handoffs/
├── HANDOFF-BKF-20260625-01.md     # 1 file per sesi
├── HANDOFF-BKF-20260626-01.md
└── LATEST.md                      # symlink/duplikat handoff terbaru (opsional)
```

- **Session-ID:** `BKF-YYYYMMDD-NN` (NN = urutan sesi di hari itu, mulai 01).
- File terbaru = handoff aktif. `resume_boot.py` (FM-04) otomatis menemukan yang terbaru.

---

## 3. TEMPLATE HANDOFF (copy-paste)

> Salin ke `handoffs/HANDOFF-<session-id>.md` di akhir sesi. Isi semua field; tulis `-` bila kosong.

```markdown
# HANDOFF — {{BKF-YYYYMMDD-NN}}
**Tanggal:** {{YYYY-MM-DD HH:MM WIB}}
**Agent:** {{Genspark AI Dev / Claude / dst}}
**Doctrine:** MASTER-ARCHITECT-PROMPT v8.0 · D-1 Truth-Lock
**Repo/branch:** Sparkmind-obp-off/Barberkas-foundry · main
**Commit terakhir sesi ini:** {{git short-sha + subject}}

## 1. Misi sesi ini (scope locked)
- {{1–3 bullet apa yang seharusnya dikerjakan}}

## 2. Apa yang SELESAI (verified)
| Item | Bukti (file/route/commit) | Status |
|---|---|---|
| {{...}} | {{...}} | ✅ |

## 3. Apa yang BELUM / sebagian
| Item | Kenapa belum | Sisa pekerjaan |
|---|---|---|
| {{...}} | {{...}} | {{...}} |

## 4. Blocker & gate
- **HITL menunggu owner:** {{secret/payment/legal/domain/harga — atau "tidak ada"}}
- **Blocker teknis:** {{...}}

## 5. Status verifikasi (Truth-Lock)
- Build: {{`npm run build` → hijau? jumlah modul/kB}}
- Test cepat: {{curl / route mana yang dicek}}
- Deploy: {{ada/tidak — JALUR C = tidak deploy}}

## 6. Anggaran kredit sesi ini (FM-03)
- Estimasi terpakai: {{rendah/sedang/tinggi + catatan}}

## 7. NEXT STEP (untuk sesi berikutnya)
1. {{langkah pertama paling jelas}}
2. {{...}}

## 8. Catatan brutal-honest
- {{risiko, asumsi, hal yang perlu owner tahu}}
```

---

## 4. Aturan baca-tulis (lifecycle)

```
AWAL SESI                         AKHIR SESI
─────────                         ──────────
1. Boot FM-01 (prompt induk)      1. Update artefak (commit)
2. resume_boot.py (FM-04)         2. Tulis HANDOFF-<id>.md (template §3)
3. Baca handoff terbaru           3. (opsional) refresh LATEST.md
4. Konfirmasi NEXT STEP           4. git add docs/ssot/foundry-master/handoffs && commit
```

> **Aturan emas:** Sesi tidak dianggap "ditutup" sampai handoff tertulis & ter-commit.

---

## 5. Contoh handoff terisi (referensi)

```markdown
# HANDOFF — BKF-20260625-01
**Tanggal:** 2026-06-25 19:40 WIB
**Agent:** Genspark AI Developer
**Doctrine:** MASTER-ARCHITECT-PROMPT v8.0 · D-1 Truth-Lock
**Repo/branch:** Sparkmind-obp-off/Barberkas-foundry · main
**Commit terakhir sesi ini:** <sha> "docs(foundry-master): add FM-00..FM-04 + context-injection skill"

## 1. Misi sesi ini (scope locked)
- JALUR C: buat SSOT FOUNDRY-MASTER (FM-00..04) + skill context-injection, package .zip, push GitHub. TANPA deploy.

## 2. Apa yang SELESAI (verified)
| Item | Bukti | Status |
|---|---|---|
| FM-00..FM-04 docs | docs/ssot/foundry-master/*.md | ✅ |
| resume_boot.py | jalan, output status repo | ✅ |
| skill context-injection | skills/sovereign-barberkas-foundry-context-injection/SKILL.md | ✅ |
| bundle .zip | foundry-master-bundle-v1.0.zip | ✅ |

## 3. Apa yang BELUM / sebagian
| Item | Kenapa belum | Sisa pekerjaan |
|---|---|---|
| Deploy webapp | JALUR C eksplisit TANPA deploy | tunggu sesi build berikutnya |

## 4. Blocker & gate
- **HITL menunggu owner:** tidak ada (dokumen + skill = public-safe, no secret).
- **Blocker teknis:** tidak ada.

## 5. Status verifikasi (Truth-Lock)
- Build: tidak dijalankan (hanya doc/skill — tidak menyentuh src produk).
- Test cepat: `python3 resume_boot.py` OK; markdown lint manual OK.
- Deploy: tidak (sesuai JALUR C).

## 6. Anggaran kredit sesi ini
- Estimasi terpakai: rendah (tulis doc + 1 script, tanpa build/deploy).

## 7. NEXT STEP
1. Saat owner siap build: boot FM-01, jalankan resume_boot.py, pilih misi (mis. /api/intake).
2. Pertimbangkan retrofit frontmatter R6-1 ke skill lain.

## 8. Catatan brutal-honest
- Dokumen ini lapisan PROSES; tidak mengubah produk live. Nilai = konsistensi antar-sesi.
```

---

## 6. Out of scope (Truth-Lock)

- Handoff **bukan** changelog penuh (itu `git log`); ia ringkasan keadaan + next-step.
- Handoff **tidak** memuat secret/credential apa pun (public-safe).

---

## 7. Ringkasan satu kalimat (kanonik)

> **MASTER-HANDOFF (FM-02) memaksa setiap sesi ditutup dengan 1 dokumen serah-terima
> Truth-Lock (selesai / belum / blocker / verifikasi / next-step) di `handoffs/`, sehingga
> sesi berikutnya bisa melanjutkan tanpa kehilangan konteks.**
