<script setup>
import { Hourglass } from 'lucide-vue-next'
import { withBase } from 'vitepress'

defineProps({
  compact: { type: Boolean, default: false }
})
</script>

<template>
  <div class="keu-segera" :class="{ 'keu-segera--compact': compact }">
    <div class="ksd-ikon">
      <Hourglass :size="compact ? 16 : 22" />
    </div>
    <div class="ksd-isi">
      <div class="ksd-judul">Laporan keuangan sedang disusun</div>
      <p v-if="!compact" class="ksd-teks">
        Bendahara sedang menyusun laporan periode berjalan.
        Laporan yang sudah terbit akan tampil di halaman ini setelah penyusunan selesai.
      </p>
      <p v-if="!compact" class="ksd-kontak">
        Untuk pertanyaan, hubungi Bendahara (Bpk. Iis Munandar) melalui
        <a :href="withBase('/tentang/kontak')">halaman kontak</a>.
      </p>
      <a v-if="compact" :href="withBase('/keuangan/')" class="ksd-link">Lihat info selengkapnya</a>
    </div>
  </div>
</template>

<style scoped>
.keu-segera {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 1.5rem;
  border-radius: 12px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
  margin: 1.5rem 0;
}

.keu-segera--compact {
  padding: 1rem 1.25rem;
  margin: 1rem 0;
  gap: 12px;
}

.ksd-ikon {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 10px;
  background: rgba(15, 107, 120, 0.08);
  color: var(--vp-c-brand);
}

.keu-segera--compact .ksd-ikon {
  width: 36px;
  height: 36px;
}

.ksd-judul {
  font-size: 1rem;
  font-weight: 700;
  margin-bottom: 0.35rem;
}

.keu-segera--compact .ksd-judul {
  font-size: 0.9rem;
  margin-bottom: 0.15rem;
}

.ksd-teks, .ksd-kontak {
  font-size: 0.875rem;
  color: var(--vp-c-text-2);
  margin: 0 0 0.5rem;
  line-height: 1.6;
}

.ksd-kontak { margin-bottom: 0; }

.ksd-kontak a, .ksd-link {
  color: var(--vp-c-brand);
  font-weight: 600;
  text-decoration: none;
}

.ksd-kontak a:hover, .ksd-link:hover { opacity: 0.75; }

.ksd-link { font-size: 0.82rem; }
</style>
