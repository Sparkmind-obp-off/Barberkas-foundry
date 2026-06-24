# 08-BARBERKAS-AaaS-DESIGN-SYSTEM-v1.0.md

**OWNER**: Reza Estes / Haidar Faras — "Sovereign AI Dev"
**DOCTRINE**: MASTER-ARCHITECT-PROMPT v5.0 + v7.0 + v8.0 OVERRIDE-LOCK
**ALIGNMENT**: SSOT Batch 4 (B4-04 outcome-led copy) + Batch 5 (proof-led UX) — *upgrade v1.1*
**DATE**: 2026-06-05 · **UPGRADED**: 2026-06-23 (Outcome Foundry alignment)
**STATUS**: CANONICAL · EXECUTE-READY · PUBLIC-SAFE · HARDENED · OUTCOME-FOUNDRY-ALIGNED

═══════════════════════════════════════════════════════════════
🔒 HARD CONSTRAINTS (embedded)
═══════════════════════════════════════════════════════════════
1. 100% genspark.ai/ai_developer + Cloudflare Workers/Pages.
2. Niche-first.
3. Horizontal-play.
4. D-1 Truth-Lock.
5. MoR Oasis BI Pro Duitku.
6. OVERRIDE-CLOSE-OUT.

═══════════════════════════════════════════════════════════════

## §OF. Outcome-Led & Proof-Led UX (Batch 4/5 — v1.1)

> Reposition Outcome Foundry mengubah **copy & hierarki halaman**, bukan token visual (steel-blue tetap). Selaras B4-04 (outcome-led + proof-led) & B5-02 (proof melekat).

### OF.1 Aturan copy halaman publik (landing/`/v2-agentic`, `/solutions`)
- **Bicara hasil, bukan fitur.** Hero = *"Barbershop-mu jalan: kasir + booking + AI Staff — bayar QRIS"*, bukan *"9 AI Curator agents"*.
- **Lulus tes 10 detik** (B4-05 §6): orang non-teknis paham & tahu langkah berikutnya (CTA).
- **Jargon disembunyikan** ke jalur developer/partner (skill mesin = proof, bukan headline).

### OF.2 Komponen UX baru (proof-led)
- **Proof block** — kartu bukti per outcome: URL live + screenshot transaksi pertama + metrik (re-use `.card`).
- **Outcome tier card** — DIY / Setup / Langganan (AI Staff) / DFY chain (tangga harga B5-03), bukan sekadar Free/Pro/Enterprise.
- **Galeri before/after** — case study barbershop (anonim bila perlu) → trust mainstream.
- **DoO checklist badge** — tampilkan status outcome ter-deliver (functional/proof/MoR) di dashboard merchant.

> Token warna, tipografi, spacing, motion (§2–§16) **tetap**. Hanya tambah pola copy + 4 komponen di atas.

---

## §1. Design Philosophy

### Core Principles
1. **Sovereign Steel-Blue Mode** — Dark, masculine, professional. Bukan playful pastel ala fitness apps. Bukan gold-heavy ala KuratorKas. Steel-blue = pembeda di Sovereign Ecosystem.
2. **Mobile-First (HP capster)** — 90%+ usage di mobile. Layout designed for thumb-reach + one-handed.
3. **AI-Native UX** — Setiap interaksi terasa "AI-assisted", bukan filled-form jadul.
4. **Bahasa Indonesia Default** — EN fallback only. Sopan-santun "Kak" / "Bro" appropriate context.
5. **Progressive Disclosure** — Capster newbie lihat 3 button, power user unlock 20. Tidak overwhelm.
6. **Performance-First** — TTFB <100ms (Cloudflare edge), LCP <1.5s, JS bundle <50KB initial.
7. **Capster Eyes, Founder Voice** — Visual & copy = barbershop authentic, bukan corporate SaaS.

---

## §2. Color System — Dark Sovereign Steel-Blue

### Primary Palette

```css
:root {
  /* Background - Dark steel */
  --bg-primary: #0A0F1A;        /* deepest base */
  --bg-surface: #131A29;        /* card / panel */
  --bg-elevated: #1E2638;       /* modal / popover */
  --bg-input: #0F1623;          /* form field */

  /* Border */
  --border-subtle: #1F2937;
  --border-strong: #2E3B4F;
  --border-focus: #4A90E2;

  /* Text */
  --text-primary: #E8EEF7;      /* main */
  --text-secondary: #A6B3C5;    /* secondary */
  --text-muted: #6B7B92;        /* placeholder */
  --text-inverse: #0A0F1A;      /* on accent */

  /* Accent — Steel-Blue (signature) */
  --accent: #4A90E2;            /* primary action */
  --accent-bright: #6BA6F0;     /* hover */
  --accent-dim: #2E6FC4;        /* pressed */
  --accent-bg: #0E1B30;         /* tint background */

  /* Secondary accent — Sovereign chrome */
  --chrome: #94A3B8;            /* metallic */
  --chrome-dim: #475569;

  /* Status */
  --success: #22C55E;
  --success-bg: #0A2E1B;
  --warning: #F59E0B;
  --warning-bg: #2A1E08;
  --danger:  #EF4444;
  --danger-bg: #2A0E0E;
  --info: #4A90E2;              /* same as accent */
}
```

### Light Mode (Optional)
```css
[data-theme="light"] {
  --bg-primary: #F7F9FC;
  --bg-surface: #FFFFFF;
  --bg-elevated: #FFFFFF;
  --text-primary: #0A0F1A;
  --text-secondary: #475569;
  --accent: #2E6FC4;
  --accent-bg: #E7F0FC;
  /* ... */
}
```

**Brutal honest**: Default = Dark. Capster Indonesia majoritas suka dark mode (kerja malam, batt save). Light mode optional, dev tidak diprioritaskan Sprint 0-3.

---

## §3. Typography

### Font Stack
```css
:root {
  --font-display: 'Inter', system-ui, -apple-system, sans-serif;
  --font-body: 'Inter', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;
}
```

### Scale (Mobile-first, rem unit)
```css
--text-xs:   0.75rem;   /* 12px - caption */
--text-sm:   0.875rem;  /* 14px - body sm */
--text-base: 1rem;      /* 16px - body */
--text-lg:   1.125rem;  /* 18px - subhead */
--text-xl:   1.25rem;   /* 20px - h3 */
--text-2xl:  1.5rem;    /* 24px - h2 */
--text-3xl:  1.875rem;  /* 30px - h1 mobile */
--text-4xl:  2.25rem;   /* 36px - h1 desktop */
```

### Weight
- 400 body
- 500 emphasis / labels
- 600 subheading
- 700 heading
- 800 hero only

---

## §4. Spacing (8px grid)

```css
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
```

Rule: gap, padding, margin = multiples of 4. Tidak ada `13px`, `17px`.

---

## §5. Border Radius

```css
--radius-sm: 4px;   /* tags, chip */
--radius-md: 8px;   /* buttons, inputs */
--radius-lg: 12px;  /* cards */
--radius-xl: 16px;  /* modal */
--radius-full: 9999px;  /* pill, avatar */
```

---

## §6. Elevation / Shadow

```css
--shadow-sm: 0 1px 2px rgba(0,0,0,0.3);
--shadow-md: 0 4px 6px rgba(0,0,0,0.4), 0 2px 4px rgba(0,0,0,0.3);
--shadow-lg: 0 10px 15px rgba(0,0,0,0.5), 0 4px 6px rgba(0,0,0,0.3);
--shadow-glow: 0 0 16px rgba(74,144,226,0.3); /* accent focus */
```

---

## §7. Component Library (Core)

### Button
```html
<!-- Primary -->
<button class="btn btn-primary">Konfirmasi Booking</button>
<!-- Secondary -->
<button class="btn btn-secondary">Batal</button>
<!-- Danger -->
<button class="btn btn-danger">Hapus</button>
<!-- Ghost -->
<button class="btn btn-ghost">Lihat detail</button>
```

```css
.btn {
  padding: var(--space-3) var(--space-5);
  border-radius: var(--radius-md);
  font-weight: 500;
  font-size: var(--text-base);
  transition: all 150ms ease;
  min-height: 44px; /* mobile tap target */
}
.btn-primary { background: var(--accent); color: var(--text-inverse); }
.btn-primary:hover { background: var(--accent-bright); }
.btn-secondary { background: var(--bg-surface); border: 1px solid var(--border-strong); color: var(--text-primary); }
.btn-danger { background: var(--danger); color: white; }
.btn-ghost { background: transparent; color: var(--accent); }
```

### Card
```html
<div class="card">
  <h3 class="card-title">Stylist Curator</h3>
  <p class="card-desc">AI rekomendasi cut style</p>
  <button class="btn btn-primary">Coba Sekarang</button>
</div>
```

```css
.card {
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
}
```

### Input
```html
<label class="label">Nama Customer</label>
<input class="input" type="text" placeholder="Nama lengkap..." />
```

```css
.input {
  background: var(--bg-input);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  padding: var(--space-3) var(--space-4);
  width: 100%;
  min-height: 44px;
  font-size: var(--text-base);
}
.input:focus {
  border-color: var(--border-focus);
  outline: none;
  box-shadow: var(--shadow-glow);
}
```

### Badge / Pill
```html
<span class="badge badge-success">Active</span>
<span class="badge badge-warning">Trial</span>
<span class="badge badge-info">AI</span>
```

### Agent Card (signature)
```html
<div class="agent-card">
  <div class="agent-icon">✂️</div>
  <h4>Stylist Curator</h4>
  <p>Rekomendasi cut style dari history customer</p>
  <div class="agent-meta">
    <span class="badge badge-info">Pro</span>
    <span class="text-muted">200 calls/bln</span>
  </div>
  <button class="btn btn-primary">Panggil Agent</button>
</div>
```

---

## §8. Iconography

### Library
- **Lucide Icons** (open source, MIT) — tree-shake on demand
- Custom: barbershop-specific (scissors, comb, razor, pomade)
- Loaded via inline SVG, no icon font

### Naming convention
```html
<svg class="icon icon-scissors" />
<svg class="icon icon-clock icon-sm" />  <!-- sm = 16px, md = 20px (default), lg = 24px -->
```

---

## §9. Layout Patterns

### Mobile (default)
```
┌───────────────────────┐
│ Header (fixed, 56px)  │
├───────────────────────┤
│                       │
│  Content (scroll)     │
│                       │
├───────────────────────┤
│ Bottom Nav (64px)     │
└───────────────────────┘
```

### Bottom Nav (5 max items)
```
[ Home ] [ Transaksi ] [ AI ] [ Customer ] [ Profile ]
```

Center "AI" = primary action button (slightly elevated, accent color).

### Tablet / Desktop
```
┌──────────────────────────────────┐
│ Header                            │
├──────┬───────────────────────────┤
│ Side │                            │
│ Nav  │   Main content (max 1200)  │
│      │                            │
│      │                            │
└──────┴───────────────────────────┘
```

---

## §10. Tone of Voice (Copy)

### Style Rules
- Bahasa Indonesia casual-professional. "Kak" / "Bro" acceptable in customer-facing WA.
- Avoid corporate buzzword: "synergy", "leverage", "ekosistem digital terdepan"
- Action-oriented: "Booking", "Konfirmasi", "Lihat hasil" (verb-led)
- Brutal honest in error: "Saldo tidak cukup" bukan "Terjadi kesalahan tidak terduga"
- Founder voice: kalau capster baca, dia ngerasa "ini bro saya yang ngomong, bukan bot"

### Example: Empty State
❌ Bad: "Tidak ada data yang tersedia saat ini"
✅ Good: "Belum ada transaksi hari ini. Yuk mulai catat customer pertama!"

### Example: Error
❌ Bad: "Error 500: Internal Server Error"
✅ Good: "Wah, server kita lagi nge-lag. Tunggu sebentar atau hubungi kita di WA."

### Example: Success
❌ Bad: "Operation completed successfully"
✅ Good: "Booking confirmed! WA reminder otomatis dikirim 1 jam sebelum."

---

## §11. Accessibility (WCAG AA minimum)

- Contrast ratio: text 4.5:1, large text 3:1
- Focus indicators visible (use `--shadow-glow` on focus)
- Touch target min 44×44px
- All interactive: keyboard accessible
- ARIA labels on icon-only buttons
- Screen reader friendly heading hierarchy

---

## §12. Logo / Brand Mark

```
   ╱│
  ╱ │   B  A  R  B  E  R  K  A  S
 ╱  │
╱   │   Vibe Kasir untuk Capster
```

### Wordmark
- "BarberKas" — Inter weight 700, letter-spacing -0.02em
- Color: `--accent` on dark, `#0A0F1A` on light
- "v2 Agentic" tag — Inter weight 500, smaller, `--chrome` color

### Icon mark
- Scissors blade + ascending bar chart fusion
- 1-color flat, no gradient

---

## §13. Email / WA Template Style

### WA template tone
```
🔱 BarberKas
Halo Kak [Nama], 

Reminder: booking jam 15:00 hari ini, sama Capster Andre.

Kalau ada yang perlu diubah, balas pesan ini.

Sampai ketemu! ✂️
```

Rules:
- Start with brand emoji + name
- "Halo Kak/Bro [Name]"
- Body ≤ 3 lines
- End: friendly + sign-off
- Always opt-out footer if broadcast

### Email (rare, for billing only)
- Minimal HTML, plain-text safe
- Single CTA button
- Brand color accent

---

## §14. Print Style (Receipt)

Thermal printer 58mm width:
```
========================================
        BARBERSHOP ALFACUT
   Jl. Sudirman 12, Purwokerto
========================================
Tanggal: 2026-06-15 14:32
Capster: Andre

Cuci Potong            Rp 35.000
Pomade Premium         Rp 25.000
                       ---------
TOTAL                  Rp 60.000

Bayar: Cash
Kembalian: Rp 40.000

Terima kasih ✂️
Powered by BarberKas
========================================
```

---

## §15. Motion / Animation

### Principles
- Subtle, never bouncy
- Duration 150-250ms standard
- Easing: `ease-out` for entry, `ease-in` for exit
- Reduce motion respected (prefers-reduced-motion)

### Common
```css
.fade-in { animation: fadeIn 200ms ease-out; }
.slide-up { animation: slideUp 250ms ease-out; }
.skeleton-pulse { animation: pulse 1.5s ease-in-out infinite; }
```

---

## §16. Design Tokens File

All tokens exported as `design-tokens.json` for cross-platform (PWA + future native):
```json
{
  "color": { "bg": { "primary": "#0A0F1A", ... } },
  "spacing": { "1": "4px", ... },
  "radius": { ... },
  "shadow": { ... }
}
```

Synced with Tailwind config + CSS vars.

---

## §17. Reference: Cross-Brand Visual Identity

| Brand | Primary | Secondary | Vibe |
|---|---|---|---|
| **SparkMind** (parent) | Dark + chrome | Subtle gradient | Sovereign authority |
| **BarberKas** | Dark + steel-blue #4A90E2 | Chrome accent | Capster-masculine |
| **KuratorKas** | Dark + gold #D4AF37 | Cream | Fashion-elegant |
| **PaceLokal** | Dark + orange #FF6B1A | Cyan #00D9FF | Running-energetic |
| **Nurani.OS** (future) | Dark + emerald | Soft white | Spiritual-calm |

**Pattern**: All Sovereign Ecosystem = dark base, brand-specific accent. Cohesive but distinct.

---

**END §08 — Design System**
