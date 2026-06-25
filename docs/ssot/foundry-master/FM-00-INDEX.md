# SSOT FOUNDRY-MASTER — Operating-System Layer (Index)
## SparkMind · BarberKas-Foundry · Master-Architect / Handoff / Sprint-Kas / Resume-Boot

> **Status:** Canonical · **Versi:** v1.0 · **Tanggal:** 2026-06-25
> **Doctrine induk:** MASTER-ARCHITECT-PROMPT v8.0 OVERRIDE-LOCK · D-1 Truth-Lock · Indonesia-first · Credit-aware
> **Repo kanonik:** https://github.com/Sparkmind-obp-off/Barberkas-foundry
> **Sumber kanonik:** `docs/ssot/foundry-master/`

---

## 0. Mandat owner (verbatim intent)

> *"Buat doc SSOT / doc canonical tambahan tentang sovereign / barberkas-foundry: master
> architect prompt, master handoff (per-session), master sprint-kas (per-session), semacam
> `resume.boot.md` + script resume boot, lalu skill.md baru (sovereign barberkas-foundry
> context-injection). Lalu push ke GitHub. JALUR C — dokumen + skills, TANPA build/deploy
> webapp dulu (app sudah live)."*

---

## 0a. Mengapa lapisan FOUNDRY-MASTER ada (masalah yang dipecahkan)

SSOT Batch 4 (reposition) + Batch 5 (pivot OaaS) sudah **memutuskan & mengeksekusi** produk
ke kode live (`/solutions`, `/app`, engine checkout MoR, Duitku Pop LIVE). Yang masih **belum
dikanonkan** adalah **lapisan "sistem operasi sesi kerja"** — yaitu *bagaimana* owner & agent
memulai, melanjutkan, dan menutup setiap sesi build tanpa kehilangan konteks.

| Gap (sebelum FM) | Akibat | Ditutup oleh |
|---|---|---|
| Tidak ada prompt induk tunggal untuk boot agent | tiap sesi mulai dari nol, drift doctrine | **FM-01 Master-Architect-Prompt** |
| Handoff antar-sesi lisan/ingatan | konteks hilang, kerja diulang | **FM-02 Master-Handoff (per-session)** |
| Sprint tidak terikat ke kas/biaya | eksekusi tidak credit-aware, tak terukur | **FM-03 Master-Sprint-Kas (per-session)** |
| Tidak ada cara cepat "resume" keadaan repo | re-orientasi lambat tiap buka sesi | **FM-04 Resume-Boot** (+ `resume_boot.py`) |
| Konteks SSOT tak bisa di-inject otomatis | agent tak auto-patuh doctrine | **skill** `sovereign-barberkas-foundry-context-injection` |

> Inti: Batch 4/5 = **APA yang dijual & dibangun**. FOUNDRY-MASTER = **BAGAIMANA setiap sesi
> kerja di-boot, di-handoff, di-sprint, & di-resume** secara konsisten & Truth-Lock.

---

## 1. Tesis FOUNDRY-MASTER (1 kalimat)

> Setiap sesi build BarberKas-Foundry harus bisa **di-boot dalam 1 prompt**, **di-handoff
> dalam 1 dokumen**, **di-sprint dengan anggaran kas/biaya yang sadar-kredit**, dan **di-resume
> dalam 1 perintah** — sehingga konteks, doctrine, dan status tidak pernah hilang antar-sesi.

---

## 2. Peta Dokumen FOUNDRY-MASTER

| Kode | Judul | Pertanyaan yang dijawab |
|---|---|---|
| **FM-00** | Index (dok ini) | Apa lapisan ini & bagaimana semua terhubung? |
| **FM-01** | **[MASTER-ARCHITECT-PROMPT](FM-01-MASTER-ARCHITECT-PROMPT-DOC.md)** | Prompt induk tunggal untuk boot agent: peran, hard-constraint, urutan kerja, gate |
| **FM-02** | **[MASTER-HANDOFF (per-session)](FM-02-MASTER-HANDOFF-DOC.md)** | Template & aturan handoff antar-sesi: state, blocker, next-step |
| **FM-03** | **[MASTER-SPRINT-KAS (per-session)](FM-03-MASTER-SPRINT-KAS-DOC.md)** | Sprint terikat kas/biaya: anggaran kredit, OMTM, exit-gate, log |
| **FM-04** | **[RESUME-BOOT](FM-04-RESUME-BOOT-DOC.md)** | Cara me-resume keadaan repo dalam 1 perintah (+ `resume_boot.py`) |

> **Urutan baca disarankan:** FM-00 → FM-01 → FM-02 → FM-03 → FM-04 → skill context-injection.

---

## 3. Non-Negotiables FOUNDRY-MASTER

1. **Satu prompt induk.** Semua sesi boot lewat FM-01 (Master-Architect-Prompt) — tidak ada
   improvisasi doctrine.
2. **Handoff tertulis, bukan ingatan.** Akhir tiap sesi → tulis FM-02 handoff; awal sesi →
   baca handoff terakhir.
3. **Credit-aware.** Sprint (FM-03) selalu menyertakan anggaran kredit & biaya estimasi; tidak
   ada eksekusi "buta biaya".
4. **Truth-Lock.** Status di handoff/resume = diverifikasi dari kode/`git`/build nyata — bukan
   klaim.
5. **HITL pada payment/legal/secrets.** Perubahan Duitku/MoR/secret/domain WAJIB lewat gate
   owner (lihat FM-01 §HITL).
6. **Tambah, jangan hancurkan.** Lapisan ini **menambah** di atas Batch 1–5; tidak mengubah
   kode produk yang sudah live.
7. **100% Cloudflare-Native + MoR patuh.** Stack tetap Hono+Pages+D1 + Duitku/OBP.

---

## 4. Hubungan dengan SSOT lain

```
Batch 1–3   → fondasi produk + teknis + monetisasi v1     [TETAP — mesin]
Batch 4     → KEPUTUSAN reposition (skill→outcome)          [DISERAP]
Batch 5     → TUNTASKAN pivot = sistem & model OaaS         [KANONIK produk]
R6-1..R6-4  → standar skill + eval-loop + AgentShield SKU   [STANDAR]
FOUNDRY-MASTER (FM) → OS lapisan sesi-kerja (boot/handoff/sprint/resume)  [KANONIK proses] ⭐
```

- **Tidak men-supersede** apa pun — murni **menambah lapisan proses kerja**.
- **Diturunkan ke eksekusi harian:** FM-03 → checklist 09 (BarberKas), B5-05 roadmap R-series.
- **Mengikat skill:** `sovereign-barberkas-foundry-context-injection` meng-inject FM-01..FM-04
  + SSOT terkait ke konteks agent saat boot.

---

## 5. Definisi "FOUNDRY-MASTER tuntas" (DoD)

- [x] FM-01 Master-Architect-Prompt kanonik (boot 1-prompt).
- [x] FM-02 Master-Handoff template + aturan per-session.
- [x] FM-03 Master-Sprint-Kas template + anggaran kredit.
- [x] FM-04 Resume-Boot doc + `resume_boot.py` (zero-dep).
- [x] Skill `sovereign-barberkas-foundry-context-injection` (frontmatter patuh R6-1).
- [x] MANIFEST + README bundle + index.
- [ ] Di-package `.zip` + push ke GitHub (`main`).

> **Truth-Lock:** centang `[x]` di atas hanya untuk artefak yang benar-benar ada di repo saat commit.
