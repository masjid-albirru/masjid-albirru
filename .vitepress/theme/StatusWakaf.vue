<script setup>
/**
 * StatusWakaf — kartu 9:16 untuk dibagikan ke WhatsApp.
 * Dirender di luar layar lalu dikonversi ke PNG oleh TombolShareWakaf.vue.
 * Warna dipatok light-theme (bukan CSS var) supaya hasil gambarnya
 * sama di mode terang maupun gelap, sama seperti StatusDonasi.vue.
 */
import { ref, computed, onMounted } from 'vue'
import { useData } from 'vitepress'
import QRCode from 'qrcode'
import { QRIS_STRING, REKENING } from './donasiData.js'
import { rupiah, luasM2, LUAS_TARGET_M2 } from './wakafData.js'

const { site } = useData()

const logoUrl = site.value.base.replace(/\/$/, '') + '/images/uploads/logo-al-birru.png'

const props = defineProps({
  ringkasan: { type: Object, required: true },
  wilayah: { type: Array, default: () => [] },
})

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

const rekening = REKENING[0]

const persen = computed(() => {
  const nilai = props.ringkasan.totalNilai
  if (!nilai) return 0
  return Math.min(Math.round((props.ringkasan.totalSetoran / nilai) * 100), 100)
})

// Hanya wilayah yang sudah ada wakifnya; wilayah kosong tidak ada artinya di kartu.
const wilayahTerisi = computed(() =>
  [...props.wilayah].filter(w => w.luas > 0).sort((a, b) => b.luas - a.luas)
)

// Grain inline (SVG feTurbulence sebagai data URL): menekan banding pada
// gradien saat diekspor jadi PNG. Sama seperti kartu status donasi.
const GRAIN_URL =
  'data:image/svg+xml,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120">` +
      `<filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/>` +
      `<feColorMatrix type="saturate" values="0"/></filter>` +
      `<rect width="120" height="120" filter="url(%23n)" opacity="0.5"/></svg>`
  )

const grainCss = 'url("' + GRAIN_URL + '")'
</script>

<template>
  <div class="sw-layer" aria-hidden="true">
    <div class="sw-status">
      <img class="sw-watermark" :src="logoUrl" alt="">
      <div class="sw-grain" :style="{ backgroundImage: grainCss }"></div>

      <header class="sw-head">
        <div class="sw-brand">Masjid Al-Birru</div>
        <div class="sw-motif"></div>
      </header>

      <div class="sw-body">
        <p class="sw-label">Wakaf Tanah</p>
        <h4 class="sw-nama">Pembebasan Tanah H. Basir</h4>

        <div class="sw-fokus">
          <span class="sw-luas">{{ luasM2(ringkasan.totalM2) }}</span>
          <span class="sw-luas-caption">luas wakaf yang sudah dihimpun</span>
        </div>

        <div class="sw-bar">
          <div class="sw-bar-fill" :style="{ width: persen + '%' }"></div>
        </div>

        <div class="sw-angka">
          <span class="sw-terkumpul">{{ rupiah(ringkasan.totalSetoran) }}</span>
          <span class="sw-target">dari target {{ rupiah(ringkasan.totalNilai) }}</span>
        </div>

        <ul v-if="wilayahTerisi.length" class="sw-wilayah">
          <li v-for="w in wilayahTerisi" :key="w.nama" class="sw-wilayah-item">
            <span class="sw-wilayah-nama">{{ w.nama }}</span>
            <span class="sw-wilayah-luas">{{ luasM2(w.luas) }}</span>
          </li>
        </ul>
      </div>

      <footer class="sw-foot">
        <div v-if="qrDataUrl" class="sw-qr">
          <span class="sw-qr-merchant">DKM AL-BIRRU</span>
          <img :src="qrDataUrl" alt="" width="170" height="170">
          <span class="sw-qr-caption">Scan QRIS</span>
        </div>
        <div class="sw-cta">
          <p class="sw-ajakan">Mari mewakafkan tanah masjid bersama</p>
          <p class="sw-situs">masjid-albirru.id/wakaf-tanah</p>
          <p class="sw-rekening">
            {{ rekening.bank.split(' (')[0] }} {{ rekening.no }} a.n. {{ rekening.atas }}
          </p>
          <p class="sw-pengurus">PR Muhammadiyah Cinangka</p>
        </div>
      </footer>
    </div>
  </div>
</template>

<style scoped>
/* Pembawa di luar layar; ukuran 540x960, diekspor @2x jadi 1080x1920 */
.sw-layer {
  position: fixed;
  top: 0;
  left: -10000px;
  width: 540px;
  pointer-events: none;
}

.sw-status {
  position: relative;
  width: 540px;
  height: 960px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  padding: 52px 48px;
  /* Gradien dua nada sebagai pemisah hierarki: identitas atas gelap, ajakan
     bawah tetap gelap namun diberi garis motif emas. Satu seri dengan
     StatusDonasi agar kartu masjid ini terbaca satu keluarga. */
  background: linear-gradient(180deg, #0d3d45 0%, #0f6b78 100%);
  color: #ffffff;
  font-family: 'Lato', 'Segoe UI', sans-serif;
  text-align: left;
  overflow: hidden;
}

.sw-watermark {
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

.sw-grain {
  position: absolute;
  inset: 0;
  z-index: 0;
  opacity: 0.05;
  pointer-events: none;
}

.sw-head {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.sw-brand {
  font-size: 17px;
  font-weight: 700;
  letter-spacing: 0.5px;
}

/* Garis hairline emas: identity motif dari DESIGN.md */
.sw-motif {
  width: 56px;
  height: 2px;
  background: #e8c97a;
}

.sw-body {
  position: relative;
  z-index: 2;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 16px;
  min-height: 0;
}

.sw-label {
  margin: 0;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: #33bdd4;
}

.sw-nama {
  margin: 0;
  font-size: 34px;
  font-weight: 700;
  line-height: 1.25;
  margin-top: -6px;
}

/* Fokus tunggal kartu: luas wakaf. Persentase_bar dan setoran ada di bawah
   sebagai informasi pendukung, bukan bersaing dengan angka luas. */
.sw-fokus {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.sw-luas {
  font-size: 82px;
  font-weight: 700;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

.sw-luas-caption {
  font-size: 16px;
  color: #e8e8e8;
}

.sw-bar {
  height: 10px;
  border-radius: 99px;
  background: rgba(255, 255, 255, 0.18);
  overflow: hidden;
  margin-top: 4px;
}

.sw-bar-fill {
  height: 100%;
  border-radius: 99px;
  background: #33bdd4;
  min-width: 4px;
}

.sw-angka {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 8px;
  font-variant-numeric: tabular-nums;
}

.sw-terkumpul {
  font-size: 25px;
  font-weight: 700;
}

.sw-target {
  font-size: 16px;
  color: #e8e8e8;
}

/* Sebaran wakaf per wilayah: dua kolom agar muat di kanvas 9:16, urutan
   mengikuti besaran wakaf supaya wilayah terbesar terbaca lebih dulu. */
.sw-wilayah {
  list-style: none;
  margin: 10px 0 0;
  padding: 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px 20px;
}

.sw-wilayah-item {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
  padding-bottom: 6px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.14);
}

.sw-wilayah-nama {
  font-size: 15px;
  color: #e8e8e8;
}

.sw-wilayah-luas {
  font-size: 16px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.sw-foot {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 24px;
  padding-top: 26px;
  border-top: 1px solid rgba(255, 255, 255, 0.16);
}

.sw-qr {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  background: #ffffff;
  border-radius: 14px;
  padding: 10px 10px 8px;
}

.sw-qr img {
  display: block;
  width: 152px;
  height: 152px;
}

.sw-qr-merchant {
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.5px;
  color: #0d3d45;
}

.sw-qr-caption {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: #0d3d45;
}

.sw-cta {
  display: flex;
  flex-direction: column;
  gap: 5px;
  min-width: 0;
}

.sw-cta p { margin: 0; }

.sw-ajakan {
  font-size: 15px;
  color: #e8e8e8;
}

.sw-situs {
  font-size: 17px;
  font-weight: 700;
  /* Putih: area bawah gradien lebih terang, teal-400 tidak cukup kontras di sini. */
  color: #ffffff;
}

.sw-rekening {
  font-size: 13px;
  color: #e8e8e8;
  font-variant-numeric: tabular-nums;
}

.sw-pengurus {
  font-size: 13px;
  color: #f7e3ab;
}
</style>