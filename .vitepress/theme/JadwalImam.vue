<script setup>
import { ref, computed, onMounted } from 'vue'

const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSoGbucPkGTHeUqqI3_p5QkoYe1EqeV_0GIyHoulMMa2AZ9snYmOsO-Ulo-xENW-2_-qyO_kSic3_Wz/pub?gid=0&single=true&output=csv'

const data = ref([])
const loading = ref(true)
const error = ref(false)

const URUTAN_HARI = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jum\'at', 'Sabtu', 'Ahad']

onMounted(async () => {
  try {
    const res = await fetch(CSV_URL)
    if (!res.ok) throw new Error('fetch gagal')
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
  if (lines.length < 2) return []
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, '').toLowerCase())
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
    headers.forEach((h, i) => { row[h] = (cols[i] ?? '').replace(/"/g, '').trim() })
    return {
      hari: row['hari'] ?? '',
      subuh: row['subuh'] ?? '',
      maghrib: row['maghrib'] ?? '',
      isya: row['isya'] ?? '',
      piket: row['piket imam rawatib'] ?? '',
      muadzin: row['muadzin'] ?? '',
    }
  }).filter(r => r.hari)
}

const terurut = computed(() => {
  return URUTAN_HARI
    .map(hari => data.value.find(r => r.hari === hari))
    .filter(Boolean)
})

const hariIni = computed(() => {
  const hari = new Date().getDay()
  const map = { 1: 'Senin', 2: 'Selasa', 3: 'Rabu', 4: 'Kamis', 5: 'Jum\'at', 6: 'Sabtu', 0: 'Ahad' }
  return map[hari]
})

function sel(str) {
  return str || '—'
}
</script>

<template>
  <div class="jadwal-imam">

    <div v-if="loading" class="ji-loading">
      <span class="spinner"></span> Memuat jadwal imam...
    </div>

    <div v-else-if="error" class="ji-error">
      Gagal memuat data. Periksa koneksi internet.
    </div>

    <div v-else-if="terurut.length === 0" class="ji-empty">
      Belum ada data jadwal imam.
    </div>

    <template v-else>
      <div class="ji-table-wrap">
        <table class="ji-table">
          <thead>
            <tr>
              <th>Hari</th>
              <th>Subuh</th>
              <th>Maghrib</th>
              <th>Isya</th>
              <th>Piket Imam Rawatib</th>
              <th>Muadzin</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="item in terurut" :key="item.hari"
              :class="{ 'ji-row--hari-ini': item.hari === hariIni }"
            >
              <td class="ji-td-hari">
                <span class="ji-hari-label" :class="{ 'ji-hari--aktif': item.hari === hariIni }">
                  {{ item.hari }}
                  <span v-if="item.hari === hariIni" class="ji-badge-hari">Hari ini</span>
                </span>
              </td>
              <td class="ji-td-nama">{{ sel(item.subuh) }}</td>
              <td class="ji-td-nama">{{ sel(item.maghrib) }}</td>
              <td class="ji-td-nama">{{ sel(item.isya) }}</td>
              <td class="ji-td-piket">{{ sel(item.piket) }}</td>
              <td class="ji-td-muadzin">{{ sel(item.muadzin) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="ji-footer">
        Data diperbarui otomatis.
      </div>
    </template>

  </div>
</template>

<style scoped>
.jadwal-imam { margin: 1.5rem 0; }

.ji-loading, .ji-error, .ji-empty {
  text-align: center;
  padding: 2rem;
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

/* Table */
.ji-table-wrap {
  overflow-x: auto;
  border-radius: 10px;
  border: 1px solid var(--vp-c-divider);
}

.ji-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.ji-table th {
  background: var(--vp-c-bg-soft);
  padding: 0.65rem 1rem;
  text-align: left;
  font-weight: 600;
  font-size: 0.78rem;
  color: var(--vp-c-text-2);
  border-bottom: 1px solid var(--vp-c-divider);
  white-space: nowrap;
}

.ji-table td {
  padding: 0.65rem 1rem;
  border-bottom: 1px solid var(--vp-c-divider);
  vertical-align: middle;
}

.ji-table tbody tr:last-child td { border-bottom: none; }

.ji-row--hari-ini td {
  background: rgba(15, 107, 120, 0.05);
}

.ji-td-hari {
  font-weight: 700;
  white-space: nowrap;
  border-right: 2px solid var(--vp-c-divider);
}

.ji-hari-label {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.ji-hari--aktif {
  color: var(--vp-c-brand);
}

.ji-badge-hari {
  display: inline-block;
  background: var(--vp-c-brand);
  color: #fff;
  font-size: 0.6rem;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 99px;
  white-space: nowrap;
}

.ji-td-nama   { font-weight: 600; white-space: nowrap; }
.ji-td-piket  { color: var(--vp-c-text-2); white-space: nowrap; }
.ji-td-muadzin { color: var(--vp-c-text-2); white-space: nowrap; }

.ji-footer {
  text-align: center;
  font-size: 0.72rem;
  color: var(--vp-c-text-2);
  margin-top: 0.75rem;
}

@media (max-width: 640px) {
  .ji-table { font-size: 0.78rem; }
  .ji-table td, .ji-table th { padding: 0.5rem 0.6rem; }
}
</style>
