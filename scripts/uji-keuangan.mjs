import { PROGRAM, parseProgram, rupiah } from '../.vitepress/theme/keuanganData.js'

const BASE =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vShXeLCJ2McvlLSxj40CoYhvNB13XVDwyX4RZsguTTt6ijKeyxEx5rYHRYzbBS-6HmmCIDk-AH46e4r/pub'

let gagal = 0
function cek(nama, aktual, harap) {
  const ok = aktual === harap
  if (!ok) gagal++
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${nama}: ${rupiah(aktual)} (harap ${rupiah(harap)})`)
}

for (const def of PROGRAM) {
  const res = await fetch(`${BASE}?gid=${def.gid}&single=true&output=csv`)
  const d = parseProgram(def, await res.text())
  console.log(`\n=== ${def.id} (${d.kosong ? 'kosong' : 'ada data'}) ===`)
  console.log('  totals:', d.totals)
  if (def.id === 'celengan') {
    cek('celengan masuk', d.totals.masuk, 46693350)
    cek('celengan keluar', d.totals.keluar, 41582700)
    console.log('  bulan:', d.bulan.join(', '))
    console.log('  pengeluaran:', d.pengeluaran.length, 'baris')
    const jan = d.pemasukan.filter(p => p.bulan === 'Januari')
    cek('celengan Januari', jan.reduce((s, r) => s + r.jumlah, 0), 3480300)
  }
  if (def.id === 'donatur') {
    cek('donatur total', d.totals.masuk, 3450000)
    console.log('  perBulan:', d.perBulan.map(b => `${b.bulan} ${b.jumlah} (${b.donatur})`).join(' | '))
  }
  if (def.id === 'ramadhan') {
    cek('ramadhan masuk', d.totals.masuk, 9200000)
    cek('ramadhan keluar', d.totals.keluar, 7126000)
    cek('ramadhan saldo', d.totals.saldo, 2074000)
    console.log('  transaksi:', d.transaksi.length, 'baris')
    console.log('  saldo terakhir:', d.transaksi.at(-1)?.saldo)
  }
  if (def.id === 'zakat') {
    const A = d.seksi.find(s => s.kode === 'A')
    const B = d.seksi.find(s => s.kode === 'B')
    const C = d.seksi.find(s => s.kode === 'C')
    cek('zakat A total', A.total.total, 56025000)
    cek('zakat A beras', A.total.beras, 760.5)
    cek('zakat B uang', B.total.uang, 49950000)
    cek('zakat C total', C.total.jumlah, 5180000)
    console.log('  seksi:', d.seksi.map(s => `${s.kode}:${s.baris.length}baris`).join(' '))
  }
  if (def.id === 'kampung') {
    console.log('  seksi:', d.seksi.map(s => `${s.kode}=${s.subtotal}(${s.items.length})`).join(' '))
    cek('kampung masuk', d.totals.masuk, 63241000)
    cek('kampung keluar', d.totals.keluar, 62246000)
    cek('kampung saldo', d.totals.saldo, 995000)
    cek('kampung subtotal A', d.seksi[0].subtotal, 1038000)
    cek('kampung subtotal B', d.seksi[1].subtotal, 27411000)
    cek('kampung subtotal C', d.seksi[2].subtotal, 10547000)
    cek('kampung subtotal D', d.seksi[3].subtotal, 23250000)
    cek('kampung pemasukan', d.pemasukan.length, 10)
  }
}

console.log(`\n${gagal === 0 ? 'SEMUA COCOK' : gagal + ' KEGAGALAN'}`)
process.exit(gagal === 0 ? 0 : 1)
