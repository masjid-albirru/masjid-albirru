<script setup>
/**
 * WakafRingkas — ringkasan wakaf tanah untuk beranda.
 * Angka diambil dari modul yang sama dengan halaman /wakaf-tanah,
 * jadi dua tempat ini tidak mungkin berbeda.
 */
import { ref, computed, onMounted } from 'vue'
import { withBase } from 'vitepress'
import { LandPlot, Coins, Map as PetaIcon, ArrowRight, CircleAlert, Loader2 } from 'lucide-vue-next'
import { muatDataWakaf, rupiah, rupiahRingkas, luasM2, LUAS_TARGET_M2 } from './wakafData.js'
import TombolShareWakaf from './TombolShareWakaf.vue'

const wilayah = ref([])
const ringkasan = ref(null)
const loading = ref(true)
const error = ref(false)

onMounted(async () => {
  try {
    const data = await muatDataWakaf()
    wilayah.value = data.wilayah
    ringkasan.value = data.ringkas
  } catch {
    error.value = true
  } finally {
    loading.value = false
  }
})

const persenSetoran = computed(() => {
  const r = ringkasan.value
  if (!r || !r.totalNilai) return 0
  return Math.min((r.totalSetoran / r.totalNilai) * 100, 100)
})

function formatPersen(n) {
  if (n < 1) return n.toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
  return Math.round(n).toString()
}
</script>

<template>
  <div class="wr">
    <div v-if="loading" class="wr-state">
      <Loader2 :size="16" class="wr-spin" />
      Memuat data wakaf tanah...
    </div>

    <div v-else-if="error" class="wr-state">
      <CircleAlert :size="15" />
      Data wakaf tidak dapat dimuat saat ini.
    </div>

    <div v-else-if="ringkasan && ringkasan.totalM2 > 0" class="wr-isi">
      <div class="wr-kartus">
        <div class="wr-kartu wr-kartu--luas">
          <LandPlot :size="16" class="wr-ikon" />
          <div>
            <div class="wr-nilai">{{ luasM2(ringkasan.totalM2) }}</div>
            <div class="wr-label">Luas Wakaf yang Diperoleh Saat Ini</div>
          </div>
        </div>

        <div class="wr-kartu wr-kartu--target">
          <Coins :size="16" class="wr-ikon" />
          <div>
            <div class="wr-nilai">{{ rupiahRingkas(ringkasan.totalNilai) }}</div>
            <div class="wr-label">Target · {{ luasM2(LUAS_TARGET_M2) }}</div>
          </div>
        </div>

        <div class="wr-kartu">
          <PetaIcon :size="16" class="wr-ikon" />
          <div>
            <div class="wr-nilai">{{ ringkasan.wilayahAktif }} wilayah</div>
            <div class="wr-label">dari {{ ringkasan.jumlahWilayah }} wilayah program</div>
          </div>
        </div>
      </div>

      <div class="wr-setoran">
        <span class="wr-setoran-teks">
          {{ rupiah(ringkasan.totalSetoran) }} terkumpul dari target {{ rupiah(ringkasan.totalNilai) }} ({{ formatPersen(persenSetoran) }}%)
        </span>
        <div
          class="wr-bar"
          role="progressbar"
          :aria-valuenow="persenSetoran"
          aria-valuemin="0"
          aria-valuemax="100"
          aria-label="Progres setoran wakaf tanah"
        >
          <div class="wr-bar-isi" :style="{ width: persenSetoran + '%' }"></div>
        </div>
      </div>

      <div class="wr-kaki">
        <a :href="withBase('/wakaf-tanah')" class="wr-detail">
          Lihat daftar wakif
          <ArrowRight :size="13" />
        </a>
        <TombolShareWakaf
          :ringkasan="ringkasan"
          :wilayah="wilayah"
          label="Bagikan"
          ringkas
        />
      </div>
    </div>

    <div v-else class="wr-state">
      Belum ada data wakaf tanah yang tercatat.
    </div>
  </div>
</template>

<style scoped>
.wr { margin: 1rem 0; }

.wr-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 1.25rem;
  color: var(--vp-c-text-2);
  font-size: 0.85rem;
}

.wr-spin { animation: wr-rot 0.9s linear infinite; }
@keyframes wr-rot { to { transform: rotate(360deg); } }

.wr-kartus {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.wr-kartu {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 0.75rem 1rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  background: var(--vp-c-bg);
  min-width: 0;
}

.wr-kartu--luas {
  border-color: var(--teal-600);
  background: var(--vp-c-bg-soft);
}

.wr-ikon { flex-shrink: 0; color: var(--teal-600); margin-top: 2px; }
.dark .wr-ikon { color: var(--teal-400); }

.wr-nilai {
  font-size: 1rem;
  font-weight: 800;
  line-height: 1.2;
  color: var(--teal-700);
  font-variant-numeric: tabular-nums;
}

.dark .wr-nilai { color: var(--teal-400); }

.wr-label {
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--vp-c-text-2);
  margin-top: 1px;
}

.wr-setoran {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin: 0.9rem 0 0.6rem;
}

.wr-setoran-teks {
  font-size: 0.78rem;
  color: var(--vp-c-text-2);
  font-variant-numeric: tabular-nums;
}

.wr-bar {
  flex: 1;
  min-width: 120px;
  height: 6px;
  border-radius: 99px;
  background: var(--vp-c-bg-soft);
  overflow: hidden;
}

.wr-bar-isi {
  height: 100%;
  background: var(--teal-600);
  border-radius: 99px;
  min-width: 3px;
}

.wr-kaki {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.wr-detail {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--teal-700);
  text-decoration: none;
  min-height: 44px;
}

.dark .wr-detail { color: var(--teal-400); }

.wr-detail:hover { opacity: 0.75; }

@media (max-width: 640px) {
  .wr-kartus { grid-template-columns: 1fr; }
  .wr-kartu { padding: 0.65rem 0.8rem; }
  .wr-nilai { font-size: 0.95rem; }
  .wr-kaki { gap: 8px; }
}
</style>