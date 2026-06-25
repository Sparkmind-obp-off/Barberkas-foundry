// Minimal PDF generator — Cloudflare Workers compatible (zero deps, pure string).
// Menghasilkan faktur 1-halaman A4 dengan teks (Helvetica). Cukup untuk receipt UMKM.
// Bukan untuk layout kompleks — fokus: bukti transaksi yang sah & terbaca.

export interface ReceiptLine {
  label: string
  value: string
}

export interface ReceiptData {
  title: string            // "FAKTUR / RECEIPT"
  brand: string            // "BarberKas — SparkMind"
  order_id: string
  date_str: string
  shop_name?: string
  lines: ReceiptLine[]     // detail item / sku / amount
  total_str: string
  footer: string           // disclosure MoR
}

// Escape teks untuk literal string PDF
function esc(s: string): string {
  return (s || '').replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')
}

// Bangun content stream (teks baris demi baris)
function buildContent(d: ReceiptData): string {
  const L: string[] = []
  let y = 800
  const line = (txt: string, size = 11, dy = 18) => {
    L.push('BT')
    L.push(`/F1 ${size} Tf`)
    L.push(`50 ${y} Td`)
    L.push(`(${esc(txt)}) Tj`)
    L.push('ET')
    y -= dy
  }
  line(d.brand, 16, 26)
  line(d.title, 13, 22)
  line(`Order: ${d.order_id}`, 10, 16)
  line(`Tanggal: ${d.date_str}`, 10, 16)
  if (d.shop_name) line(`Merchant: ${d.shop_name}`, 10, 22)
  line('----------------------------------------', 10, 18)
  for (const ln of d.lines) line(`${ln.label}: ${ln.value}`, 11, 18)
  line('----------------------------------------', 10, 18)
  line(`TOTAL: ${d.total_str}`, 13, 26)
  line('', 10, 6)
  // footer wrap sederhana
  const words = d.footer.split(' ')
  let buf = ''
  for (const w of words) {
    if ((buf + ' ' + w).length > 70) { line(buf, 8, 12); buf = w }
    else buf = buf ? buf + ' ' + w : w
  }
  if (buf) line(buf, 8, 12)
  return L.join('\n')
}

// Encode string → Uint8Array (latin1-ish; PDF teks ASCII aman)
function bytes(s: string): Uint8Array {
  const out = new Uint8Array(s.length)
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i) & 0xff
  return out
}

export function generateReceiptPDF(d: ReceiptData): Uint8Array {
  const content = buildContent(d)
  const objs: string[] = []
  objs[1] = '<< /Type /Catalog /Pages 2 0 R >>'
  objs[2] = '<< /Type /Pages /Kids [3 0 R] /Count 1 >>'
  objs[3] = '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>'
  objs[4] = `<< /Length ${content.length} >>\nstream\n${content}\nendstream`
  objs[5] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'

  let pdf = '%PDF-1.4\n'
  const offsets: number[] = []
  for (let i = 1; i < objs.length; i++) {
    offsets[i] = pdf.length
    pdf += `${i} 0 obj\n${objs[i]}\nendobj\n`
  }
  const xrefPos = pdf.length
  pdf += `xref\n0 ${objs.length}\n`
  pdf += '0000000000 65535 f \n'
  for (let i = 1; i < objs.length; i++) {
    pdf += String(offsets[i]).padStart(10, '0') + ' 00000 n \n'
  }
  pdf += `trailer\n<< /Size ${objs.length} /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF`
  return bytes(pdf)
}
