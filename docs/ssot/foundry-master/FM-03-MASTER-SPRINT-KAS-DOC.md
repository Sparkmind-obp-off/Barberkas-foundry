# FM-03 · MASTER-SPRINT-KAS — Sprint Terikat Kas & Kredit (Per-Session)
## SparkMind · BarberKas-Foundry · SSOT Foundry-Master

> v1.0 · 2026-06-25 · Fokus: menjalankan sprint **credit-aware** — tiap sprint sesi punya
> anggaran kredit/biaya, OMTM, exit-gate, & log kas. "Jangan ngoding buta biaya."
> **Sumber kanonik:** `docs/ssot/foundry-master/FM-03-MASTER-SPRINT-KAS-DOC.md`
> **Selaras:** B5-03 (business model), 03-MONETIZATION (unit econ), 09-TODO-CHECKLIST.

═══════════════════════════════════════════════════════════════
🔒 HARD CONSTRAINTS (embedded — sama 6 constraint, lihat FM-01)
═══════════════════════════════════════════════════════════════
1. 100% genspark.ai/ai_developer + Cloudflare Workers/Pages. 2. Niche-first.
3. Horizontal-play. 4. D-1 Truth-Lock. 5. MoR Oasis BI Pro Duitku LIVE. 6. OVERRIDE-CLOSE-OUT.
═══════════════════════════════════════════════════════════════

---

## 1. Apa itu "Sprint-Kas"

> **Sprint-Kas** = unit kerja 1-sesi (atau beberapa sesi) yang **selalu** menyatakan:
> (a) **scope** (apa yang dirakit), (b) **anggaran kredit/biaya** (berapa "kas" yang dipakai),
> (c) **OMTM** (1 metrik yang paling penting), dan (d) **exit-gate** (kapan dianggap selesai).

Dua makna "kas" yang diikat dokumen ini:
- **Kas kredit eksekusi** — kredit AI Developer / token LLM / waktu build (biaya *membangun*).
- **Kas bisnis (MoR)** — uang masuk via Duitku/brand_ledger (hasil *menjual* outcome).

> Sprint sehat = biaya membangun << nilai yang dihasilkan, dan keduanya **terukur**.

---

## 2. Prinsip credit-aware (kanonik)

1. **Estimasi sebelum eksekusi.** Tulis perkiraan kredit (rendah/sedang/tinggi) + alasan.
2. **Batch, jangan boros.** Gabungkan edit; hindari build/deploy berulang tanpa perlu.
3. **Verify sekali, benar.** Build/test terarah (bukti), bukan trial-and-error membabi buta.
4. **Stop-loss.** Bila biaya melampaui anggaran → STOP, tulis handoff, minta keputusan owner.
5. **Reuse mesin.** Pakai engine/skill yang sudah ada (checkout MoR, fullstack-cycle) — jangan tulis ulang.

---

## 3. TEMPLATE SPRINT-KAS (copy-paste)

> Tulis di awal sesi (setelah resume). Simpan di handoff (FM-02 §1 & §6) atau `sprints/`.

```markdown
# SPRINT-KAS — {{BKF-YYYYMMDD-NN}}
**Sprint:** {{nama singkat, mis. "R-intake: endpoint /api/intake + view scope"}}
**Doctrine:** MASTER-ARCHITECT-PROMPT v8.0 · D-1 Truth-Lock · credit-aware

## 1. Scope (locked)
- {{1–3 deliverable konkret, "tambah jangan hancurkan"}}

## 2. OMTM (1 metrik terpenting)
- {{mis. "endpoint /api/intake menerima tiket & tersimpan di D1 (lokal)"}}

## 3. Anggaran KAS-KREDIT (biaya membangun)
| Aktivitas | Estimasi kredit | Catatan |
|---|---|---|
| Tulis kode/doc | rendah/sedang/tinggi | {{...}} |
| Build (`npm run build`) | {{x kali}} | batasi seminimal mungkin |
| Deploy | {{ada/tidak}} | JALUR build-only → tidak |
| **Total target** | {{rendah/sedang/tinggi}} | stop-loss bila lewat |

## 4. KAS-BISNIS terkait (bila menyentuh monetisasi)
- SKU/harga yang tersentuh: {{atau "-"}}
- Dampak ke brand_ledger / MoR: {{atau "-"}}  (perubahan harga/payment = GATE HITL)

## 5. Exit-gate (DoD sprint ini)
- [ ] {{kriteria 1 — terukur}}
- [ ] {{kriteria 2 — terverifikasi build/test}}
- [ ] Handoff (FM-02) ditulis & di-commit.

## 6. Risiko & stop-loss
- {{risiko}} → bila terjadi: {{tindakan}}
```

---

## 4. Tangga sprint (selaras roadmap produk)

Sprint-Kas memetakan ke roadmap yang sudah ada — **bukan** roadmap baru:

| Fase | Sumber roadmap | Fokus Sprint-Kas |
|---|---|---|
| **Reposition (R1–R4)** | B4-05 §4, B5-05 | tambah lapisan outcome (route/copy/data) |
| **BarberKas Sprint 0–6** | 05-SPRINT-PLAN, README "What's Inside" | agent/fitur per-sprint, OMTM paying-merchant |
| **R6 series** | R6-1..R6-4 | standar skill, eval-loop, AgentShield SKU |
| **Foundry-Master (FM)** | dok ini | OS proses: boot/handoff/sprint/resume |

> Setiap Sprint-Kas WAJIB menyebut **fase mana** yang dilayaninya agar tidak keluar jalur.

---

## 5. OMTM & metrik kas (referensi cepat)

| Lapis | Metrik | Sumber |
|---|---|---|
| **Eksekusi (kredit)** | kredit/sesi, jumlah build, jumlah deploy | observasi sesi |
| **Outcome delivered** | app live, transaksi/booking pertama tercatat | DoO (01-BRIEF §OF.4) |
| **Kas bisnis (MoR)** | pembayaran tercatat di brand_ledger, MRR | B5-03, 03-MONETIZATION |
| **Retensi** | churn langganan AI Staff | 03-MONETIZATION |

> Truth-Lock: laporkan metrik **nyata** bila tersedia; tandai *est.* bila estimasi.

---

## 6. HITL gate (kas-bisnis)

WAJIB persetujuan owner sebelum:
- Mengubah **harga** SKU publik atau tier langganan.
- Mengubah **payment flow / Duitku / MoR** atau callback.
- Menjanjikan **garansi/ROI** (legal) ke pembeli.
- Membelanjakan **kredit besar** (mis. batch generasi/eksperimen mahal) melampaui anggaran.

---

## 7. Failure modes & recovery

| Mode gagal | Gejala | Recovery |
|---|---|---|
| Scope creep | sprint membengkak tanpa OMTM | kunci ulang scope §1, sisanya → sprint baru |
| Kredit jebol | biaya lewat anggaran | stop-loss §6, handoff, keputusan owner |
| Build berulang boros | banyak build trial | batch edit, build sekali setelah yakin |
| Klaim "selesai" tanpa exit-gate | DoD tidak dicentang | tegakkan §3.5 sebelum tutup sprint |

---

## 8. Out of scope (Truth-Lock)

- FM-03 **bukan** model bisnis (itu B5-03 / 03-MONETIZATION) — ia disiplin *eksekusi sprint*.
- FM-03 **tidak** menjamin angka MRR; ia menjamin sprint **terukur & sadar-biaya**.

---

## 9. Ringkasan satu kalimat (kanonik)

> **MASTER-SPRINT-KAS (FM-03) memaksa setiap sprint sesi menyatakan scope, OMTM, anggaran
> kas-kredit + kas-bisnis, dan exit-gate sebelum eksekusi — dengan stop-loss & gate HITL pada
> harga/payment — agar build BarberKas-Foundry selalu credit-aware, terukur, dan tidak keluar jalur.**
