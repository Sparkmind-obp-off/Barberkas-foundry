// BarberKas AaaS — R3 Vertical solutions map (per-vertikal landing + intake + FAQ).
// SSOT untuk halaman /solutions/:slug. Selaras B5-04 F0 intake + B5-02 niche-first.
// Truth-Lock: copy = janji yang BISA kita penuhi (outcome-led, no overpromise).
// Harga TIDAK didefinisikan di sini — sumber kebenaran harga tetap di src/data/skus.ts.

import type { OutcomeSKU } from './skus'
import { SKUS, findSKU } from './skus'

export interface VerticalFAQ {
  q: string
  a: string
}

export interface Vertical {
  slug: string
  emoji: string
  name: string              // nama vertikal (UMKM segment)
  hero_title: string        // headline outcome-led (HTML-safe, boleh <span class="accent">)
  hero_sub: string          // sub-headline
  pains: string[]           // masalah yang dirasakan (untuk empati + intake placeholder)
  outcomes: string[]        // hasil konkret yang dijanjikan (proof-led)
  // SKU yang relevan untuk vertikal ini (urutan tangga: land → retain → expand)
  recommended_slugs: string[]
  // Kalkulator: SKU default yang dipakai sebagai titik awal estimasi
  calculator_base_slug: string
  intake_placeholder: string
  faqs: VerticalFAQ[]
}

// Objection FAQ generik (dipakai semua vertikal, di-merge dengan FAQ spesifik).
const COMMON_FAQS: VerticalFAQ[] = [
  {
    q: 'Saya gaptek / tidak bisa pasang sendiri. Bisa dibantu?',
    a: 'Bisa. Pilih mode "Kami Pasang" (DWY) — kamu cukup cerita kebutuhanmu lewat WhatsApp, kami yang pasang sampai LIVE & dipakai. Onboarding rata-rata < 15 menit.',
  },
  {
    q: 'Bayar pakai apa? Aman tidak?',
    a: 'Bayar pakai QRIS lewat Merchant of Record resmi (Oasis BI Pro / Duitku). Faktur otomatis terkirim ke WhatsApp. Tidak ada penyimpanan data kartu di sisi kami.',
  },
  {
    q: 'Kalau ternyata tidak cocok dengan usaha saya?',
    a: 'Intake kami punya gate kelayakan (feasibility) — kalau kebutuhanmu tidak cocok dengan paket, kami katakan jujur sebelum kamu bayar. Tidak ada overpromise.',
  },
  {
    q: 'Apakah ini POS biasa?',
    a: 'Bukan. Kasir + booking hanya pintu masuk. Nilai utamanya AI Staff yang mengerjakan hal yang stafmu tidak sempat: balas WA→booking, bikin konten promo, rekomendasi layanan.',
  },
]

export const VERTICALS: Vertical[] = [
  {
    slug: 'barbershop',
    emoji: '✂️',
    name: 'Barbershop',
    hero_title: 'Barbershop-mu <span class="accent">jalan</span>: kasir + booking + AI Staff.',
    hero_sub: 'Catat semua transaksi rapi, booking masuk lewat WhatsApp otomatis, dan AI Staff bikin konten promo capster — tanpa nambah orang.',
    pains: [
      'Transaksi capster bocor / tidak tercatat',
      'Booking via WA berantakan, sering double',
      'Tidak sempat bikin konten promo IG/TikTok',
    ],
    outcomes: [
      'Kasir + booking LIVE, transaksi pertama tercatat',
      'Struk WhatsApp otomatis ke customer',
      'AI Staff Resepsionis & Marketing aktif',
    ],
    recommended_slugs: ['template-kasir-booking', 'setup-barberkas', 'sub-pro', 'app-custom-chain'],
    calculator_base_slug: 'setup-barberkas',
    intake_placeholder: 'Contoh: Barbershop 3 kursi di Purwokerto, capster 4 orang. Transaksi sering bocor, booking WA berantakan. Mau kasir rapi + booking otomatis.',
    faqs: [
      { q: 'Bisa hitung komisi per capster?', a: 'Ya. Kasir mencatat transaksi per capster sehingga bagi-hasil/komisi bisa direkap otomatis tiap akhir periode.' },
      { q: 'Customer booking-nya gimana?', a: 'Customer chat WhatsApp, AI Staff Resepsionis mengubahnya jadi booking di kalender. Slot bentrok otomatis ditolak.' },
    ],
  },
  {
    slug: 'salon',
    emoji: '💇',
    name: 'Salon & Beauty',
    hero_title: 'Salon-mu <span class="accent">terisi</span>: booking penuh, kas rapi, customer balik.',
    hero_sub: 'Booking treatment masuk otomatis, paket & membership tercatat, dan AI Staff mengingatkan customer untuk treatment berikutnya.',
    pains: [
      'Slot treatment kosong di jam sepi',
      'Paket / membership sulit dilacak',
      'Customer lama tidak pernah di-follow-up',
    ],
    outcomes: [
      'Booking treatment LIVE + reminder otomatis',
      'Membership & paket tercatat rapi',
      'AI Staff CRM re-engage customer lama',
    ],
    recommended_slugs: ['template-kasir-booking', 'setup-barberkas', 'sub-pro', 'sub-enterprise'],
    calculator_base_slug: 'setup-barberkas',
    intake_placeholder: 'Contoh: Salon dengan 5 terapis, jual paket facial & membership. Slot jam siang sering kosong, customer lama jarang balik. Mau booking otomatis + reminder.',
    faqs: [
      { q: 'Bisa kelola paket / membership?', a: 'Ya. Paket dan membership tercatat sebagai item berulang, sisa kuota terlihat saat checkout.' },
      { q: 'Bisa reminder otomatis ke customer?', a: 'Ya, lewat AI Staff CRM (paket Pro/Enterprise) — reminder treatment berikutnya terkirim via WhatsApp.' },
    ],
  },
  {
    slug: 'klinik',
    emoji: '🩺',
    name: 'Klinik & Estetika',
    hero_title: 'Klinik-mu <span class="accent">tertib</span>: antrian, rekam tindakan, & pembayaran rapi.',
    hero_sub: 'Pendaftaran pasien lewat WhatsApp, antrian terstruktur, dan setiap tindakan tercatat lengkap dengan pembayaran QRIS.',
    pains: [
      'Antrian pasien menumpuk tanpa sistem',
      'Tindakan & pembayaran sulit direkap',
      'Reminder kontrol pasien terlewat',
    ],
    outcomes: [
      'Pendaftaran + antrian terstruktur',
      'Rekap tindakan & pembayaran QRIS',
      'AI Staff reminder kontrol pasien',
    ],
    recommended_slugs: ['setup-barberkas', 'sub-pro', 'sub-enterprise', 'app-custom-chain'],
    calculator_base_slug: 'sub-pro',
    intake_placeholder: 'Contoh: Klinik estetika kecil, 2 dokter + 3 perawat. Antrian sering menumpuk, reminder kontrol pasien sering terlewat. Mau pendaftaran online + rekap tindakan.',
    faqs: [
      { q: 'Data pasien aman?', a: 'Data disimpan di Cloudflare D1 (tenant-scoped). Tidak ada data sensitif kartu di sisi kami; pembayaran lewat MoR resmi.' },
      { q: 'Bisa multi-cabang?', a: 'Ya — untuk lebih dari satu cabang gunakan paket Enterprise / App Custom (multi-outlet + benchmark).' },
    ],
  },
  {
    slug: 'laundry',
    emoji: '🧺',
    name: 'Laundry & Kiloan',
    hero_title: 'Laundry-mu <span class="accent">lancar</span>: order masuk, status jelas, kas tercatat.',
    hero_sub: 'Order pelanggan masuk via WhatsApp, status cucian terlacak, dan notifikasi "siap diambil" terkirim otomatis.',
    pains: [
      'Order kiloan sering tertukar / hilang',
      'Pelanggan bolak-balik tanya "sudah selesai?"',
      'Kas harian sulit direkap',
    ],
    outcomes: [
      'Order + tracking status LIVE',
      'Notifikasi "siap diambil" otomatis',
      'Rekap kas harian rapi',
    ],
    recommended_slugs: ['template-kasir-booking', 'setup-barberkas', 'sub-starter', 'sub-pro'],
    calculator_base_slug: 'template-kasir-booking',
    intake_placeholder: 'Contoh: Laundry kiloan + satuan, 80 order/hari. Sering tertukar, pelanggan terus tanya status. Mau order via WA + notifikasi siap diambil + kas harian.',
    faqs: [
      { q: 'Bisa lacak status per order?', a: 'Ya. Setiap order punya status (diterima → proses → siap → diambil) dan pelanggan dapat notifikasi WhatsApp tiap perubahan.' },
      { q: 'Cocok untuk laundry kecil?', a: 'Sangat cocok. Mulai dari paket Starter (kasir core) lalu naik ke Pro saat butuh AI Staff notifikasi otomatis.' },
    ],
  },
  {
    slug: 'cafe',
    emoji: '☕',
    name: 'Cafe & Resto Kecil',
    hero_title: 'Cafe-mu <span class="accent">teratur</span>: pesanan, kas, & promo jalan sendiri.',
    hero_sub: 'Catat pesanan & kas tiap shift, kelola menu, dan AI Staff bikin konten promo harian untuk media sosial.',
    pains: [
      'Selisih kas tiap akhir shift',
      'Menu & stok bahan sulit dipantau',
      'Tidak ada waktu bikin konten promo',
    ],
    outcomes: [
      'Kas per-shift rapi + laporan harian',
      'Menu & stok bahan terpantau',
      'AI Staff Marketing konten promo harian',
    ],
    recommended_slugs: ['template-kasir-booking', 'setup-barberkas', 'sub-pro', 'ai-staff-addon'],
    calculator_base_slug: 'setup-barberkas',
    intake_placeholder: 'Contoh: Cafe kecil 6 meja, 2 shift barista. Kas sering selisih, tidak sempat bikin konten promo. Mau kasir per-shift + AI Staff konten harian.',
    faqs: [
      { q: 'Bisa kelola menu & stok bahan?', a: 'Ya. Menu tercatat sebagai item; stok bahan dasar bisa dipantau (paket Pro ke atas dengan AI Staff Admin/Ops).' },
      { q: 'Bisa buat konten promo otomatis?', a: 'Ya, lewat AI Staff Marketing — caption + hashtag siap posting untuk IG/TikTok cafe-mu.' },
    ],
  },
]

export function findVertical(slug: string): Vertical | undefined {
  return VERTICALS.find((v) => v.slug === slug)
}

// Gabungkan FAQ spesifik vertikal + FAQ objection generik.
export function faqsFor(v: Vertical): VerticalFAQ[] {
  return [...v.faqs, ...COMMON_FAQS]
}

// SKU yang direkomendasikan untuk vertikal (objek penuh, urut sesuai recommended_slugs).
export function recommendedSKUs(v: Vertical): OutcomeSKU[] {
  return v.recommended_slugs.map((s) => findSKU(s)).filter((x): x is OutcomeSKU => !!x)
}

// ── Kalkulator harga (deterministik, Truth-Lock) ─────────────────────────────
// Estimasi = harga dasar SKU (sumber: skus.ts) + add-on AI Staff opsional.
// TIDAK menjanjikan diskon/markup tersembunyi — angka transparan dari katalog.
export interface PriceEstimateInput {
  base_slug: string        // SKU dasar (setup/template/sub)
  ai_staff_count?: number  // jumlah AI Staff tambahan (pakai harga ai-staff-addon)
  care_plan?: boolean      // tambah Care Plan bulanan
}

export interface PriceEstimateLine {
  label: string
  price_cents: number
  billing: 'one_time' | 'subscription'
}

export interface PriceEstimate {
  ok: boolean
  error?: string
  base_slug?: string
  lines: PriceEstimateLine[]
  one_time_cents: number
  monthly_cents: number
  note: string
}

export function estimatePrice(input: PriceEstimateInput): PriceEstimate {
  const base = findSKU(input.base_slug)
  if (!base) {
    return { ok: false, error: 'base_slug tidak valid', lines: [], one_time_cents: 0, monthly_cents: 0, note: '' }
  }
  const lines: PriceEstimateLine[] = []
  let oneTime = 0
  let monthly = 0

  lines.push({ label: base.name, price_cents: base.price_cents, billing: base.billing })
  if (base.billing === 'one_time') oneTime += base.price_cents
  else monthly += base.price_cents

  const staffCount = Math.max(0, Math.min(9, Math.floor(input.ai_staff_count || 0)))
  if (staffCount > 0) {
    const addon = findSKU('ai-staff-addon')!
    const subtotal = addon.price_cents * staffCount
    lines.push({ label: `AI Staff tambahan × ${staffCount}`, price_cents: subtotal, billing: 'subscription' })
    monthly += subtotal
  }

  if (input.care_plan) {
    const care = findSKU('care-plan')!
    lines.push({ label: care.name, price_cents: care.price_cents, billing: 'subscription' })
    monthly += care.price_cents
  }

  return {
    ok: true,
    base_slug: base.slug,
    lines,
    one_time_cents: oneTime,
    monthly_cents: monthly,
    note: 'Estimasi transparan dari katalog (sumber kebenaran harga = kode). Harga "mulai dari" dapat berubah sesuai scope final saat intake.',
  }
}
