<script setup>
import { ref, computed, onMounted } from 'vue'
import { withBase } from 'vitepress'
import { Wallet, RefreshCw, Inbox } from 'lucide-vue-next'
import { muatDataKeuangan, rupiah, rupiahRingkas } from './keuanganData.js'

const programs = ref([])
const memuat = ref(true)
const galat = ref(false)

const terisi = computed(() => programs.value.filter(p => p.status === 'ok' && !p.kosong))

async function muat() {
  memuat.value = true
  galat.value = false
  try {
    const hasil = await muatDataKeuangan()
    programs.value = hasil.programs
    galat.value = hasil.ringkasan.gagal === hasil.ringkasan.program
  } catch {
    galat.value = true
  } finally {
    memuat.value = false
  }
}

onMounted(muat)
</script>

<template>
  <div class="keu-ringkas">
    <p v-if="memuat" class="kr-status">Memuat ringkasan keuangan...</p>

    <p v-else-if="galat" class="kr-status">
      Data keuangan belum bisa dimuat.
      <button type="button" class="kr-tautan" @click="muat">
        <RefreshCw :size="12" aria-hidden="true" /> Coba lagi
      </button>
    </p>

    <p v-else-if="terisi.length === 0" class="kr-status kr-status--kosong">
      <Inbox :size="16" aria-hidden="true" />
      Belum ada pos keuangan yang terisi di spreadsheet.
    </p>

    <template v-else>
      <ul class="kr-lis">
        <li v-for="p in terisi" :key="p.id" class="kr-item">
          <div class="kr-item__kepala">
            <Wallet :size="15" aria-hidden="true" class="kr-ikon" />
            <span class="kr-nama">{{ p.nama }}</span>
          </div>
          <div class="kr-saldo">{{ rupiah(p.totals.saldo) }}</div>
          <div class="kr-rinci">
            <span>Masuk {{ rupiahRingkas(p.totals.masuk) }}</span>
            <span>Keluar {{ rupiahRingkas(p.totals.keluar) }}</span>
          </div>
        </li>
      </ul>
      <p class="kr-kaki">
        <a :href="withBase('/keuangan/')">Lihat rincian tiap transaksi</a>
      </p>
    </template>
  </div>
</template>

<style scoped>
.keu-ringkas { margin: 1rem 0; }

.kr-status {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  padding: 0.85rem 1rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  font-size: 0.85rem;
  color: var(--vp-c-text-2);
}

.kr-status--kosong { background: var(--vp-c-bg-soft); }

.kr-tautan {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border: none;
  background: none;
  padding: 0;
  color: var(--teal-700);
  font: inherit;
  font-weight: 600;
  cursor: pointer;
  text-decoration: underline;
}

.kr-tautan:focus-visible { outline: 2px solid var(--teal-600); outline-offset: 2px; }

.kr-lis {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
  gap: 10px;
  list-style: none;
  padding: 0;
  margin: 0;
}

.kr-item {
  padding: 0.85rem 1rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
}

.kr-item__kepala {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 0.5rem;
}

.kr-ikon { color: var(--teal-700); flex-shrink: 0; }

.kr-nama {
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--vp-c-text-2);
  line-height: 1.3;
}

.kr-saldo {
  font-size: 1.05rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--teal-700);
  line-height: 1.3;
}

.dark .kr-saldo, .dark .kr-ikon { color: var(--teal-400); }

.kr-rinci {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 10px;
  margin-top: 4px;
  font-size: 0.72rem;
  color: var(--vp-c-text-2);
  font-variant-numeric: tabular-nums;
}

.kr-kaki {
  margin: 0.75rem 0 0;
  font-size: 0.8rem;
  text-align: right;
}

.kr-kaki a {
  color: var(--teal-700);
  font-weight: 600;
  text-decoration: none;
}

.kr-kaki a:hover { text-decoration: underline; }

.dark .kr-kaki a, .dark .kr-tautan { color: var(--teal-400); }
</style>
