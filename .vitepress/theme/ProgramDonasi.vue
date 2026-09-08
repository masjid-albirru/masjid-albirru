<script setup>
import { ref, computed, onMounted } from 'vue'
import { useData } from 'vitepress'
import {
  CalendarClock, Wallet, ArrowRight, ExternalLink,
  Loader2, CircleAlert
} from 'lucide-vue-next'

const props = defineProps({
  /** true = tampilan ringkas (dipakai di beranda), false = lengkap (halaman /donasi) */
  ringkas: { type: Boolean, default: false },
})

const { site } = useData()

function url(path) {
  return site.value.base + path.replace(/^\//, '')
}

// ============================================================
// DATA PROGRAM DONASI — dikelola lewat GOOGLE SHEETS
// ------------------------------------------------------------
// CARA ISI / TAMBAH PROGRAM (tanpa menyentuh kode):
// 1. Buka spreadsheet program donasi (lihat catatan template di
//    akhir file ini / panduan dari pengelola web).
// 2. Satu baris = satu program yang sedang buka donasi.
//    Isi header persis: aktif,nama,kode,deskripsi,target,
//    terkumpul,terpakai,deadline,link,urutan
//    (angka rupiah tanpa titik/koma: 65000000).
//    "aktif" = ya | tidak. "link" = halaman detail opsional.
// 3. File → Share → Publish to web → pilih sheet → format CSV →
//    salin URL-nya ke CSV_PROGRAM_URL di bawah.
// 4. Simpan. Halaman otomatis menampilkan semua program aktif.
// ------------------------------------------------------------
const CSV_PROGRAM_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQBRvTmbaOuGYRY0bm0604aQ08cDwsIKN1D5X4Z2p4chV9OAFaruPFRWF1goP1t7TiX_nWOReazzsDC/pub?gid=0&single=true&output=csv'
// ============================================================

// Data cadangan bila URL belum diisi / gagal diakses.
// Ganti sesuai program yang sedang berjalan bila perlu.
const FALLBACK_PROGRAM = [
  {
    aktif: 'ya',
    nama: 'Renovasi Struktur Bangunan',
    kode: 'RENOVASI-STRUKTUR',
    deskripsi: 'Penguatan struktur lantai 2 (ruang utama) yang mengalami getar pada bagian lantai tengah. Mari menjadi bagian dari kebaikan ini.',
    target: 65000000,
    terkumpul: 13845000,
    terpakai: 625000,
    deadline: 'Desember 2026',
    link: '/keuangan/donasi/program-renovasi-struktur-bangunan',
    urutan: 1,
  },
]

const WA_NUMBER = '6281399928319'

const program = ref([])
const loading = ref(true)
const error = ref(false)
const pakaiFallback = ref(false)

onMounted(async () => {
  if (!CSV_PROGRAM_URL) {
    program.value = FALLBACK_PROGRAM
    pakaiFallback.value = true
    loading.value = false
    return
  }
  try {
    const res = await fetch(CSV_PROGRAM_URL)
    const text = await res.text()
    const rows = parseCSV(text)
    if (rows.length === 0) {
      program.value = []
    } else {
      program.value = rows
    }
  } catch {
    error.value = true
    program.value = FALLBACK_PROGRAM
    pakaiFallback.value = true
  } finally {
    loading.value = false
  }
})

function parseCSV(text) {
  const lines = text.trim().split('\n')
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
  return lines.slice(1).map(line => {
    const cols = []
    let current = ''
    let inQuote = false
    for (const ch of line) {
      if (ch === '"') { inQuote = !inQuote }
      else if (ch === ',' && !inQuote) { cols.push(current.trim()); current = '' }
      else { current += ch }
    }
    cols.push(current.trim())

    const row = {}
    headers.forEach((h, i) => { row[h] = (cols[i] ?? '').replace(/"/g, '') })
    return row
  }).filter(r => r.nama && r.nama.trim() !== '')
}

// Program aktif, urut berdasarkan kolom "urutan"
const daftarProgram = computed(() => {
  return program.value
    .filter(p => (p.aktif || 'ya').trim().toLowerCase() === 'ya')
    .sort((a, b) => {
      const x = parseFloat(a.urutan) || 999
      const y = parseFloat(b.urutan) || 999
      return x - y
    })
})

const programTampil = computed(() => {
  if (!props.ringkas) return daftarProgram.value
  return daftarProgram.value.slice(0, 3)
})

const lebihBanyak = computed(() => props.ringkas && daftarProgram.value.length > 3)

function angka(v) {
  // Terima "65000000" maupun "Rp 65.000.000" — titik ribuan ikut dibuang.
  const n = parseInt(String(v ?? '').replace(/[^0-9-]/g, ''), 10)
  return isNaN(n) ? 0 : n
}

function rupiah(v) {
  return 'Rp ' + Number(v).toLocaleString('id-ID')
}

function persen(p) {
  const target = angka(p.target)
  if (target <= 0) return 0
  return Math.min(Math.round((angka(p.terkumpul) / target) * 100), 100)
}

function sisa(p) {
  return angka(p.terkumpul) - angka(p.terpakai)
}

function waLink(kode) {
  const pesan = encodeURIComponent(`DONASI_[NAMA]_[NOMINAL]_${kode}\n\nAssalamualaikum, saya telah melakukan donasi untuk program ${kode} Masjid Al-Birru.`)
  return `https://wa.me/${WA_NUMBER}?text=${pesan}`
}
</script>

<template>
  <div class="program-donasi">

    <!-- Loading -->
    <div v-if="loading" class="pd-state">
      <Loader2 :size="18" class="pd-spin" />
      Memuat program donasi...
    </div>

    <!-- Error (fetch gagal, fallback ditampilkan) -->
    <div v-else-if="error" class="pd-state pd-state--error">
      <CircleAlert :size="16" />
      Data langsung gagal dimuat — menampilkan data cadangan.
    </div>

    <template v-else>
      <div v-if="programTampil.length === 0" class="pd-empty">
        Belum ada program donasi yang sedang berjalan. Pantau terus halaman ini.
      </div>

      <div v-else class="pd-grid">
        <article
          v-for="(p, i) in programTampil" :key="p.kode || i"
          class="pd-card"
        >
          <div class="pd-head">
            <div>
              <h4 class="pd-nama">{{ p.nama }}</h4>
              <span class="pd-kode">{{ p.kode }}</span>
            </div>
            <span v-if="p.deadline" class="pd-deadline">
              <CalendarClock :size="13" />
              {{ p.deadline }}
            </span>
          </div>

          <p v-if="!ringkas && p.deskripsi" class="pd-deskripsi">{{ p.deskripsi }}</p>

          <div class="pd-angka">
            <span class="pd-terkumpul">{{ rupiah(angka(p.terkumpul)) }}</span>
            <span class="pd-target">dari {{ rupiah(angka(p.target)) }}</span>
          </div>

          <div
            class="pd-bar"
            role="progressbar"
            :aria-valuenow="persen(p)"
            aria-valuemin="0"
            aria-valuemax="100"
          >
            <div class="pd-bar-fill" :style="{ width: persen(p) + '%' }"></div>
          </div>
          <div class="pd-persen">{{ persen(p) }}% terkumpul</div>

          <div class="pd-pakai">
            <span class="pd-pakai-item">
              <Wallet :size="13" />
              Terpakai {{ rupiah(angka(p.terpakai)) }}
            </span>
            <span class="pd-pakai-item pd-pakai-item--sisa">
              Sisa {{ rupiah(sisa(p)) }}
            </span>
          </div>

          <div class="pd-footer">
            <a
              :href="waLink(p.kode)"
              target="_blank"
              rel="noopener"
              class="pd-donasi"
            >
              Konfirmasi Donasi
            </a>
            <a v-if="p.link" :href="url(p.link)" class="pd-detail">
              Detail
              <ExternalLink :size="13" />
            </a>
          </div>
        </article>
      </div>

      <div v-if="lebihBanyak" class="pd-more">
        <a :href="url('/donasi')">
          Lihat semua program donasi
          <ArrowRight :size="14" />
        </a>
      </div>
    </template>
  </div>
</template>

<style scoped>
.program-donasi {
  margin: 1.5rem 0;
}

.pd-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 2rem;
  color: var(--vp-c-text-2);
  font-size: 0.88rem;
}

.pd-state--error { color: var(--vp-c-text-2); }

.pd-spin { animation: pd-rot 0.9s linear infinite; }
@keyframes pd-rot { to { transform: rotate(360deg); } }

.pd-empty {
  text-align: center;
  padding: 2rem;
  color: var(--vp-c-text-2);
  font-size: 0.9rem;
  border: 1px dashed var(--vp-c-divider);
  border-radius: 12px;
}

.pd-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
}

.pd-card {
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  padding: 1.25rem;
  background: var(--vp-c-bg);
  transition: box-shadow 0.2s, border-color 0.2s;
  display: flex;
  flex-direction: column;
}

.pd-card:hover {
  box-shadow: 0 4px 16px rgba(0,0,0,0.07);
  border-color: var(--vp-c-brand-light);
}

.pd-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.pd-nama {
  margin: 0 0 3px;
  font-size: 1rem;
  font-weight: 700;
  line-height: 1.35;
  color: var(--vp-c-text-1);
}

.pd-kode {
  display: inline-block;
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.6px;
  text-transform: uppercase;
  padding: 1px 7px;
  border-radius: 4px;
  background: rgba(15, 107, 120, 0.1);
  color: var(--teal-700);
}

.dark .pd-kode {
  background: rgba(51, 189, 212, 0.14);
  color: var(--teal-400);
}

.pd-deadline {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.72rem;
  color: var(--vp-c-text-2);
  white-space: nowrap;
}

.pd-deskripsi {
  font-size: 0.82rem;
  color: var(--vp-c-text-2);
  line-height: 1.6;
  margin: 0 0 0.9rem;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.pd-angka {
  margin-bottom: 6px;
}

.pd-terkumpul {
  font-weight: 700;
  font-size: 1.05rem;
  color: var(--teal-700);
  font-variant-numeric: tabular-nums;
}

.pd-target {
  font-size: 0.75rem;
  color: var(--vp-c-text-2);
  margin-left: 4px;
}

.pd-bar {
  height: 8px;
  background: var(--vp-c-bg-soft);
  border-radius: 99px;
  overflow: hidden;
  margin-bottom: 5px;
}

.pd-bar-fill {
  height: 100%;
  background: var(--teal-600);
  border-radius: 99px;
}

.pd-persen {
  font-size: 0.72rem;
  color: var(--vp-c-text-2);
  margin-bottom: 0.6rem;
}

.pd-pakai {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 6px;
  padding: 0.5rem 0.65rem;
  border-radius: 8px;
  background: var(--vp-c-bg-soft);
  margin-bottom: 0.9rem;
}

.pd-pakai-item {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.72rem;
  color: var(--vp-c-text-2);
  font-variant-numeric: tabular-nums;
}

.pd-pakai-item--sisa {
  font-weight: 700;
  color: var(--teal-700);
}

.dark .pd-pakai-item--sisa { color: var(--teal-400); }

.pd-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  margin-top: auto;
}

.pd-donasi {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.78rem;
  font-weight: 700;
  color: #fff;
  background: var(--teal-700);
  padding: 6px 12px;
  border-radius: 8px;
  text-decoration: none;
  transition: opacity 0.2s;
}

.dark .pd-donasi { background: var(--teal-600); }

.pd-donasi:hover { opacity: 0.88; }

.pd-detail {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--vp-c-brand);
  text-decoration: none;
  padding: 6px 4px;
}

.pd-detail:hover { opacity: 0.75; }

.pd-more {
  text-align: center;
  margin-top: 1.25rem;
}

.pd-more a {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--teal-700);
  text-decoration: none;
}

.pd-more a:hover { opacity: 0.75; }

@media (max-width: 640px) {
  .pd-grid { grid-template-columns: 1fr; }
}
</style>
