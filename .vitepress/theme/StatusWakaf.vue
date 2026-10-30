<script setup>
/**
 * StatusWakaf — kartu share 900x1600 (9:16) untuk Story/Status WhatsApp.
 * Dirender di luar layar, lalu diekspor 1:1 (900x1600) oleh TombolShareWakaf.vue.
 *
 * Kanvas 900 px, margin 80 px. Konten hanya di y 224-1280 (zona aman
 * atas 224, bawah 320); latar gradien boleh memenuhi seluruh kanvas.
 *
 * Warna dipatok (bukan CSS var) supaya hasil ekspor sama di mode terang
 * maupun gelap. Satu aksen saja: emas #e8c97a.
 */
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { useData } from 'vitepress'
import { REKENING } from './donasiData.js'
import { rupiah, luasM2, formatPersen, HARGA_PER_M2 } from './wakafData.js'

const { site } = useData()

const props = defineProps({
  ringkasan: { type: Object, required: true },
  wilayah: { type: Array, default: () => [] },
})

/** Nama lengkap pengurus: dipakai untuk CTA dan "a.n." rekening. */
const NAMA_PENGURUS = 'Pimpinan Ranting Muhammadiyah Cinangka'

/** Ajakan di footer. Harga diambil dari HARGA_PER_M2, bukan ditulis mati. */
const ajakan = `Mari bersama-sama mewakafkan tanah bersama Pimpinan Ranting Muhammadiyah Cinangka, Rp${Number(HARGA_PER_M2).toLocaleString('id-ID')} per meter persegi.`

const rekening = REKENING[1]
const namaBank = rekening.bank.replace(/\s*\(.*\)$/, '')

// Aset dimuat sebagai data URL agar html-to-image mengekspornya utuh
// (terutama di Safari/iOS).
const muhammadiyah = ref('')
/** Elemen kartu, dipakai untuk mengukur ruang tabel. */
const kartu = ref(null)

function aset(path) {
  return site.value.base.replace(/\/$/, '') + path
}

async function keDataUrl(url, tipe) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  if (tipe === 'svg') {
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(await res.text())
  }
  const blob = await res.blob()
  return await new Promise((selesai, gagal) => {
    const baca = new FileReader()
    baca.onload = () => selesai(baca.result)
    baca.onerror = gagal
    baca.readAsDataURL(blob)
  })
}

onMounted(async () => {
  try {
    muhammadiyah.value = await keDataUrl(aset('/images/Muhammadiyah.svg'), 'svg')
  } catch (e) {
    console.error('Gagal memuat logo Muhammadiyah:', e)
  }

  // Font yang baru termuat bisa mengubah tinggi baris tabel.
  if (document.fonts?.ready) document.fonts.ready.then(() => hitungBatas())
  await hitungBatas()
})

watch(() => props.wilayah, hitungBatas)
watch(() => props.ringkasan, hitungBatas)

/** Persentase dana terkumpul terhadap target dana (bukan target luas). */
const persenDana = computed(() => {
  const target = props.ringkasan.totalNilai
  if (!target) return 0
  return Math.min((props.ringkasan.totalSetoran / target) * 100, 100)
})

/** Angka luas tanpa satuan; satuan "m²" dirender terpisah sebagai <sup>. */
const angkaLuas = computed(() => luasM2(props.ringkasan.totalM2).replace(/\s*m²$/, ''))

/** Wilayah yang sudah ada wakifnya, terbesar lebih dulu. */
const wilayahTerisi = computed(() =>
  [...props.wilayah].filter(w => w.luas > 0).sort((a, b) => b.luas - a.luas)
)

/**
 * Jumlah wilayah yang tampil. Dihitung dari ruang yang tersisa, bukan dari
 * panjang nama: nama wilayah panjang membungkus ke dua baris sehingga
 * tinggi baris tidak bisa ditebak. Sisanya dirangkum "+N wilayah lain".
 */
const batasTampil = ref(0)

/**
 * Ruang tinggi untuk baris "+N wilayah lain" (12 margin + 26 x 1.25).
 * Hanya dipakai sebagai cadangan saat mengukur.
 */
const JARAK_AKHIR = 40

/**
 * Jumlah wilayah yang tampil ditentukan dari jarak nyata isi ke footer,
 * bukan dari rekonstruksi tinggi (margin yang runtuh di luar flow flex
 * membuat hasil hitungan meleset).
 *
 * Dipindai dari jumlah terbanyak ke paling sedikit, lalu diambil yang
 * pertama muat. Urutannya penting: saat semua wilayah tampil, baris
 * "+N wilayah lain" tidak dirender, sehingga ruang melompat naik. Berhenti
 * pada kegagalan pertama (cara lama) justru membuang baris yang sebenarnya
 * masih muat.
 */
async function hitungBatas() {
  const akar = kartu.value
  if (!akar) return
  const total = wilayahTerisi.value.length
  if (!total) { batasTampil.value = 0; return }

  const grid = akar.querySelector('.sw-grid')
  const footer = akar.querySelector('.sw-foot')

  /** Jarak kosong dari isi tabel (termasuk baris sisa) ke atas footer. */
  const jarak = () => {
    const sisa = akar.querySelector('.sw-sisa')
    const bawah = Math.max(
      grid.getBoundingClientRect().bottom,
      sisa ? sisa.getBoundingClientRect().bottom : -Infinity,
    )
    return footer.getBoundingClientRect().top - bawah
  }

  let pilihan = 1
  for (let n = total; n >= 1; n--) {
    batasTampil.value = n
    await nextTick()
    if (jarak() >= JARAK_AKHIR) { pilihan = n; break }
  }

  // Kalau bahkan satu baris pun tidak muat, tetap tampilkan satu supaya
  // tabel tidak kosong tanpa alasan.
  batasTampil.value = pilihan
  await nextTick()
}

const tabelTampil = computed(() => wilayahTerisi.value.slice(0, batasTampil.value))

const sisaWilayah = computed(() => {
  const tampil = tabelTampil.value.length
  const semua = wilayahTerisi.value
  if (semua.length <= tampil) return null
  const sisa = semua.slice(tampil)
  return {
    jumlah: sisa.length,
    luas: sisa.reduce((s, w) => s + w.luas, 0),
  }
})

// Grain inline (SVG feTurbulence sebagai data URL) menekan banding gradien
// pada hasil ekspor PNG.
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
    <div class="sw-status" ref="kartu">
      <div class="sw-grain" :style="{ backgroundImage: grainCss }"></div>
      <img v-if="muhammadiyah" class="sw-watermark" :src="muhammadiyah" alt="">

      <!-- Identitas: logo Muhammadiyah di atas, nama di bawahnya -->
      <header class="sw-head">
        <div class="sw-pr">
          <span class="sw-plate">
            <img v-if="muhammadiyah" :src="muhammadiyah" alt="">
          </span>
          <p class="sw-pr-teks">Pimpinan Ranting<br>Muhammadiyah Cinangka</p>
        </div>
      </header>

      <div class="sw-body" :class="{ 'sw-body--padat': !tabelTampil.length }">
        <section class="sw-hero">
          <p class="sw-eyebrow">Wakaf Tanah</p>
          <p class="sw-judul">Pembebasan Tanah</p>
          <p class="sw-luas">{{ angkaLuas }} m<sup>²</sup></p>
          <p class="sw-luas-label">Luas wakaf yang diperoleh saat ini</p>
        </section>

        <section class="sw-dana">
          <div
            class="sw-bar"
            role="progressbar"
            :aria-valuenow="Math.round(persenDana * 100) / 100"
            aria-valuemin="0"
            aria-valuemax="100"
            :aria-label="`Dana terkumpul ${formatPersen(persenDana)} persen`"
          >
            <div class="sw-bar-fill" :style="{ width: Math.max(persenDana, 1.2) + '%' }"></div>
          </div>

          <div class="sw-dana-baris">
            <p class="sw-dana-nilai">{{ rupiah(ringkasan.totalSetoran) }}</p>
            <p class="sw-target">dari target {{ rupiah(ringkasan.totalNilai) }}</p>
          </div>

          <div class="sw-dana-baris sw-dana-baris--meta">
            <p class="sw-dana-label">Dana terkumpul · <span class="sw-persen">{{ formatPersen(persenDana) }}%</span></p>
            <p v-if="ringkasan.diperbarui" class="sw-update">Diperbarui {{ ringkasan.diperbarui }}</p>
          </div>
        </section>

        <section v-if="tabelTampil.length" class="sw-rincian">
          <p class="sw-rincian-judul">Rincian per wilayah</p>
          <div class="sw-grid">
            <div
              v-for="(w, i) in wilayahTerisi"
              :key="w.nama"
              v-show="i < batasTampil"
              class="sw-sel"
            >
              <span class="sw-sel-nama">{{ w.nama }}</span>
              <span class="sw-sel-nilai">{{ luasM2(w.luas) }}</span>
            </div>
          </div>

          <p v-if="sisaWilayah" class="sw-sisa">
            +{{ sisaWilayah.jumlah }} wilayah lain
            <span class="sw-sisa-nilai">{{ luasM2(sisaWilayah.luas) }}</span>
          </p>
        </section>
      </div>

      <footer class="sw-foot">
        <div class="sw-rekening">
          <p class="sw-bank">{{ namaBank }}</p>
          <p class="sw-nomor">{{ rekening.no }}</p>
          <p class="sw-atas">a.n. {{ NAMA_PENGURUS }}</p>
          <p class="sw-ajakan">{{ ajakan }}</p>
        </div>
      </footer>
    </div>
  </div>
</template>

<style scoped>
/* Pembawa di luar layar. Kanvas 900x1600, diekspor 1:1. */
.sw-layer {
  position: fixed;
  top: 0;
  left: -12000px;
  width: 900px;
  pointer-events: none;
}

/* Selektor di-prefix .sw-status agar tidak kalah dari gaya .vp-doc. */
.sw-status {
  position: relative;
  width: 900px;
  height: 1600px;
  box-sizing: border-box;
  display: grid;
  grid-template-rows: 1fr auto;
  padding: 224px 80px 320px;
  background: linear-gradient(180deg, #0d3d45 0%, #0b4f5a 100%);
  color: #ffffff;
  font-family: 'Lato', 'Segoe UI', sans-serif;
  text-align: left;
  overflow: hidden;
}

.sw-status .sw-grain {
  position: absolute;
  inset: 0;
  z-index: 0;
  opacity: 0.05;
  pointer-events: none;
}

/* Watermark logo Muhammadiyah di belakang konten. Opacity rendah supaya
   tidak menurunkan kontras teks di atasnya; lapisan teks ada di z-index 2. */
.sw-status .sw-watermark {
  position: absolute;
  left: 50%;
  top: 860px;
  width: 720px;
  height: auto;
  transform: translateX(-50%);
  opacity: 0.1;
  z-index: 1;
  pointer-events: none;
}

/* Header */
/* Header: pita atas di luar flow grid. Blok dimulai y 60 (di bawah baris UI
   aplikasi Story) dan berakhir sebelum y 224, sehingga body tidak kehilangan
   ruang. Teks lebih lebar dari logo, jadi blok di-center kanvas. */
.sw-status .sw-head {
  position: absolute;
  top: 60px;
  left: 80px;
  right: 80px;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
}
.sw-status .sw-pr {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}
.sw-status .sw-pr-teks {
  margin: 0;
  font-size: 25px;
  line-height: 1.2;
  text-align: center;
  color: rgba(255, 255, 255, 0.86);
  white-space: nowrap;
}
.sw-status .sw-plate {
  flex: 0 0 auto;
  width: 76px;
  height: 76px;
  box-sizing: border-box;
  padding: 8px;
  border-radius: 50%;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
}
.sw-status .sw-plate img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
}

/* Body */
.sw-status .sw-body {
  position: relative;
  z-index: 2;
  min-height: 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  gap: 6px;
  overflow: hidden;
}
.sw-status .sw-body--padat {
  gap: 44px;
}
.sw-status .sw-hero,
.sw-status .sw-dana,
.sw-status .sw-rincian {
  flex: 0 0 auto;
}

.sw-status .sw-eyebrow {
  margin: 40px 0 0;
  font-size: 26px;
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #ebcb86;
}
.sw-status .sw-judul {
  margin: 4px 0 0;
  font-size: 58px;
  font-weight: 700;
  line-height: 1.1;
  color: #ffffff;
}
.sw-status .sw-luas {
  margin: 4px 0 0;
  font-size: 148px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: -0.04em;
  font-variant-numeric: tabular-nums;
  color: #ffffff;
  white-space: nowrap;
}
.sw-status .sw-luas sup {
  font-size: 0.46em;
  vertical-align: top;
  position: relative;
  top: 0.12em;
  margin-left: 0.02em;
}
.sw-status .sw-luas-label {
  margin: 6px 0 0;
  font-size: 28px;
  line-height: 1.2;
  color: rgba(255, 255, 255, 0.86);
}

/* Progress */
.sw-status .sw-bar {
  position: relative;
  height: 16px;
  margin: 18px 0 0;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.2);
  overflow: hidden;
}
.sw-status .sw-bar-fill {
  height: 100%;
  background: #ebcb86;
  border-radius: 8px;
  min-width: 0;
}

/* Dana */
.sw-status .sw-dana-baris {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 24px;
  margin-top: 16px;
}
.sw-status .sw-dana-baris--meta {
  margin-top: 4px;
}
.sw-status .sw-dana-nilai {
  margin: 0;
  font-size: 46px;
  font-weight: 700;
  line-height: 1.1;
  font-variant-numeric: tabular-nums;
  color: #ffffff;
  white-space: nowrap;
}
.sw-status .sw-target,
.sw-status .sw-update {
  margin: 0;
  font-size: 26px;
  line-height: 1.25;
  color: rgba(255, 255, 255, 0.86);
  text-align: right;
  white-space: nowrap;
}
.sw-status .sw-dana-label {
  margin: 0;
  font-size: 26px;
  line-height: 1.25;
  color: rgba(255, 255, 255, 0.72);
  white-space: nowrap;
}
.sw-status .sw-persen {
  font-weight: 700;
  color: #ebcb86;
}

/* Rincian */
.sw-status .sw-rincian-judul {
  margin: 2px 0 4px;
  font-size: 24px;
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.72);
}
.sw-status .sw-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  column-gap: 48px;
}
.sw-status .sw-sel {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 16px;
  min-height: 54px;
  padding: 10px 0 9px;
  box-sizing: border-box;
  border-bottom: 1px solid rgba(255, 255, 255, 0.28);
  font-size: 30px;
  line-height: 1.15;
  min-width: 0;
}
.sw-status .sw-sel-nama {
  font-weight: 500;
  color: rgba(255, 255, 255, 0.86);
  overflow-wrap: break-word;
  min-width: 0;
}
.sw-status .sw-sel-nilai {
  font-weight: 700;
  color: #ffffff;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}
.sw-status .sw-sisa {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  margin: 12px 0 0;
  font-size: 26px;
  line-height: 1.25;
  color: rgba(255, 255, 255, 0.86);
}
.sw-status .sw-sisa-nilai {
  font-weight: 700;
  color: #ffffff;
}

/* Footer */
.sw-status .sw-foot {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 28px;
}
.sw-status .sw-rekening {
  min-width: 0;
  display: flex;
  flex-direction: column;
}
.sw-status .sw-bank {
  margin: 0;
  font-size: 28px;
  line-height: 1.12;
  color: rgba(255, 255, 255, 0.86);
}
.sw-status .sw-nomor {
  margin: 0;
  font-size: 50px;
  font-weight: 800;
  line-height: 1.02;
  font-variant-numeric: tabular-nums;
  color: #ffffff;
}
.sw-status .sw-atas {
  margin: 0;
  font-size: 26px;
  line-height: 1.16;
  color: rgba(255, 255, 255, 0.86);
  text-wrap: balance;
}
.sw-status .sw-ajakan {
  margin: 12px 0 0;
  font-size: 26px;
  font-weight: 700;
  line-height: 1.2;
  color: #ebcb86;
  text-wrap: balance;
}

</style>
