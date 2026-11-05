<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { RefreshCw, Inbox, CloudOff } from 'lucide-vue-next'
import { muatDataKeuangan, rupiah, formatTanggal, formatKuantitas } from './keuanganData.js'

// Data baru diambil ulang tiap 5 menit supaya laporan yang diubah bendahara
// langsung terlihat tanpa perlu deploy ulang situs.
const SELANG_POLLING = 5 * 60 * 1000

const data = ref(null)
const memuat = ref(true)
const galat = ref('')
const aktif = ref('operasional')
const tabRefs = ref([])

const program = computed(
  () => data.value?.programs.find(p => p.id === aktif.value) ?? null
)

const adaData = computed(() => data.value != null && !galat.value)

async function muat() {
  memuat.value = true
  galat.value = ''
  try {
    const hasil = await muatDataKeuangan()
    data.value = hasil
    if (hasil.ringkasan.gagal === hasil.ringkasan.program) {
      galat.value = 'Tidak ada tab spreadsheet yang bisa dibaca.'
    }
  } catch (e) {
    galat.value = e?.message || 'Gagal menghubungi Google Sheets.'
  } finally {
    memuat.value = false
  }
}

let timer = null

function mulaiPolling() {
  hentikanPolling()
  timer = setInterval(() => {
    if (!document.hidden) muat()
  }, SELANG_POLLING)
}

function hentikanPolling() {
  if (timer) { clearInterval(timer); timer = null }
}

// Tab browser yang lama ditinggal sering menahan timer, jadi saat kembali
// ke halaman data dicek ulang bila sudah lewat satu siklus polling.
function saatTerlihat() {
  if (document.hidden || !data.value) return
  if (Date.now() - data.value.waktu.getTime() > SELANG_POLLING) muat()
}

onMounted(() => {
  muat()
  mulaiPolling()
  document.addEventListener('visibilitychange', saatTerlihat)
})

onUnmounted(() => {
  hentikanPolling()
  document.removeEventListener('visibilitychange', saatTerlihat)
})

function pilihTab(e, i) {
  const total = data.value?.programs.length ?? 0
  if (!total) return
  let tujuan = -1
  if (e.key === 'ArrowRight') tujuan = (i + 1) % total
  else if (e.key === 'ArrowLeft') tujuan = (i - 1 + total) % total
  else if (e.key === 'Home') tujuan = 0
  else if (e.key === 'End') tujuan = total - 1
  if (tujuan < 0) return
  e.preventDefault()
  aktif.value = data.value.programs[tujuan].id
  tabRefs.value[tujuan]?.focus()
}

/** Nilai sel tabel zakat/kampung, sesuai tipe kolomnya. */
function sel(nilai, tipe) {
  if (nilai == null) return '—'
  if (tipe === 'kuantitas') return formatKuantitas(nilai)
  if (tipe === 'jumlah') return Number(nilai).toLocaleString('id-ID')
  return rupiah(nilai)
}

function subtotalBulan(bulan) {
  const p = program.value
  if (!p) return 0
  return p.subtotal?.[bulan]
    ?? p.pemasukan.filter(r => r.bulan === bulan).reduce((s, r) => s + r.jumlah, 0)
}

const jamMuat = computed(() => {
  if (!data.value) return ''
  return data.value.waktu.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
})
</script>

<template>
  <div class="keu">
    <div v-if="memuat && !data" class="keu-status">
      <span class="keu-spinner" aria-hidden="true"></span>
      Memuat data keuangan dari Google Sheets...
    </div>

    <div v-else-if="galat" class="keu-status keu-status--galat">
      <CloudOff :size="20" aria-hidden="true" />
      <div>
        <strong>Gagal memuat data keuangan</strong>
        <p>{{ galat }} Periksa koneksi Anda, lalu coba lagi.</p>
        <button type="button" class="keu-tombol" @click="muat">
          <RefreshCw :size="14" aria-hidden="true" /> Muat ulang
        </button>
      </div>
    </div>

    <template v-else-if="adaData && program">
      <nav class="keu-tabs" role="tablist" aria-label="Program laporan keuangan">
        <button
          v-for="(p, i) in data.programs"
          :key="p.id"
          ref="tabRefs"
          type="button"
          role="tab"
          class="keu-tab"
          :class="{ 'is-aktif': p.id === aktif }"
          :aria-selected="p.id === aktif"
          :tabindex="p.id === aktif ? 0 : -1"
          @click="aktif = p.id"
          @keydown="pilihTab($event, i)"
        >
          {{ p.nama }}
        </button>
      </nav>

      <section
        class="keu-panel"
        role="tabpanel"
        :aria-label="program.nama"
        tabindex="0"
      >
        <header class="keu-panel__kepala">
          <div>
            <h3 class="keu-panel__judul">{{ program.nama }}</h3>
            <p class="keu-panel__ket">{{ program.keterangan }}</p>
          </div>
          <button type="button" class="keu-tombol keu-tombol--kecil" @click="muat" :disabled="memuat">
            <RefreshCw :size="13" aria-hidden="true" :class="{ 'keu-putar': memuat }" />
            {{ memuat ? 'Memuat' : 'Muat ulang' }}
          </button>
        </header>

        <!-- Program belum diisi bendahara -->
        <div v-if="program.status === 'error'" class="keu-status keu-status--galat">
          <CloudOff :size="18" aria-hidden="true" />
          <div>
            <strong>Tab ini gagal dibaca</strong>
            <p>{{ program.pesan }}</p>
          </div>
        </div>

        <div v-else-if="program.kosong" class="keu-kosong">
          <Inbox :size="20" aria-hidden="true" />
          <div>
            <strong>Belum ada data</strong>
            <p>
              Data <em>{{ program.nama }}</em> masih kosong.
              Data di halaman ini akan terisi otomatis begitu ada
              catatan transaksi.
            </p>
          </div>
        </div>

        <template v-else>
          <div class="financial-summary">
            <div class="financial-card pemasukan">
              <div class="label">Pemasukan</div>
              <div class="amount">{{ rupiah(program.totals.masuk) }}</div>
            </div>
            <div class="financial-card pengeluaran">
              <div class="label">Pengeluaran</div>
              <div class="amount">{{ rupiah(program.totals.keluar) }}</div>
            </div>
            <div class="financial-card saldo">
              <div class="label">Saldo</div>
              <div class="amount">{{ rupiah(program.totals.saldo) }}</div>
            </div>
          </div>

          <!-- Transaksi berjalan: Infaq Operasional, Pemulasaran, Infaq Ramadhan -->
          <template v-if="program.jenis === 'transaksi'">
            <h4 class="keu-h4">Rincian transaksi</h4>
            <div class="keu-tabel-wrap">
              <table class="keu-tabel">
                <thead>
                  <tr>
                    <th scope="col">Tanggal</th>
                    <th scope="col">Keterangan</th>
                    <th scope="col" class="keu-num">Masuk</th>
                    <th scope="col" class="keu-num">Keluar</th>
                    <th scope="col" class="keu-num">Saldo</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(r, i) in program.transaksi" :key="i">
                    <td class="keu-tgl">{{ formatTanggal(r.tanggal, r.tanggalMentah) }}</td>
                    <td>{{ r.ket }}</td>
                    <td class="keu-num keu-masuk">
                      <template v-if="r.masuk">{{ rupiah(r.masuk) }}</template>
                      <span v-else class="keu-kosongsel">—</span>
                    </td>
                    <td class="keu-num keu-keluar">
                      <template v-if="r.keluar">{{ rupiah(r.keluar) }}</template>
                      <span v-else class="keu-kosongsel">—</span>
                    </td>
                    <td class="keu-num keu-saldo">{{ rupiah(r.saldo) }}</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr>
                    <td colspan="2">Total</td>
                    <td class="keu-num keu-masuk">{{ rupiah(program.totals.masuk) }}</td>
                    <td class="keu-num keu-keluar">{{ rupiah(program.totals.keluar) }}</td>
                    <td class="keu-num keu-saldo">{{ rupiah(program.totals.saldo) }}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <p class="keu-catatan">Saldo dihitung ulang dari kolom masuk dan keluar tiap baris.</p>
          </template>

          <!-- Celengan LAZIRU: pemasukan per RT dan penyaluran -->
          <template v-else-if="program.jenis === 'celengan'">
            <div class="keu-dua">
              <div>
                <h4 class="keu-h4">Pemasukan per wilayah</h4>
                <div class="keu-tabel-wrap">
                  <table class="keu-tabel">
                    <thead>
                      <tr>
                        <th scope="col">Bulan</th>
                        <th scope="col">Wilayah</th>
                        <th scope="col" class="keu-num">Jumlah</th>
                      </tr>
                    </thead>
                    <tbody>
                      <template v-for="b in program.bulan" :key="b">
                        <tr v-for="r in program.pemasukan.filter(x => x.bulan === b)" :key="b + r.wilayah">
                          <td class="keu-tgl">{{ b }}</td>
                          <td>{{ r.wilayah }}</td>
                          <td class="keu-num keu-masuk">{{ rupiah(r.jumlah) }}</td>
                        </tr>
                        <tr class="keu-sub">
                          <td colspan="2">Jumlah {{ b }}</td>
                          <td class="keu-num">{{ rupiah(subtotalBulan(b)) }}</td>
                        </tr>
                      </template>
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colspan="2">Total pemasukan</td>
                        <td class="keu-num keu-masuk">{{ rupiah(program.totals.masuk) }}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              <div>
                <h4 class="keu-h4">Penyaluran</h4>
                <div class="keu-tabel-wrap">
                  <table class="keu-tabel">
                    <thead>
                      <tr>
                        <th scope="col">Tanggal</th>
                        <th scope="col">Kegiatan</th>
                        <th scope="col" class="keu-num">Jumlah</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="r in program.pengeluaran" :key="r.no">
                        <td class="keu-tgl">{{ formatTanggal(r.tanggal, r.tanggalMentah) }}</td>
                        <td>{{ r.kegiatan }}</td>
                        <td class="keu-num keu-keluar">{{ rupiah(r.jumlah) }}</td>
                      </tr>
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colspan="2">Total penyaluran</td>
                        <td class="keu-num keu-keluar">{{ rupiah(program.totals.keluar) }}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          </template>

          <!-- Donatur tetap -->
          <template v-else-if="program.jenis === 'donatur'">
            <h4 class="keu-h4">Setoran per bulan</h4>
            <ul class="keu-chip-lis">
              <li v-for="b in program.perBulan" :key="b.bulan" class="keu-chip">
                <span class="keu-chip__nama">{{ b.bulan }}</span>
                <span class="keu-chip__nilai">{{ rupiah(b.jumlah) }}</span>
                <span class="keu-chip__ket">{{ b.donatur }} donatur</span>
              </li>
            </ul>

            <h4 class="keu-h4">Daftar donatur</h4>
            <div class="keu-tabel-wrap">
              <table class="keu-tabel">
                <thead>
                  <tr>
                    <th scope="col">Bulan</th>
                    <th scope="col">Tanggal</th>
                    <th scope="col">Donatur</th>
                    <th scope="col" class="keu-num">Nominal</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(r, i) in program.list" :key="i">
                    <td class="keu-tgl">{{ r.bulan }}</td>
                    <td class="keu-tgl">{{ formatTanggal(r.tanggal, r.tanggalMentah) }}</td>
                    <td>{{ r.nama }}</td>
                    <td class="keu-num keu-masuk">{{ rupiah(r.jumlah) }}</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr>
                    <td colspan="3">Total</td>
                    <td class="keu-num keu-masuk">{{ rupiah(program.totals.masuk) }}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </template>

          <!-- Rekap zakat: tiga seksi dengan arti kolom berbeda -->
          <template v-else-if="program.jenis === 'zakat'">
            <div v-for="s in program.seksi" :key="s.kode" class="keu-blok">
              <h4 class="keu-h4">{{ s.kode }}. {{ s.judul }}</h4>
              <div class="keu-tabel-wrap">
                <table class="keu-tabel">
                  <thead>
                    <tr>
                      <th scope="col">No</th>
                      <th scope="col">Item</th>
                      <th v-for="k in s.kolom" :key="k.key" scope="col" class="keu-num">{{ k.label }}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(b, i) in s.baris" :key="i">
                      <td class="keu-tgl">{{ b.no }}</td>
                      <td>{{ b.item }}</td>
                      <td v-for="k in s.kolom" :key="k.key" class="keu-num keu-kosongsel">
                        {{ sel(b[k.key], k.tipe) }}
                      </td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colspan="2">Total</td>
                      <td v-for="k in s.kolom" :key="k.key" class="keu-num">
                        {{ sel(s.total[k.key], k.tipe) }}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
            <p class="keu-catatan">
              Saldo = penerimaan dikurangi penyaluran zakat dan biaya kelengkapan.
            </p>
          </template>

          <!-- Kampung Ramadhan: empat seksi pengeluaran dan blok pemasukan -->
          <template v-else-if="program.jenis === 'kampung'">
            <div v-for="s in program.seksi" :key="s.kode" class="keu-blok">
              <h4 class="keu-h4">{{ s.kode }}. {{ s.judul }}</h4>
              <div class="keu-tabel-wrap">
                <table class="keu-tabel">
                  <thead>
                    <tr>
                      <th scope="col">No</th>
                      <th scope="col">Uraian</th>
                      <th scope="col" class="keu-num">Satuan</th>
                      <th scope="col" class="keu-num">Qty</th>
                      <th scope="col" class="keu-num">Biaya</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(b, i) in s.items" :key="i">
                      <td class="keu-tgl">{{ b.no || '—' }}</td>
                      <td>{{ b.nama }}</td>
                      <td class="keu-num keu-kosongsel">{{ b.satuan || '—' }}</td>
                      <td class="keu-num keu-kosongsel">
                        {{ b.qty == null ? '—' : formatKuantitas(b.qty) }}
                      </td>
                      <td class="keu-num keu-keluar">{{ rupiah(b.total) }}</td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colspan="4">Subtotal {{ s.kode }}</td>
                      <td class="keu-num">{{ rupiah(s.subtotal) }}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <h4 class="keu-h4">Sumber pemasukan</h4>
            <div class="keu-tabel-wrap">
              <table class="keu-tabel">
                <thead>
                  <tr>
                    <th scope="col">No</th>
                    <th scope="col">Keterangan</th>
                    <th scope="col" class="keu-num">Jumlah</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(r, i) in program.pemasukan" :key="i">
                    <td class="keu-tgl">{{ r.no || '—' }}</td>
                    <td>{{ r.ket }}</td>
                    <td class="keu-num keu-masuk">{{ rupiah(r.jumlah) }}</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr>
                    <td colspan="2">Total pemasukan</td>
                    <td class="keu-num keu-masuk">{{ rupiah(program.totals.masuk) }}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </template>
        </template>
      </section>

      <footer class="keu-kaki">
        <span>
          Sumber: Data keuangan Masjid Al-Birru, diperbarui otomatis tiap 5 menit.
          Terakhir dimuat pukul {{ jamMuat }}.
        </span>
      </footer>
    </template>
  </div>
</template>

<style scoped>
.keu { margin: 1.5rem 0; }

/* ---- state: memuat, galat, kosong ---- */
.keu-status,
.keu-kosong {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 1.25rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
  color: var(--vp-c-text-2);
  font-size: 0.9rem;
  line-height: 1.6;
}

.keu-status p,
.keu-kosong p { margin: 0.35rem 0 0; }

.keu-status strong,
.keu-kosong strong { color: var(--vp-c-text-1); }

.keu-status--galat { border-color: rgba(220, 38, 38, 0.35); }

.keu-kosong { background: var(--vp-c-bg-soft); }
.keu-kosong svg { color: var(--vp-c-text-3, var(--vp-c-text-2)); flex-shrink: 0; margin-top: 2px; }
.keu-status svg { flex-shrink: 0; margin-top: 2px; }

.keu-spinner {
  width: 15px;
  height: 15px;
  margin-top: 3px;
  border: 2px solid var(--vp-c-divider);
  border-top-color: var(--vp-c-brand-1, var(--teal-700));
  border-radius: 50%;
  animation: keu-putar 0.8s linear infinite;
  flex-shrink: 0;
}

@keyframes keu-putar { to { transform: rotate(360deg); } }

/* ---- tombol ---- */
.keu-tombol {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 0.75rem;
  padding: 0 14px;
  min-height: 40px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  font-size: 0.85rem;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: border-color 0.15s, color 0.15s;
}

.keu-tombol:hover:not(:disabled) {
  border-color: var(--teal-600);
  color: var(--teal-700);
}

.keu-tombol:focus-visible {
  outline: 2px solid var(--teal-600);
  outline-offset: 2px;
}

.keu-tombol:disabled { opacity: 0.55; cursor: default; }

.keu-tombol--kecil { margin-top: 0; min-height: 34px; font-size: 0.78rem; }

.keu-putar { animation: keu-putar 0.8s linear infinite; }

/* ---- pemindah program ---- */
.keu-tabs {
  display: flex;
  gap: 2px;
  overflow-x: auto;
  scrollbar-width: thin;
  border-bottom: 1px solid var(--vp-c-divider);
  margin-bottom: 1.5rem;
}

.keu-tab {
  flex: 0 0 auto;
  position: relative;
  padding: 10px 14px;
  min-height: 44px;
  border: none;
  border-bottom: 2px solid transparent;
  background: none;
  color: var(--vp-c-text-2);
  font-size: 0.85rem;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  white-space: nowrap;
  transition: color 0.15s, border-color 0.15s;
}

.keu-tab:hover { color: var(--teal-700); }

.keu-tab.is-aktif {
  color: var(--teal-700);
  border-bottom-color: var(--gold);
}

.keu-tab:focus-visible {
  outline: 2px solid var(--teal-600);
  outline-offset: -3px;
}

.dark .keu-tab:hover,
.dark .keu-tab.is-aktif { color: var(--teal-400); }

/* ---- panel ---- */
.keu-panel { outline: none; }

.keu-panel__kepala {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  padding-bottom: 0.85rem;
  border-bottom: 1px solid rgba(201, 168, 76, 0.45);
  margin-bottom: 1rem;
}

.keu-panel__judul {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--vp-c-text-1);
}

.keu-panel__ket {
  margin: 0.2rem 0 0;
  font-size: 0.82rem;
  color: var(--vp-c-text-2);
}

.keu-h4 {
  margin: 1.75rem 0 0.6rem;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.4px;
  text-transform: uppercase;
  color: var(--vp-c-text-2);
}

.keu-blok:first-of-type .keu-h4 { margin-top: 1rem; }

.keu-dua {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

/* ---- tabel ---- */
.keu-tabel-wrap {
  overflow-x: auto;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
}

.keu-tabel {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.82rem;
  margin: 0;
}

.keu-tabel th,
.keu-tabel td {
  padding: 8px 12px;
  text-align: left;
  vertical-align: top;
  border-bottom: 1px solid var(--vp-c-divider);
}

.keu-tabel thead th {
  position: sticky;
  top: 0;
  background: var(--vp-c-bg-soft);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.3px;
  text-transform: uppercase;
  color: var(--vp-c-text-2);
  white-space: nowrap;
  z-index: 1;
}

.keu-tabel tbody tr:hover td { background: var(--vp-c-bg-soft); }
.keu-tabel tbody tr:last-child td { border-bottom: 1px solid var(--vp-c-divider); }

.keu-tabel tfoot td {
  background: var(--vp-c-bg-soft);
  font-weight: 700;
  border-bottom: none;
  border-top: 1px solid var(--vp-c-divider);
}

.keu-num {
  text-align: right !important;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.keu-tgl { color: var(--vp-c-text-2); white-space: nowrap; }
.keu-masuk { color: var(--teal-700); font-weight: 600; }
.keu-keluar { color: var(--keluar); font-weight: 600; }
.keu-saldo { font-weight: 700; }
.keu-kosongsel { color: var(--vp-c-text-2); font-weight: 400; }
.keu-sub td { background: var(--vp-c-bg-soft); font-weight: 600; }

.dark .keu-masuk { color: var(--teal-400); }

/* ---- chip bulan ---- */
.keu-chip-lis {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  list-style: none;
  padding: 0;
  margin: 0;
}

.keu-chip {
  display: flex;
  flex-direction: column;
  gap: 1px;
  padding: 8px 12px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
}

.keu-chip__nama { font-size: 0.72rem; font-weight: 700; color: var(--vp-c-text-2); text-transform: uppercase; letter-spacing: 0.3px; }
.keu-chip__nilai { font-size: 0.9rem; font-weight: 700; font-variant-numeric: tabular-nums; color: var(--teal-700); }
.keu-chip__ket { font-size: 0.72rem; color: var(--vp-c-text-2); }

.dark .keu-chip__nilai { color: var(--teal-400); }

/* ---- catatan & footer ---- */
.keu-catatan {
  margin: 0.6rem 0 0;
  font-size: 0.75rem;
  color: var(--vp-c-text-2);
  line-height: 1.6;
}

.keu-kaki {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 1rem;
  flex-wrap: wrap;
  margin-top: 1.75rem;
  padding-top: 0.85rem;
  border-top: 1px solid var(--vp-c-divider);
  font-size: 0.75rem;
  color: var(--vp-c-text-2);
  line-height: 1.6;
}

.keu-kaki__tautan {
  color: var(--teal-700);
  font-weight: 600;
  text-decoration: none;
  white-space: nowrap;
}

.keu-kaki__tautan:hover { text-decoration: underline; }

.dark .keu-kaki__tautan { color: var(--teal-400); }

/* ---- mobile ---- */
@media (max-width: 768px) {
  .keu-dua { grid-template-columns: 1fr; gap: 0; }
  .keu-panel__kepala { flex-direction: column; }
  .keu-tabel { min-width: 460px; }
  .keu-tabel th:first-child,
  .keu-tabel td:first-child {
    position: sticky;
    left: 0;
    background: var(--vp-c-bg);
    z-index: 2;
  }
  .keu-tabel thead th:first-child { background: var(--vp-c-bg-soft); z-index: 3; }
  .keu-tabel tfoot td:first-child { background: var(--vp-c-bg-soft); }
  .keu-tabel tbody tr:hover td:first-child { background: var(--vp-c-bg-soft); }
}
</style>
