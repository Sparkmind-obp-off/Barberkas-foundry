import { Hono } from 'hono'
import { cors } from 'hono/cors'
import type { Bindings, TenantContext } from './types'
import api from './routes/api'
import outcome from './routes/outcome'
import subscriptions from './routes/subscriptions'
import webhooks from './routes/webhooks'
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

// API — kasir/booking/agents (tenant-scoped)
app.route('/api/v1', api)

// Outcome Foundry pipeline (F0-F7): catalog/intake/checkout/pay/proof/orders
// Public-safe: intake & catalog boleh diakses prospek (belum jadi tenant).
app.route('/api/v1/outcome', outcome)

// R4 — Retain & Expand: langganan (Care Plan/AI Staff) + reminder + upsell high-ticket.
// Tenant opsional via ?tenant=/x-tenant; state nyata di D1 (Truth-Lock).
app.route('/api/v1/subscriptions', subscriptions)

// Inbound webhooks (Fonnte WA — Booking Curator real). Public, no subdomain.
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
