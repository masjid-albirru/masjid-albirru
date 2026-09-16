<script setup>
import { ref, onMounted } from 'vue'
import { withBase } from 'vitepress'
import { Play, Youtube, CalendarDays } from 'lucide-vue-next'

const CHANNEL_URL = 'https://www.youtube.com/channel/UCbEPa8MAlTIzLkm_5brGjGQ'

const videos = ref([])
const loading = ref(true)
const error = ref(false)
const videoAktif = ref(null) // id video yang sedang diputar (lite-embed)

onMounted(async () => {
  try {
    const res = await fetch(withBase('/data/youtube.json'))
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const json = await res.json()
    videos.value = json.videos ?? []
  } catch {
    error.value = true
  } finally {
    loading.value = false
  }
})

function formatTanggal(str) {
  return new Date(str).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric'
  })
}
</script>

<template>
  <div class="video-kajian">

    <!-- Loading -->
    <div v-if="loading" class="vk-status">
      <span class="spinner"></span> Memuat video...
    </div>

    <!-- Error -->
    <div v-else-if="error" class="vk-status vk-status--error">
      Gagal memuat video. Periksa koneksi internet.
    </div>

    <!-- Kosong -->
    <div v-else-if="videos.length === 0" class="vk-status">
      Belum ada video yang diunggah.
    </div>

    <!-- Grid video -->
    <div v-else class="vk-grid">
      <article
        v-for="video in videos"
        :key="video.id"
        class="vk-kartu"
      >
        <!-- Player (lite-embed: iframe hanya dibuat saat diklik) -->
        <div v-if="videoAktif === video.id" class="vk-player">
          <iframe
            :src="`https://www.youtube-nocookie.com/embed/${video.id}?autoplay=1&rel=0`"
            :title="video.title"
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowfullscreen
          ></iframe>
        </div>

        <!-- Thumbnail + tombol play -->
        <button
          v-else
          type="button"
          class="vk-thumb"
          :aria-label="`Putar video: ${video.title}`"
          @click="videoAktif = video.id"
        >
          <img
            :src="video.thumbnail || `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`"
            :alt="`Thumbnail video: ${video.title}`"
            loading="lazy"
            @error="$event.target.src = `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`"
          />
          <span class="vk-play">
            <Play :size="22" class="vk-play-ikon" />
          </span>
        </button>

        <!-- Info -->
        <div class="vk-info">
          <a
            class="vk-judul"
            :href="`https://www.youtube.com/watch?v=${video.id}`"
            target="_blank"
            rel="noopener noreferrer"
          >{{ video.title }}</a>
          <div class="vk-tanggal">
            <CalendarDays :size="12" />
            {{ formatTanggal(video.published) }}
          </div>
        </div>
      </article>
    </div>

    <!-- Footer -->
    <div v-if="!loading && !error && videos.length" class="vk-footer">
      <a :href="CHANNEL_URL" target="_blank" rel="noopener noreferrer" class="vk-footer-link">
        <Youtube :size="14" />
        Lihat semua video di kanal YouTube
      </a>
    </div>
  </div>
</template>

<style scoped>
.video-kajian {
  margin: 2rem 0;
}

/* Status */
.vk-status {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 2rem 1rem;
  border: 1px dashed var(--warm-border);
  border-radius: 12px;
  color: var(--vp-c-text-2);
  font-size: 0.88rem;
  background: var(--warm-bg);
}

.vk-status--error {
  border-color: rgba(220, 38, 38, 0.35);
  color: #b91c1c;
}

.dark .vk-status--error {
  color: #fca5a5;
}

/* Grid */
.vk-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

@media (max-width: 768px) {
  .vk-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
}

@media (max-width: 480px) {
  .vk-grid {
    grid-template-columns: 1fr;
  }
}

/* Kartu */
.vk-kartu {
  border: 1px solid var(--warm-border);
  border-radius: 12px;
  overflow: hidden;
  background: var(--warm-bg);
  transition: border-color 0.15s ease;
}

.vk-kartu:hover {
  border-color: var(--teal-600);
}

/* Thumbnail & player */
.vk-thumb {
  position: relative;
  display: block;
  width: 100%;
  aspect-ratio: 16 / 9;
  padding: 0;
  border: none;
  background: var(--teal-900);
  cursor: pointer;
}

.vk-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.vk-play {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.vk-play-ikon {
  width: 44px;
  height: 44px;
  padding: 12px;
  box-sizing: content-box;
  background: var(--teal-700);
  color: #fff;
  border-radius: 999px;
  transition: background 0.15s ease;
}

.vk-thumb:hover .vk-play-ikon,
.vk-thumb:focus-visible .vk-play-ikon {
  background: var(--teal-600);
}

.vk-player {
  aspect-ratio: 16 / 9;
  background: #000;
}

.vk-player iframe {
  width: 100%;
  height: 100%;
  border: 0;
  display: block;
}

/* Info */
.vk-info {
  padding: 10px 12px 12px;
}

.vk-judul {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  font-size: 0.85rem;
  font-weight: 600;
  line-height: 1.4;
  color: var(--vp-c-text-1);
  text-decoration: none;
}

.vk-judul:hover {
  color: var(--teal-600);
}

.vk-tanggal {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 6px;
  font-size: 0.72rem;
  color: var(--vp-c-text-2);
}

/* Footer */
.vk-footer {
  margin-top: 14px;
  text-align: center;
}

.vk-footer-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--teal-700);
  text-decoration: none;
}

.vk-footer-link:hover {
  color: var(--teal-600);
  text-decoration: underline;
}

.dark .vk-footer-link {
  color: var(--teal-400);
}

.dark .vk-footer-link:hover {
  color: var(--teal-500);
}
</style>
