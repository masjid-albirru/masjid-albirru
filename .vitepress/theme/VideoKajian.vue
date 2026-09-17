<script setup>
import { ref, onMounted } from 'vue'
import { withBase } from 'vitepress'
import { Play, Youtube, CalendarDays } from 'lucide-vue-next'

const CHANNEL_URL = 'https://www.youtube.com/channel/UCbEPa8MAlTIzLkm_5brGjGQ'
const SHORTS_URL = `${CHANNEL_URL}/shorts`

const videos = ref([])
const shorts = ref([])
const loading = ref(true)
const error = ref(false)
const videoAktif = ref(null) // id video yang sedang diputar (lite-embed)
const shortAktif = ref(null) // id short yang sedang diputar (lite-embed)

onMounted(async () => {
  try {
    const res = await fetch(withBase('/data/youtube.json'))
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const json = await res.json()
    videos.value = json.videos ?? []
    shorts.value = json.shorts ?? []
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
    <div v-else-if="videos.length === 0 && shorts.length === 0" class="vk-status">
      Belum ada video yang diunggah.
    </div>

    <template v-else>
      <!-- Video reguler -->
      <section v-if="videos.length" aria-labelledby="vk-video-judul">
        <h3 id="vk-video-judul" class="vk-subjudul">Video</h3>

        <div class="vk-grid">
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
      </section>

      <!-- Link kanal, tepat di bawah grid video -->
      <div v-if="videos.length" class="vk-footer">
        <a :href="CHANNEL_URL" target="_blank" rel="noopener noreferrer" class="vk-footer-link">
          <Youtube :size="14" />
          Lihat semua video di kanal YouTube
        </a>
      </div>

      <!-- Rel Shorts -->
      <section v-if="shorts.length" class="vk-shorts" aria-labelledby="vk-shorts-judul">
        <h3 id="vk-shorts-judul" class="vk-subjudul">Shorts</h3>

        <div class="vk-shorts-rel" tabindex="0" role="region" aria-label="Daftar video Shorts">
          <article
            v-for="short in shorts"
            :key="short.id"
            class="vk-short"
          >
            <div v-if="shortAktif === short.id" class="vk-short-player">
              <iframe
                :src="`https://www.youtube-nocookie.com/embed/${short.id}?autoplay=1&rel=0`"
                :title="short.title"
                loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowfullscreen
              ></iframe>
            </div>

            <button
              v-else
              type="button"
              class="vk-short-thumb"
              :aria-label="`Putar Shorts: ${short.title}`"
              @click="shortAktif = short.id"
            >
              <img
                :src="short.thumbnail || `https://i.ytimg.com/vi/${short.id}/hqdefault.jpg`"
                :alt="`Thumbnail Shorts: ${short.title}`"
                loading="lazy"
                @error="$event.target.src = `https://i.ytimg.com/vi/${short.id}/hqdefault.jpg`"
              />
              <span class="vk-short-badge">Shorts</span>
              <span class="vk-short-play">
                <Play :size="20" class="vk-play-ikon" />
              </span>
            </button>

            <div class="vk-short-info">
              <a
                class="vk-short-judul"
                :href="`https://www.youtube.com/shorts/${short.id}`"
                target="_blank"
                rel="noopener noreferrer"
              >{{ short.title }}</a>
              <div class="vk-tanggal">
                <CalendarDays :size="12" />
                {{ formatTanggal(short.published) }}
              </div>
            </div>
          </article>
        </div>
      </section>
    </template>

    <!-- Footer: link Shorts di bawah rel Shorts -->
    <div v-if="!loading && !error && shorts.length" class="vk-footer">
      <a :href="SHORTS_URL" target="_blank" rel="noopener noreferrer" class="vk-footer-link">
        <Play :size="14" />
        Lihat semua Shorts
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

/* Shorts */
.vk-shorts {
  margin-top: 2rem;
}

.vk-subjudul {
  margin: 0 0 0.75rem;
  font-size: 1rem;
  font-weight: 700;
  color: var(--teal-700);
}

.dark .vk-subjudul {
  color: var(--teal-400);
}

/* Rel horizontal dengan scroll-snap; overflow dikurung di container ini
   sehingga tidak menimbulkan scroll horizontal pada halaman */
.vk-shorts-rel {
  --vk-short-w: 172px;
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: var(--vk-short-w);
  gap: 12px;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
  padding-bottom: 8px;
}

.vk-shorts-rel:focus-visible {
  outline: 2px solid var(--teal-600);
  outline-offset: 4px;
}

.vk-short {
  scroll-snap-align: start;
}

.vk-short-thumb {
  position: relative;
  display: block;
  width: 100%;
  aspect-ratio: 9 / 16;
  padding: 0;
  border: none;
  border-radius: 10px;
  overflow: hidden;
  background: var(--teal-900);
  cursor: pointer;
}

/* Thumbnail 4:3 dari YouTube memuat bingkai vertikal di tengah;
   object-fit: cover pada kotak 9:16 menampilkan bingkai itu tanpa pilar hitam */
.vk-short-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.vk-short-badge {
  position: absolute;
  top: 6px;
  left: 6px;
  padding: 2px 6px;
  border-radius: 4px;
  background: var(--teal-900);
  color: #fff;
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.4px;
  text-transform: uppercase;
}

.vk-short-play {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.vk-short-play .vk-play-ikon {
  width: 38px;
  height: 38px;
  padding: 10px;
}

.vk-short-thumb:hover .vk-play-ikon,
.vk-short-thumb:focus-visible .vk-play-ikon {
  background: var(--teal-600);
}

.vk-short-player {
  aspect-ratio: 9 / 16;
  border-radius: 10px;
  overflow: hidden;
  background: #000;
}

.vk-short-player iframe {
  width: 100%;
  height: 100%;
  border: 0;
  display: block;
}

.vk-short-info {
  padding: 8px 2px 0;
}

.vk-short-judul {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  font-size: 0.78rem;
  font-weight: 600;
  line-height: 1.35;
  color: var(--vp-c-text-1);
  text-decoration: none;
}

.vk-short-judul:hover {
  color: var(--teal-600);
}

/* Footer */
.vk-footer {
  margin-top: 14px;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px 18px;
}

.vk-footer-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 44px;
  padding: 4px 6px;
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

@media (max-width: 480px) {
  .vk-shorts-rel {
    --vk-short-w: 148px;
  }
}
</style>