// R2 — Halaman case-study publik (proof-led): /case-study (index) + /proof/:slug.
// Komponen: telemetry agregat LIVE (GET /api/v1/outcome/telemetry/delivery) ·
// daftar case-study (data/cases.ts) · detail per-case (metrics before/after + bukti).
// Steel-blue Sovereign dark mode, reuse style.css. Bahasa Indonesia default.
// Truth-Lock: badge status (pilot vs ilustrasi) tampil eksplisit; tidak ada klaim palsu.

import { CASES, findCase, type CaseStudy, DELIVERY_LABEL, STATUS_LABEL } from '../data/cases'

function head(title: string, desc: string): string {
  return `<!DOCTYPE html>
<html lang="id" data-theme="dark">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90' fill='%234A90E2'>⊿</text></svg>">
<meta name="description" content="${desc}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
<link href="/static/style.css" rel="stylesheet">
</head>`
}

function siteHeader(): string {
  return `<header class="site-header">
  <div class="container nav">
    <a href="/" class="brand"><span class="brand-mark">⊿</span> BarberKas <span class="brand-tag">v2 Agentic</span></a>
    <nav class="nav-links">
      <a href="/solutions">Solusi</a>
      <a href="/case-study">Bukti</a>
      <a href="/#pricing">Harga</a>
      <a href="/app" class="btn btn-primary btn-sm">Buka Demo App</a>
    </nav>
  </div>
</header>`
}

function siteFooter(): string {
  return `<footer class="site-footer">
  <div class="container">
    <p><strong>BarberKas AaaS</strong> · SparkMind Sovereign Ecosystem · MoR Oasis BI Pro (Duitku)</p>
    <p class="muted">Niche-first: barbershop UMKM Purwokerto → Banyumas → Jateng → Indonesia. Cloudflare-native.</p>
  </div>
</footer>`
}

function statusBadge(s: CaseStudy['status']): string {
  const cls = s === 'pilot' ? 'badge-success' : 'badge-warning'
  return `<span class="badge ${cls}">${STATUS_LABEL[s]}</span>`
}

function caseCard(c: CaseStudy): string {
  return `
    <a class="card proof-card" href="/proof/${c.slug}" style="text-decoration:none;display:block">
      <div class="proof-metric">${c.emoji}</div>
      <div style="display:flex;gap:var(--space-1h);flex-wrap:wrap;margin:var(--space-1) 0">
        ${statusBadge(c.status)}
        <span class="badge badge-info">${DELIVERY_LABEL[c.delivery_mode]}</span>
      </div>
      <h3>${c.business}</h3>
      <p class="muted">${c.headline}</p>
      <p class="muted" style="font-size:var(--text-sm)">📍 ${c.location} · ⏱️ ${c.tto_days} hari (Time-to-Outcome)</p>
      <span class="badge badge-info">Lihat bukti →</span>
    </a>`
}

// ── Index: /case-study ───────────────────────────────────────────────────────
export function caseStudyIndexPage(): string {
  const cards = CASES.map(caseCard).join('')
  return `${head(
    'Bukti Hasil (Case Study) — BarberKas AaaS',
    'Bukti nyata: outcome, Time-to-Outcome, dan metrik before/after dari pemasangan BarberKas. Proof-led, jujur (pilot vs ilustrasi).'
  )}
<body>
${siteHeader()}
<main>
  <section class="hero" id="hero-section">
    <div class="container">
      <p class="eyebrow">PROOF-LED · BUKTI = PRODUK</p>
      <h1 class="hero-title">Bukti hasil, bukan janji.</h1>
      <p class="hero-sub">Kami tampilkan outcome nyata + metrik before/after. Setiap kartu ditandai jujur: <strong>pilot nyata</strong> atau <strong>ilustrasi skenario</strong>.</p>
    </div>
  </section>

  <!-- Telemetry agregat LIVE dari DB (orders) -->
  <section class="section" id="telemetry-live">
    <div class="container">
      <h2 class="section-title">Telemetry pengiriman (live)</h2>
      <p class="section-sub muted">Angka di bawah ditarik langsung dari database produksi (real, bukan ilustrasi).</p>
      <div class="stat-grid" id="telemetry-grid">
        <div class="stat"><div class="stat-value" id="t-orders">…</div><div class="stat-label">Order total</div></div>
        <div class="stat"><div class="stat-value" id="t-paid">…</div><div class="stat-label">Order dibayar</div></div>
        <div class="stat"><div class="stat-value" id="t-doo">…</div><div class="stat-label">DoO lulus (%)</div></div>
        <div class="stat"><div class="stat-value" id="t-tto">…</div><div class="stat-label">TTO median (hari)</div></div>
      </div>
    </div>
  </section>

  <section class="section section-alt" id="cases">
    <div class="container">
      <h2 class="section-title">Studi kasus per industri</h2>
      <div class="grid grid-3">${cards}</div>
    </div>
  </section>

  <section class="cta-final" id="cta">
    <div class="container">
      <h2>Mau hasil yang sama di usaha Anda?</h2>
      <p class="muted">Mulai dari intake gratis — kami klasifikasikan kebutuhan & tampilkan harga transparan.</p>
      <a href="/solutions" class="btn btn-primary btn-lg">Lihat solusi & mulai intake →</a>
    </div>
  </section>
</main>
${siteFooter()}
<script>
(async () => {
  try {
    const r = await fetch('/api/v1/outcome/telemetry/delivery', { headers: { 'X-Tenant': 'alfacut' } });
    if (!r.ok) throw new Error('status ' + r.status);
    const d = await r.json();
    document.getElementById('t-orders').textContent = d.orders_total ?? 0;
    document.getElementById('t-paid').textContent = d.orders_paid ?? 0;
    document.getElementById('t-doo').textContent = (d.doo_success_rate_pct ?? 0) + '%';
    document.getElementById('t-tto').textContent = d.tto_median_days ?? '—';
  } catch (e) {
    ['t-orders','t-paid','t-doo','t-tto'].forEach(id => { document.getElementById(id).textContent = '—'; });
  }
})();
</script>
</body>
</html>`
}

// ── Detail: /proof/:slug ─────────────────────────────────────────────────────
export function casePage(c: CaseStudy): string {
  const metricRows = c.metrics
    .map(
      (m) => `
      <div class="card" style="display:grid;grid-template-columns:1.4fr 1fr 1fr .6fr;gap:var(--space-2);align-items:center">
        <div><strong>${m.label}</strong></div>
        <div class="muted">Sebelum: ${m.before}</div>
        <div class="accent">Sesudah: ${m.after}</div>
        <div class="badge badge-success">${m.delta}</div>
      </div>`
    )
    .join('')

  const quote = c.quote
    ? `<blockquote class="card" style="border-left:4px solid var(--accent,#4A90E2);padding:var(--space-4) var(--space-5)">
         <p style="font-size:var(--text-lg)">"${c.quote.text}"</p>
         <p class="muted">— ${c.quote.by}</p>
       </blockquote>`
    : ''

  const truthNote =
    c.status === 'illustration'
      ? `<div class="card" style="border:1px solid var(--warn,#d6a23a)">
           <p><strong>⚠️ Ilustrasi:</strong> ${c.proof_note}</p>
         </div>`
      : `<div class="card">
           <p><strong>🔎 Bukti (${c.proof_kind}):</strong> ${c.proof_note}</p>
         </div>`

  return `${head(`${c.business} — Bukti Hasil · BarberKas AaaS`, c.headline)}
<body>
${siteHeader()}
<main>
  <section class="hero" id="hero-section">
    <div class="container">
      <p class="eyebrow"><a href="/case-study" style="color:inherit">← Semua bukti</a></p>
      <div style="display:flex;gap:var(--space-1h);flex-wrap:wrap;margin:var(--space-1h) 0">
        ${statusBadge(c.status)}
        <span class="badge badge-info">${DELIVERY_LABEL[c.delivery_mode]}</span>
        <span class="badge badge-info">⏱️ TTO ${c.tto_days} hari</span>
      </div>
      <h1 class="hero-title">${c.emoji} ${c.business}</h1>
      <p class="hero-sub">${c.headline}</p>
      <p class="muted">📍 ${c.location}</p>
    </div>
  </section>

  <section class="section" id="context">
    <div class="container grid grid-2">
      <article class="card">
        <h3>Masalah awal</h3>
        <p class="muted">${c.context}</p>
      </article>
      <article class="card">
        <h3>Yang kami pasang</h3>
        <p class="muted">${c.intervention}</p>
        <p><a href="/solutions/${c.vertical_slug}" class="badge badge-info">Solusi ${c.vertical_slug} →</a></p>
      </article>
    </div>
  </section>

  <section class="section section-alt" id="metrics">
    <div class="container">
      <h2 class="section-title">Metrik before → after</h2>
      <div class="list" style="display:grid;gap:var(--space-2h)">${metricRows}</div>
    </div>
  </section>

  <section class="section" id="proof">
    <div class="container" style="display:grid;gap:var(--space-3)">
      ${truthNote}
      ${quote}
    </div>
  </section>

  <section class="cta-final" id="cta">
    <div class="container">
      <h2>Mau outcome serupa?</h2>
      <a href="/solutions/${c.vertical_slug}" class="btn btn-primary btn-lg">Mulai intake untuk ${c.vertical_slug} →</a>
    </div>
  </section>
</main>
${siteFooter()}
</body>
</html>`
}
