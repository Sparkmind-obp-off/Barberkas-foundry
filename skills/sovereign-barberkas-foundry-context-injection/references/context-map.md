# Context-Map — Daftar Doc Kanonik & Kapan Memuat
## skill: sovereign-barberkas-foundry-context-injection · reference

> Progressive-load: muat HANYA bagian yang relevan dengan misi sesi (hemat context & kredit).

---

## 1. Selalu muat (boot inti)

| Doc | Path | Untuk |
|---|---|---|
| Master-Architect-Prompt | `docs/ssot/foundry-master/FM-01-MASTER-ARCHITECT-PROMPT-DOC.md` | peran + 6 constraint + urutan wajib + gate |
| Master-Handoff | `docs/ssot/foundry-master/FM-02-MASTER-HANDOFF-DOC.md` | template handoff (baca terakhir, tulis baru) |
| Master-Sprint-Kas | `docs/ssot/foundry-master/FM-03-MASTER-SPRINT-KAS-DOC.md` | anggaran kredit + OMTM + exit-gate |
| Resume-Boot | `docs/ssot/foundry-master/FM-04-RESUME-BOOT-DOC.md` | cara resume + `resume_boot.py` |
| Index FM | `docs/ssot/foundry-master/FM-00-INDEX.md` | peta lapisan proses |

---

## 2. Muat saat menyentuh PRODUK / monetisasi / outcome

| Doc | Path | Pemicu |
|---|---|---|
| B5 Index | `docs/ssot/B5-00-INDEX.md` | apa pun terkait Outcome Foundry / OaaS |
| B5 Concept | `docs/ssot/B5-02-OUTCOME-FOUNDRY-CONCEPT-DOC.md` | definisi sistem mesin→outcome, DoO |
| B5 Business Model | `docs/ssot/B5-03-OUTCOME-BUSINESS-MODEL-DOC.md` | pricing hibrida, value-metric |
| B5 Delivery Engine | `docs/ssot/B5-04-OUTCOME-DELIVERY-ENGINE-DOC.md` | pipeline intake→live, SLA, proof |
| B5 Pivot Exec Map | `docs/ssot/B5-05-PIVOT-EXECUTION-MAP-DOC.md` | status kode live + roadmap R1–R5 |

---

## 3. Muat saat menyentuh POSITIONING / copy / pasar

| Doc | Path | Pemicu |
|---|---|---|
| B4 Index | `docs/ssot/B4-00-INDEX.md` | reposition skill→outcome |
| B4 Repositioning | `docs/ssot/B4-01-REPOSITIONING-DOC.md` | naming, kategori, narasi jual |
| B4 Target Market | `docs/ssot/B4-02-TARGET-MARKET-DOC.md` | TAM/SAM/SOM, ICP |
| B4 Productized Offers | `docs/ssot/B4-03-PRODUCTIZED-OFFERS-DOC.md` | katalog SKU, packaging, harga |
| B4 Winning GTM | `docs/ssot/B4-04-WINNING-GTM-BROAD-DOC.md` | channel, funnel, copy non-teknis |

---

## 4. Muat saat menyentuh SKILL / standar / spec

| Doc | Path | Pemicu |
|---|---|---|
| Skill Authoring Standard | `docs/ssot/SKILL-AUTHORING-STANDARD.md` | menulis/menyentuh skill (frontmatter R6-1) |
| Eval-Loop Spec | `docs/ssot/R6-3-EVAL-LOOP-SPEC.md` | proof-of-outcome / trace-verify-promote |
| AgentShield SKU | `docs/ssot/R6-4-AGENTSHIELD-SKU-SPEC.md` | SKU security review agentik |

---

## 5. Muat saat menyentuh BARBERKAS bundle (vertical)

| Doc | Path | Pemicu |
|---|---|---|
| Strategic Brief | `docs/barberkas-aaas-bundle/01-BARBERKAS-AaaS-STRATEGIC-BRIEF-v1.0.md` | ICP, OMTM, §OF Outcome alignment |
| Monetization Matrix | `docs/barberkas-aaas-bundle/03-BARBERKAS-AaaS-MONETIZATION-MATRIX-v1.0.md` | tier, unit econ |
| Master Architect (teknis) | `docs/barberkas-aaas-bundle/04-BARBERKAS-AaaS-MASTER-ARCHITECT-v1.0.md` | arsitektur CF-native |
| Sprint Plan | `docs/barberkas-aaas-bundle/05-BARBERKAS-AaaS-SPRINT-PLAN-v1.0.md` | roadmap sprint 0–6 |
| Agent PRD | `docs/barberkas-aaas-bundle/07-BARBERKAS-AaaS-AGENT-PRD-v1.0.md` | 9 curator agent (mesin) |
| TODO Checklist | `docs/barberkas-aaas-bundle/09-BARBERKAS-AaaS-TODO-CHECKLIST-v1.0.md` | backlog eksekusi |

---

## 6. Aturan emas

- **Jangan muat semua sekaligus.** Pilih berdasarkan misi sesi (lihat SPRINT-KAS scope).
- **Status repo = dari `resume_boot.py`**, bukan dari ingatan doc (Truth-Lock).
- **Secret tidak pernah dimuat ke konteks** (file `.dev.vars`, token = secret store saja).
