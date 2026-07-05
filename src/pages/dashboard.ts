// Dashboard PWA shell — mobile-first, steel-blue, bottom nav (Design System §9).
export function dashboardPage(): string {
  return `<!DOCTYPE html>
<html lang="id" data-theme="dark">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
<title>BarberKas — Dashboard</title>
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90' fill='%234A90E2'>⊿</text></svg>">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
<link href="/static/style.css" rel="stylesheet">
</head>
<body class="app-body">
<header class="app-header">
  <a href="/" class="brand brand-sm"><span class="brand-mark">⊿</span> BarberKas</a>
  <div class="app-header-right">
    <select id="tenant-switch" class="tenant-switch" title="Ganti tenant (demo)">
      <option value="cutoclock">Cut O'Clock</option>
      <option value="alfacut">AlfaCut (demo)</option>
      <option value="scissor7">Scissor7 (demo)</option>
    </select>
    <span id="tier-badge" class="badge badge-info">…</span>
  </div>
</header>

<main class="app-main container-app">
  <!-- HOME -->
  <section class="tab-panel" id="tab-home">
    <h2 class="panel-title">Ringkasan Hari Ini</h2>
    <div class="stat-grid" id="stat-grid"><div class="loading">Memuat…</div></div>
    <div class="doo-badge" id="doo-badge"></div>
    <h3 class="sub-title">Bukti AI Staff bekerja</h3>
    <div id="agent-feed" class="feed"><div class="loading">Memuat…</div></div>
  </section>

  <!-- TRANSAKSI -->
  <section class="tab-panel hidden" id="tab-tx">
    <div class="panel-head">
      <h2 class="panel-title">Transaksi</h2>
      <button class="btn btn-primary btn-sm" id="btn-new-tx">+ Catat</button>
    </div>
    <div id="tx-list" class="list"><div class="loading">Memuat…</div></div>
  </section>

  <!-- AI -->
  <section class="tab-panel hidden" id="tab-ai">
    <h2 class="panel-title">AI Staff (9 Curator)</h2>
    <div id="agent-list" class="grid-2"><div class="loading">Memuat…</div></div>
    <div id="agent-output" class="card hidden"></div>
  </section>

  <!-- CUSTOMER -->
  <section class="tab-panel hidden" id="tab-cust">
    <h2 class="panel-title">Customer</h2>
    <div id="cust-list" class="list"><div class="loading">Memuat…</div></div>
  </section>

  <!-- BOOKING -->
  <section class="tab-panel hidden" id="tab-book">
    <h2 class="panel-title">Booking</h2>
    <div id="book-list" class="list"><div class="loading">Memuat…</div></div>
  </section>

  <!-- OUTCOME (Outcome Foundry: katalog SKU + intake + orders/DoO) -->
  <section class="tab-panel hidden" id="tab-outcome">
    <div class="panel-head">
      <h2 class="panel-title">Outcome Foundry</h2>
      <button class="btn btn-primary btn-sm" id="btn-intake">+ Intake</button>
    </div>
    <p class="section-sub" style="margin-bottom:var(--space-4)">Jual <strong>hasil</strong>, bukan fitur. Tangga: edukasi/vertical (land) → langganan (retain) → high-ticket (expand).</p>
    <div id="delivery-telemetry" class="stat-grid" style="margin-bottom:var(--space-5)"></div>
    <h3 class="sub-title">Katalog Outcome (SKU)</h3>
    <div id="catalog-list" class="list"><div class="loading">Memuat…</div></div>
    <h3 class="sub-title">Pesanan & Bukti (DoO)</h3>
    <div id="orders-list" class="list"><div class="loading">Memuat…</div></div>
  </section>

  <!-- LANGGANAN (R4 — retain & expand: Care Plan/AI Staff + reminder + upsell) -->
  <section class="tab-panel hidden" id="tab-subs">
    <div class="panel-head">
      <h2 class="panel-title">Langganan</h2>
      <button class="btn btn-primary btn-sm" id="btn-subscribe">+ Langganan</button>
    </div>
    <p class="section-sub" style="margin-bottom:var(--space-4)">Retain &amp; expand: Care Plan / AI Staff jalan tiap bulan → naik high-ticket. Truth-Lock: state nyata di D1.</p>
    <div id="subs-telemetry" class="stat-grid" style="margin-bottom:var(--space-5)"></div>
    <h3 class="sub-title">Langganan aktif</h3>
    <div id="subs-list" class="list"><div class="loading">Memuat…</div></div>
    <h3 class="sub-title">🚀 Upsell — Next Best Action</h3>
    <div id="upsell-list" class="list"><div class="loading">Memuat…</div></div>
    <h3 class="sub-title">🔔 Reminder terjadwal</h3>
    <div class="panel-head" style="margin-bottom:var(--space-2)">
      <span class="muted" style="font-size:.8rem" id="reminders-summary">…</span>
      <button class="btn btn-secondary btn-sm" id="btn-run-reminders">Proses jatuh tempo</button>
    </div>
    <div id="reminders-list" class="list"><div class="loading">Memuat…</div></div>
  </section>
</main>

<nav class="bottom-nav">
  <button class="nav-item active" data-tab="home"><span class="nav-ico">🏠</span><span>Home</span></button>
  <button class="nav-item" data-tab="tx"><span class="nav-ico">🧾</span><span>Transaksi</span></button>
  <button class="nav-item nav-center" data-tab="ai"><span class="nav-ico">✨</span><span>AI</span></button>
  <button class="nav-item" data-tab="outcome"><span class="nav-ico">🎯</span><span>Outcome</span></button>
  <button class="nav-item" data-tab="subs"><span class="nav-ico">💳</span><span>Langganan</span></button>
  <button class="nav-item" data-tab="book"><span class="nav-ico">📅</span><span>Booking</span></button>
</nav>

<!-- New Transaction Modal -->
<div class="modal-overlay hidden" id="tx-modal">
  <div class="modal">
    <h3>Catat Transaksi</h3>
    <label class="label">Capster</label>
    <select class="input" id="tx-capster"></select>
    <label class="label">Layanan</label>
    <div id="tx-services" class="chip-group"></div>
    <label class="label">Customer (opsional)</label>
    <select class="input" id="tx-customer"><option value="">— Walk-in —</option></select>
    <label class="label">Pembayaran</label>
    <select class="input" id="tx-pay"><option value="cash">Cash</option><option value="qris">QRIS</option><option value="transfer">Transfer</option></select>
    <div class="modal-actions">
      <button class="btn btn-secondary" id="tx-cancel">Batal</button>
      <button class="btn btn-primary" id="tx-save">Simpan</button>
    </div>
  </div>
</div>

<!-- Intake Modal (F0 Outcome Foundry) -->
<div class="modal-overlay hidden" id="intake-modal">
  <div class="modal">
    <h3>Intake Outcome (F0)</h3>
    <p class="muted" style="font-size:.82rem;margin-bottom:var(--space-2)">Ceritakan barbershop & masalahmu → AI klasifikasi outcome SKU yang pas (Truth-Lock).</p>
    <label class="label">Nama Barbershop</label>
    <input class="input" id="in-shop" placeholder="cth: AlfaCut Purwokerto">
    <label class="label">No. WhatsApp</label>
    <input class="input" id="in-phone" placeholder="6281…">
    <label class="label">Masalah / kebutuhan</label>
    <input class="input" id="in-problem" placeholder="cth: butuh AI balas WA & booking otomatis">
    <div id="intake-result" class="card hidden" style="margin-top:var(--space-4)"></div>
    <div class="modal-actions">
      <button class="btn btn-secondary" id="intake-cancel">Tutup</button>
      <button class="btn btn-primary" id="intake-submit">Klasifikasi</button>
    </div>
  </div>
</div>

<!-- Subscribe Modal (R4) -->
<div class="modal-overlay hidden" id="subs-modal">
  <div class="modal">
    <h3>Aktifkan Langganan</h3>
    <p class="muted" style="font-size:.82rem;margin-bottom:var(--space-2)">Pilih paket retain (Care Plan / AI Staff). Harga = sumber kebenaran kode (Truth-Lock).</p>
    <label class="label">Paket</label>
    <select class="input" id="subs-plan"></select>
    <label class="label">Jumlah (untuk AI Staff add-on)</label>
    <input class="input" id="subs-qty" type="number" min="1" value="1">
    <div class="modal-actions">
      <button class="btn btn-secondary" id="subs-cancel">Batal</button>
      <button class="btn btn-primary" id="subs-save">Aktifkan</button>
    </div>
  </div>
</div>

<script src="/static/app.js"></script>
</body>
</html>`
}
