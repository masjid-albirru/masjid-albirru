<script setup>
/**
 * StatusAcara — kartu gambar 9:16 untuk status WhatsApp (acara mendatang).
 * Warna dipatok light-theme agar hasil gambar konsisten di mode gelap/terang.
 */
import { Clock, MapPin, User } from 'lucide-vue-next'

const props = defineProps({
  acara: { type: Object, required: true },
})

const tanggalValid = (str) => {
  if (!str) return false
  const d = new Date(str)
  return !isNaN(d.getTime())
}

function formatTanggal(str) {
  if (!tanggalValid(str)) {
    return { hari: '—', tanggal: '—', bulan: '—', tahun: '—' }
  }
  const d = new Date(str)
  return {
    hari: d.toLocaleDateString('id-ID', { weekday: 'long' }).replace('Minggu', 'Ahad'),
    tanggal: d.getDate(),
    bulan: d.toLocaleDateString('id-ID', { month: 'short' }),
    tahun: d.getFullYear(),
  }
}

function hariLagi(str) {
  if (!tanggalValid(str)) return ''
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const target = new Date(str); target.setHours(0, 0, 0, 0)
  const diff = Math.round((target - today) / (1000 * 60 * 60 * 24))
  if (diff === 0) return 'Hari ini'
  if (diff === 1) return 'Besok'
  if (diff < 0) return 'Sudah lewat'
  return `${diff} hari lagi`
}

const tipeWarna = {
  Kajian:    { background: 'rgba(51,189,212,0.2)',   color: '#7fe3f5' },
  Pengajian: { background: 'rgba(51,189,212,0.2)',   color: '#7fe3f5' },
  Rapat:     { background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.9)' },
  Lomba:     { background: 'rgba(234,179,8,0.25)',   color: '#f3e5ab' },
  Sosial:    { background: 'rgba(34,197,94,0.2)',    color: '#86efac' },
  Lainnya:   { background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.9)' },
}

const terbukaBadge = {
  'Ya':                  { label: 'Terbuka Umum',  warna: '#86efac' },
  'Tidak (Jamaah saja)': { label: 'Jamaah Masjid', warna: '#93c5fd' },
  'Khusus Muslimah':     { label: 'Khusus Muslimah', warna: '#d8b4fe' },
}
</script>

<template>
  <div class="sa-layer" aria-hidden="true">
    <div class="sa-status">
      <header class="sa-head">
        <div class="sa-brand">Masjid Al-Birru</div>
        <div class="sa-motif"></div>
      </header>

      <div class="sa-body">
        <p class="sa-label">Acara Mendatang</p>
        <h4 class="sa-nama">{{ acara.nama_acara }}</h4>

        <div class="sa-date-block">
          <div class="sa-date-box">
            <div class="sa-day">{{ formatTanggal(acara.tanggal).tanggal }}</div>
            <div class="sa-month">{{ formatTanggal(acara.tanggal).bulan }}</div>
            <div class="sa-year">{{ formatTanggal(acara.tanggal).tahun }}</div>
          </div>
          <div class="sa-date-meta">
            <div class="sa-weekday">{{ formatTanggal(acara.tanggal).hari }}</div>
            <div class="sa-countdown">{{ hariLagi(acara.tanggal) }}</div>
          </div>
        </div>

        <div class="sa-meta">
          <span v-if="acara.tipe" class="sa-badge" :style="tipeWarna[acara.tipe]">
            {{ acara.tipe }}
          </span>
          <span v-if="terbukaBadge[acara.terbuka_umum]" class="sa-badge" :style="{ background: 'rgba(255,255,255,0.15)', color: terbukaBadge[acara.terbuka_umum].warna }">
            {{ terbukaBadge[acara.terbuka_umum].label }}
          </span>
        </div>

        <ul class="sa-info">
          <li v-if="acara.waktu_mulai">
            <Clock :size="15" />
            <span>{{ acara.waktu_mulai }}{{ acara.waktu_selesai ? ' - ' + acara.waktu_selesai : '' }} WIB</span>
          </li>
          <li v-if="acara.lokasi">
            <MapPin :size="15" />
            <span>{{ acara.lokasi }}</span>
          </li>
          <li v-if="acara.pemateri">
            <User :size="15" />
            <span>{{ acara.pemateri }}</span>
          </li>
        </ul>

        <p v-if="acara.keterangan" class="sa-desc">{{ acara.keterangan }}</p>
      </div>

      <footer class="sa-foot">
        <div class="sa-cta">
          <p class="sa-ajakan">Info selengkapnya</p>
          <p class="sa-situs">masjid-albirru.id</p>
        </div>
      </footer>
    </div>
  </div>
</template>

<style scoped>
.sa-layer {
  position: fixed;
  top: 0;
  left: -10000px;
  z-index: -1;
}

.sa-status {
  width: 540px;
  height: 960px;
  padding: 56px 44px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  background: #0d3d45;
  color: #ffffff;
  font-family: 'Lato', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  overflow: hidden;
}

.sa-head {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.sa-brand {
  font-size: 17px;
  font-weight: 700;
  letter-spacing: 0.5px;
  color: #ffffff;
}

/* Garis hairline emas: identity motif dari DESIGN.md */
.sa-motif {
  width: 56px;
  height: 2px;
  background: #e8c97a;
}

.sa-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 18px;
  min-height: 0;
}

.sa-label {
  margin: 0;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: #33bdd4;
}

.sa-nama {
  margin: 0;
  font-size: 38px;
  font-weight: 700;
  line-height: 1.2;
}

.sa-date-block {
  display: flex;
  align-items: center;
  gap: 18px;
}

.sa-date-box {
  width: 96px;
  flex-shrink: 0;
  background: #ffffff;
  color: #0d3d45;
  border-radius: 14px;
  padding: 16px 8px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
}

.sa-day {
  font-size: 44px;
  font-weight: 800;
  line-height: 1;
}

.sa-month {
  font-size: 14px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.sa-year {
  font-size: 12px;
  font-weight: 600;
  opacity: 0.8;
}

.sa-date-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.sa-weekday {
  font-size: 20px;
  font-weight: 700;
  color: #ffffff;
}

.sa-countdown {
  font-size: 14px;
  font-weight: 600;
  color: #33bdd4;
}

.sa-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.sa-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 99px;
  font-size: 12px;
  font-weight: 700;
}

.sa-info {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sa-info li {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: 15px;
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.4;
}

.sa-info li svg {
  flex-shrink: 0;
  margin-top: 2px;
  color: #33bdd4;
}

.sa-desc {
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.85);
  overflow-wrap: break-word;
}

.sa-foot {
  margin-top: auto;
  padding-top: 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.12);
}

.sa-cta {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.sa-ajakan {
  margin: 0;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.85);
}

.sa-situs {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: #ffffff;
}
</style>
