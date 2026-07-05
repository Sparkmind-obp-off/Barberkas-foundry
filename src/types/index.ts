// BarberKas AaaS — Shared types

export type Bindings = {
  DB: D1Database
  // Secrets (set via wrangler secret put in prod):
  GROQ_API_KEY?: string
  OPENROUTER_API_KEY?: string
  FONNTE_TOKEN?: string
  // Duitku Pop (MoR rel uang via Oasis BI Pro):
  DUITKU_MERCHANT_CODE?: string   // cth: D20919
  DUITKU_MERCHANT_KEY?: string    // API key (rahasia — wrangler secret put)
  DUITKU_ENV?: 'sandbox' | 'production'
  JWT_SECRET?: string
  // BKF-14 — Clerk.com auth:
  CLERK_SECRET_KEY?: string        // sk_test_… / sk_live_… (wrangler secret put)
  CLERK_PUBLISHABLE_KEY?: string   // pk_test_… (boleh public — dikirim ke frontend)
  CLERK_ISSUER?: string            // https://<instance>.clerk.accounts.dev
  ADMIN_EMAILS?: string            // csv email operator BarberKas (auto role=admin saat login pertama)
  DEV_AUTH_BYPASS_EMAIL?: string   // HANYA .dev.vars lokal — bypass login utk test E2E. JANGAN set di prod.
}

// BKF-14 — user login (Clerk) → tenant mapping
export interface AuthUser {
  id: string
  clerk_user_id: string | null
  email: string
  name: string | null
  tenant_id: string | null
  tenant_subdomain: string | null   // join dari tenants (null = belum di-map)
  role: 'owner' | 'staff' | 'admin' // admin = operator BarberKas, boleh lintas tenant
}

export type Tier = 'free' | 'starter' | 'pro' | 'enterprise'
export type TenantStatus = 'trial' | 'active' | 'suspended' | 'churned'

export interface Tenant {
  id: string
  subdomain: string
  shop_name: string
  owner_phone: string
  owner_email: string | null
  tier: Tier
  status: TenantStatus
  trial_ends_at: number | null
  outcome_proof_url: string | null
  tto_days: number | null
  delivery_mode: string | null
  created_at: number
  updated_at: number
}

export interface TenantContext {
  tenant_id: string
  subdomain: string
  tier: Tier
  shop_name: string
  request_id: string
}

export type AgentType =
  | 'stylist' | 'content' | 'trend' | 'pricing' | 'booking'
  | 'inventory' | 'customer' | 'capster_perf' | 'multi_tenant'

export interface AgentResult {
  agent_type: AgentType
  output: Record<string, unknown>
  cost_cents: number
  duration_ms: number
  status: 'success' | 'fail'
}
