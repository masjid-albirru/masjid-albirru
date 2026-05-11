<script setup>
import { ref, computed, onMounted } from 'vue'

const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRcav5kMKjw3qiDvIxwCElXAsx1diknBdXPMbz_J0qh_Ki4WfoCd_HNprv_8KmiuDEja5JOPWpF_k4F/pub?gid=0&single=true&output=csv'

const data = ref([])
const loading = ref(true)
const error = ref(false)

const URUTAN_HARI = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jum\'at', 'Sabtu', 'Ahad']

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
  }).filter(r => r.hari && r.kegiatan)
}

// Group by hari, urut sesuai URUTAN_HARI
const byHari = computed(() => {
  return URUTAN_HARI
    .map(hari => ({
      hari,
      items: data.value.filter(r => r.hari === hari)
    }))
    .filter(g => g.items.length > 0)
})

// Hari ini
const hariIni = computed(() => {
  const hari = new Date().getDay()
  const map = { 1: 'Senin', 2: 'Selasa', 3: 'Rabu', 4: 'Kamis', 5: 'Jum\'at', 6: 'Sabtu', 0: 'Ahad' }
  return map[hari]
})
</script>

<template>
  <div class="kegiatan-rutin">

    <div v-if="loading" class="kr-loading">
      <span class="spinner"></span> Memuat jadwal kegiatan...
    </div>

    <div v-else-if="error" class="kr-error">
      ⚠️ Gagal memuat data. Periksa koneksi internet.
    </div>

    <div v-else-if="data.length === 0" class="kr-empty">
      Belum ada data kegiatan.
    </div>

    <template v-else>
      <div class="kr-table-wrap">
        <table class="kr-table">
          <thead>
            <tr>
              <th>Hari</th>
              <th>Waktu</th>
              <th>Kegiatan</th>
              <th>Pemateri/Pengisi</th>
              <th>Keterangan</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="grup in byHari" :key="grup.hari">
              <tr
                v-for="(item, i) in grup.items" :key="i"
                :class="{ 'kr-row--hari-ini': grup.hari === hariIni }"
              >
                <!-- Kolom hari hanya di baris pertama per grup -->
                <td v-if="i === 0" :rowspan="grup.items.length" class="kr-td-hari">
                  <span class="kr-hari-label" :class="{ 'kr-hari--aktif': grup.hari === hariIni }">
                    {{ grup.hari }}
                    <span v-if="grup.hari === hariIni" class="kr-badge-hari">Hari ini</span>
                  </span>
                </td>
                <td class="kr-td-waktu">{{ item.waktu || '—' }}</td>
                <td class="kr-td-kegiatan">{{ item.kegiatan }}</td>
                <td class="kr-td-pemateri">{{ item.pemateri || '—' }}</td>
                <td class="kr-td-ket">{{ item.keterangan || '—' }}</td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
    </template>

  </div>
</template>

<style scoped>
.kegiatan-rutin { margin: 1.5rem 0; }

.kr-loading, .kr-error, .kr-empty {
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
.kr-table-wrap {
  overflow-x: auto;
  border-radius: 10px;
  border: 1px solid var(--vp-c-divider);
}

.kr-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.kr-table th {
  background: var(--vp-c-bg-soft);
  padding: 0.65rem 1rem;
  text-align: left;
  font-weight: 600;
  font-size: 0.78rem;
  color: var(--vp-c-text-2);
  border-bottom: 1px solid var(--vp-c-divider);
  white-space: nowrap;
}

.kr-table td {
  padding: 0.65rem 1rem;
  border-bottom: 1px solid var(--vp-c-divider);
  vertical-align: middle;
}

.kr-table tbody tr:last-child td { border-bottom: none; }

.kr-row--hari-ini td {
  background: rgba(15, 107, 120, 0.05);
}

.kr-td-hari {
  font-weight: 700;
  vertical-align: top;
  white-space: nowrap;
  border-right: 2px solid var(--vp-c-divider);
}

.kr-hari-label {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.kr-hari--aktif {
  color: var(--vp-c-brand);
}

.kr-badge-hari {
  display: inline-block;
  background: var(--vp-c-brand);
  color: #fff;
  font-size: 0.6rem;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 99px;
  white-space: nowrap;
}

.kr-td-waktu    { white-space: nowrap; color: var(--vp-c-text-2); font-size: 0.82rem; }
.kr-td-kegiatan { font-weight: 600; }
.kr-td-pemateri { color: var(--vp-c-text-2); }
.kr-td-ket      { color: var(--vp-c-text-2); font-size: 0.82rem; font-style: italic; }

.kr-footer {
  text-align: center;
  font-size: 0.72rem;
  color: var(--vp-c-text-2);
  margin-top: 0.75rem;
}

@media (max-width: 640px) {
  .kr-table { font-size: 0.78rem; }
  .kr-table td, .kr-table th { padding: 0.5rem 0.6rem; }
}
</style>