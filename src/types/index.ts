// BarberKas AaaS — Shared types

export type Bindings = {
  DB: D1Database
  // Secrets (set via wrangler secret put in prod):
  GROQ_API_KEY?: string
  OPENROUTER_API_KEY?: string
  FONNTE_TOKEN?: string
  DUITKU_MERCHANT_KEY?: string
  JWT_SECRET?: string
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
