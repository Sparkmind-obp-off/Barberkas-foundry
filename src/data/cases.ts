// R2 — Case-study (proof-led) SSOT untuk /case-study + /proof/:slug.
// Truth-Lock (hard-constraint #4): JUJUR soal status bukti.
//   - status 'pilot'      = pelanggan/pilot nyata terbatas (Purwokerto), angka diverifikasi.
//   - status 'illustration' = skenario representatif (BELUM ada pelanggan nyata) — DITANDAI jelas.
// Tidak ada testimoni palsu. Angka agregat live diambil terpisah dari /telemetry/delivery (DB nyata).
//
// Selaras: B5-04 (Proof-of-Outcome F5), kolom orders.outcome_proof_url/tto_days/delivery_mode,
// tabel outcome_proofs(kind,label,value). delivery_mode: diy|dwy|dfy.

export type CaseStatus = 'pilot' | 'illustration'
export type DeliveryMode = 'diy' | 'dwy' | 'dfy'

export interface CaseMetric {
  label: string
  before: string
  after: string
  delta: string // ringkasan perubahan (mis. "+38%")
}

export interface CaseStudy {
  slug: string
  vertical_slug: string // selaras data/verticals.ts (barbershop|salon|klinik|laundry|cafe)
  emoji: string
  business: string // nama usaha (anonim/inisial bila pilot privat)
  location: string
  status: CaseStatus
  headline: string // outcome 1 kalimat
  context: string // masalah awal (pain)
  intervention: string // apa yang kami pasang (SKU/delivery)
  sku_slug: string // selaras data/skus.ts
  delivery_mode: DeliveryMode
  tto_days: number // Time-to-Outcome (hari) — konsisten kolom orders.tto_days
  metrics: CaseMetric[]
  proof_kind: 'url' | 'metric' | 'acceptance' | 'screenshot'
  proof_note: string // catatan bukti (apa yang bisa diverifikasi)
  quote?: { text: string; by: string } // hanya untuk status 'pilot' yang disetujui
}

export const CASES: CaseStudy[] = [
  {
    slug: 'alfacut-purwokerto',
    vertical_slug: 'barbershop',
    emoji: '✂️',
    business: 'Barbershop "AlfaCut"',
    location: 'Purwokerto, Banyumas',
    status: 'pilot',
    headline: 'Kasir + booking online live <2 hari; antrian walk-in turun, slot sepi mulai terisi.',
    context:
      'Catatan transaksi manual (buku), booking via chat WA berserak, slot siang sering kosong, sulit tahu omzet harian real-time.',
    intervention:
      'Setup BarberKas (kami pasang): kasir digital + booking online + reminder WA + 1 AI Staff (Booking Curator).',
    sku_slug: 'setup-barberkas',
    delivery_mode: 'dwy',
    tto_days: 2,
    metrics: [
      { label: 'Waktu rekap omzet harian', before: '~20 mnt manual', after: '< 1 mnt (otomatis)', delta: '−95%' },
      { label: 'Booking tercatat rapi', before: 'chat berserak', after: 'satu antrean terstruktur', delta: '✓' },
      { label: 'Time-to-Outcome (live)', before: '—', after: '2 hari', delta: '2 hari' },
    ],
    proof_kind: 'url',
    proof_note:
      'Bukti = app live (subdomain tenant) + log AI Staff (agent_calls) yang bisa ditelusuri di dashboard. Angka di atas indikatif dari pilot terbatas.',
    quote: {
      text: 'Sekarang nutup kasir nggak perlu hitung buku lagi — langsung kelihatan omzet hari ini.',
      by: 'Pemilik AlfaCut (pilot)',
    },
  },
  {
    slug: 'salon-reminder-retensi',
    vertical_slug: 'salon',
    emoji: '💇‍♀️',
    business: 'Salon & Beauty (skenario representatif)',
    location: 'Banyumas',
    status: 'illustration',
    headline: 'Reminder otomatis + booking online untuk mengisi slot sepi & menarik kembali pelanggan lama.',
    context:
      'Beberapa terapis, slot siang kosong, pelanggan lama jarang kembali, follow-up manual sering terlewat.',
    intervention:
      'Langganan Pro (3 AI Staff): booking online + reminder otomatis + win-back pelanggan lama via WA.',
    sku_slug: 'sub-pro',
    delivery_mode: 'dfy',
    tto_days: 3,
    metrics: [
      { label: 'Slot siang terisi', before: 'banyak kosong', after: 'reminder + win-back', delta: 'target ↑' },
      { label: 'Follow-up pelanggan lama', before: 'manual / terlewat', after: 'otomatis terjadwal', delta: '✓' },
      { label: 'Estimasi Time-to-Outcome', before: '—', after: '~3 hari', delta: '~3 hari' },
    ],
    proof_kind: 'metric',
    proof_note:
      'ILUSTRASI: skenario representatif berbasis pipeline produk yang sama (belum ada pelanggan salon nyata). Angka adalah target, bukan hasil terverifikasi.',
  },
  {
    slug: 'laundry-template-diy',
    vertical_slug: 'laundry',
    emoji: '🧺',
    business: 'Laundry kiloan (skenario representatif)',
    location: 'Purwokerto',
    status: 'illustration',
    headline: 'Template kasir DIY: catat order kiloan + status cucian tanpa ribet, mulai dari biaya rendah.',
    context: 'Order kiloan dicatat manual, status cucian (proses/selesai/diambil) sulit dilacak.',
    intervention: 'Template Kasir + Booking (DIY): pelanggan pasang sendiri dengan panduan, biaya satu kali.',
    sku_slug: 'template-kasir-booking',
    delivery_mode: 'diy',
    tto_days: 1,
    metrics: [
      { label: 'Pencatatan order', before: 'buku manual', after: 'digital terstruktur', delta: '✓' },
      { label: 'Lacak status cucian', before: 'sulit', after: 'per-order jelas', delta: '✓' },
      { label: 'Estimasi go-live', before: '—', after: '~1 hari (DIY)', delta: '~1 hari' },
    ],
    proof_kind: 'acceptance',
    proof_note:
      'ILUSTRASI: berbasis SKU DIY yang tersedia. Hasil tergantung implementasi mandiri pelanggan.',
  },
]

export function findCase(slug: string): CaseStudy | undefined {
  return CASES.find((c) => c.slug === slug)
}

export function casesByVertical(verticalSlug: string): CaseStudy[] {
  return CASES.filter((c) => c.vertical_slug === verticalSlug)
}

// Label manusiawi untuk delivery mode (selaras solutions/skus).
export const DELIVERY_LABEL: Record<DeliveryMode, string> = {
  diy: 'DIY — Pasang Sendiri',
  dwy: 'DWY — Kami Bantu Pasang',
  dfy: 'DFY — Dikelola Penuh',
}

export const STATUS_LABEL: Record<CaseStatus, string> = {
  pilot: 'Pilot nyata',
  illustration: 'Ilustrasi (skenario)',
}
