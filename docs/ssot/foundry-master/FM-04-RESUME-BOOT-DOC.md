# FM-04 · RESUME-BOOT — Resume Keadaan Repo dalam 1 Perintah
## SparkMind · BarberKas-Foundry · SSOT Foundry-Master

> v3.0 · 2026-06-26 · Fokus: cara me-**resume** keadaan repo & sesi secara instan, lewat
> 1 dokumen + 1 script zero-dependency (`resume_boot.py`). "Buka sesi → langsung tahu posisi."
> **Sumber kanonik:** `docs/ssot/foundry-master/FM-04-RESUME-BOOT-DOC.md`
> **Script:** `docs/ssot/foundry-master/resume_boot.py`
>
> **v2.0 (anti-boros kredit, OPSI 2):** + auto-deteksi **backup tar.gz** (restore, bukan
> rebuild) · + **production health check** opt-in (1 GET gratis ke `/health`) · + **1-baris
> master boot prompt** (`--boot`) · + **restore dari backup** (`--restore-from`, mode tulis
> v3.0 (one-shot session driver): + **`--preflight`** (gate kesiapan eksekusi 1-perintah) ·
> + **`--close-out`** (scaffold handoff berikutnya otomatis — anti-lupa tutup sesi). Satu-satunya
> mode yang menulis, safe-extract). Default run tetap **read-only · zero-dep · zero-network**.

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

# v2.0 — flag baru (semua opt-in, default tetap read-only & gratis):
python3 docs/ssot/foundry-master/resume_boot.py --boot          # 1-baris master boot prompt
python3 docs/ssot/foundry-master/resume_boot.py --health        # cek production /health (1 GET gratis)
python3 docs/ssot/foundry-master/resume_boot.py --list-backups  # daftar tar.gz backup terdeteksi
python3 docs/ssot/foundry-master/resume_boot.py --restore-from <tar.gz> --dry-run  # pratinjau restore
python3 docs/ssot/foundry-master/resume_boot.py --restore-from <tar.gz>            # restore (WRITES)

# v3.0 — one-shot session driver (1 sesi = boot → eksekusi penuh → tutup):
python3 docs/ssot/foundry-master/resume_boot.py --preflight     # gate kesiapan eksekusi (deps/build/dist/wrangler/git/prod)
python3 docs/ssot/foundry-master/resume_boot.py --preflight --health  # + cek prod /health sekalian
python3 docs/ssot/foundry-master/resume_boot.py --close-out --dry-run # pratinjau skeleton handoff berikutnya
python3 docs/ssot/foundry-master/resume_boot.py --close-out           # scaffold HANDOFF-BKF-<tgl>-NN (WRITES 1 .md)
```

> Tidak ada `pip install` apa pun. Hanya butuh Python 3 + `git` (sudah ada di sandbox).

### 2b. Detail flag v2.0 (anti-boros kredit)

| Flag | Aksi | Network? | Menulis? | Catatan Truth-Lock |
|---|---|---|---|---|
| *(none)* / `--json` | Ringkasan repo + git + handoff + SSOT + backup + boot | ❌ | ❌ | default aman |
| `--boot` | Cetak **1-baris** master boot prompt (tempel di awal sesi) | ❌ | ❌ | sumber: handoff + README |
| `--health` | Satu HTTP GET stdlib ke `<production_url>/health` | ✅ (1×) | ❌ | gratis; tanpa secret/paid API |
| `--list-backups` | Cari tar.gz (repo, `./backups`, `~`, `/home/user`, `/mnt/aidrive` — **shallow**) | ❌ | ❌ | hanya yg ber-nama hint `barberkas/foundry/bkf` atau di `backups/` |
| `--restore-from <t>` | Mode tulis (restore): ekstrak tar.gz (safe-extract, tolak `/`+`..`) | ❌ | ✅ | tambahkan `--dry-run` utk pratinjau dulu |
| `--preflight` | **v3** Gate 1-perintah: cek `node_modules`+vite, `dist/_worker.js`, wrangler config, git bersih → verdict `ready`/`needs-setup`/`blocked` | ❌ (+`--health` opt-in) | ❌ | jawab "siap eksekusi penuh?" tanpa tebak |
| `--close-out` | **v3** Mode tulis (scaffold): auto-deteksi `NN+1`, tulis skeleton `HANDOFF-BKF-<tgl>-NN.md` (FM-02 shape, pre-fill state git) | ❌ | ✅ | anti-lupa tutup sesi; tolak timpa file ada; `--dry-run` utk pratinjau |

> **One-shot session driver (v3):** `--preflight` di awal (pastikan `ready`) + `--close-out`
> di akhir (scaffold handoff otomatis) membuat **satu sesi = boot → build → verify → deploy
> → handoff** tanpa drift/lupa — langsung memangkas kredit re-orientasi & sesi terbuang.

> **Anti-boros kredit:** `--health` & `--restore-from` opt-in supaya boot harian tetap nol-biaya.
> `--restore-from` mengembalikan state dari backup (restore, **bukan** rebuild dari nol) →
> langsung memangkas kredit re-build saat sesi sebelumnya terputus.

---

## 3. Apa yang dilaporkan script

| Bagian | Isi | Sumber |
|---|---|---|
| **Repo** | branch, commit terakhir (sha + subject), jumlah file uncommitted | `git` |
| **Recent commits** | 5 commit terakhir (oneline) | `git log` |
| **Handoff terakhir** | path + isi ringkas handoff terbaru | `handoffs/` |
| **Peta SSOT** | daftar doc kanonik FM + Batch 4/5 + R6 | scan `docs/ssot/` |
| **Status produk** | URL/produksi dari README (fakta tertulis) | `README.md` |
| **Backup tersedia** | daftar tar.gz (path, ukuran, mtime) utk restore | scan shallow dir |
| **Production health** | status `/health` (opt-in `--health`) | 1 GET stdlib |
| **Master boot prompt** | 1-baris boot doctrine-aware | handoff + README |
| **Reminder doctrine** | 6 hard-constraint + urutan wajib FM-01 | embedded |

> **Truth-Lock:** script hanya **melaporkan fakta** (git/file). Ia **tidak menebak** status
> deploy/payment — bila tak ada bukti tertulis, ditandai "unknown / cek manual".

---

## 4. Alur boot lengkap (recommended)

```
1. Tempel MASTER-ARCHITECT-PROMPT (FM-01) — atau cukup: resume_boot.py --boot (1-baris).
2. Jalankan:  python3 docs/ssot/foundry-master/resume_boot.py
   (opsional, jika lanjut sesi build): tambah --health untuk pastikan prod LIVE.
3. Baca ringkasan → konfirmasi NEXT STEP dari handoff terakhir.
   Jika sesi sebelumnya terputus & ada backup → restore (jangan rebuild):
     python3 docs/ssot/foundry-master/resume_boot.py --list-backups
     python3 docs/ssot/foundry-master/resume_boot.py --restore-from <tar.gz>
4. Tulis SPRINT-KAS (FM-03) untuk sesi ini.
5. Eksekusi (OVERRIDE-CLOSE-OUT, kecuali GATE HITL).
6. Akhir sesi: ProjectBackup tar.gz + tulis HANDOFF (FM-02) + commit & push.
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
| Sesi lalu terputus, kerja hilang | uncommitted/dist hilang | `--list-backups` → `--restore-from <tar.gz>` (restore, bukan rebuild) |
| Prod down / regресi | `--health` → ❌ DOWN/ERR | cek deploy CF Pages; jangan klaim "live" tanpa 200 OK |
| Backup tak terdeteksi | `--list-backups` → `[]` | pastikan nama tar.gz mengandung `barberkas/foundry/bkf` atau taruh di `./backups/` |

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
