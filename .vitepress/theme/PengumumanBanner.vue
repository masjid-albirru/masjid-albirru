<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { useData } from 'vitepress'
import { ChevronLeft, ChevronRight, X, Info, HardHat, TriangleAlert } from 'lucide-vue-next'

const { site } = useData()

// Fungsi helper buat link dengan base otomatis
function url(path) {
  return site.value.base + path.replace(/^\//, '')
}

// ============================================================
// DATA PENGUMUMAN — dikelola lewat GOOGLE SHEETS
// ------------------------------------------------------------
// Struktur kolom (header baris pertama, harus persis):
//   aktif,tipe,pesan,link,link_label
//   - aktif  : ya | tidak
//   - tipe   : info | penting | darurat
//   - pesan  : teks pengumuman (boleh memakai koma)
//   - link   : path halaman, boleh kosong
//   - link_label : label tautan, boleh kosong
// Contoh baris:
//   ya,info,Kajian Rutin Malam Rabu ba'da Maghrib,/blog/kajian/keutamaan-sholat-berjamaah,Selengkapnya
// Publish: File → Share → Publish to web → pilih sheet → CSV →
// salin URL ke CSV_PENGUMUMAN_URL di bawah. Kosong = pakai data
// cadangan. Pengumuman selesai → set aktif = tidak.
// ------------------------------------------------------------
const CSV_PENGUMUMAN_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTZOtSWre8I4xMlqXOm6VYJMmBoCdCIDahi24vvY8kb8ZF6Qrg8dMtfYZhVIvu1X_F9B-lIFh5503bc/pub?gid=769753275&single=true&output=csv'
// ============================================================

// Data cadangan bila URL belum diisi / gagal diakses
const FALLBACK_PENGUMUMAN = [
  {
    aktif: 'ya',
    tipe: 'info',
    pesan: 'Kajian Rutin Malam Rabu bersama Ust. Ahmad Fauzi — setiap Rabu ba\'da Maghrib di Masjid Al-Birru.',
    link: '/blog/kajian/keutamaan-sholat-berjamaah',
    link_label: 'Selengkapnya',
  },
  {
    aktif: 'ya',
    tipe: 'penting',
    pesan: 'Program donasi Renovasi Struktur Bangunan sedang berjalan — bantu kami capai target anggarannya!',
    link: '/donasi',
    link_label: 'Donasi Sekarang',
  },
]

function splitCSVLine(line) {
  const cols = []
  let cur = ''
  let inQuote = false
  for (const ch of line) {
    if (ch === '"') { inQuote = !inQuote }
    else if (ch === ',' && !inQuote) { cols.push(cur.trim()); cur = '' }
    else { cur += ch }
  }
  cols.push(cur.trim())
  return cols
}

function parsePengumuman(text) {
  const lines = text.trim().split(/\r?\n/)
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
  return lines.slice(1).map(line => {
    const cols = splitCSVLine(line)
    const row = {}
    headers.forEach((h, i) => { row[h] = (cols[i] ?? '').replace(/"/g, '') })
    return row
  }).filter(r => r.pesan && r.pesan.trim() !== '')
}

const semuaPengumuman = ref([])
const siap = ref(false)

// Daftar aktif + normalisasi tipe
const aktifList = computed(() =>
  semuaPengumuman.value
    .filter(p => (p.aktif || 'ya').trim().toLowerCase() === 'ya')
    .map(p => ({
      ...p,
      tipe: ['info', 'penting', 'darurat'].includes((p.tipe || '').trim().toLowerCase())
        ? p.tipe.trim().toLowerCase()
        : 'info',
    }))
)

const current = ref(0)
const dismissed = ref(false)

// --- Collapse saat scroll ---
// Banner menempel di atas (fixed). Saat halaman mulai di-scroll,
// banner menyusut tingginya sehingga navbar naik ke posisi paling atas.
const collapsed = ref(false)

function onScroll() {
  collapsed.value = window.scrollY > 48
}

const aktif = computed(() => aktifList.value[current.value] ?? null)

const tipeIkon = {
  info: Info,
  penting: HardHat,
  darurat: TriangleAlert,
}

const warna = {
  info:    { bg: '#0f6b78', text: '#fff' },
  penting: { bg: '#92400e', text: '#fef3c7' },
  darurat: { bg: '#991b1b', text: '#fee2e2' },
}

// Tutup banner per sesi browser (muncul lagi di kunjungan berikutnya)
const DISMISS_KEY = 'pengumuman-ditutup'
try {
  dismissed.value = sessionStorage.getItem(DISMISS_KEY) === String(new Date().toDateString())
} catch {}

function tutup() {
  dismissed.value = true
  try { sessionStorage.setItem(DISMISS_KEY, new Date().toDateString()) } catch {}
}

// Auto-rotate jika lebih dari 1 pengumuman (data bisa datang async)
let timer
function aturTimer() {
  clearInterval(timer)
  if (aktifList.value.length > 1) {
    timer = setInterval(() => {
      current.value = (current.value + 1) % aktifList.value.length
    }, 5000)
  }
}
watch(aktifList, () => {
  if (current.value >= aktifList.value.length) current.value = 0
  aturTimer()
})

function next() {
  current.value = (current.value + 1) % aktifList.value.length
}

function prev() {
  current.value = (current.value - 1 + aktifList.value.length) % aktifList.value.length
}

// --- Sinkronisasi tinggi banner ke var VitePress ---
// Tanpa ini, navbar fixed menutupi banner di desktop.
const bannerEl = ref(null)
const KUNCI_VAR = '--vp-layout-top-height'

function updateTinggi() {
  // Saat collapsed/dismissed, banner menyusut ke 0 — var = 0 juga.
  const h = collapsed.value ? 0 : (dismissed.value ? 0 : (bannerEl.value?.offsetHeight ?? 0))
  document.documentElement.style.setProperty(KUNCI_VAR, h + 'px')
}

let observer
onMounted(async () => {
  if (CSV_PENGUMUMAN_URL) {
    try {
      const res = await fetch(CSV_PENGUMUMAN_URL)
      const rows = parsePengumuman(await res.text())
      semuaPengumuman.value = rows.length > 0 ? rows : FALLBACK_PENGUMUMAN
    } catch {
      semuaPengumuman.value = FALLBACK_PENGUMUMAN
    }
  } else {
    semuaPengumuman.value = FALLBACK_PENGUMUMAN
  }
  siap.value = true
  aturTimer()

  await nextTick()
  updateTinggi()
  observer = new ResizeObserver(updateTinggi)
  if (bannerEl.value) observer.observe(bannerEl.value)
  window.addEventListener('scroll', onScroll, { passive: true })
})

watch(dismissed, () => nextTick(updateTinggi))
watch(collapsed, () => nextTick(updateTinggi))

onBeforeUnmount(() => {
  clearInterval(timer)
  observer?.disconnect()
  window.removeEventListener('scroll', onScroll)
  document.documentElement.style.setProperty(KUNCI_VAR, '0px')
})
</script>

<template>
  <div
    v-if="siap && !dismissed && aktif"
    ref="bannerEl"
    class="pengumuman-banner"
    :class="{ 'pengumuman-banner--collapsed': collapsed }"
    :style="{ background: warna[aktif.tipe].bg, color: warna[aktif.tipe].text }"
  >
    <div class="pb-inner">
      <!-- Nav kiri -->
      <button v-if="aktifList.length > 1" class="pb-nav" @click="prev" aria-label="Pengumuman sebelumnya">
        <ChevronLeft :size="15" />
      </button>

      <!-- Konten -->
      <div class="pb-content">
        <component :is="tipeIkon[aktif.tipe]" :size="15" class="pb-ikon" />
        <span class="pb-pesan">{{ aktif.pesan }}</span>
        <a v-if="aktif.link" :href="url(aktif.link)" class="pb-link">
          {{ aktif.link_label || 'Selengkapnya' }}
        </a>
      </div>

      <!-- Nav kanan + dots + close -->
      <div class="pb-right">
        <button v-if="aktifList.length > 1" class="pb-nav" @click="next" aria-label="Pengumuman berikutnya">
          <ChevronRight :size="15" />
        </button>

        <!-- Dots -->
        <div v-if="aktifList.length > 1" class="pb-dots">
          <span
            v-for="(_, i) in aktifList" :key="i"
            class="pb-dot"
            :class="{ active: i === current }"
            @click="current = i"
          ></span>
        </div>

        <button class="pb-close" @click="tutup" title="Tutup" aria-label="Tutup pengumuman">
          <X :size="12" />
        </button>
      </div>
    </div>

  </div>
</template>

<style scoped>
.pengumuman-banner {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: var(--vp-z-index-layout-top, 40);
  width: 100%;
  overflow: hidden;
  transition: max-height 0.25s ease, opacity 0.2s ease, background-color 0.4s ease;
  max-height: 96px;
}

/* Saat halaman di-scroll, banner menyusut & memudar — navbar kembali ke paling atas */
.pengumuman-banner--collapsed {
  max-height: 0;
  opacity: 0;
  pointer-events: none;
}

.pb-inner {
  max-width: 1280px;
  margin: 0 auto;
  padding: 8px 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.pb-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  font-size: 0.82rem;
  text-align: center;
}

.pb-ikon {
  display: inline-flex;
  flex-shrink: 0;
  opacity: 0.85;
}

.pb-pesan { line-height: 1.4; }

.pb-link {
  font-weight: 700;
  text-decoration: underline;
  opacity: 0.9;
  white-space: nowrap;
  color: inherit;
  transition: opacity 0.2s;
}
.pb-link:hover { opacity: 1; }

.pb-nav {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(255,255,255,0.2);
  border: none;
  color: inherit;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  cursor: pointer;
  line-height: 1;
  flex-shrink: 0;
  transition: background 0.2s;
}
.pb-nav:hover { background: rgba(255,255,255,0.35); }

.pb-right {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.pb-dots {
  display: flex;
  gap: 4px;
  align-items: center;
}

.pb-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgba(255,255,255,0.4);
  cursor: pointer;
  transition: background 0.2s;
}
.pb-dot.active { background: rgba(255,255,255,0.95); }

.pb-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(255,255,255,0.15);
  border: none;
  color: inherit;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  cursor: pointer;
  line-height: 1;
  flex-shrink: 0;
  transition: background 0.2s;
}
.pb-close:hover { background: rgba(255,255,255,0.3); }

@media (max-width: 640px) {
  .pb-content { font-size: 0.75rem; }
  .pb-pesan { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
}
</style>
