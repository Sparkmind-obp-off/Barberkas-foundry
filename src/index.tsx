import { Hono } from 'hono'
import { cors } from 'hono/cors'
import type { Bindings, TenantContext } from './types'
import api from './routes/api'
import auth from './routes/auth'
import outcome from './routes/outcome'
import subscriptions from './routes/subscriptions'
import webhooks from './routes/webhooks'
import retention from './routes/retention'
import waops from './routes/waops'
import { authMiddleware, tenantParamGuard } from './middleware/auth'
import { landingPage } from './pages/landing'
import { dashboardPage } from './pages/dashboard'
import { solutionsIndexPage, solutionPage } from './pages/solutions'
import { findVertical } from './data/verticals'
import { caseStudyIndexPage, casePage } from './pages/proof'
import { findCase } from './data/cases'

const app = new Hono<{ Bindings: Bindings; Variables: { tenant: TenantContext } }>()

app.use('/api/*', cors())

// Health
app.get('/health', (c) => c.json({ ok: true, service: 'barberkas-aaas', layer: 'outcome-foundry' }))

// BUGFIX (BKF-17 server-side gating audit) — URUTAN MOUNT PENTING:
// api (catch-all /api/v1/*) pasang authMiddleware via use('*') — kalau di-mount
// duluan, middleware-nya nyangkut ke /api/v1/outcome/* juga → endpoint funnel
// public (catalog/config/proofs/intake/price-estimate) balas 401 ke prospek
// anonim (funnel patah di production saat Clerk live). Maka: sub-app yang punya
// guard eksplisit sendiri di-mount DULU, catch-all api paling AKHIR.

// BKF-14 — Auth Clerk.com: /config (public), /me; /map /users /tenants (admin via requireAdmin)
app.route('/api/v1/auth', auth)

// Outcome Foundry pipeline (F0-F7): catalog/intake/checkout/pay/proof/orders
// Public-safe: intake & catalog boleh diakses prospek (belum jadi tenant).
// Endpoint sensitif (orders list/detail, proof, telemetry) digerbang requireAdmin
// di dalam routes/outcome.ts sendiri.
app.route('/api/v1/outcome', outcome)

// R4 — Retain & Expand: langganan (Care Plan/AI Staff) + reminder + upsell high-ticket.
// Tenant opsional via ?tenant=/x-tenant; state nyata di D1 (Truth-Lock).
// BKF-14: digerbang auth bila Clerk aktif (tenantParamGuard = isolasi per ?tenant=).
app.use('/api/v1/subscriptions/*', authMiddleware, tenantParamGuard)
app.route('/api/v1/subscriptions', subscriptions)

// BKF-13 — Retensi customer: reminder H-1 booking + retensi 3-4 minggu + run-due Fonnte.
app.use('/api/v1/retention/*', authMiddleware, tenantParamGuard)
app.route('/api/v1/retention', retention)

// BKF-22 — WA Ops: monitoring READ-ONLY wa_messages (tab observability dashboard).
// Gerbang sama dengan retention (auth + isolasi ?tenant=); breakdown lintas
// tenant digerbang admin di dalam routes/waops.ts.
app.use('/api/v1/wa-ops', authMiddleware, tenantParamGuard)
app.use('/api/v1/wa-ops/*', authMiddleware, tenantParamGuard)
app.route('/api/v1/wa-ops', waops)

// API — kasir/booking/agents (tenant-scoped penuh: auth → tenant → requireTenantAccess).
// WAJIB paling akhir di antara /api/v1/* (lihat catatan urutan mount di atas).
app.route('/api/v1', api)

// Inbound webhooks (Fonnte WA — Booking Curator real). Public, no subdomain.
// KECUALI endpoint dashboard (simulate/wa-log/conversations) — digerbang auth (BKF-14).
// BKF-16: /fonnte/test-send juga digerbang — kirim WA nyata pakai token kita,
// tidak boleh bisa dipicu anonim (spam/abuse + kuota Fonnte terbakar).
app.use('/webhooks/simulate', authMiddleware, tenantParamGuard)
app.use('/webhooks/wa-log', authMiddleware, tenantParamGuard)
app.use('/webhooks/conversations', authMiddleware, tenantParamGuard)
app.use('/webhooks/fonnte/test-send', authMiddleware, tenantParamGuard)
app.route('/webhooks', webhooks)

// Pages
app.get('/', (c) => c.html(landingPage()))
app.get('/app', (c) => c.html(dashboardPage()))

// R3 — Solusi per-vertikal (intake + kalkulator harga + objection FAQ)
app.get('/solutions', (c) => c.html(solutionsIndexPage()))
app.get('/solutions/:slug', (c) => {
  const v = findVertical(c.req.param('slug'))
  if (!v) return c.html(solutionsIndexPage(), 404)
  return c.html(solutionPage(v))
})

// R2 — Bukti hasil / case-study publik (proof-led)
app.get('/case-study', (c) => c.html(caseStudyIndexPage()))
app.get('/proof/:slug', (c) => {
  const cs = findCase(c.req.param('slug'))
  if (!cs) return c.html(caseStudyIndexPage(), 404)
  return c.html(casePage(cs))
})

export default app
