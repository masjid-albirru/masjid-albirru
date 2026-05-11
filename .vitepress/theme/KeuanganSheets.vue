<script setup>
import { ref, computed, onMounted } from 'vue'

const CSV_REKAP = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQETicf9LMmWLV_Koo1WtGao-L5BuljaABvc9GGIoQWukZ_yXJcNy7Wz03S6yy10zGxrEznRfHSK-52/pub?gid=0&single=true&output=csv'

const CSV_TAHUN = {
  '2026': 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQETicf9LMmWLV_Koo1WtGao-L5BuljaABvc9GGIoQWukZ_yXJcNy7Wz03S6yy10zGxrEznRfHSK-52/pub?gid=125761613&single=true&output=csv',
  // tambah tahun baru di sini, contoh:
  // '2027': 'https://docs.google.com/spreadsheets/d/.../pub?gid=xxx&output=csv',
}

const rekap = ref([])
const transaksi = ref([])
const loadingRekap = ref(true)
const loadingTransaksi = ref(false)
const error = ref(false)

const activeTahun = ref('2026')
const activeBulan = ref('Semua')
const activeJenis = ref('Semua')
const search = ref('')

onMounted(async () => {
  await fetchRekap()
  await fetchTransaksi(activeTahun.value)
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
  }).filter(r => Object.values(r).some(v => v !== ''))
}

async function fetchRekap() {
  try {
    const res = await fetch(CSV_REKAP)
    const text = await res.text()
    rekap.value = parseCSV(text)
  } catch {
    error.value = true
  } finally {
    loadingRekap.value = false
  }
}

async function fetchTransaksi(tahun) {
  const url = CSV_TAHUN[tahun]
  if (!url) return
  loadingTransaksi.value = true
  try {
    const res = await fetch(url)
    const text = await res.text()
    transaksi.value = parseCSV(text)
    activeBulan.value = 'Semua'
  } catch {
    error.value = true
  } finally {
    loadingTransaksi.value = false
  }
}

async function gantTahun(tahun) {
  activeTahun.value = tahun
  await fetchTransaksi(tahun)
}

// Bulan unik dari transaksi
const bulanOptions = computed(() => {
  const set = new Set(transaksi.value.map(r => r.bulan).filter(Boolean))
  return ['Semua', ...Array.from(set)]
})

// Filter transaksi
const filtered = computed(() => {
  return transaksi.value.filter(r => {
    const q = search.value.toLowerCase()
    const matchSearch = !q || r.keterangan?.toLowerCase().includes(q)
    const matchBulan  = activeBulan.value === 'Semua' || r.bulan === activeBulan.value
    const matchJenis  = activeJenis.value === 'Semua' || r.jenis?.toLowerCase() === activeJenis.value.toLowerCase()
    return matchSearch && matchBulan && matchJenis
  })
})

// Total dari filtered
const totalPemasukan = computed(() =>
  filtered.value.filter(r => r.jenis?.toLowerCase() === 'pemasukan')
    .reduce((s, r) => s + (parseFloat(r.nominal?.replace(/[^0-9.-]/g, '')) || 0), 0)
)

const totalPengeluaran = computed(() =>
  filtered.value.filter(r => r.jenis?.toLowerCase() === 'pengeluaran')
    .reduce((s, r) => s + (parseFloat(r.nominal?.replace(/[^0-9.-]/g, '')) || 0), 0)
)

const saldoAkhir = computed(() => {
  if (activeBulan.value !== 'Semua') {
    // ambil saldo terakhir di bulan itu
    const bulanData = filtered.value.filter(r => r.saldo)
    return bulanData.length ? parseFloat(bulanData[bulanData.length - 1].saldo?.replace(/[^0-9.-]/g, '')) || 0 : 0
  }
  // ambil saldo paling akhir
  const last = transaksi.value.filter(r => r.saldo).at(-1)
  return last ? parseFloat(last.saldo?.replace(/[^0-9.-]/g, '')) || 0 : 0
})

function rupiah(angka) {
  return 'Rp ' + Number(angka).toLocaleString('id-ID')
}

function formatTanggal(str) {
  if (!str) return '—'
  const d = new Date(str)
  if (isNaN(d)) return str
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}
</script>

<template>
  <div class="keuangan-sheets">

    <div v-if="error" class="ks-error">
      ⚠️ Gagal memuat data. Periksa koneksi internet.
    </div>

    <template v-else>

      <!-- ===== REKAP TAHUNAN ===== -->
      <h3 class="ks-section-title">📊 Rekap Per Bulan</h3>

      <div v-if="loadingRekap" class="ks-loading">
        <span class="spinner"></span> Memuat rekap...
      </div>

      <div v-else class="ks-rekap-wrap">
        <table class="ks-table">
          <thead>
            <tr>
              <th>Bulan</th>
              <th>Pemasukan</th>
              <th>Pengeluaran</th>
              <th>Saldo Akhir</th>
              <th>Keterangan</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(r, i) in rekap" :key="i">
              <td class="ks-td-bulan">{{ r.bulan }}</td>
              <td class="ks-masuk">{{ rupiah(r.pemasukan) }}</td>
              <td class="ks-keluar">{{ rupiah(r.pengeluaran) }}</td>
              <td class="ks-saldo">{{ rupiah(r.saldo_akhir) }}</td>
              <td class="ks-ket">{{ r.keterangan || '—' }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- ===== DETAIL TRANSAKSI ===== -->
      <h3 class="ks-section-title" style="margin-top: 2rem">📋 Detail Transaksi</h3>

      <!-- Pilih tahun -->
      <div class="ks-toolbar">
        <div class="ks-tahun-tabs">
          <button
            v-for="tahun in Object.keys(CSV_TAHUN)"
            :key="tahun"
            class="ks-tab"
            :class="{ active: activeTahun === tahun }"
            @click="gantTahun(tahun)"
          >{{ tahun }}</button>
        </div>

        <div class="ks-filters">
          <input v-model="search" class="ks-search" placeholder="🔍 Cari keterangan..." />
          <select v-model="activeBulan" class="ks-select">
            <option v-for="b in bulanOptions" :key="b">{{ b }}</option>
          </select>
          <select v-model="activeJenis" class="ks-select">
            <option>Semua</option>
            <option>Pemasukan</option>
            <option>Pengeluaran</option>
          </select>
        </div>
      </div>

      <!-- Ringkasan filter -->
      <div class="ks-summary">
        <div class="ks-sum-card ks-sum--masuk">
          <div class="ks-sum-label">Pemasukan</div>
          <div class="ks-sum-value">{{ rupiah(totalPemasukan) }}</div>
        </div>
        <div class="ks-sum-card ks-sum--keluar">
          <div class="ks-sum-label">Pengeluaran</div>
          <div class="ks-sum-value">{{ rupiah(totalPengeluaran) }}</div>
        </div>
        <div class="ks-sum-card ks-sum--saldo">
          <div class="ks-sum-label">Saldo Akhir</div>
          <div class="ks-sum-value">{{ rupiah(saldoAkhir) }}</div>
        </div>
      </div>

      <div v-if="loadingTransaksi" class="ks-loading">
        <span class="spinner"></span> Memuat transaksi...
      </div>

      <div v-else-if="filtered.length === 0" class="ks-empty">
        Tidak ada transaksi yang cocok.
      </div>

      <div v-else class="ks-rekap-wrap">
        <table class="ks-table">
          <thead>
            <tr>
              <th>Tanggal</th>
              <th>Bulan</th>
              <th>Keterangan</th>
              <th>Jenis</th>
              <th>Nominal</th>
              <th>Saldo</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(r, i) in filtered" :key="i"
              :class="r.jenis?.toLowerCase() === 'pemasukan' ? 'ks-row--masuk' : 'ks-row--keluar'"
            >
              <td class="ks-td-tgl">{{ formatTanggal(r.tanggal) }}</td>
              <td class="ks-td-bulan">{{ r.bulan }}</td>
              <td>{{ r.keterangan }}</td>
              <td>
                <span class="ks-jenis-badge" :class="r.jenis?.toLowerCase() === 'pemasukan' ? 'ks-jenis--masuk' : 'ks-jenis--keluar'">
                  {{ r.jenis?.toLowerCase() === 'pemasukan' ? '↑' : '↓' }} {{ r.jenis }}
                </span>
              </td>
              <td :class="r.jenis?.toLowerCase() === 'pemasukan' ? 'ks-masuk' : 'ks-keluar'">
                {{ rupiah(r.nominal) }}
              </td>
              <td class="ks-saldo">{{ rupiah(r.saldo) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="ks-footer">
        Menampilkan {{ filtered.length }} transaksi ·
        Data diperbarui otomatis dari Google Sheets
      </div>

    </template>
  </div>
</template>

<style scoped>
.keuangan-sheets { margin: 1.5rem 0; }

.ks-section-title {
  font-size: 1rem;
  font-weight: 700;
  margin: 0 0 1rem;
}

.ks-loading, .ks-empty, .ks-error {
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

/* Rekap table */
.ks-rekap-wrap {
  overflow-x: auto;
  border-radius: 10px;
  border: 1px solid var(--vp-c-divider);
  margin-bottom: 1rem;
}

.ks-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.ks-table th {
  background: var(--vp-c-bg-soft);
  padding: 0.65rem 1rem;
  text-align: left;
  font-weight: 600;
  font-size: 0.78rem;
  color: var(--vp-c-text-2);
  border-bottom: 1px solid var(--vp-c-divider);
  white-space: nowrap;
}

.ks-table td {
  padding: 0.65rem 1rem;
  border-bottom: 1px solid var(--vp-c-divider);
  vertical-align: middle;
}

.ks-table tbody tr:last-child td { border-bottom: none; }
.ks-table tbody tr:hover td { background: var(--vp-c-bg-soft); }

.ks-td-bulan { font-weight: 600; white-space: nowrap; }
.ks-td-tgl   { white-space: nowrap; color: var(--vp-c-text-2); font-size: 0.82rem; }
.ks-ket      { color: var(--vp-c-text-2); font-size: 0.82rem; font-style: italic; }
.ks-masuk    { color: #16a34a; font-weight: 600; font-variant-numeric: tabular-nums; white-space: nowrap; }
.ks-keluar   { color: #dc2626; font-weight: 600; font-variant-numeric: tabular-nums; white-space: nowrap; }
.ks-saldo    { font-variant-numeric: tabular-nums; white-space: nowrap; font-weight: 500; }

.ks-row--masuk td  { background: rgba(34,197,94,0.03); }
.ks-row--keluar td { background: rgba(239,68,68,0.03); }

.ks-jenis-badge {
  font-size: 0.72rem;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 99px;
  white-space: nowrap;
}
.ks-jenis--masuk  { background: rgba(34,197,94,0.1);  color: #16a34a; }
.ks-jenis--keluar { background: rgba(239,68,68,0.1);  color: #dc2626; }

/* Toolbar */
.ks-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 1rem;
}

.ks-tahun-tabs {
  display: flex;
  gap: 6px;
}

.ks-tab {
  padding: 5px 14px;
  border-radius: 8px;
  border: 1.5px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
  color: var(--vp-c-text-2);
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.ks-tab:hover { border-color: var(--vp-c-brand); color: var(--vp-c-brand); }
.ks-tab.active { background: var(--vp-c-brand); border-color: var(--vp-c-brand); color: #fff; }

.ks-filters {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.ks-search {
  padding: 6px 10px;
  border-radius: 8px;
  border: 1.5px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  font-size: 0.82rem;
  min-width: 180px;
}

.ks-search:focus { outline: none; border-color: var(--vp-c-brand); }

.ks-select {
  padding: 6px 10px;
  border-radius: 8px;
  border: 1.5px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  font-size: 0.82rem;
  cursor: pointer;
}

/* Summary cards */
.ks-summary {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 1rem;
}

.ks-sum-card {
  padding: 0.75rem 1rem;
  border-radius: 10px;
  border: 1px solid var(--vp-c-divider);
}

.ks-sum-label {
  font-size: 0.72rem;
  font-weight: 600;
  opacity: 0.7;
  margin-bottom: 2px;
}

.ks-sum-value {
  font-size: 1rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.ks-sum--masuk  { background: rgba(34,197,94,0.08);  }
.ks-sum--masuk  .ks-sum-value { color: #16a34a; }
.ks-sum--keluar { background: rgba(239,68,68,0.08);  }
.ks-sum--keluar .ks-sum-value { color: #dc2626; }
.ks-sum--saldo  { background: rgba(15,107,120,0.08); }
.ks-sum--saldo  .ks-sum-value { color: var(--vp-c-brand); }

/* Footer */
.ks-footer {
  text-align: center;
  font-size: 0.72rem;
  color: var(--vp-c-text-2);
  margin-top: 0.75rem;
}

/* Mobile */
@media (max-width: 640px) {
  .ks-summary { grid-template-columns: 1fr; }
  .ks-toolbar { flex-direction: column; align-items: flex-start; }
  .ks-search { min-width: 100%; }
}
</style>