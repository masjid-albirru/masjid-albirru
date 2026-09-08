<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Wallet, Users, Layers, BadgeCheck, Beef, Drumstick,
  ChevronRight, ChevronDown, CircleAlert, Loader2
} from 'lucide-vue-next'

// ============================================================
// DATA TABUNGAN QURBAN — dikelola lewat GOOGLE SHEETS
// Sapi: gid=0 · Kambing: gid=1591452287 (spreadsheet yang sama)
// Update angka cukup lewat spreadsheet, halaman menarik otomatis.
// ============================================================
const SHEET_BASE = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQI4qLTRQGU5bREmlIGpUCitTLUVAjb1A8FDRLcCbp8LwKk9ACuqtgXaxYPYPycxjUKXSEN8bJSW1g3/pub'
const SHEET_SAPI    = `${SHEET_BASE}?gid=0&single=true&output=csv`
const SHEET_KAMBING = `${SHEET_BASE}?gid=1591452287&single=true&output=csv`

const grupSapi = ref([])
const grupKambing = ref([])
const loading = ref(true)
const error = ref(false)
const expanded = ref({})

onMounted(async () => {
  try {
    const [sapi, kambing] = await Promise.all([
      fetch(SHEET_SAPI).then(r => r.text()),
      fetch(SHEET_KAMBING).then(r => r.text()),
    ])
    grupSapi.value = parseTabungan(sapi)
    grupKambing.value = parseTabungan(kambing, 'Kambing')
  } catch {
    error.value = true
  } finally {
    loading.value = false
  }
})

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

function angka(v) {
  // Terima "Rp1,400,000", "400000", "Rp0", kosong
  const n = parseInt(String(v ?? '').replace(/[^0-9-]/g, ''), 10)
  return isNaN(n) ? 0 : n
}

// Parse buku tabungan: baris judul kelompok, header NO/NAMA,
// label bulan, lalu baris peserta.
function parseTabungan(text, namaGrupDefault) {
  const lines = text.trim().split(/\r?\n/).map(splitCSVLine)
  const groups = []
  let g = null
  let bulan = []
  let totalIdx = -1

  for (const cols of lines) {
    const c0 = (cols[0] || '').trim()
    const c1 = (cols[1] || '').trim()

    // Baris judul kelompok: "A. KELOMPOK 1 (7 JUTA)"
    // Angka dalam kurung = target PER ORANG
    const mGrup = c0.match(/^[A-Za-z]\.\s*(.+)$/)
    if (mGrup && !/^\d+$/.test(c0)) {
      const label = mGrup[1].trim()
      const mTarget = label.match(/\((\d+)\s*JUTA\)/i)
      g = { nama: label, perOrang: mTarget ? parseInt(mTarget[1], 10) * 1e6 : null, peserta: [] }
      groups.push(g)
      bulan = []
      totalIdx = -1
      continue
    }

    // Baris header "NO,NAMA,BULAN...TOTAL"
    if (c0.toUpperCase() === 'NO' && c1.toUpperCase() === 'NAMA') {
      if (!g) { g = { nama: namaGrupDefault, perOrang: null, peserta: [] }; groups.push(g) }
      totalIdx = cols.findIndex(c => c.toUpperCase() === 'TOTAL')
      bulan = []
      continue
    }

    // Baris label bulan: kolom0&1 kosong, kolom2+ nama bulan
    if (!c0 && !c1 && totalIdx > 0) {
      bulan = cols.slice(2, totalIdx).map(c => c.trim()).filter(Boolean)
      continue
    }

    // Baris peserta: kolom0 = nomor, kolom1 = nama
    if (/^\d+$/.test(c0) && c1 && g) {
      const nilai = {}
      bulan.forEach((b, i) => { nilai[b] = angka(cols[2 + i]) })
      const total = totalIdx >= 0 ? angka(cols[totalIdx]) : angka(cols[cols.length - 1])
      g.peserta.push({ no: parseInt(c0, 10), nama: c1, nilai, total })
    }
  }
  return groups
}

function rupiah(n) {
  return 'Rp ' + Number(n).toLocaleString('id-ID')
}

function terkumpul(gr) {
  return gr.peserta.reduce((s, p) => s + p.total, 0)
}

// Target kelompok = target per orang × 7 slot
function targetGrup(gr) {
  return gr.perOrang ? gr.perOrang * 7 : null
}

function progress(gr) {
  const t = targetGrup(gr)
  if (!t) return 0
  return Math.min(Math.round((terkumpul(gr) / t) * 100), 100)
}

// Lunas = total setoran mencapai target per orang
function isLunas(p, gr) {
  return gr.perOrang !== null && p.total >= gr.perOrang
}

function bulanBayar(p) {
  return Object.entries(p.nilai).filter(([, v]) => v > 0)
}

function toggle(key) {
  expanded.value[key] = !expanded.value[key]
}

// Statistik gabungan
const totalDana = computed(() =>
  [...grupSapi.value, ...grupKambing.value].reduce((s, gr) => s + terkumpul(gr), 0)
)

const totalPeserta = computed(() =>
  [...grupSapi.value, ...grupKambing.value].reduce((s, gr) => s + gr.peserta.length, 0)
)

const totalKelompok = computed(() =>
  grupSapi.value.length + grupKambing.value.length
)

const totalLunas = computed(() =>
  [...grupSapi.value, ...grupKambing.value]
    .reduce((s, gr) => s + gr.peserta.filter(p => isLunas(p, gr)).length, 0)
)
</script>

<template>
  <div class="daftar-qurban">

    <!-- Loading -->
    <div v-if="loading" class="dq-loading">
      <Loader2 :size="18" class="dq-spin" />
      Memuat data tabungan qurban...
    </div>

    <!-- Error -->
    <div v-else-if="error" class="dq-error">
      <CircleAlert :size="16" />
      Gagal memuat data. Periksa koneksi internet lalu muat ulang halaman.
    </div>

    <template v-else>

      <!-- Statistik -->
      <div class="dq-stats">
        <div class="dq-stat">
          <Wallet :size="18" class="dq-stat-icon" />
          <div>
            <div class="dq-stat-value">{{ rupiah(totalDana) }}</div>
            <div class="dq-stat-label">Total Dana Terkumpul</div>
          </div>
        </div>
        <div class="dq-stat">
          <Users :size="18" class="dq-stat-icon" />
          <div>
            <div class="dq-stat-value">{{ totalPeserta }}</div>
            <div class="dq-stat-label">Peserta Terisi</div>
          </div>
        </div>
        <div class="dq-stat">
          <Layers :size="18" class="dq-stat-icon" />
          <div>
            <div class="dq-stat-value">{{ totalKelompok }}</div>
            <div class="dq-stat-label">Kelompok</div>
          </div>
        </div>
        <div class="dq-stat">
          <BadgeCheck :size="18" class="dq-stat-icon" />
          <div>
            <div class="dq-stat-value">{{ totalLunas }}</div>
            <div class="dq-stat-label">Sudah Lunas</div>
          </div>
        </div>
      </div>

      <!-- SAPI -->
      <section class="dq-section">
        <h3 class="dq-section-title">
          <Beef :size="18" />
          Sapi
        </h3>

        <div v-if="grupSapi.length === 0" class="dq-empty">
          Belum ada data kelompok sapi.
        </div>

        <div v-for="(gr, gi) in grupSapi" :key="gi" class="dq-group">
          <div class="dq-group-head">
            <div>
              <div class="dq-group-nama">{{ gr.nama }}</div>
              <div v-if="gr.perOrang" class="dq-group-target">
                {{ rupiah(gr.perOrang) }} / orang &middot; target kelompok {{ rupiah(targetGrup(gr)) }}
              </div>
            </div>
            <div class="dq-group-total">
              <span class="dq-group-terkumpul">{{ rupiah(terkumpul(gr)) }}</span>
              <span v-if="gr.perOrang" class="dq-group-persen">{{ progress(gr) }}%</span>
            </div>
          </div>

          <div v-if="gr.perOrang" class="dq-bar">
            <div class="dq-bar-fill" :style="{ width: progress(gr) + '%' }"></div>
          </div>

          <table class="dq-table">
            <thead>
              <tr>
                <th class="dq-th-no">No</th>
                <th>Nama</th>
                <th class="dq-th-total">Total</th>
                <th class="dq-th-status">Status</th>
                <th class="dq-th-toggle"><span class="visually-hidden">Rincian</span></th>
              </tr>
            </thead>
            <tbody>
              <template v-for="p in gr.peserta" :key="p.no">
                <tr
                  class="dq-row"
                  :class="{ 'dq-row--open': expanded[gi + '-' + p.no] }"
                  @click="toggle(gi + '-' + p.no)"
                >
                  <td class="dq-td-no">{{ p.no }}</td>
                  <td class="dq-td-nama">{{ p.nama }}</td>
                  <td class="dq-td-total">{{ rupiah(p.total) }}</td>
                  <td class="dq-td-status">
                    <span v-if="isLunas(p, gr)" class="dq-lunas">
                      <BadgeCheck :size="13" />
                      Lunas
                    </span>
                  </td>
                  <td class="dq-td-toggle">
                    <ChevronDown v-if="expanded[gi + '-' + p.no]" :size="15" />
                    <ChevronRight v-else :size="15" />
                  </td>
                </tr>
                <tr v-if="expanded[gi + '-' + p.no]" class="dq-detail-row">
                  <td :colspan="5">
                    <div v-if="bulanBayar(p).length" class="dq-bulan">
                      <span v-for="[b, v] in bulanBayar(p)" :key="b" class="dq-bulan-chip">
                        <span class="dq-bulan-nama">{{ b }}</span>
                        <span class="dq-bulan-nilai">{{ rupiah(v) }}</span>
                      </span>
                    </div>
                    <div v-else class="dq-bulan-kosong">
                      Belum ada setoran tercatat.
                    </div>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
      </section>

      <!-- KAMBING -->
      <section class="dq-section">
        <h3 class="dq-section-title">
          <Drumstick :size="18" />
          Kambing
        </h3>

        <div v-if="grupKambing.length === 0" class="dq-empty">
          Belum ada data kambing.
        </div>

        <div v-for="(gr, gi) in grupKambing" :key="'k' + gi" class="dq-group">
          <div class="dq-group-head">
            <div>
              <div class="dq-group-nama">{{ gr.nama }}</div>
              <div v-if="gr.perOrang" class="dq-group-target">
                {{ rupiah(gr.perOrang) }} / orang &middot; target kelompok {{ rupiah(targetGrup(gr)) }}
              </div>
            </div>
            <div class="dq-group-total">
              <span class="dq-group-terkumpul">{{ rupiah(terkumpul(gr)) }}</span>
            </div>
          </div>

          <table class="dq-table">
            <thead>
              <tr>
                <th class="dq-th-no">No</th>
                <th>Nama</th>
                <th class="dq-th-total">Total</th>
                <th class="dq-th-status">Status</th>
                <th class="dq-th-toggle"><span class="visually-hidden">Rincian</span></th>
              </tr>
            </thead>
            <tbody>
              <template v-for="p in gr.peserta" :key="p.no">
                <tr
                  class="dq-row"
                  :class="{ 'dq-row--open': expanded['k' + gi + '-' + p.no] }"
                  @click="toggle('k' + gi + '-' + p.no)"
                >
                  <td class="dq-td-no">{{ p.no }}</td>
                  <td class="dq-td-nama">{{ p.nama }}</td>
                  <td class="dq-td-total">{{ rupiah(p.total) }}</td>
                  <td class="dq-td-status"></td>
                  <td class="dq-td-toggle">
                    <ChevronDown v-if="expanded['k' + gi + '-' + p.no]" :size="15" />
                    <ChevronRight v-else :size="15" />
                  </td>
                </tr>
                <tr v-if="expanded['k' + gi + '-' + p.no]" class="dq-detail-row">
                  <td :colspan="5">
                    <div v-if="bulanBayar(p).length" class="dq-bulan">
                      <span v-for="[b, v] in bulanBayar(p)" :key="b" class="dq-bulan-chip">
                        <span class="dq-bulan-nama">{{ b }}</span>
                        <span class="dq-bulan-nilai">{{ rupiah(v) }}</span>
                      </span>
                    </div>
                    <div v-else class="dq-bulan-kosong">
                      Belum ada setoran tercatat.
                    </div>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
      </section>

      <div class="dq-footer">
        Data diperbarui otomatis dari Google Sheets
      </div>

    </template>
  </div>
</template>

<style scoped>
.daftar-qurban { margin: 1.5rem 0; }

/* Loading & error */
.dq-loading, .dq-error, .dq-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  text-align: center;
  padding: 2rem;
  color: var(--vp-c-text-2);
  font-size: 0.9rem;
}

.dq-empty {
  border: 1px dashed var(--vp-c-divider);
  border-radius: 12px;
}

.dq-spin { animation: dq-rot 0.9s linear infinite; }
@keyframes dq-rot { to { transform: rotate(360deg); } }

/* Statistik */
.dq-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 1.75rem;
}

.dq-stat {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 1rem;
  background: var(--vp-c-bg-soft);
  border-radius: 10px;
  border: 1px solid var(--vp-c-divider);
}

.dq-stat-icon { flex-shrink: 0; color: var(--teal-600); }

.dq-stat-value {
  font-size: 1.15rem;
  font-weight: 800;
  color: var(--vp-c-brand);
  line-height: 1.1;
  margin-bottom: 2px;
  font-variant-numeric: tabular-nums;
}

.dq-stat-label {
  font-size: 0.7rem;
  color: var(--vp-c-text-2);
  font-weight: 600;
}

/* Section */
.dq-section { margin-bottom: 2rem; }

.dq-section-title {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 1.05rem;
  font-weight: 700;
  margin: 0 0 1rem;
  color: var(--teal-700);
}

.dq-section-title svg { color: var(--teal-600); }

/* Grup */
.dq-group {
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  padding: 1.1rem 1.25rem;
  margin-bottom: 1rem;
  background: var(--vp-c-bg);
}

.dq-group-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 0.75rem;
}

.dq-group-nama {
  font-weight: 700;
  font-size: 0.95rem;
  line-height: 1.3;
  color: var(--vp-c-text-1);
}

.dq-group-target {
  font-size: 0.72rem;
  color: var(--vp-c-text-2);
  margin-top: 2px;
}

.dq-group-total {
  text-align: right;
  flex-shrink: 0;
}

.dq-group-terkumpul {
  display: block;
  font-weight: 800;
  font-size: 1rem;
  color: var(--teal-700);
  font-variant-numeric: tabular-nums;
}

.dark .dq-group-terkumpul { color: var(--teal-400); }

.dq-group-persen {
  font-size: 0.72rem;
  color: var(--vp-c-text-2);
}

/* Progress bar */
.dq-bar {
  height: 6px;
  background: var(--vp-c-bg-soft);
  border-radius: 99px;
  overflow: hidden;
  margin-bottom: 0.9rem;
}

.dq-bar-fill {
  height: 100%;
  background: var(--teal-600);
  border-radius: 99px;
}

/* Tabel */
.dq-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}

.dq-table th {
  text-align: left;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--vp-c-text-3);
  padding: 0.4rem 0.6rem;
  border-bottom: 1px solid var(--vp-c-divider);
}

.dq-table td {
  padding: 0.55rem 0.6rem;
  border-bottom: 1px solid var(--vp-c-divider);
  vertical-align: middle;
}

.dq-table tbody tr:last-child td { border-bottom: none; }

.dq-th-no, .dq-td-no { width: 2.2rem; }
.dq-td-no { color: var(--vp-c-text-3); font-variant-numeric: tabular-nums; }

.dq-td-nama { font-weight: 600; color: var(--vp-c-text-1); }

.dq-th-total, .dq-td-total {
  text-align: right;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.dq-td-total { font-weight: 700; color: var(--teal-700); }
.dark .dq-td-total { color: var(--teal-400); }

.dq-th-status, .dq-th-toggle { width: 4.2rem; }
.dq-td-status, .dq-td-toggle { text-align: right; }

.dq-th-toggle .visually-hidden {
  position: absolute;
  width: 1px; height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
}

/* Baris peserta bisa diklik */
.dq-row { cursor: pointer; }
.dq-row:hover td { background: var(--vp-c-bg-soft); }
.dq-row--open td { background: var(--vp-c-bg-soft); }

.dq-td-toggle svg { color: var(--vp-c-text-3); }

/* Badge lunas */
.dq-lunas {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.68rem;
  font-weight: 700;
  color: #16a34a;
  background: rgba(34, 197, 94, 0.1);
  padding: 2px 8px;
  border-radius: 99px;
  white-space: nowrap;
}

/* Baris detail bulanan */
.dq-detail-row td {
  background: var(--vp-c-bg-soft);
  padding: 0.75rem 0.9rem;
}

.dq-bulan {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.dq-bulan-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  padding: 3px 9px;
  font-size: 0.72rem;
}

.dq-bulan-nama {
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  color: var(--vp-c-text-2);
}

.dq-bulan-nilai {
  font-weight: 700;
  color: var(--teal-700);
  font-variant-numeric: tabular-nums;
}

.dark .dq-bulan-nilai { color: var(--teal-400); }

.dq-bulan-kosong {
  font-size: 0.78rem;
  color: var(--vp-c-text-2);
  font-style: italic;
}

.dq-footer {
  text-align: center;
  font-size: 0.72rem;
  color: var(--vp-c-text-3);
  margin-top: 1.25rem;
}

/* Mobile */
@media (max-width: 640px) {
  .dq-stats { grid-template-columns: repeat(2, 1fr); }
  .dq-stat-value { font-size: 1rem; }
  .dq-group { padding: 1rem; }
  .dq-group-head { flex-direction: column; gap: 0.35rem; }
  .dq-group-total { text-align: left; }
  .dq-table th, .dq-table td { padding: 0.5rem 0.45rem; }
  .dq-th-status, .dq-td-status { display: none; }
}
</style>
