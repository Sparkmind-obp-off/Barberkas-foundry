// R3 — Halaman solusi per-vertikal: /solutions (index) + /solutions/:slug.
// Komponen: hero per-vertikal · intake form (POST /api/v1/outcome/intake) ·
// kalkulator harga (GET /api/v1/outcome/price-estimate) · objection FAQ.
// Steel-blue Sovereign dark mode, reuse style.css. Bahasa Indonesia default.

import { rupiah } from '../lib/d1'
import { VERTICALS, type Vertical, faqsFor, recommendedSKUs } from '../data/verticals'

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

// ── Index: daftar semua vertikal ─────────────────────────────────────────────
export function solutionsIndexPage(): string {
  const cards = VERTICALS.map((v) => `
    <a class="card proof-card" href="/solutions/${v.slug}" style="text-decoration:none;display:block">
      <div class="proof-metric">${v.emoji}</div>
      <h3>${v.name}</h3>
      <p class="muted">${v.hero_sub}</p>
      <span class="badge badge-info">Lihat solusi →</span>
    </a>`).join('')

  return `${head('Solusi per Industri — BarberKas AaaS', 'Solusi kasir + booking + AI Staff untuk barbershop, salon, klinik, laundry, dan cafe. Intake langsung, harga transparan.')}
<body>
${siteHeader()}
<main>
  <section class="hero" id="hero-section">
    <div class="container">
      <span class="eyebrow">Outcome SKU · per Industri</span>
      <h1 class="hero-title">Pilih <span class="accent">industri</span>-mu, lihat outcome-nya.</h1>
      <p class="hero-sub">Setiap industri punya kebutuhan beda. Pilih yang paling mendekati usahamu — isi intake, lihat estimasi harga transparan, dan mulai.</p>
    </div>
  </section>
  <section class="section">
    <div class="container">
      <div class="grid grid-3">${cards}</div>
    </div>
  </section>
</main>
${siteFooter()}
</body>
</html>`
}

// ── Detail: /solutions/:slug ─────────────────────────────────────────────────
export function solutionPage(v: Vertical): string {
  const faqs = faqsFor(v)
  const skus = recommendedSKUs(v)

  const painsList = v.pains.map((p) => `<li>${p}</li>`).join('')
  const outcomesList = v.outcomes.map((o) => `<li>${o}</li>`).join('')

  const skuCards = skus.map((s) => {
    const priceFmt = (s.price_from ? 'mulai ' : '') + rupiah(s.price_cents) + (s.billing === 'subscription' ? '/bln' : '')
    return `
      <article class="card price-card">
        <h3>${s.name}</h3>
        <div class="price">${priceFmt}</div>
        <ul><li>${s.value_metric}</li><li class="muted">Bukti: ${s.proof}</li></ul>
        <span class="badge ${s.checkout === 'instant' ? 'badge-success' : 'badge-warning'}">${s.checkout === 'instant' ? 'Checkout instan' : 'Via intake'}</span>
      </article>`
  }).join('')

  const faqItems = faqs.map((f, i) => `
      <details class="card" style="margin-bottom:var(--space-3)"${i === 0 ? ' open' : ''}>
        <summary style="cursor:pointer;font-weight:700">${f.q}</summary>
        <p class="muted" style="margin-top:var(--space-2)">${f.a}</p>
      </details>`).join('')

  // Opsi base SKU untuk kalkulator (hanya yang relevan vertikal)
  const baseOptions = skus.map((s) =>
    `<option value="${s.slug}"${s.slug === v.calculator_base_slug ? ' selected' : ''}>${s.name}</option>`
  ).join('')

  return `${head(`Solusi ${v.name} — BarberKas AaaS`, v.hero_sub)}
<body>
${siteHeader()}
<main>
  <section class="hero" id="hero-section">
    <div class="container">
      <span class="eyebrow">${v.emoji} Solusi ${v.name}</span>
      <h1 class="hero-title">${v.hero_title}</h1>
      <p class="hero-sub">${v.hero_sub}</p>
      <div class="hero-cta">
        <a href="#intake" class="btn btn-primary btn-lg">Mulai Intake</a>
        <a href="#kalkulator" class="btn btn-secondary btn-lg">Hitung Estimasi Harga</a>
      </div>
    </div>
  </section>

  <!-- PAINS vs OUTCOMES -->
  <section class="section">
    <div class="container">
      <div class="grid grid-2">
        <article class="card">
          <h2 class="section-title">Masalah yang sering kamu alami</h2>
          <ul class="list">${painsList}</ul>
        </article>
        <article class="card">
          <h2 class="section-title">Yang kamu dapat <span class="muted">(outcome)</span></h2>
          <ul class="list">${outcomesList}</ul>
        </article>
      </div>
    </div>
  </section>

  <!-- KALKULATOR HARGA -->
  <section class="section section-alt" id="kalkulator">
    <div class="container">
      <h2 class="section-title">Kalkulator estimasi harga</h2>
      <p class="section-sub">Transparan — angka diambil langsung dari katalog. Tanpa biaya tersembunyi.</p>
      <div class="grid grid-2">
        <article class="card">
          <label class="label" for="calc-base">Paket dasar</label>
          <select class="input" id="calc-base">${baseOptions}</select>

          <label class="label" for="calc-staff" style="margin-top:var(--space-4)">AI Staff tambahan (0–9)</label>
          <input class="input" id="calc-staff" type="number" min="0" max="9" value="0">

          <label class="label" style="margin-top:var(--space-4);display:flex;align-items:center;gap:var(--space-2)">
            <input id="calc-care" type="checkbox"> Tambah Care Plan (update &amp; support)
          </label>
        </article>
        <article class="card" id="calc-result" aria-live="polite">
          <p class="muted">Mengisi estimasi…</p>
        </article>
      </div>
    </div>
  </section>

  <!-- PAKET REKOMENDASI -->
  <section class="section" id="paket">
    <div class="container">
      <h2 class="section-title">Paket untuk ${v.name}</h2>
      <p class="section-sub">Urut tangga: land → retain → expand.</p>
      <div class="grid grid-4">${skuCards}</div>
    </div>
  </section>

  <!-- INTAKE FORM -->
  <section class="section section-alt" id="intake">
    <div class="container">
      <h2 class="section-title">Mulai: ceritakan usahamu</h2>
      <p class="section-sub">Kami klasifikasikan kebutuhanmu jujur (gate kelayakan) sebelum kamu bayar.</p>
      <form id="intake-form" class="card" style="max-width:640px">
        <input type="hidden" id="f-vertical" value="${v.slug}">
        <label class="label" for="f-shop">Nama usaha</label>
        <input class="input" id="f-shop" required placeholder="Contoh: ${v.name} ${v.slug === 'barbershop' ? 'AlfaCut' : 'Sejahtera'}">

        <label class="label" for="f-name" style="margin-top:var(--space-4)">Nama kamu</label>
        <input class="input" id="f-name" placeholder="Nama kontak">

        <label class="label" for="f-phone" style="margin-top:var(--space-4)">Nomor WhatsApp</label>
        <input class="input" id="f-phone" required placeholder="08xxxxxxxxxx">

        <label class="label" for="f-problem" style="margin-top:var(--space-4)">Masalah / kebutuhanmu</label>
        <textarea class="input" id="f-problem" rows="4" required placeholder="${v.intake_placeholder}"></textarea>

        <div class="modal-actions" style="margin-top:var(--space-5)">
          <button type="submit" class="btn btn-primary btn-lg">Kirim Intake</button>
        </div>
        <div id="intake-result" style="margin-top:var(--space-4)"></div>
      </form>
    </div>
  </section>

  <!-- OBJECTION FAQ -->
  <section class="section" id="faq">
    <div class="container">
      <h2 class="section-title">Pertanyaan yang sering ditanyakan</h2>
      <div style="max-width:760px">${faqItems}</div>
    </div>
  </section>

  <section class="section cta-final">
    <div class="container">
      <h2>Siap bikin ${v.name.toLowerCase()}-mu jalan?</h2>
      <a href="#intake" class="btn btn-primary btn-lg">Mulai Intake Sekarang</a>
    </div>
  </section>
</main>
${siteFooter()}
<script>
(function(){
  var API = '/api/v1/outcome';
  // ── Kalkulator ──
  var baseEl = document.getElementById('calc-base');
  var staffEl = document.getElementById('calc-staff');
  var careEl = document.getElementById('calc-care');
  var resEl = document.getElementById('calc-result');

  function rupiah(cents){ return 'Rp ' + Math.round(cents/100).toLocaleString('id-ID'); }

  async function calc(){
    var qs = new URLSearchParams({
      base_slug: baseEl.value,
      ai_staff_count: String(staffEl.value || 0),
      care_plan: careEl.checked ? '1' : '0'
    });
    try {
      var r = await fetch(API + '/price-estimate?' + qs.toString());
      var d = await r.json();
      if(!d.ok){ resEl.innerHTML = '<p class="muted">'+(d.error||'Tidak bisa menghitung')+'</p>'; return; }
      var rows = d.lines.map(function(l){
        return '<div class="list-item"><span>'+l.label+'</span><span class="li-amount">'+rupiah(l.price_cents)+(l.billing==='subscription'?'/bln':'')+'</span></div>';
      }).join('');
      var totals = '';
      if(d.one_time_cents>0) totals += '<div class="stat"><span class="stat-label">Sekali bayar</span><span class="stat-value">'+rupiah(d.one_time_cents)+'</span></div>';
      if(d.monthly_cents>0) totals += '<div class="stat"><span class="stat-label">Per bulan</span><span class="stat-value">'+rupiah(d.monthly_cents)+'/bln</span></div>';
      resEl.innerHTML = '<div class="list">'+rows+'</div><div class="stat-grid" style="margin-top:var(--space-4)">'+totals+'</div><p class="muted" style="margin-top:var(--space-3)">'+d.note+'</p>';
    } catch(e){ resEl.innerHTML = '<p class="muted">Gagal memuat estimasi.</p>'; }
  }
  baseEl.addEventListener('change', calc);
  staffEl.addEventListener('input', calc);
  careEl.addEventListener('change', calc);
  calc();

  // ── Intake ──
  var form = document.getElementById('intake-form');
  var out = document.getElementById('intake-result');
  form.addEventListener('submit', async function(ev){
    ev.preventDefault();
    out.innerHTML = '<p class="muted">Mengirim…</p>';
    var payload = {
      shop_name: document.getElementById('f-shop').value.trim(),
      contact_name: document.getElementById('f-name').value.trim(),
      contact_phone: document.getElementById('f-phone').value.trim(),
      problem: document.getElementById('f-problem').value.trim(),
      vertical: document.getElementById('f-vertical').value
    };
    if(!payload.shop_name || !payload.contact_phone || !payload.problem){
      out.innerHTML = '<p class="badge badge-warning">Nama usaha, WhatsApp, dan masalah wajib diisi.</p>'; return;
    }
    try {
      var r = await fetch(API + '/intake', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
      var d = await r.json();
      if(r.ok){
        var sku = d.classified_sku || {};
        out.innerHTML = '<div class="card"><span class="badge badge-success">Intake diterima</span>'
          + '<p style="margin-top:var(--space-2)"><strong>Rekomendasi:</strong> '+(sku.name||'-')+'</p>'
          + '<p class="muted">'+(d.feasible_reason||d.reason||'Tim kami akan menghubungi via WhatsApp.')+'</p></div>';
      } else {
        out.innerHTML = '<p class="badge badge-warning">'+(d.error||'Gagal mengirim intake')+'</p>';
      }
    } catch(e){ out.innerHTML = '<p class="badge badge-warning">Gagal terhubung. Coba lagi.</p>'; }
  });
})();
</script>
</body>
</html>`
}
