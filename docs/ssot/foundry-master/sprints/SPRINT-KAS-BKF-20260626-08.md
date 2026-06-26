# SPRINT-KAS — BKF-20260626-08
**Sprint:** R4 — Dashboard Langganan (Care Plan / AI Staff) + Reminder + Upsell high-ticket
**Doctrine:** MASTER-ARCHITECT-PROMPT v8.0 · D-1 Truth-Lock · credit-aware
**Repo:** Sparkmind-obp-off/Barberkas-foundry @ main · **Prod:** https://barberkas-aaas.pages.dev

---

## 1. Scope (apa yang dirakit)
NEXT STEP eksplisit dari handoff BKF-07: **R4 — retain & expand layer**.
- **Migration `0004_subscriptions.sql`** — tabel:
  - `subscriptions` (langganan aktif per-tenant: plan SKU, status, billing cycle, next_charge_at, MRR)
  - `reminders` (jadwal reminder: renewal/dunning/onboarding/winback — channel WA)
  - `upsell_events` (rekomendasi upsell high-ticket + status terima/tolak — telemetry expand)
- **Backend `src/routes/subscriptions.ts`** (mount `/api/v1/subscriptions`):
  - `POST /subscribe` — aktifkan langganan dari SKU subscription (reuse SKUS skus.ts; Truth-Lock harga = kode)
  - `GET /` — daftar langganan tenant + MRR ringkas
  - `POST /:id/cancel` — churn (set status cancelled, catat alasan)
  - `GET /reminders` + `POST /reminders/run` — engine reminder deterministik (jatuh tempo H-3, dunning, winback)
  - `GET /upsell` — rekomendasi upsell high-ticket berbasis rule (Starter→Pro→AI Staff add-on→Enterprise→Chain)
  - `POST /upsell/:id/respond` — catat accept/decline (telemetry expand-rate)
  - `GET /telemetry` — MRR, active subs, churn-rate, upsell-accept-rate, reminders due
- **Frontend** — tab **Langganan** baru di `src/pages/dashboard.ts` + handler di `public/static/app.js`
  (kartu langganan aktif, tombol reminder, panel upsell next-best-action).

## 2. Anggaran kredit/biaya (estimasi sebelum eksekusi)
- **Level: SEDANG.** 1 migration + 1 route file + edit dashboard/app.js + 1 build + 1 PM2 run + curl batch.
- **Anti-boros:** reuse engine yang ada (SKUS, rupiah, uid/now, markOrderPaid pattern, MoR checkout).
  Tidak menulis ulang checkout/payment. Reminder & upsell = **rule-based deterministik** (bukan LLM call) → 0 biaya token, Truth-Lock.
- **Stop-loss:** bila build merah > 2x atau scope melebar ke payment baru → STOP + handoff.

## 3. OMTM (1 metrik paling penting)
**MRR tercatat & dapat di-retain** (active subscriptions × harga/bln) + **upsell-accept-rate** sebagai sinyal expand.

## 4. Exit-gate (kapan selesai)
1. `npm run build` hijau (catat modul/kB).
2. Migration 0004 ter-apply ke D1 lokal tanpa error.
3. Curl bukti **semua** route R4 (subscribe→list→reminders→upsell→telemetry) 200 + JSON valid.
4. Regресi: `/health` `/app` `/solutions` `/case-study` tetap 200.
5. README + B5-05 update; handoff BKF-08 + backup tar.gz; commit + push origin/main.

## 5. GATE HITL (tetap berlaku)
- **Deploy CF BYOK = OPSIONAL** sesi ini (owner: "deploy via cf byok itu opsional").
  Default aman = LIVE di sandbox + push GitHub; deploy hanya bila owner izinkan eksplisit.
- Payment/secret/domain/harga/D1-destruktif tetap butuh izin owner.
- Truth-Lock: subscription = catatan nyata di D1; tidak mengarang MRR/testimoni.

## 6. Log kas (diisi saat close-out)
- Build: 45→? modul · `_worker.js` ?.?? kB.
- Hasil: route R4 LIVE (curl-verified) · push origin/main commit `?`.
