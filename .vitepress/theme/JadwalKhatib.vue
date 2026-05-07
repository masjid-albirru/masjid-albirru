<script setup>
import { computed } from 'vue'
import { useData } from 'vitepress'
import { data as khatib } from '../../docs/khatib/khatib.data.ts'

const { site } = useData()

function url(path) {
  return site.value.base + path.replace(/^\//, '')
}

const sekarang = new Date()
sekarang.setHours(0, 0, 0, 0)

// Cari Jum'at terdekat
function getJumatTerdekat() {
  const d = new Date()
  const hari = d.getDay() // 0=Ahad, 5=Jumat
  const selisih = (5 - hari + 7) % 7
  const jumat = new Date(d)
  jumat.setDate(d.getDate() + selisih)
  jumat.setHours(0, 0, 0, 0)
  return jumat
}

const jumatTerdekat = getJumatTerdekat()

// Split mendatang & lewat
const mendatang = computed(() =>
  khatib.filter(k => {
    const t = new Date(k.tanggal); t.setHours(0,0,0,0)
    return t >= sekarang
  })
)

const lewat = computed(() =>
  khatib.filter(k => {
    const t = new Date(k.tanggal); t.setHours(0,0,0,0)
    return t < sekarang
  }).reverse() // terbaru dulu
)

function formatTanggal(str) {
  return new Date(str).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric'
  })
}

function isJumatIni(str) {
  const t = new Date(str); t.setHours(0,0,0,0)
  return t.getTime() === jumatTerdekat.getTime()
}
</script>

<template>
  <div class="jadwal-khatib">

    <div v-if="khatib.length === 0" class="jk-empty">
      Belum ada jadwal khatib. Tambahkan melalui Decap CMS.
    </div>

    <template v-else>

      <!-- Khatib Jum'at ini -->
      <div v-if="mendatang.length > 0 && isJumatIni(mendatang[0].tanggal)" class="jk-highlight">
        <div class="jk-highlight-label">🕌 Khatib Jum'at Ini</div>
        <div class="jk-highlight-khatib">{{ mendatang[0].khatib }}</div>
        <div v-if="mendatang[0].tema" class="jk-highlight-tema">
          "{{ mendatang[0].tema }}"
        </div>
        <div class="jk-highlight-tanggal">{{ formatTanggal(mendatang[0].tanggal) }}</div>
      </div>

      <!-- Tabel Mendatang -->
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
              v-for="k in mendatang" :key="k.tanggal"
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

      <!-- Tabel Lewat (collapsible) -->
      <details v-if="lewat.length > 0" class="jk-lewat">
        <summary class="jk-lewat-toggle">📜 Arsip Jadwal Khatib ({{ lewat.length }} entri)</summary>
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
              <tr v-for="k in lewat" :key="k.tanggal">
                <td class="jk-td-tanggal">{{ formatTanggal(k.tanggal) }}</td>
                <td class="jk-td-khatib">{{ k.khatib }}</td>
                <td class="jk-td-tema">{{ k.tema || '—' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </details>

    </template>
  </div>
</template>

<style scoped>
.jadwal-khatib { margin: 1.5rem 0; }

/* Highlight khatib minggu ini */
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

.jk-row--ini td { background: rgba(15, 107, 120, 0.06); }

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

/* Empty */
.jk-empty, .jk-empty-small {
  text-align: center;
  color: var(--vp-c-text-2);
  padding: 2rem;
  font-size: 0.88rem;
}
</style>