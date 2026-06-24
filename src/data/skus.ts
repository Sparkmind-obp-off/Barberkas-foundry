// BarberKas AaaS — Outcome Foundry SKU catalog (Lapis 1 "pasar").
// Single source of truth harga (B5-03 §2: "Sumber kebenaran harga = kode").
// Selaras 03-MONETIZATION-MATRIX §OF.1 + B5-02 §5 taksonomi 4 tier.

export type OutcomeTier = 'education' | 'vertical' | 'subscription' | 'high-ticket'
export type DeliveryMode = 'diy' | 'dwy' | 'dfy'
export type Billing = 'one_time' | 'subscription'

export interface OutcomeSKU {
  slug: string
  name: string            // nama = outcome (B5-02 §3 prinsip 1)
  promise: string         // janji hasil (outcome-led copy)
  tier: OutcomeTier
  delivery_mode: DeliveryMode
  billing: Billing
  price_cents: number     // IDR cents (integer)
  price_from: boolean     // "mulai dari" untuk high-ticket
  // Value-metric deterministik (B5-03 §3) — apa yang dibayar pelanggan
  value_metric: string
  proof: string           // bukti (proof-of-outcome) yang dijanjikan
  checkout: 'instant' | 'intake'  // one-time → instant MoR; high-ticket/setup → intake+invoice (HITL)
  engine_skills: string[] // transparansi mesin Lapis 2 (proof utk developer/partner)
  business_role: string   // land | retain | expand | top-of-funnel
}

// Pola pertumbuhan kanonik: education/vertical (land) → subscription (retain) → high-ticket (expand)
export const SKUS: OutcomeSKU[] = [
  {
    slug: 'canon-course-barbershop',
    name: 'Canon Course — Kelola Barbershop + AI',
    promise: 'Belajar kelola kas, booking & promo barbershop pakai AI — dari nol.',
    tier: 'education',
    delivery_mode: 'diy',
    billing: 'one_time',
    price_cents: 19900000, // Rp 199.000
    price_from: true,
    value_metric: 'Akses materi + template kas/booking aktif',
    proof: 'Akun kursus aktif + 1 template terpasang',
    checkout: 'instant',
    engine_skills: ['master-boot', 'context-injection', 'specialists'],
    business_role: 'top-of-funnel',
  },
  {
    slug: 'template-kasir-booking',
    name: 'Template Kasir + Booking (DIY)',
    promise: 'Kasir + booking barbershop siap-pakai, pasang sendiri dalam menit.',
    tier: 'vertical',
    delivery_mode: 'diy',
    billing: 'one_time',
    price_cents: 49000000, // Rp 490.000
    price_from: true,
    value_metric: 'App kas+booking live (self-serve)',
    proof: 'URL app aktif + transaksi pertama tercatat',
    checkout: 'instant',
    engine_skills: ['fullstack-cycle', 'cf-byok-deploy', 'workflow-ops'],
    business_role: 'land',
  },
  {
    slug: 'setup-barberkas',
    name: 'Setup BarberKas (Kami Pasang)',
    promise: 'Ceritakan barbershop-mu. Kami pasang kas+booking sampai LIVE & dipakai.',
    tier: 'vertical',
    delivery_mode: 'dwy',
    billing: 'one_time',
    price_cents: 150000000, // Rp 1.500.000
    price_from: true,
    value_metric: 'App kas+booking live + onboarding capster',
    proof: 'URL live + transaksi pertama + bukti onboarding',
    checkout: 'intake',
    engine_skills: ['fullstack-cycle', 'cf-byok-deploy', 'orchestration-patterns'],
    business_role: 'land',
  },
  {
    slug: 'sub-starter',
    name: 'Langganan Starter — Kasir Core',
    promise: 'Catat 100% transaksi rapi + struk WhatsApp. Tanpa AI Staff.',
    tier: 'subscription',
    delivery_mode: 'dfy',
    billing: 'subscription',
    price_cents: 4900000, // Rp 49.000 /bln
    price_from: false,
    value_metric: 'Kasir core jalan tiap bulan (500 tx/bln)',
    proof: 'Dashboard transaksi/bln + struk terkirim',
    checkout: 'instant',
    engine_skills: ['squad-opsfinance', 'workflow-ops'],
    business_role: 'retain',
  },
  {
    slug: 'sub-pro',
    name: 'Langganan Pro — 3 AI Staff',
    promise: 'Resepsionis + Marketing + Insight Stylist jalan tiap bulan.',
    tier: 'subscription',
    delivery_mode: 'dfy',
    billing: 'subscription',
    price_cents: 14900000, // Rp 149.000 /bln
    price_from: false,
    value_metric: '3 AI Staff berfungsi: balas WA→booking, konten, rekomendasi cut',
    proof: 'Log agent_calls + booking confirmed + kalender konten',
    checkout: 'instant',
    engine_skills: ['squad-sales-cs', 'squad-marketing', 'squad-product'],
    business_role: 'retain',
  },
  {
    slug: 'care-plan',
    name: 'Care Plan — Update & Support',
    promise: 'App tetap jalan, update & dukungan selama langganan aktif.',
    tier: 'subscription',
    delivery_mode: 'dfy',
    billing: 'subscription',
    price_cents: 9900000, // Rp 99.000 /bln
    price_from: true,
    value_metric: 'Uptime + changelog + support',
    proof: 'Changelog bulanan + uptime',
    checkout: 'instant',
    engine_skills: ['workflow-ops', 'verify-rubric'],
    business_role: 'retain',
  },
  {
    slug: 'ai-staff-addon',
    name: 'AI Staff Tambahan (per staff)',
    promise: 'Tambah staf AI (CS / Marketing / Admin) sesuai kebutuhan shop.',
    tier: 'subscription',
    delivery_mode: 'dfy',
    billing: 'subscription',
    price_cents: 49000000, // Rp 490.000 /bln/staff
    price_from: true,
    value_metric: 'Fungsi staf AF berjalan tiap bulan',
    proof: 'Output bulanan staf (log + laporan)',
    checkout: 'instant',
    engine_skills: ['squad-sales-cs', 'squad-marketing', 'squad-opsfinance'],
    business_role: 'expand',
  },
  {
    slug: 'sub-enterprise',
    name: 'Langganan Enterprise — 9 Agent + Multi-Outlet',
    promise: 'Semua AI Staff + benchmark cross-shop untuk chain barbershop.',
    tier: 'subscription',
    delivery_mode: 'dfy',
    billing: 'subscription',
    price_cents: 49900000, // Rp 499.000 /bln
    price_from: false,
    value_metric: '9 agent aktif + analitik multi-outlet',
    proof: 'Dashboard multi-outlet + benchmark report',
    checkout: 'instant',
    engine_skills: ['orchestrator', 'coo', 'squad-opsfinance'],
    business_role: 'expand',
  },
  {
    slug: 'app-custom-chain',
    name: 'App Custom / AI Company (Chain DFY)',
    promise: 'Sistem custom untuk grup barbershop — AI Company in a Box.',
    tier: 'high-ticket',
    delivery_mode: 'dfy',
    billing: 'one_time',
    price_cents: 500000000, // Rp 5.000.000
    price_from: true,
    value_metric: 'App sesuai spec ter-deploy + C-Suite/squad aktif',
    proof: 'URL + acceptance checklist + dashboard peran',
    checkout: 'intake',
    engine_skills: ['team-boot', 'orchestrator', 'fullstack-cycle', 'C-Suite'],
    business_role: 'expand',
  },
]

export const TIER_LABEL: Record<OutcomeTier, string> = {
  education: 'Edukasi (top-of-funnel)',
  vertical: 'Vertical (land)',
  subscription: 'Langganan (retain)',
  'high-ticket': 'High-Ticket (expand)',
}

export function findSKU(slug: string): OutcomeSKU | undefined {
  return SKUS.find((s) => s.slug === slug)
}

// Klasifikasi outcome dari masalah pembeli (F0 intake gate — rule-based lite, Truth-Lock).
export function classifyOutcome(problem: string): { slug: string; reason: string; feasible: boolean } {
  const p = (problem || '').toLowerCase()
  if (/(chain|cabang|outlet|multi|franchise)/.test(p)) {
    return { slug: 'app-custom-chain', reason: 'Disebut multi-outlet/chain → high-ticket DFY.', feasible: true }
  }
  if (/(belajar|kursus|cara|panduan|pemula|nol)/.test(p)) {
    return { slug: 'canon-course-barbershop', reason: 'Niat belajar → edukasi.', feasible: true }
  }
  if (/(pasang|setup|bantu|dibuatin|gak bisa|tidak bisa|gaptek)/.test(p)) {
    return { slug: 'setup-barberkas', reason: 'Butuh dipasang → DWY Setup.', feasible: true }
  }
  if (/(ai|staff|marketing|konten|booking|wa|whatsapp|cs|resepsionis)/.test(p)) {
    return { slug: 'sub-pro', reason: 'Butuh AI Staff → langganan Pro.', feasible: true }
  }
  // default land: kasir+booking
  return { slug: 'template-kasir-booking', reason: 'Kebutuhan kas+booking dasar → DIY template.', feasible: true }
}
