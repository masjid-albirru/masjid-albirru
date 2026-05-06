<script setup>
import { ref, onMounted, computed } from 'vue'

// Koordinat Masjid Al-Birru (Depok, Jawa Barat)
// Ganti dengan koordinat yang tepat jika perlu
const LAT = -6.3763781
const LNG = 106.7550339
const KOTA = 'Depok, Jawa Barat'

const waktuSholat = ref(null)
const sekarang = ref(new Date())
const loading = ref(true)
const error = ref(false)

const namaWaktu = ['Subuh', 'Dzuhur', 'Ashar', 'Maghrib', 'Isya']
const keyAPI   = ['Fajr',  'Dhuhr',  'Asr',   'Maghrib', 'Isha']
const ikonWaktu = ['🌙', '☀️', '🌤️', '🌅', '🌙']

// Update jam setiap detik
let interval
onMounted(async () => {
  interval = setInterval(() => { sekarang.value = new Date() }, 1000)
  await fetchJadwal()
})

async function fetchJadwal() {
  try {
    const today = new Date()
    const d = today.getDate()
    const m = today.getMonth() + 1
    const y = today.getFullYear()
    const res = await fetch(
      `https://api.aladhan.com/v1/timings/${d}-${m}-${y}?latitude=${LAT}&longitude=${LNG}&method=20`
    )
    const json = await res.json()
    waktuSholat.value = json.data.timings
  } catch (e) {
    error.value = true
  } finally {
    loading.value = false
  }
}

// Konversi "HH:MM" ke menit
function toMenit(str) {
  if (!str) return 0
  const [h, m] = str.split(':').map(Number)
  return h * 60 + m
}

const menitSekarang = computed(() => {
  const d = sekarang.value
  return d.getHours() * 60 + d.getMinutes()
})

// Waktu sholat berikutnya
const berikutnya = computed(() => {
  if (!waktuSholat.value) return null
  for (let i = 0; i < keyAPI.length; i++) {
    const menit = toMenit(waktuSholat.value[keyAPI[i]])
    if (menitSekarang.value < menit) return { nama: namaWaktu[i], menit, index: i }
  }
  return { nama: namaWaktu[0], menit: toMenit(waktuSholat.value[keyAPI[0]]) + 1440, index: 0 }
})

// Countdown ke waktu berikutnya
const countdown = computed(() => {
  if (!berikutnya.value) return '--:--'
  let sisa = berikutnya.value.menit - menitSekarang.value
  if (sisa < 0) sisa += 1440
  const jam = Math.floor(sisa / 60)
  const menit = sisa % 60
  return `${jam}j ${menit}m lagi`
})

const jamSekarang = computed(() => {
  return sekarang.value.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
})

const tanggalSekarang = computed(() => {
  return sekarang.value.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
})

function formatWaktu(str) {
  if (!str) return '--:--'
  return str.substring(0, 5)
}

function isAktif(index) {
  if (!waktuSholat.value || !berikutnya.value) return false
  // Waktu aktif = waktu sebelum "berikutnya"
  const prev = (berikutnya.value.index - 1 + namaWaktu.length) % namaWaktu.length
  return index === prev
}

function isBerikutnya(index) {
  if (!berikutnya.value) return false
  return index === berikutnya.value.index
}
</script>

<template>
  <div class="jadwal-sholat">

    <!-- Header jam & tanggal -->
    <div class="js-header">
      <div class="js-jam">{{ jamSekarang }}</div>
      <div class="js-tanggal">{{ tanggalSekarang }}</div>
      <div class="js-kota">📍 {{ KOTA }}</div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="js-loading">
      <span class="spinner"></span> Memuat jadwal sholat...
    </div>

    <!-- Error -->
    <div v-else-if="error" class="js-error">
      ⚠️ Gagal memuat jadwal. Periksa koneksi internet.
    </div>

    <!-- Jadwal -->
    <template v-else>
      <!-- Countdown -->
      <div class="js-countdown">
        <span class="countdown-label">{{ berikutnya?.nama }}</span>
        <span class="countdown-timer">{{ countdown }}</span>
      </div>

      <!-- Grid waktu sholat -->
      <div class="js-grid">
        <div
          v-for="(nama, i) in namaWaktu"
          :key="nama"
          class="js-item"
          :class="{
            'js-item--aktif': isAktif(i),
            'js-item--berikutnya': isBerikutnya(i)
          }"
        >
          <div class="js-ikon">{{ ikonWaktu[i] }}</div>
          <div class="js-nama">{{ nama }}</div>
          <div class="js-waktu">{{ formatWaktu(waktuSholat?.[keyAPI[i]]) }}</div>
          <div v-if="isBerikutnya(i)" class="js-badge">Berikutnya</div>
          <div v-else-if="isAktif(i)" class="js-badge js-badge--aktif">Sekarang</div>
        </div>
      </div>

      <div class="js-footer">
        Sumber: Aladhan API · Metode Kemenag RI
      </div>
    </template>
  </div>
</template>

<style scoped>
.jadwal-sholat {
  background: linear-gradient(135deg, #0f6b78 0%, #0a4a54 100%);
  border-radius: 16px;
  padding: 1.75rem;
  color: #fff;
  margin: 2rem 0;
  box-shadow: 0 8px 32px rgba(15, 107, 120, 0.3);
}

/* Header */
.js-header {
  text-align: center;
  margin-bottom: 1.25rem;
}

.js-jam {
  font-size: 2.5rem;
  font-weight: 700;
  letter-spacing: 2px;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

.js-tanggal {
  font-size: 0.9rem;
  opacity: 0.85;
  margin-top: 4px;
  text-transform: capitalize;
}

.js-kota {
  font-size: 0.78rem;
  opacity: 0.65;
  margin-top: 2px;
}

/* Countdown */
.js-countdown {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.75rem;
  background: rgba(255,255,255,0.12);
  border-radius: 10px;
  padding: 0.6rem 1rem;
  margin-bottom: 1.25rem;
  font-size: 0.88rem;
}

.countdown-label {
  font-weight: 700;
  font-size: 0.95rem;
}

.countdown-timer {
  opacity: 0.85;
  font-variant-numeric: tabular-nums;
}

/* Grid */
.js-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
}

.js-item {
  background: rgba(255,255,255,0.1);
  border-radius: 10px;
  padding: 0.75rem 0.4rem;
  text-align: center;
  position: relative;
  transition: background 0.2s;
}

.js-item--aktif {
  background: rgba(255,255,255,0.18);
}

.js-item--berikutnya {
  background: rgba(255,255,255,0.25);
  box-shadow: 0 0 0 2px rgba(255,255,255,0.5);
}

.js-ikon {
  font-size: 1.2rem;
  margin-bottom: 4px;
}

.js-nama {
  font-size: 0.72rem;
  font-weight: 600;
  opacity: 0.8;
  margin-bottom: 4px;
}

.js-waktu {
  font-size: 1rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.js-badge {
  position: absolute;
  top: -8px;
  left: 50%;
  transform: translateX(-50%);
  background: #fff;
  color: #0f6b78;
  font-size: 0.6rem;
  font-weight: 700;
  padding: 1px 7px;
  border-radius: 20px;
  white-space: nowrap;
}

.js-badge--aktif {
  background: rgba(255,255,255,0.4);
  color: #fff;
}

/* Loading & Error */
.js-loading,
.js-error {
  text-align: center;
  padding: 1.5rem;
  opacity: 0.8;
  font-size: 0.9rem;
}

.spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  vertical-align: middle;
  margin-right: 6px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Footer */
.js-footer {
  text-align: center;
  font-size: 0.68rem;
  opacity: 0.45;
  margin-top: 1rem;
}

/* Mobile */
@media (max-width: 640px) {
  .js-jam { font-size: 2rem; }
  .js-grid { gap: 6px; }
  .js-item { padding: 0.6rem 0.25rem; }
  .js-waktu { font-size: 0.85rem; }
  .js-nama { font-size: 0.65rem; }
}
</style>