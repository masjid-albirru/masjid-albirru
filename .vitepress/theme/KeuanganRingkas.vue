<script setup>
import { ref, onMounted } from 'vue'

const CSV_REKAP = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQETicf9LMmWLV_Koo1WtGao-L5BuljaABvc9GGIoQWukZ_yXJcNy7Wz03S6yy10zGxrEznRfHSK-52/pub?gid=0&single=true&output=csv'

const pemasukan = ref(0)
const pengeluaran = ref(0)
const saldo = ref(0)
const loading = ref(true)
const error = ref(false)

onMounted(async () => {
  try {
    const res = await fetch(CSV_REKAP)
    const text = await res.text()
    const rows = parseCSV(text)

    // Jumlahkan semua baris rekap
    rows.forEach(r => {
      pemasukan.value   += toAngka(r.pemasukan)
      pengeluaran.value += toAngka(r.pengeluaran)
    })

    // Saldo akhir = saldo_akhir baris terakhir
    const last = rows.filter(r => r.saldo_akhir).at(-1)
    saldo.value = last ? toAngka(last.saldo_akhir) : pemasukan.value - pengeluaran.value

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
    const cols = line.split(',').map(c => c.trim().replace(/"/g, ''))
    const row = {}
    headers.forEach((h, i) => { row[h] = cols[i] ?? '' })
    return row
  }).filter(r => Object.values(r).some(v => v !== ''))
}

function toAngka(str) {
  return parseFloat((str ?? '').replace(/[^0-9.-]/g, '')) || 0
}

function rupiah(angka) {
  return 'Rp ' + Number(angka).toLocaleString('id-ID')
}
</script>

<template>
  <div class="keu-ringkas">
    <div v-if="loading" class="kr-loading">Memuat data keuangan...</div>
    <div v-else-if="error" class="kr-error">⚠️ Gagal memuat data</div>
    <template v-else>
      <div class="kr-cards">
        <div class="kr-card kr-masuk">
          <div class="kr-label">Pemasukan</div>
          <div class="kr-value">{{ rupiah(pemasukan) }}</div>
        </div>
        <div class="kr-card kr-keluar">
          <div class="kr-label">Pengeluaran</div>
          <div class="kr-value">{{ rupiah(pengeluaran) }}</div>
        </div>
        <div class="kr-card kr-saldo">
          <div class="kr-label">Saldo Akhir</div>
          <div class="kr-value">{{ rupiah(saldo) }}</div>
        </div>
      </div>
      <div class="kr-footer">
        <a href="/masjid-albirru/keuangan/">Lihat laporan lengkap →</a>
      </div>
    </template>
  </div>
</template>

<style scoped>
.keu-ringkas { margin: 1rem 0; }

.kr-loading, .kr-error {
  text-align: center;
  color: var(--vp-c-text-2);
  font-size: 0.85rem;
  padding: 1rem;
}

.kr-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.kr-card {
  padding: 1rem 1.25rem;
  border-radius: 12px;
  border: 1px solid var(--vp-c-divider);
}

.kr-label {
  font-size: 0.75rem;
  font-weight: 600;
  opacity: 0.7;
  margin-bottom: 4px;
}

.kr-value {
  font-size: 1.15rem;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
}

.kr-masuk  { background: rgba(34,197,94,0.08); }
.kr-masuk  .kr-value { color: #16a34a; }
.kr-keluar { background: rgba(239,68,68,0.08); }
.kr-keluar .kr-value { color: #dc2626; }
.kr-saldo  { background: rgba(15,107,120,0.08); }
.kr-saldo  .kr-value { color: var(--vp-c-brand); }

.kr-footer {
  text-align: right;
  margin-top: 0.5rem;
  font-size: 0.78rem;
}

.kr-footer a {
  color: var(--vp-c-brand);
  text-decoration: none;
  font-weight: 600;
}

.kr-footer a:hover { opacity: 0.75; }

@media (max-width: 640px) {
  .kr-cards { grid-template-columns: 1fr; }
}
</style>