# FM-04 · RESUME-BOOT — Resume Keadaan Repo dalam 1 Perintah
## SparkMind · BarberKas-Foundry · SSOT Foundry-Master

> v1.0 · 2026-06-25 · Fokus: cara me-**resume** keadaan repo & sesi secara instan, lewat
> 1 dokumen + 1 script zero-dependency (`resume_boot.py`). "Buka sesi → langsung tahu posisi."
> **Sumber kanonik:** `docs/ssot/foundry-master/FM-04-RESUME-BOOT-DOC.md`
> **Script:** `docs/ssot/foundry-master/resume_boot.py`

═══════════════════════════════════════════════════════════════
🔒 HARD CONSTRAINTS (embedded — sama 6 constraint, lihat FM-01)
═══════════════════════════════════════════════════════════════
1. 100% genspark.ai/ai_developer + Cloudflare Workers/Pages. 2. Niche-first.
3. Horizontal-play. 4. D-1 Truth-Lock. 5. MoR Oasis BI Pro Duitku LIVE. 6. OVERRIDE-CLOSE-OUT.
═══════════════════════════════════════════════════════════════

---

## 1. Tujuan

Saat membuka sesi baru, agent/owner perlu tahu dalam hitungan detik:
- **Di mana posisi repo** (branch, commit terakhir, file berubah).
- **Handoff terakhir** (next-step yang ditinggalkan sesi sebelumnya).
- **Peta SSOT** (doc kanonik mana yang harus dibaca).
- **Status produk** (live? di mana? — fakta, bukan klaim).

`resume_boot.py` mengumpulkan semua ini menjadi **satu ringkasan Truth-Lock** tanpa dependency
eksternal (zero-dep, credit-aware: tidak memanggil API berbayar).

---

## 2. Cara pakai (1 perintah)

```bash
# Dari root repo:
python3 docs/ssot/foundry-master/resume_boot.py

# Output ringkas (default) — untuk dibaca cepat
# Output JSON (untuk di-inject ke konteks agent):
python3 docs/ssot/foundry-master/resume_boot.py --json
```

> Tidak ada `pip install` apa pun. Hanya butuh Python 3 + `git` (sudah ada di sandbox).

---

## 3. Apa yang dilaporkan script

| Bagian | Isi | Sumber |
|---|---|---|
| **Repo** | branch, commit terakhir (sha + subject), jumlah file uncommitted | `git` |
| **Recent commits** | 5 commit terakhir (oneline) | `git log` |
| **Handoff terakhir** | path + isi ringkas handoff terbaru | `handoffs/` |
| **Peta SSOT** | daftar doc kanonik FM + Batch 4/5 + R6 | scan `docs/ssot/` |
| **Status produk** | URL/produksi dari README (fakta tertulis) | `README.md` |
| **Reminder doctrine** | 6 hard-constraint + urutan wajib FM-01 | embedded |

> **Truth-Lock:** script hanya **melaporkan fakta** (git/file). Ia **tidak menebak** status
> deploy/payment — bila tak ada bukti tertulis, ditandai "unknown / cek manual".

---

## 4. Alur boot lengkap (recommended)

```
1. Tempel MASTER-ARCHITECT-PROMPT (FM-01) sebagai pesan pertama.
2. Jalankan:  python3 docs/ssot/foundry-master/resume_boot.py
3. Baca ringkasan → konfirmasi NEXT STEP dari handoff terakhir.
4. Tulis SPRINT-KAS (FM-03) untuk sesi ini.
5. Eksekusi (OVERRIDE-CLOSE-OUT, kecuali GATE HITL).
6. Akhir sesi: tulis HANDOFF (FM-02) + commit.
```

---

## 5. resume.boot (versi markdown manual — fallback)

Bila Python tak tersedia, baca peta minimal ini (selalu benar untuk repo ini):

```text
REPO     : Sparkmind-obp-off/Barberkas-foundry (branch main)
PRODUK   : BarberKas AaaS — live di CF Pages (lihat README "Production")
PAYMENT  : Duitku Pop LIVE, MoR Oasis BI Pro (merchant D20919)
DOCTRINE : MASTER-ARCHITECT-PROMPT v8.0 · D-1 Truth-Lock
SSOT     : docs/ssot/B4-* (reposition), B5-* (Outcome Foundry), R6-* (standar),
           foundry-master/FM-01..FM-04 (OS sesi-kerja)
SKILL    : skills/sovereign-barberkas-foundry-context-injection/SKILL.md
NEXT     : baca handoff terbaru di docs/ssot/foundry-master/handoffs/
GATE     : payment/legal/secret/domain/harga = HITL owner
```

---

## 6. Failure modes & recovery

| Mode gagal | Gejala | Recovery |
|---|---|---|
| Bukan di root repo | `git` error / file tak ketemu | `cd` ke root repo lalu ulangi |
| Belum ada handoff | "no handoff found" | wajar untuk sesi pertama; mulai bersih |
| Python tak ada | command not found | pakai fallback §5 (markdown manual) |
| Git tak ter-init | bukan repo git | clone/`git init` dulu (di luar JALUR C) |

---

## 7. Out of scope (Truth-Lock)

- Script **tidak** memodifikasi repo (read-only) — aman dijalankan kapan saja.
- Script **tidak** memanggil API berbayar, tidak membaca secret, tidak deploy.
- Script **tidak** menebak status deploy/payment tanpa bukti tertulis.

---

## 8. Ringkasan satu kalimat (kanonik)

> **RESUME-BOOT (FM-04) + `resume_boot.py` adalah cara zero-dependency, read-only, Truth-Lock
> untuk me-resume keadaan repo (git, handoff terakhir, peta SSOT, status produk) dalam satu
> perintah — agar setiap sesi langsung terorientasi tanpa kehilangan konteks.**
