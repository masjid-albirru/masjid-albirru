<script setup>
/**
 * StatusDonasi — kartu gambar 9:16 untuk status WhatsApp.
 * Dirender di luar layar, dikonversi ke PNG oleh ProgramDonasi.vue.
 * Warna dipatok light-theme (bukan CSS var) agar hasil gambar konsisten
 * di mode gelap maupun terang.
 */
import { ref, onMounted } from 'vue'
import { useData } from 'vitepress'
import QRCode from 'qrcode'
import { CalendarClock } from 'lucide-vue-next'
import { QRIS_STRING } from './donasiData.js'

const { site } = useData()

// Logo emblem untuk watermark — path base-aware agar aman bila
// config.base berubah. Sama dengan StatusAcara.
const logoUrl = site.value.base.replace(/\/$/, '') + '/images/uploads/logo-al-birru.png'

defineProps({
  program: { type: Object, required: true },
})

// QR QRIS digenerate sekali saat mount sebagai data URL —
// html-to-image merender <img> data URL tanpa masalah CORS.
const qrDataUrl = ref('')

onMounted(async () => {
  try {
    qrDataUrl.value = await QRCode.toDataURL(QRIS_STRING, {
      width: 480,
      margin: 1,
      errorCorrectionLevel: 'M',
      color: { dark: '#0d3d45', light: '#ffffff' },
    })
  } catch (e) {
    console.error('Gagal generate QR QRIS:', e)
  }
})

function angka(v) {
  // Terima "65000000" maupun "Rp 65.000.000" — sama dengan ProgramDonasi.
  const n = parseInt(String(v ?? '').replace(/[^0-9-]/g, ''), 10)
  return isNaN(n) ? 0 : n
}

function rupiah(v) {
  return 'Rp ' + Number(v).toLocaleString('id-ID')
}

function persen(p) {
  const target = angka(p.target)
  if (target <= 0) return 0
  return Math.min(Math.round((angka(p.terkumpul) / target) * 100), 100)
}

// Grain inline (SVG feTurbulence sebagai data URL): menekan banding pada
// gradien saat diekspor jadi PNG status WA. Bukan file eksternal —
// html-to-image merender data URL tanpa masalah CORS. Opacity 0.05
// (terlihat di PNG nyata, hampir tak terlihat di layar).
const GRAIN_URL =
  'data:image/svg+xml,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120">` +
      `<filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/>` +
      `<feColorMatrix type="saturate" values="0"/></filter>` +
      `<rect width="120" height="120" filter="url(%23n)" opacity="0.5"/></svg>`
  )

// Dipakai lewat binding style; dibungkus kutip agar tanda kurung dalam
// data URL tidak merusak fungsi CSS url().
const grainCss = 'url("' + GRAIN_URL + '")'
</script>

<template>
  <div class="sd-layer" aria-hidden="true">
    <div class="sd-status">
      <img class="sd-watermark" :src="logoUrl" alt="">
      <div class="sd-grain" :style="{ backgroundImage: grainCss }"></div>

      <header class="sd-head">
        <div class="sd-brand">Masjid Al-Birru</div>
        <div class="sd-motif"></div>
      </header>

      <div class="sd-body">
        <p class="sd-label">Program Donasi</p>
        <h4 class="sd-nama">{{ program.nama }}</h4>
        <p v-if="program.deskripsi" class="sd-deskripsi">{{ program.deskripsi }}</p>

        <div class="sd-fokus">
          <span class="sd-persen">{{ persen(program) }}%</span>
          <span class="sd-persen-caption">terkumpul</span>
        </div>

        <div class="sd-bar">
          <div
            class="sd-bar-fill"
            :style="{ width: persen(program) + '%' }"
          ></div>
        </div>

        <div class="sd-angka">
          <span class="sd-terkumpul">{{ rupiah(angka(program.terkumpul)) }}</span>
          <span class="sd-target">dari {{ rupiah(angka(program.target)) }}</span>
        </div>

        <p v-if="program.deadline" class="sd-deadline">Sampai {{ program.deadline }}</p>
      </div>

      <footer class="sd-foot">
        <div v-if="qrDataUrl" class="sd-qr">
          <span class="sd-qr-merchant">DKM AL-BIRRU</span>
          <img :src="qrDataUrl" alt="" width="170" height="170">
          <span class="sd-qr-caption">Scan QRIS</span>
        </div>
        <div class="sd-cta">
          <p class="sd-ajakan">Salurkan donasi Anda</p>
          <p class="sd-situs">masjid-albirru.id</p>
          <p class="sd-rekening">BSI 7192880558 a.n. DKM Al Birru</p>
        </div>
      </footer>
    </div>
  </div>
</template>

<style scoped>
/* Pembawa di luar layar; ukuran 540x960, diekspor @2x jadi 1080x1920 */
.sd-layer {
  position: fixed;
  top: 0;
  left: -10000px;
  width: 540px;
  pointer-events: none;
}

.sd-status {
  position: relative;
  width: 540px;
  height: 960px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  padding: 56px 52px;
  /* Gradien dua-nada (alasan hierarki: identitas atas gelap -> aksi bawah terang),
     bukan dekorasi — sesuai DESIGN.md §dials ENERGY 1. */
  background: linear-gradient(180deg, #0d3d45 0%, #0f6b78 100%);
  color: #ffffff;
  font-family: 'Lato', 'Segoe UI', sans-serif;
  text-align: left;
  overflow: hidden;
}

/* Watermark logo emblem: sama dengan StatusAcara agar kartu terlihat
   satu seri. object-fit cover + object-position top memotong sisa
   wordmark gelap yang ikut dalam file aset. */
.sd-watermark {
  position: absolute;
  right: -60px;
  bottom: -130px;
  z-index: 0;
  width: 470px;
  height: 470px;
  object-fit: cover;
  object-position: top;
  opacity: 0.07;
  pointer-events: none;
  user-select: none;
}

/* Grain menekan banding gradien di hasil ekspor PNG */
.sd-grain {
  position: absolute;
  inset: 0;
  z-index: 0;
  opacity: 0.05;
  pointer-events: none;
}

.sd-head {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.sd-brand {
  font-size: 17px;
  font-weight: 700;
  letter-spacing: 0.5px;
}

/* Garis hairline emas: identity motif dari DESIGN.md */
.sd-motif {
  width: 56px;
  height: 2px;
  background: #e8c97a;
}

.sd-body {
  position: relative;
  z-index: 2;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 14px;
  min-height: 0;
}

.sd-label {
  margin: 0;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: #33bdd4;
}

.sd-nama {
  margin: 0;
  font-size: 38px;
  font-weight: 700;
  line-height: 1.25;
}

.sd-deskripsi {
  margin: 0;
  /* Diperkecil sedikit supaya deskripsi panjang dari CSV tetap muat
     penuh di kanvas 9:16 tanpa dipotong. */
  font-size: 14px;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.85);
  overflow-wrap: break-word;
}

/* Fokus tunggal kartu: persentase capaian */
.sd-fokus {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.sd-persen {
  font-size: 88px;
  font-weight: 700;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

.sd-persen-caption {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.85);
}

.sd-bar {
  height: 10px;
  border-radius: 99px;
  background: rgba(255, 255, 255, 0.18);
  overflow: hidden;
}

.sd-bar-fill {
  height: 100%;
  border-radius: 99px;
  background: #33bdd4;
}

.sd-angka {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 8px;
  font-variant-numeric: tabular-nums;
}

.sd-terkumpul {
  font-size: 26px;
  font-weight: 700;
}

.sd-target {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.85);
}

.sd-deadline {
  margin: 0;
  font-size: 15px;
  color: rgba(255, 255, 255, 0.85);
}

.sd-foot {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 28px;
  padding-top: 28px;
  border-top: 1px solid rgba(255, 255, 255, 0.16);
}

/* Kartu QR putih agar mudah discan dari status WA */
.sd-qr {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  background: #ffffff;
  border-radius: 14px;
  padding: 12px 12px 8px;
}

.sd-qr img {
  display: block;
  width: 170px;
  height: 170px;
}

.sd-qr-merchant {
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.5px;
  color: #0d3d45;
}

.sd-qr-caption {
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: #0d3d45;
}

.sd-cta {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.sd-ajakan {
  margin: 0;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.85);
}

.sd-situs {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  /* Putih, bukan teal-400: kontras 6.2:1 di footer (area gradien terang),
     teal-400 hanya 2.75:1 di sana. */
  color: #ffffff;
}

.sd-rekening {
  margin: 0;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.85);
  font-variant-numeric: tabular-nums;
}
</style>
