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
    <button class="btn btn-secondary btn-sm hidden" id="btn-signout" title="Keluar">Keluar</button>
  </div>
</header>

<!-- BKF-14 — Auth Clerk: overlay login (muncul hanya bila auth aktif & belum login) -->
<div id="auth-overlay" class="hidden" style="position:fixed;inset:0;z-index:1000;background:rgba(7,12,20,.96);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;padding:20px">
  <div style="text-align:center">
    <div class="brand" style="font-size:var(--text-2xl);justify-content:center"><span class="brand-mark">⛿</span> BarberKas</div>
    <p class="muted" style="font-size:var(--text-sm);margin-top:6px">Masuk untuk mengakses dashboard barbershop-mu.</p>
  </div>
  <div id="clerk-signin"></div>
  <p id="auth-status" class="muted" style="font-size:var(--text-xs)">Memuat login…</p>
</div>

<main class="app-main container-app">
  <!-- HOME -->
  <section class="tab-panel" id="tab-home">
    <h2 class="panel-title">Ringkasan Hari Ini</h2>
    <div class="stat-grid" id="stat-grid"><div class="loading">Memuat…</div></div>
    <div class="doo-badge" id="doo-badge"></div>
    <h3 class="sub-title">Bukti AI Staff bekerja <span class="count-badge" id="feed-count"></span></h3>
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

  <!-- WA — AI Resepsionis v2 (BKF-13): simulator FSM multi-turn + retensi -->
  <section class="tab-panel hidden" id="tab-wa">
    <h2 class="panel-title">💬 AI Resepsionis WA</h2>
    <p class="section-sub" style="margin-bottom:var(--space-4)">Simulasi percakapan WhatsApp customer → FSM multi-turn: cek slot kosong per-capster real-time, booking, reschedule, batal — tanpa admin. (Pesan simulasi <strong>tidak</strong> dikirim ke WA nyata.)</p>
    <div class="card" style="margin-bottom:var(--space-4)">
      <label class="label">Nomor WA customer (simulasi)</label>
      <input class="input" id="wa-phone" value="6281234509876" placeholder="628…">
      <div id="wa-chat" style="max-height:320px;overflow-y:auto;background:var(--bg-primary,#0b1220);border-radius:10px;padding:10px;margin:10px 0;display:flex;flex-direction:column;gap:6px">
        <div class="muted" style="font-size:var(--text-xs)">Mulai chat — coba: "halo", "booking", "cuci potong besok jam 3 sore", "ganti jadwal", "batal"…</div>
      </div>
      <div style="display:flex;gap:8px">
        <input class="input" id="wa-msg" placeholder="Ketik pesan WA customer…" style="flex:1;margin:0">
        <button class="btn btn-primary" id="wa-send">Kirim</button>
      </div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px" id="wa-quick">
        <span class="chip" data-q="halo">halo</span>
        <span class="chip" data-q="menu">menu</span>
        <span class="chip" data-q="booking">booking</span>
        <span class="chip" data-q="cuci potong besok jam 3 sore">cuci potong besok jam 3 sore</span>
        <span class="chip" data-q="ganti jadwal">ganti jadwal</span>
        <span class="chip" data-q="batal">batal</span>
      </div>
    </div>

    <h3 class="sub-title">🔁 Retensi &amp; Reminder Customer</h3>
    <div id="ret-telemetry" class="stat-grid" style="margin-bottom:var(--space-3)"></div>
    <div class="panel-head" style="margin-bottom:var(--space-2)">
      <span class="muted" style="font-size:var(--text-xs)" id="ret-summary">…</span>
      <span style="display:flex;gap:6px">
        <button class="btn btn-secondary btn-sm" id="btn-ret-scan">Scan idle 3-4 mgg</button>
        <button class="btn btn-primary btn-sm" id="btn-ret-run">Kirim jatuh tempo</button>
      </span>
    </div>
    <div id="ret-list" class="list"><div class="loading">Memuat…</div></div>

    <h3 class="sub-title">📜 Log WA terakhir</h3>
    <div id="wa-log" class="list"><div class="loading">Memuat…</div></div>
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
      <span class="muted" style="font-size:var(--text-xs)" id="reminders-summary">…</span>
      <button class="btn btn-secondary btn-sm" id="btn-run-reminders">Proses jatuh tempo</button>
    </div>
    <div id="reminders-list" class="list"><div class="loading">Memuat…</div></div>
  </section>

  <!-- ADMIN (BKF-16 — operator BarberKas: self-service tenant onboarding) -->
  <section class="tab-panel hidden" id="tab-admin">
    <div class="panel-head">
      <h2 class="panel-title">Admin — Onboarding Tenant</h2>
    </div>
    <p class="section-sub" style="margin-bottom:var(--space-4)">Buat barbershop baru <strong>tanpa SQL migration manual</strong>: 1 form → tenant + layanan default + capster + mapping owner email (langsung bisa login Google).</p>
    <form id="onboard-form" class="card" style="padding:var(--space-4);display:flex;flex-direction:column;gap:8px">
      <label class="label">Subdomain (huruf kecil/angka/dash, 3-30 char)</label>
      <input class="input" id="ob-subdomain" placeholder="cth: cutoclock" autocomplete="off">
      <label class="label">Nama Barbershop</label>
      <input class="input" id="ob-shop" placeholder="cth: Cut O'Clock Barbershop">
      <label class="label">No. WA Owner</label>
      <input class="input" id="ob-phone" placeholder="628…">
      <label class="label">Email Owner (untuk login Google — opsional)</label>
      <input class="input" id="ob-email" placeholder="owner@gmail.com">
      <label class="label">Capsters awal (pisah koma — opsional)</label>
      <input class="input" id="ob-capsters" placeholder="cth: Agus, Budi">
      <label class="label">Tier</label>
      <select class="input" id="ob-tier"><option value="starter">Starter</option><option value="free">Free</option><option value="pro">Pro</option><option value="enterprise">Enterprise</option></select>
      <label class="label">Trial (hari)</label>
      <input class="input" id="ob-trial" type="number" value="14" min="0" max="90">
      <button type="submit" class="btn btn-primary" id="ob-submit">Buat Tenant</button>
      <div id="ob-result" class="muted" style="font-size:var(--text-xs)"></div>
    </form>
    <h3 class="sub-title">Daftar Tenant</h3>
    <div id="admin-tenant-list" class="list"><div class="loading">Memuat…</div></div>
    <h3 class="sub-title">Map Email → Tenant</h3>
    <form id="map-form" class="card" style="padding:var(--space-4);display:flex;flex-direction:column;gap:8px">
      <input class="input" id="mp-email" placeholder="email user">
      <input class="input" id="mp-tenant" placeholder="subdomain tenant">
      <select class="input" id="mp-role"><option value="owner">owner</option><option value="staff">staff</option><option value="admin">admin</option></select>
      <button type="submit" class="btn btn-secondary btn-sm">Map</button>
      <div id="mp-result" class="muted" style="font-size:var(--text-xs)"></div>
    </form>
  </section>
</main>

<nav class="bottom-nav">
  <button class="nav-item active" data-tab="home"><span class="nav-ico">🏠</span><span>Home</span></button>
  <button class="nav-item" data-tab="tx"><span class="nav-ico">🧾</span><span>Transaksi</span></button>
  <button class="nav-item nav-center" data-tab="ai"><span class="nav-ico">✨</span><span>AI</span></button>
  <button class="nav-item" data-tab="outcome"><span class="nav-ico">🎯</span><span>Outcome</span></button>
  <button class="nav-item" data-tab="subs"><span class="nav-ico">💳</span><span>Langganan</span></button>
  <button class="nav-item" data-tab="book"><span class="nav-ico">📅</span><span>Booking</span></button>
  <button class="nav-item" data-tab="wa"><span class="nav-ico">💬</span><span>WA</span></button>
  <button class="nav-item hidden" data-tab="admin" id="nav-admin"><span class="nav-ico">🛠️</span><span>Admin</span></button>
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
    <p class="muted" style="font-size:var(--text-xs);margin-bottom:var(--space-2)">Ceritakan barbershop & masalahmu → AI klasifikasi outcome SKU yang pas (Truth-Lock).</p>
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
    <p class="muted" style="font-size:var(--text-xs);margin-bottom:var(--space-2)">Pilih paket retain (Care Plan / AI Staff). Harga = sumber kebenaran kode (Truth-Lock).</p>
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
