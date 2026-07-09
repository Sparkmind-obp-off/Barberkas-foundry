// BKF-20/T4 — unit test freePackageSanitize + retry-with-fallback fonnteSend.
// Jalankan: node tests/fonnte-sanitize.test.mjs
// (transpile src/lib/fonnte.ts via esbuild — sudah ada sebagai dep vite, nol install baru)

import { build } from 'esbuild'
import { writeFileSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const out = await build({
  entryPoints: ['src/lib/fonnte.ts'],
  bundle: true,
  format: 'esm',
  write: false,
  platform: 'neutral',
})
const dir = mkdtempSync(join(tmpdir(), 'fonnte-test-'))
const mod = join(dir, 'fonnte.mjs')
writeFileSync(mod, out.outputFiles[0].text)
const { freePackageSanitize, isFreePackageReject, envSanitizeLevel, fonnteSend } = await import(mod)

let pass = 0, fail = 0
function eq(name, got, want) {
  const ok = JSON.stringify(got) === JSON.stringify(want)
  if (ok) { pass++; console.log(`  ✅ ${name}`) }
  else { fail++; console.log(`  ❌ ${name}\n     got : ${JSON.stringify(got)}\n     want: ${JSON.stringify(want)}`) }
}
function truthy(name, got) {
  if (got) { pass++; console.log(`  ✅ ${name}`) }
  else { fail++; console.log(`  ❌ ${name} — got falsy: ${JSON.stringify(got)}`) }
}

console.log('── freePackageSanitize ──')
const greeting = `Halo kak! 👋 Selamat datang di *Cut O'Clock* 💈\n\nAku asisten booking otomatis. Bisa bantu:\n• *booking* — cek slot kosong & pesan jadwal\n• *menu* — daftar layanan & harga\n\nMau potong kapan kak? ✂️`

eq('L0 = identitas (pesan tak berubah)', freePackageSanitize(greeting, 0), greeting)

const l1 = freePackageSanitize(greeting, 1)
truthy('L1: bullet • hilang', !l1.includes('•'))
truthy('L1: em-dash — hilang', !l1.includes('—'))
truthy('L1: bold *…* MASIH ada (isi format dipertahankan)', l1.includes("*Cut O'Clock*"))
truthy('L1: emoji MASIH ada', l1.includes('👋'))
truthy('L1: isi teks utuh (kata "booking" ada)', l1.includes('booking'))

const l2 = freePackageSanitize(greeting, 2)
truthy('L2: marker bold hilang tapi teks tetap', !l2.includes('*') && l2.includes("Cut O'Clock"))
truthy('L2: emoji hilang', !/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(l2))
truthy('L2: newline ganda → tunggal', !l2.includes('\n\n'))
truthy('L2: isi teks utuh', l2.includes('Selamat datang di Cut O\'Clock') && l2.includes('booking'))

eq('L1: collapse 3+ newline jadi 2', freePackageSanitize('a\n\n\n\nb', 1), 'a\n\nb')
eq('L2: strip ```mono``` pertahankan isi', freePackageSanitize('cek ```kode123``` ya', 2), 'cek kode123 ya')

console.log('── isFreePackageReject ──')
eq('reason khas free package terdeteksi', isFreePackageReject('invalid message request on free package'), true)
eq('error lain tidak memicu retry', isFreePackageReject('token invalid'), false)
eq('undefined aman', isFreePackageReject(undefined), false)

console.log('── envSanitizeLevel ──')
eq("kosong → 0", envSanitizeLevel({}), 0)
eq("'1' → 1", envSanitizeLevel({ FONNTE_FREE_SANITIZE: '1' }), 1)
eq("'2' → 2", envSanitizeLevel({ FONNTE_FREE_SANITIZE: '2' }), 2)
eq("nilai aneh → 0", envSanitizeLevel({ FONNTE_FREE_SANITIZE: 'yes' }), 0)

console.log('── fonnteSend retry-with-fallback (fetch dimock) ──')
const realFetch = globalThis.fetch
function mockFonnte(responder) {
  const calls = []
  globalThis.fetch = async (_url, opts) => {
    const msg = new URLSearchParams(opts.body).get('message')
    calls.push(msg)
    const j = responder(msg, calls.length)
    return new Response(JSON.stringify(j), { status: 200, headers: { 'content-type': 'application/json' } })
  }
  return calls
}
const env = { FONNTE_TOKEN: 'tok-test' }

// Skenario A: attempt#1 ditolak free-package, attempt#2 (L1) diterima
let calls = mockFonnte((_m, n) =>
  n === 1 ? { status: false, reason: 'invalid message request on free package' } : { status: true, id: ['123'] })
let r = await fonnteSend(env, '081234', greeting)
eq('A: ok=true setelah fallback', r.ok, true)
eq('A: terkirim di sanitize_level=1', r.sanitize_level, 1)
eq('A: 2 attempt', calls.length, 2)
truthy('A: attempt#2 tanpa bullet', !calls[1].includes('•'))

// Skenario B: L0 & L1 ditolak → L2 plain-text diterima
calls = mockFonnte((_m, n) =>
  n <= 2 ? { status: false, reason: 'invalid message request on free package' } : { status: true, id: ['456'] })
r = await fonnteSend(env, '081234', greeting)
eq('B: ok=true di level 2', r.ok && r.sanitize_level, 2)
eq('B: 3 attempt', calls.length, 3)
truthy('B: attempt#3 plain (tanpa * dan emoji)', !calls[2].includes('*') && !calls[2].includes('👋'))

// Skenario C: error lain (token) → TIDAK retry
calls = mockFonnte(() => ({ status: false, reason: 'invalid token' }))
r = await fonnteSend(env, '081234', greeting)
eq('C: gagal tanpa retry (1 attempt)', calls.length, 1)
eq('C: ok=false, error diteruskan', r.error, 'invalid token')

// Skenario D: semua level ditolak → gagal jujur setelah 3 attempt
calls = mockFonnte(() => ({ status: false, reason: 'invalid message request on free package' }))
r = await fonnteSend(env, '081234', greeting)
eq('D: 3 attempt lalu gagal jujur', calls.length === 3 && r.ok, false)

// Skenario E: env FONNTE_FREE_SANITIZE=1 → mulai langsung dari L1 (hemat attempt)
calls = mockFonnte(() => ({ status: true, id: ['789'] }))
r = await fonnteSend({ ...env, FONNTE_FREE_SANITIZE: '1' }, '081234', greeting)
eq('E: pre-sanitize aktif — attempt pertama sudah L1', r.sanitize_level, 1)
truthy('E: pesan pertama tanpa bullet', !calls[0].includes('•'))

// Skenario F: pesan polos (L1 tak mengubah teks) → level duplikat di-skip
calls = mockFonnte(() => ({ status: false, reason: 'invalid message request on free package' }))
r = await fonnteSend(env, '081234', 'halo kak')
truthy('F: attempt < 3 karena teks identik di-skip', calls.length < 3)

// Skenario G: tanpa token → stub, nol fetch
calls = mockFonnte(() => ({ status: true }))
r = await fonnteSend({}, '081234', 'halo')
eq('G: mode stub (Truth-Lock)', r.mode, 'stub')
eq('G: nol panggilan API', calls.length, 0)

globalThis.fetch = realFetch

console.log(`\n${fail === 0 ? '✅' : '❌'} ${pass} pass, ${fail} fail`)
process.exit(fail === 0 ? 0 : 1)
