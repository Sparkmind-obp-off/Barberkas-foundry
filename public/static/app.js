// BarberKas AaaS — Dashboard PWA client
// Tenant resolution: ?tenant= di URL menang (untuk link personal, cth /app?tenant=cutoclock),
// lalu pilihan tersimpan, lalu fallback demo alfacut.
const _urlTenant = new URLSearchParams(location.search).get('tenant');
if (_urlTenant) localStorage.setItem('bk_tenant', _urlTenant);
let TENANT = _urlTenant || localStorage.getItem('bk_tenant') || 'alfacut';

// ── BKF-14: Auth Clerk ──
// AUTH.enabled dari GET /api/v1/auth/config. Bila aktif → semua fetch bawa
// Bearer token Clerk (fresh per-request, token session pendek umurnya).
const AUTH = { enabled: false, user: null, clerk: null };
async function authToken() {
  if (!AUTH.enabled || !AUTH.clerk || !AUTH.clerk.session) return null;
  try { return await AUTH.clerk.session.getToken(); } catch { return null; }
}
async function authHeaders(extra = {}) {
  const h = { 'Content-Type': 'application/json', ...extra };
  const tok = await authToken();
  if (tok) h['Authorization'] = `Bearer ${tok}`;
  return h;
}
const api = async (path, opts = {}) =>
  fetch(`/api/v1${path}`, { ...opts, headers: await authHeaders({ 'x-tenant': TENANT, ...(opts.headers || {}) }) })
    .then((r) => r.json());

const $ = (id) => document.getElementById(id);
const rp = (cents) => 'Rp ' + Math.round(cents / 100).toLocaleString('id-ID');
const fmtDate = (ms) => new Date(ms).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

// ── Tab navigation ──
document.querySelectorAll('.nav-item').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-item').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    const tab = btn.dataset.tab;
    document.querySelectorAll('.tab-panel').forEach((p) => p.classList.add('hidden'));
    $(`tab-${tab}`).classList.remove('hidden');
    loadTab(tab);
  });
});

// ── Tenant switch ──
$('tenant-switch').value = TENANT;
$('tenant-switch').addEventListener('change', (e) => {
  TENANT = e.target.value;
  localStorage.setItem('bk_tenant', TENANT);
  loadHome();
});

// ── HOME ──
async function loadHome() {
  const d = await api('/dashboard');
  $('tier-badge').textContent = (d.tier || '').toUpperCase();
  $('stat-grid').innerHTML = `
    <div class="stat"><div class="stat-label">Omzet Hari Ini</div><div class="stat-value accent">${d.today.revenue_fmt}</div></div>
    <div class="stat"><div class="stat-label">Transaksi Hari Ini</div><div class="stat-value">${d.today.tx_count}</div></div>
    <div class="stat"><div class="stat-label">Booking Aktif</div><div class="stat-value">${d.bookings_open}</div></div>
    <div class="stat"><div class="stat-label">Customer</div><div class="stat-value">${d.customers}</div></div>`;
  $('doo-badge').textContent = `✓ Outcome LIVE — ${d.shop_name}: ${d.total.tx_count} transaksi tercatat (${d.total.revenue_fmt}), ${d.agent_calls} AI call.`;

  const { calls } = await api('/agent-calls');
  $('agent-feed').innerHTML = calls.length
    ? calls.slice(0, 6).map((c) => `
      <div class="feed-item"><span class="fi-type">${c.agent_type}</span> · ${fmtDate(c.created_at)}<br>
      <span class="muted">${c.output_summary ? c.output_summary.replace(/[{}"]/g, '').slice(0, 90) : '—'}</span></div>`).join('')
    : '<div class="loading">Belum ada aktivitas AI. Coba panggil agent di tab AI.</div>';
}

// ── TRANSAKSI ──
async function loadTx() {
  const { transactions } = await api('/transactions');
  $('tx-list').innerHTML = transactions.length
    ? transactions.map((t) => `
      <div class="list-item">
        <div><div class="li-main">${t.payment_method.toUpperCase()}</div><div class="li-sub">${fmtDate(t.created_at)} · ${t.status}</div></div>
        <div class="li-amount">${rp(t.total_cents)}</div>
      </div>`).join('')
    : '<div class="loading">Belum ada transaksi. Yuk catat customer pertama!</div>';
}

// ── AI ──
async function loadAi() {
  const { agents, tier } = await api('/agents');
  $('agent-list').innerHTML = agents.map((a) => `
    <div class="agent-tile ${a.available ? '' : 'disabled'}" data-type="${a.type}" data-available="${a.available}">
      <div class="ico">${a.icon}</div><h4>${a.name}</h4><p>${a.one_liner}</p>
      <span class="badge ${a.live ? (a.available ? 'badge-success' : 'badge-warning') : 'badge-info'}">${a.live ? (a.available ? 'Live' : a.tier_required) : 'Roadmap'}</span>
    </div>`).join('');
  document.querySelectorAll('.agent-tile').forEach((t) => {
    t.addEventListener('click', () => callAgent(t.dataset.type, t.dataset.available === 'true'));
  });
}

async function callAgent(type, available) {
  const out = $('agent-output');
  out.classList.remove('hidden');
  if (!available) {
    out.innerHTML = `<p class="muted">Agent <strong>${type}</strong> belum tersedia di tier ini / masih roadmap (Truth-Lock: no overpromise). Upgrade tier untuk akses.</p>`;
    return;
  }
  out.innerHTML = '<div class="loading">AI sedang bekerja…</div>';
  let input = {};
  if (type === 'content') input = { platform: 'instagram', theme: 'promo weekend' };
  if (type === 'stylist') {
    const { customers } = await api('/customers');
    input = { customer_id: customers[0]?.id, occasion: 'daily' };
  }
  if (type === 'booking') input = { wa_message: 'bro bisa potong besok?', customer_name: 'Customer Demo', from_phone: '628' + Date.now().toString().slice(-9) };
  const res = await api(`/agents/${type}`, { method: 'POST', body: JSON.stringify(input) });
  out.innerHTML = `<h4 style="margin-bottom:8px">Hasil ${type} <span class="badge badge-success">${res.status}</span></h4>
    <pre style="white-space:pre-wrap;font-family:var(--font-mono);font-size:.82rem;color:var(--text-secondary)">${escapeHtml(JSON.stringify(res.output, null, 2))}</pre>
    <p class="muted" style="margin-top:8px;font-size:.75rem">⏱ ${res.duration_ms}ms · biaya ${rp(res.cost_cents)}</p>`;
  if (type === 'booking') loadHome();
}

// ── CUSTOMER ──
async function loadCust() {
  const { customers } = await api('/customers');
  $('cust-list').innerHTML = customers.length
    ? customers.map((c) => `
      <div class="list-item">
        <div><div class="li-main">${c.name}</div><div class="li-sub">${c.phone} · ${c.visit_count} kunjungan</div></div>
        <div class="li-amount">${rp(c.total_spent_cents)}</div>
      </div>`).join('')
    : '<div class="loading">Belum ada customer.</div>';
}

// ── BOOKING ──
async function loadBook() {
  const { bookings } = await api('/bookings');
  $('book-list').innerHTML = bookings.length
    ? bookings.map((b) => `
      <div class="list-item">
        <div><div class="li-main">${fmtDate(b.scheduled_at)}</div><div class="li-sub">${b.source} · ${b.status}</div></div>
        <div>${b.status === 'pending'
          ? `<button class="btn btn-primary btn-sm" onclick="confirmBooking('${b.id}')">Konfirmasi</button>`
          : `<span class="badge badge-success">${b.status}</span>`}</div>
      </div>`).join('')
    : '<div class="loading">Belum ada booking.</div>';
}
window.confirmBooking = async (id) => {
  await api(`/bookings/${id}/status`, { method: 'POST', body: JSON.stringify({ status: 'confirmed' }) });
  loadBook();
};

// ── New transaction modal ──
$('btn-new-tx').addEventListener('click', openTxModal);
$('tx-cancel').addEventListener('click', () => $('tx-modal').classList.add('hidden'));
let selectedServices = [];
async function openTxModal() {
  selectedServices = [];
  const [{ capsters }, { services }, { customers }] = await Promise.all([api('/capsters'), api('/services'), api('/customers')]);
  $('tx-capster').innerHTML = capsters.map((c) => `<option value="${c.id}">${c.name}</option>`).join('');
  $('tx-customer').innerHTML = '<option value="">— Walk-in —</option>' + customers.map((c) => `<option value="${c.id}">${c.name}</option>`).join('');
  $('tx-services').innerHTML = services.map((s) => `<span class="chip" data-id="${s.id}" data-price="${s.price_cents}">${s.name} · ${rp(s.price_cents)}</span>`).join('');
  document.querySelectorAll('#tx-services .chip').forEach((ch) => {
    ch.addEventListener('click', () => {
      ch.classList.toggle('selected');
      const id = ch.dataset.id;
      if (selectedServices.includes(id)) selectedServices = selectedServices.filter((x) => x !== id);
      else selectedServices.push(id);
    });
  });
  $('tx-modal').classList.remove('hidden');
}
$('tx-save').addEventListener('click', async () => {
  if (selectedServices.length === 0) { alert('Pilih minimal 1 layanan'); return; }
  await api('/transactions', { method: 'POST', body: JSON.stringify({
    capster_id: $('tx-capster').value,
    customer_id: $('tx-customer').value || null,
    service_ids: selectedServices,
    payment_method: $('tx-pay').value,
  }) });
  $('tx-modal').classList.add('hidden');
  loadTx(); loadHome();
});

function escapeHtml(s) { return s.replace(/[&<>]/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m])); }

// ── OUTCOME FOUNDRY (catalog + intake + orders + DoO telemetry) ──
const oapi = (path, opts = {}) =>
  fetch(`/api/v1/outcome${path}`, { headers: { 'x-tenant': TENANT, 'Content-Type': 'application/json' }, ...opts }).then((r) => r.json());

// Payment config (Duitku Pop live? + pop_js URL). Cached after first load.
let PAY_CFG = null;
let DUITKU_JS_LOADED = false;
async function payConfig() {
  if (!PAY_CFG) { const cfg = await oapi('/config'); PAY_CFG = cfg.payment || { live: false }; }
  return PAY_CFG;
}
// Inject Duitku Pop JS once (env-specific URL), resolve when checkout global ready.
function loadDuitkuJs(url) {
  return new Promise((resolve, reject) => {
    if (DUITKU_JS_LOADED && window.checkout) return resolve();
    const s = document.createElement('script');
    s.src = url; s.async = true;
    s.onload = () => { DUITKU_JS_LOADED = true; resolve(); };
    s.onerror = () => reject(new Error('Gagal memuat Duitku Pop JS'));
    document.head.appendChild(s);
  });
}

async function loadOutcome() {
  // delivery telemetry (TTO + DoO success-rate + GMV)
  const tel = await oapi('/telemetry/delivery');
  $('delivery-telemetry').innerHTML = `
    <div class="stat"><div class="stat-label">GMV (lunas)</div><div class="stat-value accent">${tel.gmv_fmt}</div></div>
    <div class="stat"><div class="stat-label">Order Lunas</div><div class="stat-value">${tel.orders_paid}/${tel.orders_total}</div></div>
    <div class="stat"><div class="stat-label">DoO Success</div><div class="stat-value">${tel.doo_success_rate_pct}%</div></div>
    <div class="stat"><div class="stat-label">TTO Median</div><div class="stat-value">${tel.tto_median_days ?? '—'} hari</div></div>`;

  // katalog SKU
  const { catalog } = await oapi('/catalog');
  $('catalog-list').innerHTML = catalog.map((s) => `
    <div class="list-item" style="flex-direction:column;align-items:stretch;gap:6px">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px">
        <div><div class="li-main">${s.name}</div><div class="li-sub">${s.promise}</div></div>
        <div class="li-amount" style="white-space:nowrap">${s.price_fmt}</div>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap">
        <span class="badge badge-info">${s.tier_label}</span>
        <span class="muted" style="font-size:.72rem">📐 ${escapeHtml(s.value_metric)}</span>
        <button class="btn btn-primary btn-sm" onclick="checkoutSku('${s.slug}','${s.checkout}')">${s.checkout === 'instant' ? 'Bayar (Duitku)' : 'Minta Invoice'}</button>
      </div>
    </div>`).join('');

  // payment mode badge
  const pcfg = await payConfig();
  const payNote = pcfg.live
    ? `<span class="badge badge-success" style="font-size:.7rem">💳 Duitku Pop LIVE (${pcfg.mode})</span>`
    : `<span class="badge" style="font-size:.7rem;background:#3a2a12;color:#f5b14b">⚠️ Mode stub (tanpa kredensial)</span>`;
  $('catalog-list').insertAdjacentHTML('afterbegin', `<div style="margin-bottom:8px">${payNote} <span class="muted" style="font-size:.7rem">· MoR: Oasis BI Pro</span></div>`);

  // orders + DoO
  const { orders } = await oapi('/orders');
  $('orders-list').innerHTML = orders.length
    ? orders.map((o) => `
      <div class="list-item" style="flex-direction:column;align-items:stretch;gap:4px">
        <div style="display:flex;justify-content:space-between"><div class="li-main">${o.sku_name}</div><div class="li-amount">${rp(o.amount_cents)}</div></div>
        <div class="li-sub">${o.payment_status} · ${o.status} ${o.doo_passed ? '· ✓ DoO lulus' : ''} ${o.outcome_proof_url ? `· <a href="${o.outcome_proof_url}" target="_blank">bukti</a>` : ''}</div>
        ${(o.payment_status === 'pending' || o.payment_status === 'awaiting_payment') && o.mor_ref && o.mor_ref.charAt(0) === 'D' ? `<button class="btn btn-primary btn-sm" onclick="payDuitku('${o.id}','${o.mor_ref}')">Bayar Sekarang (Duitku Pop)</button>` : ''}
        ${(o.payment_status === 'pending') && !(o.mor_ref && o.mor_ref.charAt(0) === 'D') ? `<button class="btn btn-secondary btn-sm" onclick="payOrder('${o.id}')">Simulasi Bayar (stub)</button>` : ''}
        ${o.payment_status === 'paid' && !o.doo_passed ? `<button class="btn btn-primary btn-sm" onclick="deliverOrder('${o.id}')">Tandai LIVE + Bukti (F5)</button>` : ''}
      </div>`).join('')
    : '<div class="loading">Belum ada pesanan. Coba checkout SKU di atas.</div>';
}

// Buat order → bila Duitku live, langsung buka Pop checkout.
window.checkoutSku = async (slug, mode) => {
  const res = await oapi('/checkout', { method: 'POST', body: JSON.stringify({ sku_slug: slug, tenant_id: 't_' + TENANT, shop_name: TENANT }) });
  if (res.error) { alert('Checkout gagal: ' + res.error); loadOutcome(); return; }
  // Duitku live + ada pop_reference → buka Pop
  if (res.mor.mode === 'live' && res.mor.pop_reference) {
    await openDuitkuPop(res.mor.pop_js, res.mor.pop_reference, res.order_id, res.mor.payment_url);
  } else {
    alert(`Order dibuat: ${res.sku}\n${res.amount_fmt}\nMoR: ${res.mor.provider}\nFee ${res.fee_fmt} · Net ${res.net_fmt}\n\n${res.note}`);
  }
  loadOutcome();
};

// Buka Duitku Pop popup (Pop JS) atau fallback redirect ke payment_url.
async function openDuitkuPop(popJs, reference, orderId, paymentUrl) {
  try {
    await loadDuitkuJs(popJs);
    if (!window.checkout || typeof window.checkout.process !== 'function') throw new Error('checkout.process tidak tersedia');
    window.checkout.process(reference, {
      defaultLanguage: 'id',
      successEvent: () => { alert('Pembayaran berhasil! Outcome sedang dirakit (F3→F5).'); pollOrder(orderId); },
      pendingEvent: () => { alert('Pembayaran pending. Selesaikan sesuai instruksi.'); pollOrder(orderId); },
      errorEvent: (r) => { alert('Pembayaran error: ' + JSON.stringify(r)); },
      closeEvent: () => { loadOutcome(); },
    });
  } catch (e) {
    // fallback: redirect ke halaman Duitku
    if (paymentUrl) { window.open(paymentUrl, '_blank'); }
    else alert('Tidak bisa membuka Duitku Pop: ' + e.message);
  }
}

// Bayar ulang order yang sudah punya Duitku reference.
window.payDuitku = async (orderId, reference) => {
  const pcfg = await payConfig();
  await openDuitkuPop(pcfg.pop_js, reference, orderId, null);
};

// Poll status order sampai paid (callback Duitku server-to-server).
async function pollOrder(orderId, tries = 0) {
  if (tries > 10) { loadOutcome(); return; }
  const s = await oapi(`/orders/${orderId}/status`);
  if (s.payment_status === 'paid') { loadOutcome(); return; }
  setTimeout(() => pollOrder(orderId, tries + 1), 3000);
}

// Stub-only fallback (mode tanpa kredensial Duitku).
window.payOrder = async (id) => {
  const res = await oapi('/pay/confirm', { method: 'POST', body: JSON.stringify({ order_id: id }) });
  alert(res.error ? res.error : `Lunas (stub). Status: ${res.status}. ${res.next}`);
  loadOutcome();
};
window.deliverOrder = async (id) => {
  const res = await oapi(`/orders/${id}/proof`, { method: 'POST', body: JSON.stringify({ app_live: true, subdomain: TENANT, tto_days: 1, onboarded: true }) });
  alert(`DoO: ${res.doo_passed ? 'LULUS ✓' : 'belum lulus'}\nBukti: ${res.outcome_proof_url}\nTTO: ${res.tto_days} hari\nStatus: ${res.status}`);
  loadOutcome();
};

// Intake modal (F0)
$('btn-intake').addEventListener('click', () => { $('intake-result').classList.add('hidden'); $('intake-modal').classList.remove('hidden'); });
$('intake-cancel').addEventListener('click', () => $('intake-modal').classList.add('hidden'));
$('intake-submit').addEventListener('click', async () => {
  const shop = $('in-shop').value.trim(), phone = $('in-phone').value.trim(), problem = $('in-problem').value.trim();
  if (!shop || !phone || !problem) { alert('Isi semua field'); return; }
  const res = await oapi('/intake', { method: 'POST', body: JSON.stringify({ shop_name: shop, contact_phone: phone, problem, tenant_id: 't_' + TENANT }) });
  if (res.error) { alert(res.error); return; }
  const r = $('intake-result');
  r.classList.remove('hidden');
  r.innerHTML = `<h4 style="margin-bottom:6px">Outcome cocok: ${res.classified_sku.name}</h4>
    <p class="muted" style="font-size:.82rem">${res.reason}</p>
    <p style="font-size:.82rem;margin-top:6px">Tier: <span class="badge badge-info">${res.classified_sku.tier}</span> · Mode: ${res.classified_sku.delivery_mode} · ${res.feasible ? 'Feasible ✓' : 'Tidak feasible'}</p>
    <button class="btn btn-primary btn-sm" style="margin-top:10px" onclick="checkoutSku('${res.classified_sku.slug}','instant');document.getElementById('intake-modal').classList.add('hidden')">Lanjut Checkout</button>`;
});

// ── R4: Langganan (retain & expand) ──
const sapi = async (path, opts = {}) =>
  fetch(`/api/v1/subscriptions${path}${path.includes('?') ? '&' : '?'}tenant=${TENANT}`, { ...opts, headers: await authHeaders({ 'x-tenant': TENANT, ...(opts.headers || {}) }) }).then((r) => r.json());

async function loadSubs() {
  // telemetry
  const t = await sapi('/telemetry');
  $('subs-telemetry').innerHTML = `
    <div class="stat-card"><span class="stat-num">${t.mrr_fmt}</span><span class="stat-label">MRR</span></div>
    <div class="stat-card"><span class="stat-num">${t.subscriptions_active}</span><span class="stat-label">Langganan aktif</span></div>
    <div class="stat-card"><span class="stat-num">${t.churn_rate_pct}%</span><span class="stat-label">Churn</span></div>
    <div class="stat-card"><span class="stat-num">${t.upsell_accept_rate_pct}%</span><span class="stat-label">Upsell accept</span></div>`;

  // active subscriptions
  const d = await sapi(`?tenant=${TENANT}`);
  const subs = d.subscriptions || [];
  $('subs-list').innerHTML = subs.length
    ? subs.map((s) => `<div class="list-item">
        <div><strong>${escapeHtml(s.sku_name)}</strong> <span class="badge ${s.status === 'active' ? 'badge-info' : 'badge-muted'}">${s.status}</span>
        <div class="muted" style="font-size:.78rem">${s.amount_fmt} · jatuh tempo ${fmtDate(s.next_charge_at)}${s.qty > 1 ? ' · ' + s.qty + ' staff' : ''}</div></div>
        ${s.status === 'active' ? `<button class="btn btn-secondary btn-sm" onclick="cancelSub('${s.id}')">Henti</button>` : ''}
      </div>`).join('')
    : '<div class="empty">Belum ada langganan. Klik “+ Langganan”.</div>';

  // upsell next-best-action
  const u = await sapi(`/upsell?tenant=${TENANT}`);
  const ups = u.upsell || [];
  $('upsell-list').innerHTML = ups.length
    ? ups.map((x) => `<div class="card" style="margin-bottom:8px">
        <strong>${escapeHtml(x.to_name)}</strong> <span class="badge badge-info">${x.delta_fmt}</span>
        <p class="muted" style="font-size:.8rem;margin:6px 0">${escapeHtml(x.reason)}</p>
        <div style="display:flex;gap:8px">
          <button class="btn btn-primary btn-sm" onclick="respondUpsell('${x.upsell_id}','accepted','${x.to_sku}')">Terima</button>
          <button class="btn btn-secondary btn-sm" onclick="respondUpsell('${x.upsell_id}','declined')">Nanti</button>
        </div></div>`).join('')
    : '<div class="empty">Belum ada rekomendasi upsell (aktifkan langganan dulu).</div>';

  // reminders
  const r = await sapi('/reminders');
  const rems = r.reminders || [];
  $('reminders-summary').textContent = `${rems.length} reminder · ${r.due_now} jatuh tempo sekarang`;
  $('reminders-list').innerHTML = rems.length
    ? rems.map((m) => `<div class="list-item">
        <div><span class="badge badge-muted">${m.kind}</span> <span class="muted" style="font-size:.78rem">${m.status} · ${fmtDate(m.due_at)}</span>
        <div style="font-size:.82rem">${escapeHtml(m.message)}</div></div></div>`).join('')
    : '<div class="empty">Belum ada reminder.</div>';
}

async function cancelSub(id) {
  if (!confirm('Hentikan langganan ini?')) return;
  const reason = prompt('Alasan berhenti (opsional):') || '';
  await sapi(`/${id}/cancel`, { method: 'POST', body: JSON.stringify({ reason }) });
  loadSubs();
}

async function respondUpsell(id, decision, toSku) {
  const res = await sapi(`/upsell/${id}/respond`, { method: 'POST', body: JSON.stringify({ decision }) });
  if (decision === 'accepted' && res.next && res.next.action === 'subscribe') {
    if (confirm('Aktifkan paket upgrade ini sekarang?')) {
      await sapi('/subscribe', { method: 'POST', body: JSON.stringify({ sku_slug: toSku, tenant_id: TENANT }) });
    }
  }
  loadSubs();
}

// Subscribe modal
$('btn-subscribe').addEventListener('click', async () => {
  const { plans } = await sapi('/plans');
  $('subs-plan').innerHTML = plans.map((p) => `<option value="${p.slug}">${escapeHtml(p.name)} — ${p.price_fmt}</option>`).join('');
  $('subs-modal').classList.remove('hidden');
});
$('subs-cancel').addEventListener('click', () => $('subs-modal').classList.add('hidden'));
$('subs-save').addEventListener('click', async () => {
  const sku_slug = $('subs-plan').value;
  const qty = parseInt($('subs-qty').value, 10) || 1;
  const res = await sapi('/subscribe', { method: 'POST', body: JSON.stringify({ sku_slug, qty, tenant_id: TENANT }) });
  if (res.error) { alert(res.error); return; }
  $('subs-modal').classList.add('hidden');
  loadSubs();
});
$('btn-run-reminders').addEventListener('click', async () => {
  const res = await sapi('/reminders/run', { method: 'POST' });
  alert(`Diproses: ${res.processed} reminder jatuh tempo (ditandai terkirim).`);
  loadSubs();
});

// ── BKF-13: AI Resepsionis WA — simulator FSM + retensi ──
const wapi = async (path, opts = {}) =>
  fetch(`/webhooks${path}${path.includes('?') ? '&' : '?'}tenant=${TENANT}`, { ...opts, headers: await authHeaders(opts.headers || {}) }).then((r) => r.json());
const rapi = async (path, opts = {}) =>
  fetch(`/api/v1/retention${path}${path.includes('?') ? '&' : '?'}tenant=${TENANT}`, { ...opts, headers: await authHeaders(opts.headers || {}) }).then((r) => r.json());

function waBubble(text, dir) {
  const isOut = dir === 'out';
  return `<div style="align-self:${isOut ? 'flex-start' : 'flex-end'};max-width:85%;background:${isOut ? '#1d2a3a' : '#1f6f43'};color:#e8f0f8;border-radius:12px;padding:8px 11px;font-size:.84rem;white-space:pre-wrap">${escapeHtml(text)}</div>`;
}

function waAppend(text, dir) {
  const box = $('wa-chat');
  box.insertAdjacentHTML('beforeend', waBubble(text, dir));
  box.scrollTop = box.scrollHeight;
}

async function waSend(msg) {
  const phone = $('wa-phone').value.trim();
  if (!phone || !msg) return;
  waAppend(msg, 'in');
  $('wa-msg').value = '';
  const res = await wapi('/simulate', { method: 'POST', body: JSON.stringify({ phone, message: msg, name: 'Simulasi Dashboard' }) });
  if (res.reply) {
    waAppend(res.reply, 'out');
    const box = $('wa-chat');
    box.insertAdjacentHTML('beforeend', `<div class="muted" style="font-size:.68rem;align-self:center">state: ${res.state} · action: ${res.action}${res.booking_id ? ' · booking: ' + res.booking_id : ''} · ${res.duration_ms}ms</div>`);
    box.scrollTop = box.scrollHeight;
  } else {
    waAppend('⚠️ ' + (res.error || 'gagal'), 'out');
  }
  if (res.action === 'booked' || res.action === 'rescheduled' || res.action === 'cancelled') { loadRetention(); }
}

async function loadRetention() {
  const t = await rapi('/telemetry');
  $('ret-telemetry').innerHTML = `
    <div class="stat"><div class="stat-label">Reminder terjadwal</div><div class="stat-value">${t.reminders_scheduled}</div></div>
    <div class="stat"><div class="stat-label">Jatuh tempo</div><div class="stat-value accent">${t.reminders_due_now}</div></div>
    <div class="stat"><div class="stat-label">Terkirim total</div><div class="stat-value">${t.reminders_sent_total}</div></div>
    <div class="stat"><div class="stat-label">Customer idle ≥${t.retention_days}h</div><div class="stat-value">${t.customers_idle}</div></div>`;

  const r = await rapi('/reminders');
  const rems = r.reminders || [];
  $('ret-summary').textContent = `${rems.length} reminder customer · ${r.due_now} jatuh tempo`;
  $('ret-list').innerHTML = rems.length
    ? rems.slice(0, 20).map((m) => `<div class="list-item">
        <div><span class="badge ${m.kind === 'retention' ? 'badge-info' : 'badge-muted'}">${m.kind}</span>
        <span class="badge ${m.status === 'sent' ? 'badge-success' : m.status === 'scheduled' ? 'badge-warning' : 'badge-muted'}">${m.status}</span>
        <span class="muted" style="font-size:.75rem">${m.phone} · due ${fmtDate(m.due_at)}</span>
        <div style="font-size:.8rem;margin-top:3px">${escapeHtml(m.message.slice(0, 140))}${m.message.length > 140 ? '…' : ''}</div></div></div>`).join('')
    : '<div class="loading">Belum ada reminder customer. Booking via simulator WA → reminder H-1 otomatis dibuat.</div>';

  const log = await wapi('/wa-log?limit=20');
  const msgs = log.messages || [];
  $('wa-log').innerHTML = msgs.length
    ? msgs.slice(-20).map((m) => `<div class="list-item">
        <div><span class="badge ${m.direction === 'in' ? 'badge-muted' : 'badge-info'}">${m.direction === 'in' ? '⬇ in' : '⬆ out'}</span>
        <span class="muted" style="font-size:.72rem">${m.phone} · ${m.status} · ${fmtDate(m.created_at)}</span>
        <div style="font-size:.8rem;margin-top:3px">${escapeHtml((m.body || '').slice(0, 120))}${(m.body || '').length > 120 ? '…' : ''}</div></div></div>`).join('')
    : '<div class="loading">Belum ada log WA.</div>';
}

function loadWa() { loadRetention(); }

$('wa-send').addEventListener('click', () => waSend($('wa-msg').value.trim()));
$('wa-msg').addEventListener('keydown', (e) => { if (e.key === 'Enter') waSend($('wa-msg').value.trim()); });
document.querySelectorAll('#wa-quick .chip').forEach((ch) => ch.addEventListener('click', () => waSend(ch.dataset.q)));
$('btn-ret-scan').addEventListener('click', async () => {
  const res = await rapi('/retention/scan', { method: 'POST' });
  alert(`Scan retensi: ${res.created} reminder baru dibuat untuk customer idle.`);
  loadRetention();
});
$('btn-ret-run').addEventListener('click', async () => {
  const res = await rapi('/run-due', { method: 'POST' });
  alert(`Diproses: ${res.processed}\nTerkirim: ${res.sent} · Stub: ${res.stub} · Gagal: ${res.failed}${res.note ? '\n\n' + res.note : ''}`);
  loadRetention();
});

function loadTab(tab) {
  ({ home: loadHome, tx: loadTx, ai: loadAi, cust: loadCust, book: loadBook, outcome: loadOutcome, subs: loadSubs, wa: loadWa }[tab] || (() => {}))();
}

// ── BKF-14: Boot auth → baru load dashboard ──
// 1) /auth/config public: auth aktif? publishable key?
// 2) aktif → muat Clerk JS dari CDN instance, mount SignIn bila belum login
// 3) login OK → /auth/me → kunci TENANT ke tenant milik user (non-admin)
function showAuthOverlay(show, msg) {
  const ov = $('auth-overlay');
  if (ov) ov.classList.toggle('hidden', !show);
  if (msg && $('auth-status')) $('auth-status').textContent = msg;
}

function clerkFrontendHost(pk) {
  // pk_test_<base64(frontend-api)$> → host CDN clerk-js instance
  try { return atob(pk.split('_').slice(2).join('_')).replace(/\$$/, ''); } catch { return null; }
}

async function initAuth() {
  let cfg = { enabled: false };
  try { cfg = await fetch('/api/v1/auth/config').then((r) => r.json()); } catch {}
  AUTH.enabled = Boolean(cfg.enabled);

  if (!AUTH.enabled) {
    // auth off (dev terbuka / dev bypass) — langsung masuk
    if (cfg.dev_bypass) console.info('[auth] dev bypass aktif');
    return true;
  }

  const pk = cfg.publishable_key;
  const host = pk && clerkFrontendHost(pk);
  if (!pk || !host) { showAuthOverlay(true, 'Auth aktif tapi publishable key tidak tersedia — hubungi operator.'); return false; }

  showAuthOverlay(true, 'Memuat login…');
  await new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = `https://${host}/npm/@clerk/clerk-js@5/dist/clerk.browser.js`;
    s.setAttribute('data-clerk-publishable-key', pk);
    s.async = true; s.crossOrigin = 'anonymous';
    s.onload = resolve; s.onerror = () => reject(new Error('gagal muat Clerk JS'));
    document.head.appendChild(s);
  }).catch((e) => { showAuthOverlay(true, '⚠️ ' + e.message); });

  if (!window.Clerk) { showAuthOverlay(true, '⚠️ Clerk JS tidak tersedia.'); return false; }
  AUTH.clerk = window.Clerk;
  await AUTH.clerk.load();

  if (!AUTH.clerk.user) {
    // belum login → mount widget SignIn Clerk
    showAuthOverlay(true, 'Silakan masuk.');
    AUTH.clerk.mountSignIn(document.getElementById('clerk-signin'), { appearance: { baseTheme: undefined } });
    AUTH.clerk.addListener(({ user }) => { if (user) location.reload(); });
    return false;
  }

  // sudah login → ambil mapping tenant dari backend
  const me = await fetch('/api/v1/auth/me', { headers: await authHeaders() }).then((r) => r.json()).catch(() => null);
  if (!me || !me.authenticated) { showAuthOverlay(true, '⚠️ Sesi tidak valid — coba muat ulang.'); return false; }
  AUTH.user = me.user;

  if (me.user.role !== 'admin') {
    if (!me.user.tenant_subdomain) {
      showAuthOverlay(true, `Akun ${me.user.email} belum di-map ke barbershop manapun. Hubungi operator BarberKas.`);
      const si = document.getElementById('clerk-signin');
      if (si) si.innerHTML = '<button class="btn btn-secondary" onclick="AUTH.clerk.signOut().then(()=>location.reload())">Keluar</button>';
      return false;
    }
    // kunci tenant ke milik user — sembunyikan switcher demo
    TENANT = me.user.tenant_subdomain;
    localStorage.setItem('bk_tenant', TENANT);
    const sw = $('tenant-switch');
    if (sw) {
      sw.innerHTML = `<option value="${TENANT}">${TENANT}</option>`;
      sw.value = TENANT; sw.disabled = true; sw.title = 'Tenant terkunci ke akunmu';
    }
  }

  const so = $('btn-signout');
  if (so) {
    so.classList.remove('hidden');
    so.addEventListener('click', () => AUTH.clerk.signOut().then(() => location.reload()));
  }
  showAuthOverlay(false);
  return true;
}

// init
initAuth().then((ok) => { if (ok) loadHome(); });
