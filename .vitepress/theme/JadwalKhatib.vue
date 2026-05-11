<script setup>
import { ref, computed, onMounted } from 'vue'

const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQVpTzZUDk9wpJi-AeS_iVKZsZr_xOWhD-1kft0DRegMjS94PuDhfszzI7o5Deo2UJJJDyt7tG8WbHr/pub?gid=0&single=true&output=csv'

const data = ref([])
const loading = ref(true)
const error = ref(false)

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

    const t = new Date(row.tanggal); t.setHours(0,0,0,0)
    row.sudah_lewat = t < sekarang
    return row
  })
  .filter(r => r.tanggal && r.khatib)
  .sort((a, b) => new Date(a.tanggal) - new Date(b.tanggal))
}

// Cari Jum'at terdekat
function getJumatTerdekat() {
  const d = new Date()
  const selisih = (5 - d.getDay() + 7) % 7
  const jumat = new Date(d)
  jumat.setDate(d.getDate() + selisih)
  jumat.setHours(0,0,0,0)
  return jumat
}

const jumatTerdekat = getJumatTerdekat()

const mendatang = computed(() => data.value.filter(r => !r.sudah_lewat))
const lewat     = computed(() => [...data.value.filter(r => r.sudah_lewat)].reverse())

const khatibIni = computed(() => {
  if (!mendatang.value.length) return null
  const t = new Date(mendatang.value[0].tanggal); t.setHours(0,0,0,0)
  return t.getTime() === jumatTerdekat.getTime() ? mendatang.value[0] : null
})

function isJumatIni(str) {
  const t = new Date(str); t.setHours(0,0,0,0)
  return t.getTime() === jumatTerdekat.getTime()
}

function formatTanggal(str) {
  return new Date(str).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric'
  })
}
</script>

<template>
  <div class="jadwal-khatib">

    <div v-if="loading" class="jk-loading">
      <span class="spinner"></span> Memuat jadwal khatib...
    </div>

    <div v-else-if="error" class="jk-error">
      ⚠️ Gagal memuat data. Periksa koneksi internet.
    </div>

    <template v-else-if="data.length === 0">
      <div class="jk-empty">Belum ada jadwal khatib. Tambahkan di Google Sheets.</div>
    </template>

    <template v-else>

      <!-- Highlight Khatib Jum'at Ini -->
      <div v-if="khatibIni" class="jk-highlight">
        <div class="jk-highlight-label">🕌 Khatib Jum'at Ini</div>
        <div class="jk-highlight-khatib">{{ khatibIni.khatib }}</div>
        <div v-if="khatibIni.tema" class="jk-highlight-tema">"{{ khatibIni.tema }}"</div>
        <div class="jk-highlight-tanggal">{{ formatTanggal(khatibIni.tanggal) }}</div>
      </div>

      <!-- Mendatang -->
      <h3 class="jk-section-title">📅 Jadwal Mendatang</h3>

      <div v-if="mendatang.length === 0" class="jk-empty-small">
        Belum ada jadwal mendatang.
      </div>

      <div v-else class="jk-table-wrap">
        <table class="jk-table">
          <thead>
            <tr>
              <th>Tanggal</th>
              <th>Khatib</th>
              <th>Tema Khutbah</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(k, i) in mendatang" :key="i"
              :class="{ 'jk-row--ini': isJumatIni(k.tanggal) }"
            >
              <td class="jk-td-tanggal">
                {{ formatTanggal(k.tanggal) }}
                <span v-if="isJumatIni(k.tanggal)" class="jk-badge-ini">Jum'at Ini</span>
              </td>
              <td class="jk-td-khatib">{{ k.khatib }}</td>
              <td class="jk-td-tema">{{ k.tema || '—' }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Arsip -->
      <details v-if="lewat.length > 0" class="jk-lewat">
        <summary class="jk-lewat-toggle">
          📜 Arsip Jadwal Khatib ({{ lewat.length }} entri)
        </summary>
        <div class="jk-table-wrap">
          <table class="jk-table jk-table--lewat">
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Khatib</th>
                <th>Tema Khutbah</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(k, i) in lewat" :key="i">
                <td class="jk-td-tanggal">{{ formatTanggal(k.tanggal) }}</td>
                <td class="jk-td-khatib">{{ k.khatib }}</td>
                <td class="jk-td-tema">{{ k.tema || '—' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </details>

      <div class="jk-footer">
        Data diperbarui otomatis
      </div>

    </template>
  </div>
</template>

<style scoped>
.jadwal-khatib { margin: 1.5rem 0; }

.jk-loading, .jk-error, .jk-empty, .jk-empty-small {
  text-align: center;
  padding: 2rem;
  color: var(--vp-c-text-2);
  font-size: 0.88rem;
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

/* Highlight */
.jk-highlight {
  background: linear-gradient(135deg, #0f6b78, #0a4a54);
  color: #fff;
  border-radius: 14px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  text-align: center;
}

.jk-highlight-label {
  font-size: 0.8rem;
  font-weight: 600;
  opacity: 0.75;
  margin-bottom: 0.4rem;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.jk-highlight-khatib {
  font-size: 1.6rem;
  font-weight: 800;
  margin-bottom: 0.3rem;
}

.jk-highlight-tema {
  font-size: 0.9rem;
  opacity: 0.85;
  font-style: italic;
  margin-bottom: 0.3rem;
}

.jk-highlight-tanggal {
  font-size: 0.78rem;
  opacity: 0.65;
}

/* Section title */
.jk-section-title {
  font-size: 1rem;
  font-weight: 700;
  margin: 0 0 1rem;
}

/* Table */
.jk-table-wrap {
  overflow-x: auto;
  border-radius: 10px;
  border: 1px solid var(--vp-c-divider);
  margin-bottom: 1.5rem;
}

.jk-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.jk-table th {
  background: var(--vp-c-bg-soft);
  padding: 0.65rem 1rem;
  text-align: left;
  font-weight: 600;
  font-size: 0.78rem;
  color: var(--vp-c-text-2);
  border-bottom: 1px solid var(--vp-c-divider);
  white-space: nowrap;
}

.jk-table td {
  padding: 0.65rem 1rem;
  border-bottom: 1px solid var(--vp-c-divider);
  vertical-align: middle;
}

.jk-table tbody tr:last-child td { border-bottom: none; }
.jk-table tbody tr:hover td { background: var(--vp-c-bg-soft); }

.jk-row--ini td { background: rgba(15,107,120,0.06); }

.jk-td-tanggal { white-space: nowrap; font-weight: 500; }
.jk-td-khatib  { font-weight: 600; }
.jk-td-tema    { color: var(--vp-c-text-2); font-style: italic; }

.jk-badge-ini {
  display: inline-block;
  margin-left: 6px;
  background: var(--vp-c-brand);
  color: #fff;
  font-size: 0.62rem;
  font-weight: 700;
  padding: 1px 7px;
  border-radius: 99px;
  vertical-align: middle;
}

/* Arsip */
.jk-lewat { margin-top: 0.5rem; }

.jk-lewat-toggle {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--vp-c-text-2);
  cursor: pointer;
  padding: 0.5rem 0;
  list-style: none;
  user-select: none;
}

.jk-lewat-toggle:hover { color: var(--vp-c-brand); }
.jk-table--lewat { opacity: 0.7; }

/* Footer */
.jk-footer {
  text-align: center;
  font-size: 0.72rem;
  color: var(--vp-c-text-2);
  margin-top: 0.5rem;
}
</style>