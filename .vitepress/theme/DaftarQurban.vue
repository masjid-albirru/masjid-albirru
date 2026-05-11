<script setup>
import { ref, computed, onMounted } from 'vue'

const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQaKEyByjvn6DX0SFqozsV11R8Sg-U-R7VP570NcYNUgvVaaF_JhUBGXuusNGGqQmeZW3WObiXSvRcd/pub?gid=0&single=true&output=csv'

const data = ref([])
const loading = ref(true)
const error = ref(false)
const search = ref('')
const filterStatus = ref('Semua')
const filterHewan = ref('Semua')

onMounted(async () => {
  try {
    const res = await fetch(CSV_URL)
    const text = await res.text()
    data.value = parseCSV(text)
  } catch (e) {
    error.value = true
  } finally {
    loading.value = false
  }
})

function parseCSV(text) {
  const lines = text.trim().split('\n')
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
  return lines.slice(1).map(line => {
    // Handle quoted fields dengan koma di dalamnya
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
    headers.forEach((h, i) => { row[h] = cols[i] ?? '' })
    return row
  }).filter(r => r.nama && r.nama.trim() !== '')
}

// Statistik
const totalSapi = computed(() => data.value.filter(r => r.jenis_hewan?.toLowerCase().includes('sapi')).length)
const totalKambing = computed(() => data.value.filter(r => r.jenis_hewan?.toLowerCase().includes('kambing')).length)
const totalLunas = computed(() => data.value.filter(r => r.status?.toLowerCase() === 'lunas').length)

// Opsi filter unik
const statusOptions = computed(() => {
  const set = new Set(data.value.map(r => r.status).filter(Boolean))
  return ['Semua', ...Array.from(set)]
})

const hewanOptions = computed(() => {
  const set = new Set(data.value.map(r => r.jenis_hewan).filter(Boolean))
  return ['Semua', ...Array.from(set)]
})

// Filter + search
const filtered = computed(() => {
  return data.value.filter(r => {
    const q = search.value.toLowerCase()
    const matchSearch = !q ||
      r.nama?.toLowerCase().includes(q) ||
      r.atas_nama?.toLowerCase().includes(q)
    const matchStatus = filterStatus.value === 'Semua' || r.status === filterStatus.value
    const matchHewan  = filterHewan.value  === 'Semua' || r.jenis_hewan === filterHewan.value
    return matchSearch && matchStatus && matchHewan
  })
})

const statusStyle = {
  'Lunas':    { bg: 'rgba(34,197,94,0.1)',   color: '#16a34a' },
  'DP':       { bg: 'rgba(234,179,8,0.12)',  color: '#92400e' },
  'Menunggu': { bg: 'rgba(100,100,100,0.1)', color: '#666'    },
}

function getStatusStyle(status) {
  return statusStyle[status] ?? { bg: 'rgba(100,100,100,0.1)', color: '#666' }
}

const hewanIcon = (hewan) => hewan?.toLowerCase().includes('sapi') ? '🐄' : '🐑'
</script>

<template>
  <div class="daftar-qurban">

    <!-- Loading -->
    <div v-if="loading" class="dq-loading">
      <span class="spinner"></span> Memuat daftar qurban...
    </div>

    <!-- Error -->
    <div v-else-if="error" class="dq-error">
      ⚠️ Gagal memuat data. Periksa koneksi internet atau coba lagi.
    </div>

    <template v-else>

      <!-- Statistik -->
      <div class="dq-stats">
        <div class="dq-stat">
          <div class="dq-stat-value">{{ data.length }}</div>
          <div class="dq-stat-label">Total Shohibul Qurban</div>
        </div>
        <div class="dq-stat">
          <div class="dq-stat-value">🐄 {{ totalSapi }}</div>
          <div class="dq-stat-label">Sapi</div>
        </div>
        <div class="dq-stat">
          <div class="dq-stat-value">🐑 {{ totalKambing }}</div>
          <div class="dq-stat-label">Kambing</div>
        </div>
        <div class="dq-stat">
          <div class="dq-stat-value">{{ totalLunas }}</div>
          <div class="dq-stat-label">Sudah Lunas</div>
        </div>
      </div>

      <!-- Filter & Search -->
      <div class="dq-filters">
        <input
          v-model="search"
          class="dq-search"
          type="text"
          placeholder="🔍 Cari nama atau atas nama..."
        />
        <select v-model="filterHewan" class="dq-select">
          <option v-for="h in hewanOptions" :key="h">{{ h }}</option>
        </select>
        <select v-model="filterStatus" class="dq-select">
          <option v-for="s in statusOptions" :key="s">{{ s }}</option>
        </select>
      </div>

      <!-- Tidak ada hasil -->
      <div v-if="filtered.length === 0" class="dq-empty">
        Tidak ada data yang cocok dengan pencarian.
      </div>

      <!-- Tabel -->
      <div v-else class="dq-table-wrap">
        <table class="dq-table">
          <thead>
            <tr>
              <th>No</th>
              <th>Nama Shohibul Qurban</th>
              <th>Atas Nama</th>
              <th>Hewan</th>
              <th>Jumlah</th>
              <th>Status</th>
              <th>Catatan</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, i) in filtered" :key="i">
              <td class="dq-no">{{ row.no || i + 1 }}</td>
              <td class="dq-nama">{{ row.nama }}</td>
              <td class="dq-atas">{{ row.atas_nama || '—' }}</td>
              <td class="dq-hewan">
                {{ hewanIcon(row.jenis_hewan) }} {{ row.jenis_hewan }}
              </td>
              <td class="dq-jumlah">{{ row.jumlah }}</td>
              <td>
                <span
                  class="dq-status"
                  :style="{ background: getStatusStyle(row.status).bg, color: getStatusStyle(row.status).color }"
                >
                  {{ row.status || '—' }}
                </span>
              </td>
              <td class="dq-catatan">{{ row.catatan || '—' }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="dq-footer">
        Menampilkan {{ filtered.length }} dari {{ data.length }} peserta ·
        Data diperbarui otomatis dari Google Sheets
      </div>

    </template>
  </div>
</template>

<style scoped>
.daftar-qurban { margin: 1.5rem 0; }

/* Loading & Error */
.dq-loading, .dq-error, .dq-empty {
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

/* Statistik */
.dq-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 1.25rem;
}

.dq-stat {
  text-align: center;
  padding: 1rem;
  background: var(--vp-c-bg-soft);
  border-radius: 10px;
  border: 1px solid var(--vp-c-divider);
}

.dq-stat-value {
  font-size: 1.4rem;
  font-weight: 800;
  color: var(--vp-c-brand);
  line-height: 1;
  margin-bottom: 4px;
}

.dq-stat-label {
  font-size: 0.72rem;
  color: var(--vp-c-text-2);
  font-weight: 600;
}

/* Filters */
.dq-filters {
  display: flex;
  gap: 10px;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.dq-search {
  flex: 1;
  min-width: 200px;
  padding: 7px 12px;
  border-radius: 8px;
  border: 1.5px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  font-size: 0.85rem;
}

.dq-search:focus {
  outline: none;
  border-color: var(--vp-c-brand);
}

.dq-select {
  padding: 7px 10px;
  border-radius: 8px;
  border: 1.5px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  font-size: 0.82rem;
  cursor: pointer;
}

/* Table */
.dq-table-wrap {
  overflow-x: auto;
  border-radius: 10px;
  border: 1px solid var(--vp-c-divider);
}

.dq-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.dq-table th {
  background: var(--vp-c-bg-soft);
  padding: 0.65rem 1rem;
  text-align: left;
  font-weight: 600;
  font-size: 0.78rem;
  color: var(--vp-c-text-2);
  border-bottom: 1px solid var(--vp-c-divider);
  white-space: nowrap;
}

.dq-table td {
  padding: 0.65rem 1rem;
  border-bottom: 1px solid var(--vp-c-divider);
  vertical-align: middle;
}

.dq-table tbody tr:last-child td { border-bottom: none; }
.dq-table tbody tr:hover td { background: var(--vp-c-bg-soft); }

.dq-no      { color: var(--vp-c-text-2); font-size: 0.8rem; width: 40px; }
.dq-nama    { font-weight: 600; }
.dq-atas    { color: var(--vp-c-text-2); font-size: 0.85rem; }
.dq-hewan   { white-space: nowrap; }
.dq-jumlah  { text-align: center; font-weight: 600; }
.dq-catatan { color: var(--vp-c-text-2); font-size: 0.82rem; font-style: italic; }

.dq-status {
  font-size: 0.72rem;
  font-weight: 700;
  padding: 2px 10px;
  border-radius: 99px;
  white-space: nowrap;
}

/* Footer */
.dq-footer {
  text-align: center;
  font-size: 0.72rem;
  color: var(--vp-c-text-2);
  margin-top: 0.75rem;
}

/* Mobile */
@media (max-width: 640px) {
  .dq-stats { grid-template-columns: repeat(2, 1fr); }
  .dq-search { min-width: 100%; }
}
</style>