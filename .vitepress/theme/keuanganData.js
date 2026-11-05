/**
 * Sumber tunggal data laporan keuangan masjid: satu Google Spreadsheet, tujuh tab.
 *
 * Beberapa hal di sheet ini tidak terbaca dari nama kolomnya:
 *  - Uang memakai koma sebagai pemisah ribuan ("Rp1,210,000"), bukan titik.
 *  - Tab Infaq Ramadhan menaruh pengeluaran di kolom DEBIT dan pemasukan di
 *    KREDIT (gaya mutasi rekening bank), jadi pemetaan kolomnya dibalik
 *    dibanding tab lain. Sudah dicocokkan dengan baris TOTAL di sheet.
 *  - Baris tanpa nomor urut tetap transaksi sah (mis. "Hadiah Lomba" di tab
 *    Kampung Ramadhan). Nomor urut bukan syarat sebuah baris dihitung.
 *  - Sel Bulan/Tanggal kosong berarti nilainya sama dengan baris di atasnya,
 *    karena sel di-merge di spreadsheet.
 *  - Kolom beras berisi pecahan desimal ("760,5", "22.5"), jadi diparse
 *    terpisah dari uang.
 */

const SHEET_BASE =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vShXeLCJ2McvlLSxj40CoYhvNB13XVDwyX4RZsguTTt6ijKeyxEx5rYHRYzbBS-6HmmCIDk-AH46e4r/pub'

export const NAMA_BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]

/**
 * Urutan tab mengikuti urutan di spreadsheet supaya bendahara mudah
 * mencocokkan. `kolom` hanya dipakai program bertipe transaksi.
 */
export const PROGRAM = [
  {
    id: 'operasional', nama: 'Infaq Operasional', gid: '1359921369', jenis: 'transaksi',
    keterangan: 'Kas operasional harian masjid.',
    kolom: { no: 0, tanggal: 1, masuk: 2, keluar: 3, ket: 4, saldo: 5 },
  },
  {
    id: 'celengan', nama: 'Celengan LAZIRU', gid: '0', jenis: 'celengan',
    keterangan: 'Pemasukan celengan per wilayah RT dan penyalurannya.',
  },
  {
    id: 'pemulasaran', nama: 'Pemulasaran Jenazah', gid: '1658087312', jenis: 'transaksi',
    keterangan: 'Kas lembaga pemulasaran jenazah 125.',
    kolom: { no: 0, tanggal: 1, masuk: 2, keluar: 3, ket: 4 },
  },
  {
    id: 'donatur', nama: 'Donatur Tetap', gid: '843760573', jenis: 'donatur',
    keterangan: 'Donatur tetap bulanan masjid.',
  },
  {
    id: 'ramadhan', nama: 'Infaq Ramadhan 1447 H', gid: '1530014841', jenis: 'transaksi',
    keterangan: 'Infaq dan pengeluaran selama Ramadhan 1447 H.',
    kolom: { no: 0, tanggal: 1, ket: 2, masuk: 4, keluar: 3, saldo: 5 },
  },
  {
    id: 'zakat', nama: 'Rekap Zakat 1447 H', gid: '609760207', jenis: 'zakat',
    keterangan: 'Penerimaan, penyaluran, dan kelengkapan zakat fitrah.',
  },
  {
    id: 'kampung', nama: 'Kampung Ramadhan', gid: '476214188', jenis: 'kampung',
    keterangan: 'Anggaran dan realisasi kegiatan Kampung Ramadhan.',
  },
]

/* ---------- pembaca CSV ---------- */

/** Pecah satu baris CSV, sadar tanda kutip, supaya "Rp1,210,000" tetap satu kolom. */
export function pisahBaris(line) {
  const cols = []
  let cur = ''
  let dalamKutip = false
  for (const ch of line) {
    if (ch === '"') dalamKutip = !dalamKutip
    else if (ch === ',' && !dalamKutip) { cols.push(cur.trim()); cur = '' }
    else cur += ch
  }
  cols.push(cur.trim())
  return cols
}

export function barisCSV(text) {
  return text.replace(/^\uFEFF/, '').trim().split(/\r?\n/).map(pisahBaris)
}

/** Uang: buang semua non-digit. "Rp1,210,000" -> 1210000. */
export function parseRupiahSheet(v) {
  const s = String(v ?? '')
  const negatif = /^\s*-/.test(s) || /^\(.*\)$/.test(s)
  const n = parseInt(s.replace(/[^\d]/g, ''), 10)
  if (isNaN(n)) return 0
  return negatif ? -n : n
}

/** Kuantitas/beras: dukung desimal koma maupun titik ("760,5" dan "22.5"). */
export function parseKuantitas(v) {
  const s = String(v ?? '').trim()
  if (!s) return 0
  if (/^\d+([.,]\d+)?$/.test(s)) return Number(s.replace(',', '.'))
  const n = parseInt(s.replace(/[^\d]/g, ''), 10)
  return isNaN(n) ? 0 : n
}

/** Samakan singkatan bulan dari sheet ke indeks 0-11. */
export function indeksBulan(nama) {
  const n = String(nama ?? '').trim().toLowerCase()
  if (!n) return -1
  if (n.startsWith('agst') || n === 'ags' || n === 'agu') return 7
  if (n === 'sept' || n === 'spt') return 8
  if (n === 'okt') return 9
  if (n === 'nov') return 10
  if (n === 'des') return 11
  return NAMA_BULAN.findIndex(b => b.toLowerCase() === n)
}

/** Tanggal: "08-02-2026", "12 Februari", "5 Maret 2026", "31-8-2026". */
export function parseTanggalID(v) {
  const s = String(v ?? '').trim()
  if (!s) return null
  let m = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/)
  if (m) return { hari: +m[1], bulan: +m[2], tahun: +m[3] }
  m = s.match(/^(\d{1,2})\s+([A-Za-z]+)(?:\s+(\d{4}))?$/)
  if (m) {
    const bi = indeksBulan(m[2])
    if (bi >= 0) return { hari: +m[1], bulan: bi + 1, tahun: m[3] ? +m[3] : null }
  }
  return null
}

/** Saldo akhir = pemasukan - pengeluaran. Dipakai semua program. */
function ringkasanDari(masuk, keluar) {
  return { masuk, keluar, saldo: masuk - keluar }
}

/* ---------- program: transaksi ---------- */

function parseTransaksi(text, kolom) {
  const baris = barisCSV(text)
  const transaksi = []
  let mulai = -1

  for (let i = 0; i < baris.length; i++) {
    const sel = baris[i].map(s => s.toLowerCase())
    if (sel.some(s => s === 'tanggal' || s === 'tgl')) { mulai = i; break }
  }
  if (mulai < 0) return { transaksi, totals: ringkasanDari(0, 0), kosong: true }

  let tanggalMentah = ''
  let berjalan = 0

  for (const c of baris.slice(mulai + 1)) {
    const ket = (c[kolom.ket] ?? '').trim()
    const masuk = parseRupiahSheet(c[kolom.masuk])
    const keluar = parseRupiahSheet(c[kolom.keluar])
    const noMentah = (c[kolom.no] ?? '').trim()
    const tgl = (c[kolom.tanggal] ?? '').trim()

    if (/^total$/i.test(noMentah) || /^total$/i.test(ket)) continue
    if (!noMentah && !ket && !masuk && !keluar) continue
    if (!masuk && !keluar) continue

    if (tgl && parseTanggalID(tgl)) tanggalMentah = tgl
    berjalan += masuk - keluar

    transaksi.push({
      no: noMentah,
      tanggalMentah: tgl || tanggalMentah,
      tanggal: parseTanggalID(tgl || tanggalMentah),
      ket: ket || '—',
      masuk,
      keluar,
      saldo: berjalan,
    })
  }

  const masuk = transaksi.reduce((s, r) => s + r.masuk, 0)
  const keluar = transaksi.reduce((s, r) => s + r.keluar, 0)
  return { transaksi, totals: ringkasanDari(masuk, keluar), kosong: transaksi.length === 0 }
}

/* ---------- program: celengan LAZIRU ---------- */

function parseCelengan(text) {
  const baris = barisCSV(text)
  const pemasukan = []
  const pengeluaran = []
  const subtotal = {}
  const totals = { masuk: 0, keluar: 0, saldo: 0 }
  let bulan = ''
  let subtotalSah = false

  for (const c of baris) {
    const c0 = (c[0] ?? '').trim()
    const c1 = (c[1] ?? '').trim()
    const c2 = (c[2] ?? '').trim()

    if (/^total pemasukan$/i.test(c0)) { totals.masuk = parseRupiahSheet(c[3]); subtotalSah = true; continue }
    if (/^total pengeluaran$/i.test(c0)) { totals.keluar = parseRupiahSheet(c[3]); subtotalSah = true; continue }
    if (/^saldo$/i.test(c0)) { totals.saldo = parseRupiahSheet(c[3]); subtotalSah = true; continue }

    if (c1 && indeksBulan(c1) >= 0) bulan = NAMA_BULAN[indeksBulan(c1)]

    // Sisi kiri: satu baris per wilayah RT, ditutup baris JUMLAH.
    if (/^jumlah$/i.test(c0)) {
      subtotal[bulan] = parseRupiahSheet(c[3])
    } else if (c2 && parseRupiahSheet(c[3])) {
      pemasukan.push({ bulan, wilayah: c2, jumlah: parseRupiahSheet(c[3]) })
    }

    // Sisi kanan: daftar pengeluaran, berjalan paralel di kolom 5-8.
    const noKeluar = (c[5] ?? '').trim()
    const kegiatan = (c[6] ?? '').trim()
    if (/^\d+$/.test(noKeluar) && kegiatan) {
      pengeluaran.push({
        no: +noKeluar,
        kegiatan,
        jumlah: parseRupiahSheet(c[7]),
        tanggalMentah: (c[8] ?? '').trim(),
        tanggal: parseTanggalID(c[8]),
      })
    }
  }

  const masuk = subtotalSah
    ? totals.masuk
    : pemasukan.reduce((s, r) => s + r.jumlah, 0)
  const keluar = subtotalSah && totals.keluar
    ? totals.keluar
    : pengeluaran.reduce((s, r) => s + r.jumlah, 0)

  return {
    pemasukan,
    pengeluaran,
    subtotal,
    bulan: NAMA_BULAN.filter(b => pemasukan.some(p => p.bulan === b)),
    totals: ringkasanDari(masuk, keluar),
    kosong: pemasukan.length === 0 && pengeluaran.length === 0,
  }
}

/* ---------- program: donatur tetap ---------- */

function parseDonatur(text) {
  const baris = barisCSV(text)
  const list = []
  let bulan = ''
  let tanggalMentah = ''

  for (const c of baris) {
    const c0 = (c[0] ?? '').trim()
    if (/^no$/i.test(c0)) continue

    const b = (c[1] ?? '').trim()
    const t = (c[2] ?? '').trim()
    const nama = (c[3] ?? '').trim()
    const jumlah = parseRupiahSheet(c[4])

    if (b && indeksBulan(b) >= 0) bulan = NAMA_BULAN[indeksBulan(b)]
    if (t) tanggalMentah = t

    if (/^jumlah$/i.test(c0)) continue
    if (!nama || !jumlah) continue

    list.push({
      no: c0,
      bulan,
      nama,
      jumlah,
      tanggalMentah: t || tanggalMentah,
      tanggal: parseTanggalID(t || tanggalMentah),
    })
  }

  const perBulan = NAMA_BULAN
    .map(b => {
      const isi = list.filter(r => r.bulan === b)
      if (!isi.length) return null
      return {
        bulan: b,
        jumlah: isi.reduce((s, r) => s + r.jumlah, 0),
        donatur: isi.length,
      }
    })
    .filter(Boolean)

  const masuk = list.reduce((s, r) => s + r.jumlah, 0)
  return { list, perBulan, totals: ringkasanDari(masuk, 0), kosong: list.length === 0 }
}

/* ---------- program: rekap zakat ---------- */

const SEKSI_ZAKAT = {
  A: [
    { key: 'tunai', label: 'Tunai', tipe: 'uang', kolom: 2 },
    { key: 'transfer', label: 'Transfer', tipe: 'uang', kolom: 3 },
    { key: 'total', label: 'Total', tipe: 'uang', kolom: 4 },
    { key: 'beras', label: 'Beras (kg)', tipe: 'kuantitas', kolom: 5 },
  ],
  B: [
    { key: 'penerima', label: 'Jumlah Penerima', tipe: 'jumlah', kolom: 2 },
    { key: 'uang', label: 'Uang', tipe: 'uang', kolom: 3 },
    { key: 'beras', label: 'Beras (kg)', tipe: 'kuantitas', kolom: 4 },
  ],
  C: [
    { key: 'jumlah', label: 'Jumlah', tipe: 'uang', kolom: 2 },
  ],
}

function parseZakat(text) {
  const baris = barisCSV(text)
  const seksi = []
  let aktif = null

  for (const c of baris) {
    const c0 = (c[0] ?? '').trim()
    const c1 = (c[1] ?? '').trim()

    const judul = c0.match(/^([A-C])\.\s*(.+)$/)
    if (judul) {
      aktif = { kode: judul[1], judul: judul[2].trim(), kolom: SEKSI_ZAKAT[judul[1]], baris: [], total: {} }
      seksi.push(aktif)
      continue
    }

    if (!aktif) continue
    if (/^no$/i.test(c0)) continue

    const angka = (i) => (c[i] ?? '').trim()
    const adaAngka = aktif.kolom.some(k => angka(k.kolom) !== '')

    if (/^total$/i.test(c0)) {
      for (const k of aktif.kolom) {
        aktif.total[k.key] = k.tipe === 'kuantitas'
          ? parseKuantitas(angka(k.kolom))
          : parseRupiahSheet(angka(k.kolom))
      }
      continue
    }

    if (!c1 || !adaAngka) continue

    const barisData = { no: c0, item: c1 }
    for (const k of aktif.kolom) {
      const v = angka(k.kolom)
      barisData[k.key] = k.tipe === 'kuantitas'
        ? (v ? parseKuantitas(v) : null)
        : (v ? parseRupiahSheet(v) : null)
    }
    aktif.baris.push(barisData)
  }

  const A = seksi.find(s => s.kode === 'A')
  const B = seksi.find(s => s.kode === 'B')
  const C = seksi.find(s => s.kode === 'C')

  // Kelengkapan (C) adalah biaya penyaluran, jadi ikut dihitung sebagai pengeluaran.
  const masuk = A?.total.total ?? 0
  const keluar = (B?.total.uang ?? 0) + (C?.total.jumlah ?? 0)

  return { seksi, totals: ringkasanDari(masuk, keluar), kosong: seksi.length === 0 }
}

/* ---------- program: kampung ramadhan ---------- */

function parseKampung(text) {
  const baris = barisCSV(text)
  const seksi = []
  const pemasukan = []
  let aktif = null
  let modePemasukan = false
  let totalPemasukan = 0

  for (const c of baris) {
    const c1 = (c[1] ?? '').trim()
    const c2 = (c[2] ?? '').trim()
    const biaya = parseRupiahSheet(c[5])

    if (/^pemasukan uang kegiatan/i.test(c2)) { modePemasukan = true; aktif = null; continue }

    if (modePemasukan) {
      if (/^no$/i.test(c1)) continue
      // Blok pemasukan punya tata letak sendiri: keterangan di kolom 2, saldo di kolom 4.
      const saldo = parseRupiahSheet(c[4])
      if (/^total$/i.test(c2)) { totalPemasukan = saldo; continue }
      if (c2 && saldo) pemasukan.push({ no: c1, ket: c2, jumlah: saldo })
      continue
    }

    if (/^[A-D]$/.test(c1) && c2) {
      aktif = { kode: c1, judul: c2, items: [], subtotal: 0 }
      seksi.push(aktif)
      continue
    }
    if (/^total$/i.test(c1) && !c2) continue

    if (!aktif) continue

    if (c2 && biaya) {
      // Baris tanpa nomor urut tetap dihitung: nomor bukan syarat.
      aktif.items.push({
        no: c1,
        nama: c2,
        satuan: (c[3] ?? '').trim(),
        qty: c[4] ? parseKuantitas(c[4]) : null,
        total: biaya,
      })
    } else if (!c2 && biaya) {
      aktif.subtotal = biaya
    }
  }

  for (const s of seksi) {
    if (!s.subtotal) s.subtotal = s.items.reduce((t, i) => t + i.total, 0)
  }

  const keluar = seksi.reduce((t, s) => t + s.subtotal, 0)
  const masukHitung = pemasukan.reduce((t, r) => t + r.jumlah, 0)
  const masuk = totalPemasukan || masukHitung

  return {
    seksi,
    pemasukan,
    totals: ringkasanDari(masuk, keluar),
    kosong: seksi.length === 0 && pemasukan.length === 0,
  }
}

/* ---------- pemuatan ---------- */

function csvUrl(gid) {
  return `${SHEET_BASE}?gid=${gid}&single=true&output=csv`
}

export function parseProgram(def, text) {
  switch (def.jenis) {
    case 'celengan': return parseCelengan(text)
    case 'donatur': return parseDonatur(text)
    case 'zakat': return parseZakat(text)
    case 'kampung': return parseKampung(text)
    default: return parseTransaksi(text, def.kolom)
  }
}

/** Ambil semua tab sekaligus. Satu tab gagal tidak menjatuhkan tab lain. */
export async function muatDataKeuangan() {
  const hasil = await Promise.allSettled(
    PROGRAM.map(async def => {
      const res = await fetch(csvUrl(def.gid), { cache: 'no-store' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return parseProgram(def, await res.text())
    })
  )

  const programs = PROGRAM.map((def, i) => {
    const r = hasil[i]
    if (r.status === 'rejected') {
      return { ...def, status: 'error', pesan: String(r.reason?.message ?? r.reason), kosong: false }
    }
    return { ...def, status: 'ok', ...r.value }
  })

  const ok = programs.filter(p => p.status === 'ok')
  const ringkasan = {
    masuk: ok.reduce((s, p) => s + p.totals.masuk, 0),
    keluar: ok.reduce((s, p) => s + p.totals.keluar, 0),
    program: programs.length,
    terisi: ok.filter(p => !p.kosong).length,
    gagal: programs.length - ok.length,
  }
  ringkasan.saldo = ringkasan.masuk - ringkasan.keluar

  return { programs, ringkasan, waktu: new Date() }
}

/* ---------- format tampilan ---------- */

export function rupiah(angka) {
  if (angka == null || isNaN(angka)) return '—'
  return 'Rp ' + Number(angka).toLocaleString('id-ID')
}

export function rupiahRingkas(angka) {
  const n = Number(angka) || 0
  if (Math.abs(n) >= 1e9) return 'Rp ' + (n / 1e9).toFixed(1).replace('.', ',') + ' M'
  if (Math.abs(n) >= 1e6) return 'Rp ' + (n / 1e6).toFixed(1).replace('.', ',') + ' jt'
  if (Math.abs(n) >= 1e3) return 'Rp ' + Math.round(n / 1e3) + ' rb'
  return rupiah(n)
}

export function formatTanggal(tanggal, mentah = '') {
  if (!tanggal) return mentah || '—'
  const singkat = NAMA_BULAN[tanggal.bulan - 1]?.slice(0, 3) ?? ''
  return tanggal.tahun
    ? `${tanggal.hari} ${singkat} ${tanggal.tahun}`
    : `${tanggal.hari} ${singkat}`
}

export function formatKuantitas(n) {
  if (n == null || isNaN(n)) return '—'
  return Number(n).toLocaleString('id-ID', { maximumFractionDigits: 1 })
}
