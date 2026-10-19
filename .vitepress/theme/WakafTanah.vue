<script setup>
/**
 * WakafTanah — daftar wakif & setoran per wilayah untuk pemusyataan
 * Wakaf Pembebasan Tanah H. Basir oleh PR Muhammadiyah Cinangka.
 * Sumber angka: spreadsheet yang sudah dipublish, satu tab per wilayah.
 */
import { ref, computed, onMounted } from 'vue'
import {
  LandPlot, Coins, Map as PetaIcon, Receipt,
  ChevronRight, ChevronDown, CircleAlert, Loader2
} from 'lucide-vue-next'
import { muatDataWakaf, rupiah, rupiahRingkas, luasM2, HARGA_PER_M2 } from './wakafData.js'
import TombolShareWakaf from './TombolShareWakaf.vue'

const wilayah = ref([])
const rincian = ref([])
const ringkasan = ref(null)
const loading = ref(true)
const error = ref(false)

const tabAktif = ref('')
const buka = ref({})

onMounted(async () => {
  try {
    const data = await muatDataWakaf()
    wilayah.value = data.wilayah
    rincian.value = data.rincian
    ringkasan.value = data.ringkas
    // Buka wilayah dengan data paling besar supaya halaman tidak terasa kosong.
    const pertama = [...data.wilayah].sort((a, b) => b.luas - a.luas)[0]
    tabAktif.value = pertama?.nama || data.wilayah[0]?.nama || ''
  } catch {
    error.value = true
  } finally {
    loading.value = false
  }
})

const tab = computed(() =>
  wilayah.value.find(w => w.nama === tabAktif.value) || null
)

const persenSetoran = computed(() => {
  const r = ringkasan.value
  if (!r || !r.totalNilai) return 0
  return Math.min(Math.round((r.totalSetoran / r.totalNilai) * 100), 100)
})

function toggleBuka(nama, no) {
  const key = nama + '-' + no
  buka.value[key] = !buka.value[key]
}

function pilihWilayah(nama) {
  tabAktif.value = nama
}
</script>

<template>
  <div class="wt">

    <div v-if="loading" class="wt-state">
      <Loader2 :size="18" class="wt-spin" />
      Memuat data wakaf tanah...
    </div>

    <div v-else-if="error" class="wt-state">
      <CircleAlert :size="16" />
      Data wakaf tidak dapat dimuat. Periksa koneksi internet lalu muat ulang halaman.
    </div>

    <template v-else-if="ringkasan && ringkasan.totalM2 > 0">

      <!-- Ringkasan tiga angka yang paling sering dicari: luas, nilai, dan
           berapa wilayah yang sudah punya wakif. -->
      <section class="wt-ringkas">
        <div class="wt-kartu wt-kartu--luas">
          <LandPlot :size="18" class="wt-ikon" />
          <div class="wt-kartu-isi">
            <div class="wt-nilai">{{ luasM2(ringkasan.totalM2) }}</div>
            <div class="wt-label">Luas Wakaf</div>
          </div>
        </div>

        <div class="wt-kartu wt-kartu--nilai">
          <Coins :size="18" class="wt-ikon" />
          <div class="wt-kartu-isi">
            <div class="wt-nilai">{{ rupiahRingkas(ringkasan.totalNilai) }}</div>
            <div class="wt-label">Nilai Wakaf</div>
          </div>
        </div>

        <div class="wt-kartu wt-kartu--wilayah">
          <PetaIcon :size="18" class="wt-ikon" />
          <div class="wt-kartu-isi">
            <div class="wt-nilai">{{ ringkasan.wilayahAktif }} wilayah</div>
            <div class="wt-label">dari {{ ringkasan.jumlahWilayah }} wilayah program</div>
          </div>
        </div>
      </section>

      <div class="wt-setoran">
        <div class="wt-setoran-teks">
          <span class="wt-setoran-nilai">{{ rupiah(ringkasan.totalSetoran) }}</span>
          <span class="wt-setoran-sisa">terkumpul dari {{ rupiah(ringkasan.totalNilai) }} ({{ persenSetoran }}%)</span>
        </div>
        <div
          class="wt-bar"
          role="progressbar"
          :aria-valuenow="persenSetoran"
          aria-valuemin="0"
          aria-valuemax="100"
          aria-label="Progres setoran wakaf tanah"
        >
          <div class="wt-bar-isi" :style="{ width: persenSetoran + '%' }"></div>
        </div>
      </div>

      <div class="wt-aksi">
        <TombolShareWakaf :ringkasan="ringkasan" :wilayah="wilayah" />
        <p class="wt-keterangan">
          Harga wakaf {{ rupiah(HARGA_PER_M2) }} per meter persegi. Angsuran dicatat bulanan
          dari Oktober 2026.
        </p>
      </div>

      <!-- Tab wilayah -->
      <div class="wt-tabs" role="tablist" aria-label="Wilayah wakaf">
        <button
          v-for="w in wilayah"
          :key="w.nama"
          type="button"
          role="tab"
          class="wt-tab"
          :class="{ 'wt-tab--aktif': w.nama === tabAktif }"
          :aria-selected="w.nama === tabAktif"
          @click="pilihWilayah(w.nama)"
        >
          {{ w.nama }}
          <span v-if="w.luas > 0" class="wt-tab-luas">{{ luasM2(w.luas) }}</span>
        </button>
      </div>

      <!-- Isi wilayah -->
      <section v-if="tab" class="wt-panel" role="tabpanel" :aria-label="`Data wakaf ${tab.nama}`">
        <div class="wt-panel-kepala">
          <div>
            <h3 class="wt-panel-judul">{{ tab.nama }}</h3>
            <p class="wt-panel-sub">
              {{ tab.wakif.length }} wakif terdaftar
            </p>
          </div>
          <div class="wt-panel-angka">
            <span class="wt-panel-luas">{{ luasM2(tab.luas) }}</span>
            <span class="wt-panel-nilai">{{ rupiah(tab.luas * HARGA_PER_M2) }}</span>
          </div>
        </div>

        <div v-if="tab.wakif.length === 0" class="wt-kosong">
          Belum ada wakif terdaftar di wilayah {{ tab.nama }}. Daftar akan tampil
            begitu nama wakif masuk ke lembar tersebut.
        </div>

        <table v-else class="wt-tabel">
          <thead>
            <tr>
              <th class="wt-th-no">No</th>
              <th>Nama Wakif</th>
              <th class="wt-th-luas">Luas</th>
              <th class="wt-th-setoran">Setoran</th>
              <th class="wt-th-toggle">
                <span class="wt-sr">Rincian setoran bulanan</span>
              </th>
            </tr>
          </thead>
          <tbody>
            <template v-for="w in tab.wakif" :key="w.no">
              <tr class="wt-baris">
                <td class="wt-td-no">{{ w.no }}</td>
                <td class="wt-td-nama">
                  {{ w.nama }}
                  <span class="wt-luas-mobile">{{ luasM2(w.luas) }}</span>
                </td>
                <td class="wt-td-luas">{{ luasM2(w.luas) }}</td>
                <td class="wt-td-setoran">{{ rupiah(w.total) }}</td>
                <td class="wt-td-toggle">
                  <button
                    type="button"
                    class="wt-toggle"
                    :aria-expanded="!!buka[tab.nama + '-' + w.no]"
                    :aria-label="`Rincian setoran ${w.nama}`"
                    @click="toggleBuka(tab.nama, w.no)"
                  >
                    <ChevronDown v-if="buka[tab.nama + '-' + w.no]" :size="15" />
                    <ChevronRight v-else :size="15" />
                  </button>
                </td>
              </tr>
              <tr v-if="buka[tab.nama + '-' + w.no]" class="wt-baris-detail">
                <td colspan="5">
                  <div v-if="Object.keys(w.setoran).length" class="wt-bulan">
                    <span v-for="(v, b) in w.setoran" :key="b" class="wt-bulan-chip">
                      <span class="wt-bulan-nama">{{ b }}</span>
                      <span class="wt-bulan-nilai">{{ rupiah(v) }}</span>
                    </span>
                  </div>
                  <div v-else class="wt-bulan-kosong">
                    Belum ada setoran tercatat.
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </section>

      <!-- Rincian transaksi -->
      <section class="wt-panel wt-panel--transaksi">
        <h3 class="wt-panel-judul">
          <Receipt :size="17" />
          Rincian Transaksi
        </h3>

        <div v-if="rincian.length === 0" class="wt-kosong">
          Belum ada transaksi setoran yang tercatat.
        </div>

        <table v-else class="wt-tabel">
          <thead>
            <tr>
              <th>Tanggal</th>
              <th>Nama Wakif</th>
              <th class="wt-th-setoran">Jumlah</th>
              <th class="wt-th-metode">Metode</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(t, i) in rincian" :key="i" class="wt-baris">
              <td class="wt-td-tanggal">
                {{ t.tanggal }} {{ t.bulan }} {{ t.tahun }}
              </td>
              <td class="wt-td-nama">{{ t.wakif }}</td>
              <td class="wt-td-setoran">{{ rupiah(t.jumlah) }}</td>
              <td class="wt-td-metode">{{ t.metode }}</td>
            </tr>
          </tbody>
        </table>
      </section>

    </template>

    <div v-else class="wt-state wt-state--kosong">
      Belum ada data wakaf tanah yang tercatat.
    </div>
  </div>
</template>

<style scoped>
.wt { margin: 1.5rem 0; }

/* Status */
.wt-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 2rem;
  color: var(--vp-c-text-2);
  font-size: 0.9rem;
  text-align: center;
}

.wt-state--kosong {
  border: 1px dashed var(--vp-c-divider);
  border-radius: 12px;
}

.wt-spin { animation: wt-rot 0.9s linear infinite; }
@keyframes wt-rot { to { transform: rotate(360deg); } }

/* Ringkasan: tiga angka yang selalu dicari pembaca. Focal = luas (kartu pertama
   diberi treatment lebih kuat; dua lain datar). */
.wt-ringkas {
  display: grid;
  grid-template-columns: 1.4fr 1fr 1fr;
  gap: 12px;
  margin-bottom: 1.1rem;
}

.wt-kartu {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 1rem 1.25rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  background: var(--vp-c-bg);
}

.wt-kartu--luas {
  border-color: var(--teal-600);
  background: var(--vp-c-bg-soft);
}

.wt-ikon { flex-shrink: 0; color: var(--teal-600); margin-top: 2px; }
.dark .wt-ikon { color: var(--teal-400); }

.wt-kartu-isi { min-width: 0; }

.wt-nilai {
  font-size: 1.3rem;
  font-weight: 800;
  line-height: 1.15;
  color: var(--teal-700);
  font-variant-numeric: tabular-nums;
}

.dark .wt-nilai { color: var(--teal-400); }

.wt-label {
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--vp-c-text-2);
  margin-top: 2px;
}

/* Progres setoran */
.wt-setoran { margin-bottom: 1.1rem; }

.wt-setoran-teks {
  display: flex;
  align-items: baseline;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 6px;
  font-variant-numeric: tabular-nums;
}

.wt-setoran-nilai {
  font-weight: 800;
  font-size: 1rem;
  color: var(--teal-700);
}

.dark .wt-setoran-nilai { color: var(--teal-400); }

.wt-setoran-sisa {
  font-size: 0.78rem;
  color: var(--vp-c-text-2);
}

.wt-bar {
  height: 8px;
  border-radius: 99px;
  background: var(--vp-c-bg-soft);
  overflow: hidden;
}

.wt-bar-isi {
  height: 100%;
  background: var(--teal-600);
  border-radius: 99px;
  min-width: 3px;
}

/* Aksi */
.wt-aksi {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 1.5rem;
  padding-bottom: 1.25rem;
  border-bottom: 1px solid var(--vp-c-divider);
}

.wt-keterangan {
  margin: 0;
  font-size: 0.76rem;
  color: var(--vp-c-text-2);
  flex: 1;
  min-width: 200px;
  line-height: 1.5;
}

/* Tabs */
.wt-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 1rem;
}

.wt-tab {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 44px;
  padding: 7px 13px;
  font-family: inherit;
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--vp-c-text-2);
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s, border-color 0.2s, color 0.2s;
}

.wt-tab:hover { border-color: var(--teal-600); }

.wt-tab--aktif {
  color: #fff;
  background: var(--teal-700);
  border-color: var(--teal-700);
}

.dark .wt-tab--aktif { background: var(--teal-600); border-color: var(--teal-600); }

.wt-tab-luas {
  font-size: 0.7rem;
  font-weight: 600;
  opacity: 0.85;
  font-variant-numeric: tabular-nums;
}

/* Panel */
.wt-panel {
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  padding: 1.1rem 1.25rem;
  background: var(--vp-c-bg);
  margin-bottom: 1rem;
  min-width: 0;
  /* Kalau tabel memaksa lebih lebar dari panel pada layar sempit, panel
     menjadi scroll area sendiri, bukan membuat halaman overflow horizontal. */
  overflow-x: auto;
}

.wt-panel-kepala {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.85rem;
}

.wt-panel-judul {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 1.05rem;
  font-weight: 700;
  margin: 0;
  color: var(--teal-700);
}

.dark .wt-panel-judul { color: var(--teal-400); }

.wt-panel-sub {
  margin: 3px 0 0;
  font-size: 0.75rem;
  color: var(--vp-c-text-2);
}

.wt-panel-angka {
  text-align: right;
  flex-shrink: 0;
}

.wt-panel-luas {
  display: block;
  font-weight: 800;
  font-size: 1.05rem;
  color: var(--teal-700);
  font-variant-numeric: tabular-nums;
}

.dark .wt-panel-luas { color: var(--teal-400); }

.wt-panel-nilai {
  font-size: 0.75rem;
  color: var(--vp-c-text-2);
  font-variant-numeric: tabular-nums;
}

.wt-kosong {
  padding: 1.5rem;
  text-align: center;
  font-size: 0.85rem;
  color: var(--vp-c-text-2);
  border: 1px dashed var(--vp-c-divider);
  border-radius: 10px;
}

/* Tabel */
.wt-tabel {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}

.wt-tabel th {
  text-align: left;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--vp-c-text-3);
  padding: 0.4rem 0.6rem;
  border-bottom: 1px solid var(--vp-c-divider);
}

.wt-tabel td {
  padding: 0.55rem 0.6rem;
  border-bottom: 1px solid var(--vp-c-divider);
  vertical-align: middle;
}

.wt-tabel tbody tr:last-child td { border-bottom: none; }

.wt-tabel tbody tr:hover td { background: var(--vp-c-bg-soft); }

.wt-th-no, .wt-td-no { width: 2.2rem; }
.wt-td-no { color: var(--vp-c-text-3); font-variant-numeric: tabular-nums; }

.wt-td-nama { font-weight: 600; color: var(--vp-c-text-1); }

/* Di HP kolom luas disembunyikan dan pindah ke bawah nama, supaya tabel
   tetap muat tanpa scroll horizontal. */
.wt-luas-mobile { display: none; }

.wt-tab:focus-visible {
  outline: 2px solid var(--teal-600);
  outline-offset: 2px;
}

.wt-th-luas, .wt-td-luas,
.wt-th-setoran, .wt-td-setoran {
  text-align: right;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.wt-td-luas { color: var(--vp-c-text-2); }
.wt-td-setoran { font-weight: 700; color: var(--teal-700); }
.dark .wt-td-setoran { color: var(--teal-400); }

.wt-th-toggle, .wt-td-toggle { width: 3rem; }
.wt-td-toggle { text-align: right; }

.wt-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  margin: -12px -8px -12px 0;
  background: none;
  border: none;
  color: var(--vp-c-text-3);
  cursor: pointer;
  border-radius: 8px;
}

.wt-toggle:hover { background: var(--vp-c-bg-soft); color: var(--teal-600); }
.wt-toggle:focus-visible { outline: 2px solid var(--teal-600); outline-offset: -2px; }

.wt-sr {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
}

.wt-baris-detail td {
  background: var(--vp-c-bg-soft);
  padding: 0.75rem 0.9rem;
}

.wt-bulan {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.wt-bulan-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  padding: 3px 9px;
  font-size: 0.72rem;
}

.wt-bulan-nama {
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  color: var(--vp-c-text-2);
}

.wt-bulan-nilai {
  font-weight: 700;
  color: var(--teal-700);
  font-variant-numeric: tabular-nums;
}

.dark .wt-bulan-nilai { color: var(--teal-400); }

.wt-bulan-kosong {
  font-size: 0.78rem;
  color: var(--vp-c-text-2);
  font-style: italic;
}

/* Transaksi */
.wt-panel--transaksi .wt-panel-judul { margin-bottom: 0.85rem; }

.wt-td-tanggal {
  color: var(--vp-c-text-2);
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}

.wt-th-metode, .wt-td-metode {
  text-align: right;
  color: var(--vp-c-text-2);
  font-size: 0.78rem;
}

/* Mobile: kartu turun ke satu kolom, angka tetap terbaca, tabel tetap di dalam
   viewport tanpa scroll horizontal. */
@media (max-width: 640px) {
  .wt-ringkas { grid-template-columns: 1fr; }
  .wt-nilai { font-size: 1.15rem; }
  .wt-panel { padding: 1rem; }
  .wt-panel-kepala { flex-direction: column; gap: 0.35rem; }
  .wt-panel-angka { text-align: left; }
  .wt-tabel th, .wt-tabel td { padding: 0.5rem 0.45rem; font-size: 0.8rem; }
  .wt-th-luas, .wt-td-luas { display: none !important; }
  .wt-luas-mobile {
    display: block !important;
    font-size: 0.7rem;
    font-weight: 600;
    color: var(--vp-c-text-2);
    font-variant-numeric: tabular-nums;
    margin-top: 2px;
  }
  .wt-td-tanggal { white-space: normal; }
  .wt-td-nama { min-width: 0; overflow-wrap: anywhere; }
  .wt-aksi { flex-direction: column; }
  .wt-keterangan { min-width: 0; }
}
</style>