/**
 * Data wakaf tanah — Wakaf Pembebasan Tanah (Sebelah Barat Masjid Al-Birru)
 * oleh Pimpinan Ranting Muhammadiyah Cinangka.
 *
 * Satu sumber data untuk halaman /wakaf-tanah dan ringkasan beranda,
 * supaya angka tidak pernah berbeda di dua tempat.
 *
 * Konvensi isi sheet per wilayah (identik di semua tab):
 *   No | Wakif | Jumlah Wakaf | Tenor | Okt | Nov | ... | Des | Jumlah
 * Semua "Jumlah Wakaf" dibaca sebagai meter persegi. Ada nilai pecahan
 * (mis. "2,5"), jadi kolomnya diparse sebagai desimal, bukan ribuan.
 */

/** Harga wakaf per meter persegi, sesuai ketentuan Northwestern. */
export const HARGA_PER_M2 = 2500000

/**
 * Target pengumpulan wakaf tanah, dalam meter persegi.
 * 1.000 m² × Rp2.500.000 = Rp2.500.000.000.
 * Diubah di sini, halaman, beranda, dan kartu share ikut otomatis.
 */
export const LUAS_TARGET_M2 = 1000
export const NILAI_TARGET = LUAS_TARGET_M2 * HARGA_PER_M2

const SHEET_BASE =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vTogozxD2SadoBM8A2tl8D9cPL_sY5iGgOMVdnwDBnrj7RjyR4lZXkSfW3WjVKZhl01Oc5faFzoV2o-/pub'

/** Tab wilayah sesuai urutan sheet di spreadsheet. */
export const WILAYAH_SHEET = [
  { nama: 'RT 01/08', gid: '2108613077' },
  { nama: 'RT 02/08', gid: '49278673' },
  { nama: 'RT 05/08', gid: '1223491287' },
  { nama: 'Kp. Kebon Selatan', gid: '4478687' },
  { nama: 'Kp. Kebon Cura', gid: '119487636' },
  { nama: 'SMP Muhammadiyah 29', gid: '2098343335' },
  { nama: 'TPA Aisyiyah Cinangka', gid: '885998276' },
]

const GID_RINCIAN = '1423454212'

function csvUrl(gid) {
  return `${SHEET_BASE}?gid=${gid}&single=true&output=csv`
}

/** Pemecah baris CSV yang sadar tanda kutip: nilai "2,5" tetap satu kolom. */
function pisahBaris(line) {
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

function barisCSV(text) {
  return text.trim().split(/\r?\n/).map(pisahBaris)
}

/** Kolom luas: "45" atau "2,5" (koma sebagai pemisah desimal). */
export function parseLuas(v) {
  const s = String(v ?? '').replace(/[^\d,]/g, '')
  if (!s) return 0
  const n = parseFloat(s.replace(',', '.'))
  return isNaN(n) ? 0 : n
}

/** Kolom uang: "Rp4.500.000", "Rp0", atau angka polos. Titik = ribuan. */
export function parseRupiah(v) {
  const n = parseInt(String(v ?? '').replace(/[^0-9-]/g, ''), 10)
  return isNaN(n) ? 0 : n
}

function parseWilayah(text) {
  const baris = barisCSV(text)
  let bulan = []
  let idxTotal = -1

  const wakif = []
  let totalBaris = null

  for (const cols of baris) {
    const c0 = cols[0] ?? ''
    const c1 = cols[1] ?? ''

    // Header kolom: "No, Wakif, Jumlah Wakaf, Tenor, Setoran Angsuran, ..., Jumlah"
    if (c0.toLowerCase() === 'no' && c1.toLowerCase() === 'wakif') {
      idxTotal = cols.reduce((akhir, c, i) =>
        c.toLowerCase() === 'jumlah' ? i : akhir, -1)
      continue
    }

    // Baris label bulan. Baris kosong lain (mis. pemisah sebelum baris reakit)
    // juga punya kolom 0-1 kosong, jadi label kosong tidak boleh menimpa daftar.
    if (!c0 && !c1 && idxTotal > 0) {
      const label = cols.slice(4, idxTotal).filter(Boolean)
      if (label.length) bulan = label
      continue
    }

    // Baris reakit: "Jumlah, , 45, , Rp2.600.000, ..."
    if (c0.toLowerCase() === 'jumlah') {
      totalBaris = cols
      continue
    }

    // Baris wakif: kolom 0 nomor urut, kolom 1 nama
    if (/^\d+$/.test(c0) && c1 && idxTotal > 0) {
      const setoran = {}
      bulan.forEach((b, i) => {
        const v = parseRupiah(cols[4 + i])
        if (v > 0) setoran[b] = v
      })
      const total = idxTotal > 0
        ? parseRupiah(cols[idxTotal])
        : Object.values(setoran).reduce((s, v) => s + v, 0)
      wakif.push({
        no: parseInt(c0, 10),
        nama: c1,
        luas: parseLuas(cols[2]),
        setoran,
        total,
      })
    }
  }

  // Preferensi baris reakit dari pengelola; fallback hitung ulang dari baris wakif.
  const luasRekap = totalBaris ? parseLuas(totalBaris[2]) : 0
  const setoranRekap = totalBaris
    ? parseRupiah(totalBaris[totalBaris.length - 1])
    : 0

  return {
    bulan,
    wakif,
    luas: wakif.length ? (luasRekap || wakif.reduce((s, w) => s + w.luas, 0)) : luasRekap,
    setoran: setoranRekap || wakif.reduce((s, w) => s + w.total, 0),
  }
}

/**
 * Rincian transaksi: No, Tahun, Bulan, Tanggal, Wakif, Jumlah, Metode Setor.
 * Sel kosong pada baris berikutnya berarti angka yang sama dengan baris atas
 * (sel di-merge di spreadsheet), jadi ikut terbawa ke bawah.
 */
function parseRincian(text) {
  const baris = barisCSV(text)
  const rincian = []
  let berjalan = {}

  for (const cols of baris) {
    if ((cols[0] ?? '').toLowerCase() === 'no') {
      berjalan = {}
      continue
    }
    const ambil = (i) => {
      const v = cols[i] ?? ''
      if (v) berjalan[i] = v
      return berjalan[i] ?? ''
    }
    ambil(0); ambil(1); ambil(2); ambil(3)
    const nama = cols[4] ?? ''
    if (!nama) continue
    rincian.push({
      no: berjalan[0] ?? '',
      tahun: berjalan[1] ?? '',
      bulan: berjalan[2] ?? '',
      tanggal: berjalan[3] ?? '',
      wakif: nama,
      jumlah: parseRupiah(cols[5]),
      metode: cols[6] ?? '',
    })
  }
  return rincian
}

async function ambilSheet(gid) {
  const res = await fetch(csvUrl(gid))
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.text()
}

const NAMA_BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]

/** Samakan singkatan bulan dari sheet ("Agsts", "Ags") ke nama penuh. */
function indeksBulan(nama) {
  const n = String(nama ?? '').trim().toLowerCase()
  if (!n) return -1
  if (n.startsWith('agst') || n === 'ags' || n === 'agu') return 7
  return NAMA_BULAN.findIndex(b => b.toLowerCase() === n)
}

/**
 * Tanggal update = tanggal transaksi terakhir di sheet Rincian.
 * Diambil dari data, bukan hardcode. null bila belum ada transaksi.
 */
function tanggalTerbaru(rincian) {
  let maks = null
  for (const t of rincian) {
    const hari = parseInt(t.tanggal, 10)
    const bulan = indeksBulan(t.bulan)
    const tahun = parseInt(t.tahun, 10)
    if (!hari || bulan < 0 || !tahun) continue
    const d = new Date(tahun, bulan, hari)
    if (!maks || d > maks) maks = d
  }
  if (!maks) return null
  return `${maks.getDate()} ${NAMA_BULAN[maks.getMonth()]} ${maks.getFullYear()}`
}

/** Satu putaran ambil untuk seluruh tab; tab gagal tidak menggagalkan halaman. */
async function ambilSemua() {
  const [hasilWilayah, hasilRincian] = await Promise.all([
    Promise.allSettled(WILAYAH_SHEET.map(w => ambilSheet(w.gid))),
    ambilSheet(GID_RINCIAN).then(parseRincian).catch(() => []),
  ])

  const wilayah = []
  hasilWilayah.forEach((hasil, i) => {
    if (hasil.status !== 'fulfilled') return
    const isi = parseWilayah(hasil.value)
    wilayah.push({ nama: WILAYAH_SHEET[i].nama, ...isi })
  })

  const totalM2 = wilayah.reduce((s, w) => s + w.luas, 0)
  const totalSetoran = wilayah.reduce((s, w) => s + w.setoran, 0)
  const wilayahAktif = wilayah.filter(w => w.luas > 0)

  return {
    wilayah,
    rincian: hasilRincian,
    ringkas: {
      totalM2,
      totalSetoran,
      // totalNilai adalah target tetap (1.000 m² × Rp2.500.000), bukan
      // nilai dari totalM2 saat ini — agar progres bermakna walau wakif
      // masih sedikit. Mengubah LUAS_TARGET_M2 di atas mengubah semua
      // tampilan "Nilai/Target" sekaligus.
      totalNilai: NILAI_TARGET,
      luasTarget: LUAS_TARGET_M2,
      jumlahWakif: wilayah.reduce((s, w) => s + w.wakif.length, 0),
      wilayahAktif: wilayahAktif.length,
      jumlahWilayah: WILAYAH_SHEET.length,
      /** Tanggal transaksi terakhir, mis. "18 Oktober 2026". null bila kosong. */
      diperbarui: tanggalTerbaru(hasilRincian),
    },
  }
}

// One fetch per page, dipakai bersama oleh komponen yang sama.
let dalamProses = null

export function muatDataWakaf() {
  if (!dalamProses) {
    dalamProses = ambilSemua().catch((err) => {
      dalamProses = null // biar bisa dicoba ulang saat visitors reload
      throw err
    })
  }
  return dalamProses
}

export function rupiah(n) {
  return 'Rp ' + Number(n).toLocaleString('id-ID')
}

/**
 * Bentuk ringkas untuk kartu ringkasan: "Rp 655 juta".
 * Angka penuh tetap muncul di bar progres di bawahnya, jadi tidak ada
 * informasi yang hilang hanya karena angka tidak muat satu baris.
 */
export function rupiahRingkas(n) {
  const angka = Number(n) || 0
  if (angka >= 1e9) return 'Rp ' + Math.round(angka / 1e8) / 10 + ' miliar'
  if (angka >= 1e6) return 'Rp ' + Math.round(angka / 1e6) + ' juta'
  return rupiah(angka)
}

/** Meter persegi utuh tampil tanpa desimal; pecahan tampil satu angka di belakang koma. */
export function luasM2(n) {
  const bulat = Math.round(Number(n) * 10) / 10
  const tampil = Number.isInteger(bulat)
    ? bulat.toLocaleString('id-ID')
    : bulat.toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
  return `${tampil} m²`
}

/**
 * Persentase progres tanpa tanda "%" (template yang menambahkannya).
 * Progres kecil tidak dibulatkan jadi 0: di bawah 1% dipakai dua desimal
 * (mis. "0,28"), 1-10% satu desimal, di atasnya bilangan bulat.
 */
export function formatPersen(n) {
  const angka = Number(n) || 0
  if (angka <= 0) return '0'
  if (angka < 1) {
    return angka.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }
  if (angka < 10) {
    return angka.toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
  }
  return Math.round(angka).toLocaleString('id-ID')
}