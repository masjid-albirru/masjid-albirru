<script setup>
import { ref, computed, onMounted } from 'vue'
import { useData } from 'vitepress'

const { site } = useData()

const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRcqzrQ3Ybt3LkWQfzC7uqzG-Byn_u1SzRIkBpFJ4kC5eR7qYbry5YTHauQrH-Q4WXXFC-yMvWVamN8/pub?gid=0&single=true&output=csv'

const data = ref([])
const loading = ref(true)
const error = ref(false)

const activeTab = ref('Akan Datang')
const activeTipe = ref('Semua Tipe')

onMounted(async () => {
  try {
    const res = await fetch(CSV_URL)
    const text = await res.text()
    data.value = parseCSV(text)
  } catch {
    error.value = true
  } finally {
    loading.value = false
  }
})

function parseCSV(text) {
  const lines = text.trim().split('\n')
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
  const sekarang = new Date(); sekarang.setHours(0,0,0,0)

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

    const tanggal = new Date(row.tanggal); tanggal.setHours(0,0,0,0)
    row.sudah_lewat = tanggal < sekarang
    return row
  }).filter(r => r.tanggal && r.nama_acara)
    .sort((a, b) => new Date(a.tanggal) - new Date(b.tanggal))
}

const TAB_OPTIONS = ['Akan Datang', 'Sudah Lewat', 'Semua']

const tipeOptions = computed(() => {
  const set = new Set(data.value.map(r => r.tipe).filter(Boolean))
  return ['Semua Tipe', ...Array.from(set)]
})

const mendatangCount = computed(() => data.value.filter(r => !r.sudah_lewat).length)

const filtered = computed(() => {
  let list = data.value

  if (activeTab.value === 'Akan Datang') list = list.filter(r => !r.sudah_lewat)
  else if (activeTab.value === 'Sudah Lewat') list = list.filter(r => r.sudah_lewat).reverse()

  if (activeTipe.value !== 'Semua Tipe') list = list.filter(r => r.tipe === activeTipe.value)

  return list
})

function formatTanggal(str) {
  const d = new Date(str)
  return {
    hari: d.toLocaleDateString('id-ID', { weekday: 'long' }),
    tanggal: d.getDate(),
    bulan: d.toLocaleDateString('id-ID', { month: 'short' }),
    tahun: d.getFullYear(),
  }
}

function hariLagi(str) {
  const today = new Date(); today.setHours(0,0,0,0)
  const target = new Date(str); target.setHours(0,0,0,0)
  const diff = Math.round((target - today) / (1000 * 60 * 60 * 24))
  if (diff === 0) return '🟢 Hari ini!'
  if (diff === 1) return '⏰ Besok'
  if (diff <= 7) return `⏳ ${diff} hari lagi`
  return null
}

const tipeWarna = {
  Kajian:    { bg: 'rgba(15,107,120,0.1)',  text: '#0f6b78' },
  Pengajian: { bg: 'rgba(15,107,120,0.1)',  text: '#0f6b78' },
  Rapat:     { bg: 'rgba(100,100,100,0.1)', text: '#666' },
  Lomba:     { bg: 'rgba(234,179,8,0.12)',  text: '#92400e' },
  Sosial:    { bg: 'rgba(34,197,94,0.1)',   text: '#16a34a' },
  Lainnya:   { bg: 'rgba(100,100,100,0.1)', text: '#666' },
}

const terbukaBadge = {
  'Ya':                  { label: 'Terbuka Umum',    warna: '#16a34a' },
  'Tidak (Jamaah saja)': { label: 'Jamaah Masjid',   warna: '#0f6b78' },
  'Khusus Muslimah':     { label: 'Khusus Muslimah', warna: '#9333ea' },
}
</script>

<template>
  <div class="acara-list">

    <div v-if="loading" class="al-loading">
      <span class="spinner"></span> Memuat jadwal acara...
    </div>

    <div v-else-if="error" class="al-error">
      ⚠️ Gagal memuat data. Periksa koneksi internet.
    </div>

    <template v-else>
      <!-- Tabs & Filter -->
      <div class="al-tabs">
        <button
          v-for="tab in TAB_OPTIONS" :key="tab"
          class="al-tab"
          :class="{ active: activeTab === tab }"
          @click="activeTab = tab"
        >
          {{ tab }}
          <span v-if="tab === 'Akan Datang' && mendatangCount > 0" class="al-badge">
            {{ mendatangCount }}
          </span>
        </button>

        <select class="al-select" v-model="activeTipe">
          <option v-for="t in tipeOptions" :key="t">{{ t }}</option>
        </select>
      </div>

      <!-- Kosong -->
      <div v-if="data.length === 0" class="al-empty">
        Belum ada acara. Tambahkan di Google Sheets.
      </div>
      <div v-else-if="filtered.length === 0" class="al-empty">
        Tidak ada acara {{ activeTab === 'Akan Datang' ? 'mendatang' : 'yang sudah lewat' }}
        {{ activeTipe !== 'Semua Tipe' ? 'untuk tipe ' + activeTipe : '' }}.
      </div>

      <!-- Daftar -->
      <div v-else class="al-grid">
        <div
          v-for="(a, i) in filtered" :key="i"
          class="al-card"
          :class="{ 'al-card--lewat': a.sudah_lewat }"
        >
          <!-- Tanggal -->
          <div class="al-date">
            <div class="al-date-day">{{ formatTanggal(a.tanggal).tanggal }}</div>
            <div class="al-date-month">{{ formatTanggal(a.tanggal).bulan }}</div>
            <div class="al-date-year">{{ formatTanggal(a.tanggal).tahun }}</div>
          </div>

          <!-- Konten -->
          <div class="al-content">
            <div class="al-meta">
              <span
                class="al-tipe"
                :style="{ background: tipeWarna[a.tipe]?.bg ?? 'rgba(100,100,100,0.1)', color: tipeWarna[a.tipe]?.text ?? '#666' }"
              >{{ a.tipe }}</span>

              <span
                v-if="terbukaBadge[a.terbuka_umum]"
                class="al-terbuka"
                :style="{ color: terbukaBadge[a.terbuka_umum].warna }"
              >● {{ terbukaBadge[a.terbuka_umum].label }}</span>

              <span v-if="!a.sudah_lewat && hariLagi(a.tanggal)" class="al-countdown">
                {{ hariLagi(a.tanggal) }}
              </span>
            </div>

            <h3 class="al-title">{{ a.nama_acara }}</h3>

            <div class="al-info">
              <span v-if="a.waktu_mulai">
                🕐 {{ a.waktu_mulai }}{{ a.waktu_selesai ? ' - ' + a.waktu_selesai : '' }} WIB
              </span>
              <span v-if="a.lokasi">📍 {{ a.lokasi }}</span>
              <span v-if="a.pemateri">🎤 {{ a.pemateri }}</span>
            </div>

            <p v-if="a.keterangan" class="al-desc">{{ a.keterangan }}</p>

            <div class="al-footer">
              <span class="al-hari">{{ formatTanggal(a.tanggal).hari }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="al-sheets-footer">
        {{ filtered.length }} acara ditampilkan
      </div>
    </template>
  </div>
</template>

<style scoped>
.al-loading, .al-error, .al-empty {
  text-align: center;
  padding: 2.5rem;
  color: var(--vp-c-text-2);
  font-size: 0.9rem;
}

.spinner {
  display: inline-block;
  width: 14px; height: 14px;
  border: 2px solid var(--vp-c-divider);
  border-top-color: var(--vp-c-brand);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  vertical-align: middle;
  margin-right: 6px;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* Tabs */
.al-tabs {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.al-tab {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 16px;
  border-radius: 8px;
  border: 1.5px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
  color: var(--vp-c-text-2);
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.al-tab:hover { border-color: var(--vp-c-brand); color: var(--vp-c-brand); }
.al-tab.active { background: var(--vp-c-brand); border-color: var(--vp-c-brand); color: #fff; }

.al-badge {
  background: rgba(255,255,255,0.3);
  font-size: 0.7rem;
  padding: 1px 6px;
  border-radius: 99px;
  font-weight: 700;
}
.al-tab:not(.active) .al-badge { background: var(--vp-c-brand); color: #fff; }

.al-select {
  margin-left: auto;
  padding: 6px 10px;
  border-radius: 8px;
  border: 1.5px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  font-size: 0.82rem;
  cursor: pointer;
}

/* Grid */
.al-grid { display: flex; flex-direction: column; gap: 1rem; }

/* Card */
.al-card {
  display: flex;
  gap: 1.25rem;
  padding: 1.25rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  background: var(--vp-c-bg);
  transition: box-shadow 0.2s, border-color 0.2s;
}

.al-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.07); border-color: var(--vp-c-brand-light); }
.al-card--lewat { opacity: 0.6; }

/* Date box */
.al-date {
  flex-shrink: 0;
  width: 56px;
  text-align: center;
  background: linear-gradient(135deg, #0f6b78, #0a4a54);
  color: #fff;
  border-radius: 10px;
  padding: 8px 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.al-date-day   { font-size: 1.6rem; font-weight: 800; line-height: 1; }
.al-date-month { font-size: 0.7rem; font-weight: 600; opacity: 0.85; text-transform: uppercase; }
.al-date-year  { font-size: 0.62rem; opacity: 0.65; margin-top: 2px; }

/* Content */
.al-content { flex: 1; min-width: 0; }

.al-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-bottom: 0.4rem;
}

.al-tipe {
  font-size: 0.7rem;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 99px;
}

.al-terbuka { font-size: 0.72rem; font-weight: 600; }
.al-countdown { font-size: 0.72rem; font-weight: 700; color: var(--vp-c-brand); }

.al-title {
  margin: 0 0 0.4rem;
  font-size: 1rem;
  font-weight: 700;
  line-height: 1.4;
  color: var(--vp-c-text-1);
}

.al-info {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  font-size: 0.78rem;
  color: var(--vp-c-text-2);
  margin-bottom: 0.4rem;
}

.al-desc {
  font-size: 0.82rem;
  color: var(--vp-c-text-2);
  margin: 0 0 0.5rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.al-footer { display: flex; justify-content: space-between; align-items: center; }
.al-hari { font-size: 0.75rem; color: var(--vp-c-text-2); text-transform: capitalize; }

.al-sheets-footer {
  text-align: center;
  font-size: 0.72rem;
  color: var(--vp-c-text-2);
  margin-top: 0.75rem;
}

@media (max-width: 640px) {
  .al-card { gap: 0.75rem; }
  .al-date { width: 48px; }
  .al-date-day { font-size: 1.3rem; }
  .al-select { margin-left: 0; width: 100%; }
}
</style>