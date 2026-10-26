<script setup>
/**
 * TombolShareWakaf — membuat gambar ajakan wakaf 9:16 lalu membagikannya.
 * Dipakai di halaman wakaf-tanah dan di ringkasan beranda; logika render
 * hanya ada di sini supaya keduanya tidak berbeda.
 */
import { ref, nextTick } from 'vue'
import { ImageDown, Loader2 } from 'lucide-vue-next'
import * as htmlToImage from 'html-to-image'
import StatusWakaf from './StatusWakaf.vue'

const props = defineProps({
  ringkasan: { type: Object, required: true },
  wilayah: { type: Array, default: () => [] },
  /** Label tombol. "ringkas" dipakai di beranda supaya tidak memenuhi baris. */
  label: { type: String, default: 'Share Ajakan Wakaf' },
  ringkas: { type: Boolean, default: false },
})

const statusRef = ref(null)
const proses = ref(false)
const gagal = ref(false)

/**
 * Tunggu semua <img> di kartu selesai dimuat (QR dan dua logo diambil
 * asinkron). Tanpa ini, gambar bisa ter-ekspor tanpa logo bila jaringannya
 * lambat.
 */
async function tungguGambar(kartu, batasMs = 3000) {
  const gambar = [...kartu.querySelectorAll('img')]
  if (!gambar.length) return
  const tunggu = gambar.map(img => {
    if (img.complete && img.naturalWidth > 0) return Promise.resolve()
    return new Promise((selesai) => {
      img.addEventListener('load', selesai, { once: true })
      img.addEventListener('error', selesai, { once: true })
    })
  })
  // Jangan menggantung selamanya kalau ada aset yang macet.
  await Promise.race([
    Promise.all(tunggu),
    new Promise(r => setTimeout(r, batasMs)),
  ])
}

async function bagikan() {
  if (proses.value) return
  proses.value = true
  gagal.value = false
  try {
    await nextTick()

    const kartu = statusRef.value?.$el.querySelector('.sw-status')
    if (!kartu) throw new Error('kartu belum siap')

    await tungguGambar(kartu)
    await new Promise(r => setTimeout(r, 60)) // beri waktu font & layout settle

    // Kanvas sudah 900x1600, jadi rasio 1:1 menghasilkan PNG tepat 900x1600.
    const blob = await htmlToImage.toBlob(kartu, {
      pixelRatio: 1,
      width: 900,
      height: 1600,
      backgroundColor: '#0d3d45',
    })
    if (!blob) throw new Error('render gagal')

    const file = new File([blob], 'AJAKAN_WAKAF_TANAH.png', { type: 'image/png' })

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: 'Wakaf Tanah Masjid Al-Birru',
        text: 'Mari bersama-sama mewakafkan tanah bersama Pimpinan Ranting Muhammadiyah Cinangka, Rp2.500.000 per meter persegi.',
      })
      return
    }

    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = file.name
    a.click()
    URL.revokeObjectURL(a.href)
  } catch (e) {
    // Share sheet yang ditutup user bukan kegagalan.
    if (e && e.name !== 'AbortError') {
      console.error('Gagal membuat gambar ajakan wakaf:', e)
      gagal.value = true
    }
  } finally {
    proses.value = false
  }
}
</script>

<template>
  <div class="tsw">
    <button
      type="button"
      class="tsw-tombol"
      :class="{ 'tsw-tombol--ringkas': ringkas }"
      :disabled="proses"
      @click="bagikan"
    >
      <Loader2 v-if="proses" :size="15" class="tsw-spin" />
      <ImageDown v-else :size="15" />
      {{ proses ? 'Menyiapkan gambar...' : label }}
    </button>

    <span v-if="gagal" class="tsw-gagal" role="alert">
      Gambar gagal dibuat. Coba sekali lagi.
    </span>

    <StatusWakaf ref="statusRef" :ringkasan="ringkasan" :wilayah="wilayah" />
  </div>
</template>

<style scoped>
.tsw {
  display: inline-flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
}

.tsw-tombol {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 44px;
  padding: 8px 14px;
  font-family: inherit;
  font-size: 0.82rem;
  font-weight: 700;
  /* Emas dipakai hemat sesuai DESIGN.md: satu aksen, di momen ajakan.
     Teks teal-900 di atas emas jauh melewati kontras AA. */
  background: var(--gold);
  color: var(--teal-900);
  border: 1px solid var(--gold);
  border-radius: 8px;
  cursor: pointer;
  transition: opacity 0.2s;
}

.tsw-tombol:hover { opacity: 0.88; }
.tsw-tombol:disabled { opacity: 0.65; cursor: progress; }
.tsw-tombol:focus-visible {
  outline: 2px solid var(--teal-600);
  outline-offset: 2px;
}

.tsw-tombol--ringkas {
  font-size: 0.76rem;
  padding: 6px 10px;
  min-height: 44px;
}

.tsw-spin { animation: tsw-rot 0.9s linear infinite; }
@keyframes tsw-rot { to { transform: rotate(360deg); } }

.tsw-gagal {
  font-size: 0.72rem;
  color: var(--vp-c-text-2);
}
</style>