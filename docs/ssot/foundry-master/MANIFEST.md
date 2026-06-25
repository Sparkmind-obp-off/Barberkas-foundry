# FOUNDRY-MASTER BUNDLE — MANIFEST

**Bundle ID**: `BARBERKAS-FOUNDRY-MASTER-BUNDLE-v1.0`
**Owner**: Reza Estes / Haidar Faras — Sovereign AI Dev (Purwokerto)
**Doctrine**: MASTER-ARCHITECT-PROMPT v8.0 OVERRIDE-LOCK · D-1 Truth-Lock
**Status**: CANONICAL · EXECUTE-READY · PUBLIC-SAFE · v1.0 · 2026-06-25
**Repo**: https://github.com/Sparkmind-obp-off/Barberkas-foundry

═══════════════════════════════════════════════════════════════
🔒 HARD CONSTRAINTS (embedded)
═══════════════════════════════════════════════════════════════
1. 100% genspark.ai/ai_developer + Cloudflare Workers/Pages.
2. Niche-first: barbershop UMKM Indonesia.
3. Horizontal-play.
4. D-1 Truth-Lock.
5. MoR Oasis BI Pro Duitku LIVE (merchant D20919).
6. OVERRIDE-CLOSE-OUT.
═══════════════════════════════════════════════════════════════

## 1. File index (urutan kanonik)

| # | File | Tujuan | Status |
|---|---|---|---|
| 00 | `FM-00-INDEX.md` | Index + peta lapisan proses + DoD | ✅ |
| 01 | `FM-01-MASTER-ARCHITECT-PROMPT-DOC.md` | Prompt induk boot agent | ✅ |
| 02 | `FM-02-MASTER-HANDOFF-DOC.md` | Handoff per-session | ✅ |
| 03 | `FM-03-MASTER-SPRINT-KAS-DOC.md` | Sprint credit-aware | ✅ |
| 04 | `FM-04-RESUME-BOOT-DOC.md` | Resume keadaan repo | ✅ |
| — | `resume_boot.py` | Script resume (zero-dep, read-only) | ✅ |
| — | `README.md` | Panduan bundle | ✅ |
| — | `handoffs/HANDOFF-BKF-20260625-01.md` | Handoff sesi pembuatan bundle | ✅ |

**Skill terkait** (folder lain):
| File | Tujuan | Status |
|---|---|---|
| `skills/sovereign-barberkas-foundry-context-injection/SKILL.md` | Inject konteks + boot doctrine | ✅ |
| `.../references/context-map.md` | Peta doc + kapan memuat | ✅ |
| `.../references/inject-snippet.md` | Snippet siap-tempel | ✅ |

## 2. Hubungan dengan SSOT lain

- **Tidak men-supersede** apa pun. Murni **menambah lapisan PROSES** di atas:
  - Batch 4 (`B4-00..07`) — reposition skill→outcome.
  - Batch 5 (`B5-00..06`) — pivot Outcome Foundry / OaaS.
  - R6 (`SKILL-AUTHORING-STANDARD`, `R6-3`, `R6-4`) — standar skill, eval-loop, AgentShield.
- Skill context-injection **menunjuk & menegakkan** SSOT di atas (lihat `references/context-map.md`).

## 3. Verifikasi

```bash
# Resume-boot harus jalan tanpa dependency
python3 docs/ssot/foundry-master/resume_boot.py
python3 docs/ssot/foundry-master/resume_boot.py --json | python3 -m json.tool > /dev/null && echo "JSON OK"
```

> **Truth-Lock:** MANIFEST ini hanya mendaftar file yang benar-benar ada di folder bundle &
> skill. Status `✅` diklaim setelah file diverifikasi ada + `resume_boot.py` diuji jalan.
> Bundle **public-safe**: tidak memuat secret/credential.

## 4. Catatan keamanan (penting)

File credential yang pernah di-upload owner ke chat (mis. token Groq/Fonnte/OpenRouter/Duitku)
**TIDAK** dimasukkan ke repo/bundle ini. Credential WAJIB disimpan di **secret store**
(`wrangler secret` / `.dev.vars` lokal yang di-`.gitignore`), bukan di SSOT. Bila ada credential
yang terlanjur terekspos, **rotate** segera (GATE HITL owner).
