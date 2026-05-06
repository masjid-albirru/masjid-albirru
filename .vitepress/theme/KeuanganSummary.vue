<script setup>
import { computed } from 'vue'
import { data as laporan } from '../../docs/keuangan/keuangan.data.ts'

const namaBulan = [
  '', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
]

// Tahun yang tersedia (urutan desc)
const tahunList = computed(() => {
  const set = new Set(laporan.map(l => l.tahun))
  return Array.from(set).sort((a, b) => b - a)
})

// Grouping by tahun
const byTahun = computed(() => {
  return tahunList.value.map(tahun => {
    const items = laporan.filter(l => l.tahun === tahun)
    const totalPemasukan   = items.reduce((s, l) => s + (l.pemasukan ?? 0), 0)
    const totalPengeluaran = items.reduce((s, l) => s + (l.pengeluaran ?? 0), 0)
    const saldoAkhir = items[0]?.saldo_akhir ?? (totalPemasukan - totalPengeluaran)
    return { tahun, items, totalPemasukan, totalPengeluaran, saldoAkhir }
  })
})

function rupiah(angka) {
  if (angka == null) return '—'
  return 'Rp ' + Number(angka).toLocaleString('id-ID')
}

function selisih(p, pengeluaran) {
  const val = (p ?? 0) - (pengeluaran ?? 0)
  return { nilai: rupiah(Math.abs(val)), positif: val >= 0 }
}
</script>

<template>
  <div class="keuangan-summary">

    <div v-if="laporan.length === 0" class="ks-empty">
      Belum ada laporan keuangan. Tambahkan melalui Decap CMS.
    </div>

    <div v-for="grup in byTahun" :key="grup.tahun" class="ks-tahun">

      <!-- Ringkasan tahunan -->
      <h3 class="ks-tahun-title">📊 Ringkasan {{ grup.tahun }}</h3>
      <div class="ks-cards">
        <div class="ks-card ks-card--masuk">
          <div class="ks-card-label">Total Pemasukan</div>
          <div class="ks-card-value">{{ rupiah(grup.totalPemasukan) }}</div>
        </div>
        <div class="ks-card ks-card--keluar">
          <div class="ks-card-label">Total Pengeluaran</div>
          <div class="ks-card-value">{{ rupiah(grup.totalPengeluaran) }}</div>
        </div>
        <div class="ks-card ks-card--saldo">
          <div class="ks-card-label">Saldo Akhir</div>
          <div class="ks-card-value">{{ rupiah(grup.saldoAkhir) }}</div>
        </div>
      </div>

      <!-- Tabel laporan bulanan -->
      <div class="ks-table-wrap">
        <table class="ks-table">
          <thead>
            <tr>
              <th>Bulan</th>
              <th>Pemasukan</th>
              <th>Pengeluaran</th>
              <th>Surplus/Defisit</th>
              <th>Saldo Akhir</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="lap in grup.items" :key="lap.link">
              <td class="ks-bulan">{{ namaBulan[lap.bulan] }}</td>
              <td class="ks-angka ks-masuk">{{ rupiah(lap.pemasukan) }}</td>
              <td class="ks-angka ks-keluar">{{ rupiah(lap.pengeluaran) }}</td>
              <td class="ks-angka" :class="selisih(lap.pemasukan, lap.pengeluaran).positif ? 'ks-surplus' : 'ks-defisit'">
                {{ selisih(lap.pemasukan, lap.pengeluaran).positif ? '+' : '-' }}
                {{ selisih(lap.pemasukan, lap.pengeluaran).nilai }}
              </td>
              <td class="ks-angka">{{ rupiah(lap.saldo_akhir) }}</td>
              <td>
                <span class="ks-status" :class="lap.status === 'berjalan' ? 'ks-status--berjalan' : 'ks-status--selesai'">
                  {{ lap.status === 'berjalan' ? '🔄 Berjalan' : '✅ Selesai' }}
                </span>
              </td>
              <td>
                <a :href="lap.link" class="ks-link">Detail →</a>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

    </div>
  </div>
</template>

<style scoped>
.keuangan-summary {
  margin: 1.5rem 0;
}

.ks-empty {
  text-align: center;
  color: var(--vp-c-text-2);
  padding: 2rem;
}

.ks-tahun {
  margin-bottom: 2.5rem;
}

.ks-tahun-title {
  font-size: 1.1rem;
  font-weight: 700;
  margin-bottom: 1rem;
  color: var(--vp-c-text-1);
}

/* Cards */
.ks-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 1.25rem;
}

.ks-card {
  border-radius: 12px;
  padding: 1rem 1.25rem;
  border: 1px solid var(--vp-c-divider);
}

.ks-card-label {
  font-size: 0.75rem;
  font-weight: 600;
  opacity: 0.7;
  margin-bottom: 4px;
}

.ks-card-value {
  font-size: 1.1rem;
  font-weight: 700;
}

.ks-card--masuk  { background: rgba(34, 197, 94, 0.08);  border-color: rgba(34, 197, 94, 0.2); }
.ks-card--keluar { background: rgba(239, 68, 68, 0.08);  border-color: rgba(239, 68, 68, 0.2); }
.ks-card--saldo  { background: rgba(15, 107, 120, 0.08); border-color: rgba(15, 107, 120, 0.2); }

.ks-card--masuk  .ks-card-value { color: #16a34a; }
.ks-card--keluar .ks-card-value { color: #dc2626; }
.ks-card--saldo  .ks-card-value { color: var(--vp-c-brand); }

/* Table */
.ks-table-wrap {
  overflow-x: auto;
  border-radius: 10px;
  border: 1px solid var(--vp-c-divider);
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

.ks-table tbody tr:last-child td {
  border-bottom: none;
}

.ks-table tbody tr:hover td {
  background: var(--vp-c-bg-soft);
}

.ks-bulan { font-weight: 600; }

.ks-angka { font-variant-numeric: tabular-nums; white-space: nowrap; }
.ks-masuk   { color: #16a34a; }
.ks-keluar  { color: #dc2626; }
.ks-surplus { color: #16a34a; font-weight: 600; }
.ks-defisit { color: #dc2626; font-weight: 600; }

.ks-status {
  font-size: 0.72rem;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 20px;
  white-space: nowrap;
}

.ks-status--selesai  { background: rgba(34, 197, 94, 0.1);  color: #16a34a; }
.ks-status--berjalan { background: rgba(234, 179, 8, 0.1);  color: #ca8a04; }

.ks-link {
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--vp-c-brand);
  text-decoration: none;
  white-space: nowrap;
}

.ks-link:hover { opacity: 0.75; }

/* Mobile */
@media (max-width: 640px) {
  .ks-cards { grid-template-columns: 1fr; }
  .ks-card-value { font-size: 1rem; }
}
</style>