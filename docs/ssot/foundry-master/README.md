# FOUNDRY-MASTER BUNDLE — OS Lapisan Sesi-Kerja
## SparkMind · BarberKas-Foundry

**Owner**: Reza Estes / Haidar Faras — Sovereign AI Dev (Capster + Full-Stack, Purwokerto)
**Doctrine**: MASTER-ARCHITECT-PROMPT v8.0 OVERRIDE-LOCK · D-1 Truth-Lock
**Status**: CANONICAL · EXECUTE-READY · PUBLIC-SAFE (no secret) · v1.0 · 2026-06-25
**Repo**: https://github.com/Sparkmind-obp-off/Barberkas-foundry

---

## Apa ini

Lapisan **"sistem operasi sesi-kerja"** untuk BarberKas-Foundry. Sementara SSOT Batch 4/5
mendefinisikan **APA** yang dijual & dibangun (Outcome Foundry/OaaS), bundle ini mendefinisikan
**BAGAIMANA** setiap sesi build di-**boot**, di-**handoff**, di-**sprint** (credit-aware), dan
di-**resume** — agar konteks, doctrine, dan status tidak pernah hilang antar-sesi.

> Prinsip: **tambah, jangan hancurkan** — bundle ini tidak mengubah kode produk live.

---

## Isi bundle

| File | Tujuan |
|---|---|
| `FM-00-INDEX.md` | Index + peta lapisan proses + DoD |
| `FM-01-MASTER-ARCHITECT-PROMPT-DOC.md` | Prompt induk boot agent (peran + 6 constraint + urutan + gate) |
| `FM-02-MASTER-HANDOFF-DOC.md` | Template & aturan handoff per-session |
| `FM-03-MASTER-SPRINT-KAS-DOC.md` | Sprint credit-aware (anggaran kas-kredit + kas-bisnis) |
| `FM-04-RESUME-BOOT-DOC.md` | Cara resume keadaan repo dalam 1 perintah |
| `resume_boot.py` | Script zero-dependency, read-only, Truth-Lock resumer |
| `handoffs/` | File handoff per-session (`HANDOFF-BKF-YYYYMMDD-NN.md`) |
| `sprints/` | (opsional) catatan SPRINT-KAS per-session |
| `MANIFEST.md` | Index + verifikasi |

**Skill terkait** (di luar folder ini):
`skills/sovereign-barberkas-foundry-context-injection/` — meng-inject FM-01..FM-04 + SSOT
relevan + status repo ke konteks agent.

---

## Quick start

### 1. Boot sesi baru
Tempel `FM-01-MASTER-ARCHITECT-PROMPT-DOC.md` §2 (THE MASTER-ARCHITECT-PROMPT) sebagai pesan pertama.

### 2. Resume status (1 perintah)
```bash
cd <root repo>
python3 docs/ssot/foundry-master/resume_boot.py          # ringkas (manusia)
python3 docs/ssot/foundry-master/resume_boot.py --json    # untuk inject ke agent
```

### 3. Sprint
Tulis SPRINT-KAS (FM-03 §3 template) — scope + OMTM + anggaran kredit + exit-gate.

### 4. Tutup sesi
Tulis handoff (FM-02 §3 template) di `handoffs/HANDOFF-<session-id>.md` → commit.

---

## Alur lengkap (lifecycle)

```
BOOT (FM-01)  →  RESUME (FM-04/resume_boot.py)  →  PLAN (FM-03 sprint-kas)
   →  EXECUTE (OVERRIDE-CLOSE-OUT, kecuali GATE HITL)  →  VERIFY (build/test)
   →  HANDOFF (FM-02)  →  commit
```

---

## Truth-Lock & keamanan

- `resume_boot.py` = **read-only**, zero-dependency, **tidak** memanggil API berbayar, **tidak**
  membaca secret, **tidak** deploy.
- Status produk dilaporkan **hanya dari README** (fakta tertulis) — bukan tebakan.
- **GATE HITL**: payment/Duitku/MoR, legal/garansi, secret/credential, domain, harga, migrasi
  D1 destruktif = WAJIB persetujuan owner.
- Bundle ini **public-safe** — tidak memuat credential apa pun.

---

**🔱 SOVEREIGN ECOSYSTEM — Build slow, ship daily, charge fair, document everything, never burn out, never sell out.**
