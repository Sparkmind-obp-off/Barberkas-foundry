// Landing page — Outcome-led + proof-led (Design System §OF.1/§OF.2).
// Steel-blue Sovereign dark mode. Bahasa Indonesia default.

export function landingPage(): string {
  return `<!DOCTYPE html>
<html lang="id" data-theme="dark">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>BarberKas — Kasir + Booking + AI Staff untuk Barbershop</title>
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90' fill='%234A90E2'>⊿</text></svg>">
<meta name="description" content="Barbershop-mu jalan: kasir + booking + AI Staff. Bayar pakai QRIS. BarberKas AaaS — SparkMind Sovereign Ecosystem.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
<link href="/static/style.css" rel="stylesheet">
</head>
<body>
<header class="site-header">
  <div class="container nav">
    <a href="/" class="brand"><span class="brand-mark">⊿</span> BarberKas <span class="brand-tag">v2 Agentic</span></a>
    <nav class="nav-links">
      <a href="#proof">Bukti</a>
      <a href="#agents">AI Staff</a>
      <a href="#pricing">Harga</a>
      <a href="/app" class="btn btn-primary btn-sm">Buka Demo App</a>
    </nav>
  </div>
</header>

<main>
  <!-- HERO — bicara hasil, bukan fitur (OF.1) -->
  <section class="hero" id="hero-section">
    <div class="container">
      <span class="eyebrow">Outcome SKU · SparkMind Outcome Foundry</span>
      <h1 class="hero-title">Barbershop-mu <span class="accent">jalan</span>:<br>kasir + booking + AI Staff.</h1>
      <p class="hero-sub">Ceritakan barbershop-mu. Pulang bawa kasir &amp; booking yang sudah <strong>LIVE &amp; dipakai</strong> — bayar pakai QRIS. Bukan POS biasa, tapi AI sales-team-in-a-box untuk capster.</p>
      <div class="hero-cta">
        <a href="/app" class="btn btn-primary btn-lg">Coba Dashboard (Demo AlfaCut)</a>
        <a href="#pricing" class="btn btn-secondary btn-lg">Lihat Tangga Harga</a>
      </div>
      <p class="hero-note">100% Cloudflare-native · Onboarding &lt; 15 menit via WhatsApp · MoR Duitku live</p>
    </div>
  </section>

  <!-- PROOF BLOCK (OF.2) -->
  <section class="section" id="proof">
    <div class="container">
      <h2 class="section-title">Bukti, bukan janji <span class="muted">(D-1 Truth-Lock)</span></h2>
      <p class="section-sub">Outcome dianggap ter-deliver kalau app live + transaksi/booking pertama tercatat. Itu kontraknya.</p>
      <div class="grid grid-3">
        <article class="card proof-card">
          <div class="proof-metric">LIVE</div>
          <h3>App kas + booking</h3>
          <p class="muted">alfacut.barberkas.sparkmind.web.id — dapat diakses, transaksi pertama tercatat.</p>
        </article>
        <article class="card proof-card">
          <div class="proof-metric">3 / 9</div>
          <h3>AI Staff aktif</h3>
          <p class="muted">Resepsionis, Marketing, Insight Stylist sudah live. 6 sisanya intro bertahap (jujur, no overpromise).</p>
        </article>
        <article class="card proof-card">
          <div class="proof-metric">QRIS</div>
          <h3>Pembayaran tercatat</h3>
          <p class="muted">Lewat MoR Oasis BI Pro (Duitku). Faktur otomatis terkirim ke WhatsApp.</p>
        </article>
      </div>
    </div>
  </section>

  <!-- AI STAFF (agents = mesin, dijual sebagai outcome) -->
  <section class="section section-alt" id="agents">
    <div class="container">
      <h2 class="section-title">AI Staff barbershop-mu</h2>
      <p class="section-sub">Di balik layar: 9 Curator agents (mesin). Yang kamu rasakan: staf yang ngerjain hal yang capster gak sempet.</p>
      <div class="grid grid-3" id="agent-grid">
        <article class="agent-card"><div class="agent-icon">📅</div><h4>AI Staff — Resepsionis</h4><p class="muted">Balas WA customer → booking otomatis masuk.</p><span class="badge badge-success">Live</span></article>
        <article class="agent-card"><div class="agent-icon">📸</div><h4>AI Staff — Marketing</h4><p class="muted">Caption IG/TikTok + hashtag siap posting.</p><span class="badge badge-success">Live</span></article>
        <article class="agent-card"><div class="agent-icon">✂️</div><h4>Insight Stylist</h4><p class="muted">Rekomendasi cut dari history customer.</p><span class="badge badge-success">Live</span></article>
        <article class="agent-card"><div class="agent-icon">🤝</div><h4>AI Staff — CRM</h4><p class="muted">Loyalty + re-engage customer.</p><span class="badge badge-warning">Roadmap</span></article>
        <article class="agent-card"><div class="agent-icon">💰</div><h4>AI Staff — Admin/Ops</h4><p class="muted">Pricing, inventory, analitik capster.</p><span class="badge badge-warning">Roadmap</span></article>
        <article class="agent-card"><div class="agent-icon">🏢</div><h4>Cross-shop Ops</h4><p class="muted">Benchmark multi-outlet (chain).</p><span class="badge badge-info">High-ticket</span></article>
      </div>
    </div>
  </section>

  <!-- PRICING — tangga OaaS (OF.3) -->
  <section class="section" id="pricing">
    <div class="container">
      <h2 class="section-title">Tangga harga Outcome Foundry</h2>
      <p class="section-sub">Land → Retain → Expand. Bukan sekadar Free/Pro/Enterprise.</p>
      <div class="grid grid-4">
        <article class="card price-card">
          <h3>Edukasi</h3><div class="price">Gratis</div>
          <ul><li>Coba dashboard demo</li><li>Lihat AI Staff bekerja</li><li>Tanpa kartu</li></ul>
        </article>
        <article class="card price-card">
          <h3>Setup (Land)</h3><div class="price">Rp 49–99K<span>/bln</span></div>
          <ul><li>Kasir + booking LIVE</li><li>Struk WhatsApp</li><li>DIY template / DWY pasang</li></ul>
        </article>
        <article class="card price-card featured">
          <span class="ribbon">Populer</span>
          <h3>AI Staff (Retain)</h3><div class="price">Rp 149–499K<span>/bln</span></div>
          <ul><li>Resepsionis + Marketing</li><li>Insight Stylist</li><li>Pay-per-call agent</li></ul>
        </article>
        <article class="card price-card">
          <h3>Chain (Expand)</h3><div class="price">High-ticket</div>
          <ul><li>Multi-outlet ops</li><li>Cross-shop benchmark</li><li>AI Company in a Box</li></ul>
        </article>
      </div>
    </div>
  </section>

  <section class="section cta-final">
    <div class="container">
      <h2>Siap bikin barbershop-mu jalan?</h2>
      <a href="/app" class="btn btn-primary btn-lg">Buka Dashboard Demo</a>
    </div>
  </section>
</main>

<footer class="site-footer">
  <div class="container">
    <p><strong>BarberKas AaaS</strong> · SparkMind Sovereign Ecosystem · MoR Oasis BI Pro (Duitku)</p>
    <p class="muted">Niche-first: barbershop UMKM Purwokerto → Banyumas → Jateng → Indonesia. Cloudflare-native.</p>
  </div>
</footer>
</body>
</html>`
}
