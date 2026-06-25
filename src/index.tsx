import { Hono } from 'hono'
import { cors } from 'hono/cors'
import type { Bindings, TenantContext } from './types'
import api from './routes/api'
import outcome from './routes/outcome'
import webhooks from './routes/webhooks'
import { landingPage } from './pages/landing'
import { dashboardPage } from './pages/dashboard'

const app = new Hono<{ Bindings: Bindings; Variables: { tenant: TenantContext } }>()

app.use('/api/*', cors())

// Health
app.get('/health', (c) => c.json({ ok: true, service: 'barberkas-aaas', layer: 'outcome-foundry' }))

// API — kasir/booking/agents (tenant-scoped)
app.route('/api/v1', api)

// Outcome Foundry pipeline (F0-F7): catalog/intake/checkout/pay/proof/orders
// Public-safe: intake & catalog boleh diakses prospek (belum jadi tenant).
app.route('/api/v1/outcome', outcome)

// Inbound webhooks (Fonnte WA — Booking Curator real). Public, no subdomain.
app.route('/webhooks', webhooks)

// Pages
app.get('/', (c) => c.html(landingPage()))
app.get('/app', (c) => c.html(dashboardPage()))

export default app
