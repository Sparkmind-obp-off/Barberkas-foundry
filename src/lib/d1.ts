// D1 query helpers — all queries are tenant-scoped (row-level isolation)

export function uid(prefix = ''): string {
  return prefix + crypto.randomUUID().replace(/-/g, '').slice(0, 16)
}

export function now(): number {
  return Date.now()
}

export function rupiah(cents: number): string {
  // price_cents stored as integer cents of Rupiah; convert to whole Rp
  const rp = Math.round(cents / 100)
  return 'Rp ' + rp.toLocaleString('id-ID')
}

// Safe JSON parse for service_ids columns
export function parseIds(json: string | null): string[] {
  if (!json) return []
  try {
    const v = JSON.parse(json)
    return Array.isArray(v) ? v : []
  } catch {
    return []
  }
}
